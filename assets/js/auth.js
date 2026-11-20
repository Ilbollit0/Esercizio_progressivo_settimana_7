// auth.js — login, logout e profilo con DummyJSON.
import { crea } from "./libreria.js";


// === Autenticazione con DummyJSON (D4) ===

const AUTH_TOKEN_KEY = "auth.token";
const AUTH_USER_KEY = "auth.user";
const DUMMY_URL = "https://dummyjson.com/auth";

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getUtente() {
  return JSON.parse(localStorage.getItem(AUTH_USER_KEY) ?? "null");
}

async function login(username, password) {
  const r = await fetch(`${DUMMY_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }), // shorthand: { username: username, ... }
  });
  if (!r.ok) throw new Error("Credenziali non valide");

  const dati = await r.json();
  localStorage.setItem(AUTH_TOKEN_KEY, dati.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dati));
  return dati;
}

function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  renderAuthBox();
  document.getElementById("profilo-section").hidden = true;
}

async function caricaProfilo() {
  const token = getToken();
  if (!token) return null;

  const r = await fetch(`${DUMMY_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401) {
    logout(); // token scaduto o non valido
    throw new Error("Sessione scaduta, accedi di nuovo");
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function renderAuthBox() {
  const box = document.getElementById("auth-box");
  const utente = getUtente();

  if (utente) {
    const esci = crea("button", "btn-logout", "Esci");
    esci.type = "button";
    esci.addEventListener("click", logout);
    box.replaceChildren(crea("span", "saluto", `Ciao ${utente.firstName}`), esci);
    return;
  }

  // Contenuto statico (nessun dato esterno): qui innerHTML va bene
  box.innerHTML = `
    <form id="form-login">
      <input type="text" name="username" aria-label="Username" value="emilys" required>
      <input type="password" name="password" aria-label="Password" value="emilyspass" required>
      <button type="submit" class="btn-login">Accedi</button>
    </form>
  `;
  document.getElementById("form-login").addEventListener("submit", gestisciLogin);
}

async function gestisciLogin(e) {
  e.preventDefault();
  // FormData legge tutti i campi con un name (W3-D3)
  const { username, password } = Object.fromEntries(new FormData(e.target));

  try {
    await login(username, password);
    renderAuthBox();
    await mostraProfilo();
  } catch (err) {
    alert(err.message);
  }
}

export async function mostraProfilo() {
  if (!getToken()) return;
  try {
    const profilo = await caricaProfilo();

    // Dati da un'API esterna: createElement + textContent, niente innerHTML
    const img = document.createElement("img");
    img.src = profilo.image;
    img.alt = profilo.firstName;

    const info = crea("div", "info");
    const nome = crea("p");
    nome.append(crea("strong", "", `${profilo.firstName} ${profilo.lastName}`));
    info.append(nome, crea("p", "", `@${profilo.username} — ${profilo.email}`));

    document.getElementById("profilo").replaceChildren(img, info);
    document.getElementById("profilo-section").hidden = false;
  } catch (err) {
    console.error(err.message);
  }
}
