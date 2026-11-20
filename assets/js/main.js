// main.js — punto di ingresso: importa i moduli e avvia l'app.
// Nell'HTML c'è un solo <script type="module" src="assets/js/main.js">.
import { Libro, aggiungiLibro, crea, initLibreria, renderLibri } from "./libreria.js";
import { renderAuthBox, mostraProfilo } from "./auth.js";


// === Ricerca su Open Library (D3, convertita in async/await nel D4) ===

const API_URL = "https://openlibrary.org/search.json";

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

// Helper: fetch + controllo di ok + JSON
async function getJSON(url, opzioni) {
  const r = await fetch(url, opzioni);
  // 404/500 NON rifiutano la Promise: controllo manuale
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function cerca(query) {
  controller?.abort(); // annulla la ricerca precedente, se ancora in corso
  controller = new AbortController();
  const { signal } = controller;
  mostraSpinner();

  // URL + searchParams: spazi, & e accenti vengono codificati
  const url = new URL(API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  try {
    const dati = await getJSON(url, { signal });
    renderRisultati(dati.docs);
  } catch (err) {
    if (err.name === "AbortError") return; // annullata da una ricerca più nuova: ignora
    mostraErrore(`Errore nella ricerca: ${err.message}`);
  } finally {
    // se è stata annullata, lo spinner serve alla ricerca nuova: non nasconderlo
    if (!signal.aborted) nascondiSpinner();
  }
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


// === Eventi della ricerca (dal D3) ===

let timeoutId; // per il debounce

// Debounce: ogni tasto cancella il timer e ne parte uno nuovo;
// cerca() parte solo dopo 400ms senza digitazioni.
document.getElementById("cerca").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  clearTimeout(timeoutId); // prima del controllo: cancella anche un timer partito con una query più lunga
  if (query.length < 3) {
    controller?.abort(); // annulla anche una fetch già partita, così non ripopola la lista
    document.getElementById("risultati").replaceChildren();
    return;
  }
  timeoutId = setTimeout(() => cerca(query), 400);
});

// Event delegation: un solo listener per tutti i bottoni "Aggiungi"
document.getElementById("risultati").addEventListener("click", (e) => {
  const bottone = e.target.closest("button[data-titolo]");
  if (!bottone) return;

  const { titolo, autore, anno } = bottone.dataset;
  aggiungiLibro(new Libro(titolo, autore, Number(anno) || 0)); // "?" → NaN → 0

  bottone.textContent = "✓ Aggiunto";
  bottone.disabled = true;
});


// === Avvio ===
// In un modulo si può usare await al livello più alto (top-level await).

initLibreria();
renderLibri();
console.log(Libro.daStringa("1984|Orwell|1949")); // verifica EXTRA D1
renderAuthBox();
await mostraProfilo(); // se l'utente è già loggato, mostra subito il profilo
