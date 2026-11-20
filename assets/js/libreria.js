// libreria.js — classi, persistenza e render della libreria personale.
// Ogni modulo ha il suo scope: solo ciò che è "export" è visibile agli altri file.


// === Classi (dal D1) ===

export class Libro {
  letto = false; // campo pubblico con valore di default (ES2022)

  constructor(titolo, autore, anno) {
    // id univoco anche dopo un reload.
    // crypto.randomUUID() richiede HTTPS o localhost: apri la pagina con Live Server.
    this.id = crypto.randomUUID();
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }

  // Factory: crea un Libro da una stringa "titolo|autore|anno" (EXTRA D1, passo 17)
  static daStringa(s) {
    const [titolo, autore, anno] = s.split("|");
    return new Libro(titolo, autore, Number(anno));
  }

  // Ricrea un'istanza vera da un oggetto puro letto con JSON.parse.
  // `this` è la classe su cui lo chiami (Libro o LibroDigitale);
  // Object.assign copia sopra id, letto e (se c'è) dimensioneMb.
  static fromJSON(d) {
    return Object.assign(new this(d.titolo, d.autore, d.anno), d);
  }
}

export class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno); // prima di usare this
    this.dimensioneMb = dimensioneMb;
  }

  // Override: stesso nome del metodo del parent, vince questo
  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}


// === Persistenza (dal D2) ===

const STORAGE_KEY = "libri";

// localStorage salva solo stringhe: l'array diventa JSON.
// setItem sovrascrive ogni volta l'intera chiave.
function salvaLibri() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

// getItem restituisce null se la chiave non esiste: ?? "[]" fa partire da un array vuoto.
// JSON.parse dà oggetti puri, senza metodi: li ri-istanziamo con fromJSON.
function caricaLibri() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    .map((d) => d.dimensioneMb !== undefined ? LibroDigitale.fromJSON(d) : Libro.fromJSON(d));
}


// === Stato (privato del modulo: si modifica solo con le funzioni esportate) ===

let libri = caricaLibri(); // let: "Rimuovi" e "Svuota tutto" riassegnano l'array

export function aggiungiLibro(libro) {
  libri.push(libro);
  salvaLibri();
  renderLibri();
}


// === Render ===

// Crea un elemento con una classe e un testo (textContent: niente HTML interpretato)
export function crea(tag, classe, testo) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (testo !== undefined) el.textContent = testo;
  return el;
}

function creaBottone(azione, testo) {
  const b = crea("button", "", testo);
  b.type = "button";
  b.dataset.azione = azione;
  return b;
}

export function renderLibri() {
  const righe = libri.map((l) => {
    const li = crea("li", l.letto ? "letto" : "");
    li.dataset.id = l.id; // serve all'event delegation per ritrovare il libro

    const info = crea("div", "info");
    info.append(
      crea("span", "titolo", l.titolo),
      crea("span", "badge-formato", l.formato()),
      crea("div", "meta", `${l.autore} — ${l.anno}`),
    );

    const azioni = crea("div", "azioni");
    azioni.append(
      l.letto ? crea("span", "", "✓ letto") : creaBottone("leggi", "Segna come letto"),
      creaBottone("rimuovi", "Rimuovi"),
    );

    li.append(info, azioni);
    return li;
  });

  const lista = document.getElementById("lista-libri");
  if (righe.length === 0) {
    lista.replaceChildren(crea("li", "vuota", "Nessun libro in catalogo."));
  } else {
    lista.replaceChildren(...righe);
  }
  document.getElementById("contatore").textContent = libri.length;
}


// === Eventi della libreria ===

// Mostra/nasconde il campo "dimensione" in base al formato selezionato
// Se il campo è visibile diventa anche obbligatorio (required), altrimenti no.
function aggiornaCampoDimensione(formato) {
  const digitale = formato === "digitale";
  document.getElementById("campo-dimensione").hidden = !digitale;
  document.getElementById("dimensione").required = digitale;
}

export function initLibreria() {
  document.getElementById("formato").addEventListener("change", (e) => {
    aggiornaCampoDimensione(e.target.value);
  });

  // Submit del form: legge tutti i campi con FormData e crea l'istanza giusta
  document.getElementById("aggiungi-libro").addEventListener("submit", (e) => {
    e.preventDefault();

    const dati = Object.fromEntries(new FormData(e.target));
    const titolo = dati.titolo.trim(); // "required" accetta anche solo spazi: li togliamo
    const autore = dati.autore.trim();
    const { anno, formato, dimensione } = dati;

    if (!titolo || !autore) {
      alert("Titolo e autore non possono essere vuoti.");
      return;
    }

    const nuovo = formato === "digitale"
      ? new LibroDigitale(titolo, autore, Number(anno), Number(dimensione) || 0)
      : new Libro(titolo, autore, Number(anno));

    aggiungiLibro(nuovo);
    e.target.reset(); // reset() non lancia "change": riallineiamo il campo a mano
    aggiornaCampoDimensione("cartaceo");
    document.getElementById("titolo").focus(); // pronto per il libro successivo
  });

  // Event delegation: un solo listener per tutti i bottoni della lista
  document.getElementById("lista-libri").addEventListener("click", (e) => {
    const bottone = e.target.closest("[data-azione]");
    if (!bottone) return;

    const id = bottone.closest("li").dataset.id; // stringa (UUID): niente parseInt

    if (bottone.dataset.azione === "leggi") {
      libri.find((l) => l.id === id)?.segnaComeLetto();
    } else if (bottone.dataset.azione === "rimuovi") {
      libri = libri.filter((l) => l.id !== id);
    }

    salvaLibri();
    renderLibri();
  });

  // Svuota tutto: azzera l'array e cancella solo la nostra chiave
  // (removeItem, non clear: clear toglierebbe anche altre chiavi del dominio)
  document.getElementById("svuota-tutto").addEventListener("click", () => {
    libri = [];
    localStorage.removeItem(STORAGE_KEY);
    renderLibri();
  });

  // Un'altra tab ha modificato localStorage: ricarichiamo la lista (evento storage).
  // e.key === null quando l'altra tab ha fatto localStorage.clear().
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    libri = caricaLibri();
    renderLibri();
  });
}
