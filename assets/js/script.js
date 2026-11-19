// Mini-libreria — Settimana VII Giorno III
// Giorno I: class, campi, extends, override, static + form che crea istanze.
// Giorno II: persistenza con localStorage (salva, carica, svuota).
// Giorno III: ricerca su Open Library con fetch, debounce e AbortController.


// === Classi ===

class Libro {
  letto = false; // campo pubblico con valore di default (ES2022)

  constructor(titolo, autore, anno) {
    // id univoco anche dopo un reload (servirà domani con localStorage).
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

  // Factory: crea un Libro da una stringa "titolo|autore|anno" (EXTRA, passo 17)
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

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno); // prima di usare this
    this.dimensioneMb = dimensioneMb;
  }

  // Override: stesso nome del metodo del parent, vince questo
  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}


// === Persistenza (localStorage) ===

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


// === Stato ===

let libri = caricaLibri(); // let: "Rimuovi" e "Svuota tutto" riassegnano l'array


// === Render ===

// Crea un elemento con una classe e un testo (textContent: niente HTML interpretato)
function crea(tag, classe, testo) {
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

function renderLibri() {
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


// === Eventi ===

// Mostra/nasconde il campo "dimensione" in base al formato selezionato
// Se il campo è visibile diventa anche obbligatorio (required), altrimenti no.
function aggiornaCampoDimensione(formato) {
  const digitale = formato === "digitale";
  document.getElementById("campo-dimensione").hidden = !digitale;
  document.getElementById("dimensione").required = digitale;
}

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

  libri.push(nuovo);
  salvaLibri();
  renderLibri();
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


// === Ricerca su Open Library ===

// Helper per i 3 stati: caricamento, errore, risultati
function mostraSpinner() {
  document.getElementById("spinner").hidden = false;
  document.getElementById("errore").hidden = true;
}

function nascondiSpinner() {
  document.getElementById("spinner").hidden = true;
}

function mostraErrore(msg) {
  const errore = document.getElementById("errore");
  errore.textContent = msg;
  errore.hidden = false;
}

let controller; // AbortController della ricerca in corso

function cerca(query) {
  controller?.abort(); // annulla la ricerca precedente, se ancora in corso
  controller = new AbortController();
  const { signal } = controller;
  mostraSpinner();

  // URL + searchParams: spazi, & e accenti vengono codificati
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  fetch(url, { signal })
    .then((r) => {
      // 404/500 NON rifiutano la Promise: controllo manuale
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((dati) => renderRisultati(dati.docs))
    .catch((err) => {
      if (err.name === "AbortError") return; // annullata da una ricerca più nuova: ignora
      mostraErrore(`Errore nella ricerca: ${err.message}`);
    })
    .finally(() => {
      // se è stata annullata, lo spinner serve alla ricerca nuova: non nasconderlo
      if (!signal.aborted) nascondiSpinner();
    });
}

function renderRisultati(docs) {
  const lista = document.getElementById("risultati");

  if (docs.length === 0) {
    lista.replaceChildren(crea("li", "", "Nessun risultato."));
    return;
  }

  // Dati da un'API esterna: textContent e dataset, niente innerHTML (rischio XSS)
  const righe = docs.map((d) => {
    const autore = d.author_name?.[0] ?? "Autore sconosciuto";
    const anno = d.first_publish_year ?? "?";

    const li = crea("li");
    const info = crea("div", "info");
    info.append(
      crea("span", "titolo", d.title),
      crea("div", "meta", `${autore} - ${anno}`),
    );

    const bottone = crea("button", "", "Aggiungi");
    bottone.type = "button";
    bottone.dataset.titolo = d.title;
    bottone.dataset.autore = autore;
    bottone.dataset.anno = anno;

    li.append(info, bottone);
    return li;
  });

  lista.replaceChildren(...righe);
}

let timeoutId; // per il debounce

// Debounce: ogni tasto cancella il timer e ne parte uno nuovo;
// cerca() parte solo dopo 400ms senza digitazioni.
document.getElementById("cerca").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  clearTimeout(timeoutId); // prima del controllo: cancella anche un timer partito con una query più lunga
  if (query.length < 3) {
    document.getElementById("risultati").innerHTML = "";
    return;
  }
  timeoutId = setTimeout(() => cerca(query), 400);
});

// Event delegation: un solo listener per tutti i bottoni "Aggiungi"
document.getElementById("risultati").addEventListener("click", (e) => {
  const bottone = e.target.closest("button[data-titolo]");
  if (!bottone) return;

  const { titolo, autore, anno } = bottone.dataset;
  libri.push(new Libro(titolo, autore, Number(anno) || 0)); // "?" → NaN → 0
  salvaLibri();
  renderLibri();

  bottone.textContent = "✓ Aggiunto";
  bottone.disabled = true;
});


// === Avvio ===
renderLibri();
console.log(Libro.daStringa("1984|Orwell|1949")); // verifica EXTRA 17
