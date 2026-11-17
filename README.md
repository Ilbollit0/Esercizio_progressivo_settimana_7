# Mini-libreria — Esercizio progressivo Settimana VII

Una piccola web app in **HTML, CSS e JavaScript** (senza librerie) per catalogare i propri libri:
si aggiungono da un form, si segnano come letti e si rimuovono.

L'esercizio è **progressivo**: ogni giorno della settimana aggiunge un pezzo al progetto.
Questo README fa da diario e viene aggiornato giorno per giorno.

---

## Come avviarlo

1. Clona o scarica la cartella.
2. Apri `index.html` con **Live Server** (VS Code) o un altro server locale.

> `crypto.randomUUID()` (usato per generare gli id dei libri) funziona solo in un
> *contesto sicuro*: HTTPS oppure `localhost`. Per questo serve Live Server
> invece del doppio clic sul file.

## Struttura

```
.
├── index.html            # markup: header, form, lista
├── assets/
│   ├── css/style.css     # stile (variabili CSS, flexbox)
│   └── js/script.js      # classi, stato, render, eventi
└── README.md
```

## Funzionalità attuali

- Form per aggiungere un libro (titolo, autore, anno, formato).
- Campo **Dimensione (MB)** che compare, ed è obbligatorio, solo per il formato *digitale*.
- Lista dei libri con contatore, badge del formato e messaggio quando è vuota.
- Bottoni **Segna come letto** e **Rimuovi** per ogni libro.

## Concetti JavaScript usati

| Concetto | Dove |
| --- | --- |
| `class`, `constructor`, metodi | `Libro` |
| Campi pubblici con valore di default (ES2022) | `letto = false` |
| Ereditarietà: `extends` e `super()` | `LibroDigitale extends Libro` |
| Override di un metodo | `formato()` in `LibroDigitale` |
| Metodo `static` (factory) | `Libro.daStringa("titolo\|autore\|anno")` |
| `FormData` + `Object.fromEntries` | lettura del form al submit |
| Destructuring | campi del form, `split("\|")` |
| Event delegation con `closest()` e `data-*` | un solo listener sulla lista |
| `map`, `filter`, `find`, optional chaining `?.` | render, rimozione, "letto" |
| DOM sicuro con `textContent` e `replaceChildren` | funzione `crea()` e `renderLibri()` |

---

## Diario della settimana

### Giorno I — 17/11/2026

**Fatto**
- Struttura della pagina, classi `Libro` e `LibroDigitale`, form che crea le istanze.
- Render della lista, "segna come letto", "rimuovi" (EXTRA), factory `daStringa` (EXTRA 17).

**Revisione del codice**
- Corretti i percorsi di CSS e JS in `index.html` (`assets/css/…`, `assets/js/…`):
  prima la pagina si caricava senza stile e senza script.
- Titolo e autore passano da `trim()`: `required` da solo accetta anche un campo di soli spazi.
- Il campo dimensione è `required` solo quando è visibile; logica raccolta in `aggiornaCampoDimensione()`.
- Dopo l'aggiunta il focus torna sul titolo, così si inserisce subito il libro dopo.
- `min`/`max` sull'anno, `min="0"` sulla dimensione.
- CSS: colori in variabili (`:root`), `font: inherit` sugli input, contorno `:focus-visible`
  per la tastiera, righe che vanno a capo su mobile, hover rosso su "Rimuovi".
- `aria-live` sul contatore, così gli screen reader annunciano il nuovo totale.

### Giorno II — 18/11/2026

_Da completare._ Previsto: salvataggio dei libri in `localStorage`
(gli id UUID servono a ritrovarli dopo il reload).

### Giorno III — 19/11/2026

_Da completare._

### Giorno IV — 20/11/2026

_Da completare._

### Giorno V — 21/11/2026

_Da completare._

---

## Possibili sviluppi

- [ ] Persistenza con `localStorage`
- [ ] Togliere la spunta "letto"
- [ ] Filtri (tutti / letti / da leggere) e ordinamento
- [ ] Modifica di un libro già inserito
