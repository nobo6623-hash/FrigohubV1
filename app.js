const baseCases = [
  {
    id: "fh-001", title: "Alta pressione e temperatura di mandata elevate",
    type: "Pompa di calore", brand: "Daikin", refrigerant: "R410A", status: "verified",
    age: "2 h fa", author: "Luca B.", tags: ["Alta pressione", "Ventilazione", "Scambiatore"],
    art: "", useful: 18, symptom: "Alta pressione durante il funzionamento in raffrescamento.",
    measurements: [["BP", "7.8", "bar"], ["AP", "31.4", "bar"], ["SH", "9", "K"], ["Mandata", "112", "°C"]],
    diagnoses: [{ category: "Scambio termico", confidence: 5, text: "Controllare la batteria condensante e la portata aria.", author: "Marco R." }],
    cause: "Batteria condensante ostruita da polvere e residui.",
    solution: "Pulizia approfondita della batteria e verifica della ventilazione. Pressioni rientrate nei valori attesi.",
    verification: { data: 5, solution: 5, author: "Giulia P.", note: "Dati completi e prova finale coerente." }
  },
  {
    id: "fh-002", title: "Bassa resa frigorifera e surriscaldamento alto",
    type: "Chiller", brand: "Carrier", refrigerant: "R134a", status: "verified",
    age: "5 h fa", author: "Marco R.", tags: ["Bassa resa", "Surriscaldamento", "Valvola di espansione"],
    art: "pressure", useful: 29, symptom: "Il chiller non raggiunge la temperatura impostata e lavora continuativamente.",
    measurements: [["BP", "1.9", "bar"], ["AP", "9.7", "bar"], ["SH", "24", "K"], ["SC", "4", "K"]],
    diagnoses: [{ category: "Espansione", confidence: 5, text: "Possibile valvola termostatica parzialmente bloccata.", author: "Luca B." }],
    cause: "Valvola di espansione termostatica parzialmente bloccata.",
    solution: "Sostituzione della valvola e controllo del bulbo. Ripristinata la resa frigorifera nominale.",
    verification: { data: 4, solution: 5, author: "Giulia P.", note: "Soluzione confermata dalle misure finali." }
  },
  {
    id: "fh-003", title: "Allarme E7 - sovracorrente compressore",
    type: "Rooftop", brand: "Mitsubishi", refrigerant: "R32", status: "verified",
    age: "1 g fa", author: "Giulia P.", tags: ["Allarme E7", "Elettrico", "Compressore"],
    art: "electric", useful: 11, symptom: "Intervento della protezione durante l'avvio del compressore.",
    measurements: [["Tensione", "398", "V"], ["Corrente", "34", "A"], ["Frequenza", "50", "Hz"], ["T esterna", "31", "°C"]],
    diagnoses: [{ category: "Elettrico", confidence: 4, text: "Verificare caduta di tensione e contattore.", author: "Marco R." }],
    cause: "Contattore usurato con forte caduta di tensione su una fase.",
    solution: "Sostituzione del contattore e controllo serraggi. Avvio regolare confermato.",
    verification: { data: 4, solution: 5, author: "Luca B.", note: "Avviamenti ripetuti senza allarme." }
  },
  {
    id: "fh-004", title: "Evaporatore ghiacciato e ventilazione ridotta",
    type: "Split", brand: "Daikin", refrigerant: "R32", status: "open",
    age: "35 min fa", author: "Andrea T.", tags: ["Ghiaccio", "Ventilazione", "Da risolvere"],
    art: "ice", useful: 4, symptom: "Formazione rapida di ghiaccio sulla batteria interna.",
    measurements: [["BP", "5.1", "bar"], ["T interna", "26", "°C"], ["T esterna", "33", "°C"]],
    diagnoses: [{ category: "Scambio termico", confidence: 3, text: "Verificare filtri, ventilatore e pulizia batteria interna.", author: "Marco R." }],
    cause: "", solution: "", verification: null
  }
];

const state = {
  page: "home", query: "", currentId: null, toast: "", filtersOpen: false,
  filters: { type: "", refrigerant: "", status: "", minUseful: "" },
  saved: read("fh-saved", []), votes: read("fh-votes", []),
  localCases: read("fh-cases-v2", []), activities: read("fh-activities", [])
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function persist() {
  localStorage.setItem("fh-saved", JSON.stringify(state.saved));
  localStorage.setItem("fh-votes", JSON.stringify(state.votes));
  localStorage.setItem("fh-cases-v2", JSON.stringify(state.localCases));
  localStorage.setItem("fh-activities", JSON.stringify(state.activities));
}
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
function getCases() {
  const localIds = new Set(state.localCases.map((item) => item.id));
  return [...state.localCases, ...baseCases.filter((item) => !localIds.has(item.id))];
}
function findCase(id = state.currentId) { return getCases().find((item) => item.id === id); }
function updateLocalCase(id, patch) {
  const index = state.localCases.findIndex((item) => item.id === id);
  if (index < 0) {
    const source = baseCases.find((item) => item.id === id);
    if (!source) return false;
    state.localCases.unshift({ ...source, ...patch });
    persist();
    return true;
  }
  state.localCases[index] = { ...state.localCases[index], ...patch };
  persist();
  return true;
}
function addActivity(text, caseId = null, kind = "info") {
  state.activities.unshift({ id: Date.now(), text, caseId, kind, age: "adesso" });
  persist();
}
function navigate(page, id = null) {
  state.page = page; state.currentId = id || state.currentId;
  window.scrollTo({ top: 0, behavior: "smooth" }); render();
}
function toast(message) {
  state.toast = message; render();
  setTimeout(() => { state.toast = ""; render(); }, 1800);
}

const icon = (name, size = 22) => {
  const paths = {
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${paths[name]}</svg>`;
};
function statusLabel(status) {
  return ({ open: "Da risolvere", diagnosis: "Diagnosi proposte", pending: "Da verificare", verified: "Verificato" })[status] || status;
}
function statusClass(status) { return status === "verified" ? "" : status === "pending" ? "pending" : "open"; }
function measureTiles(measurements = []) {
  return measurements.length
    ? measurements.map(([label, value, unit], index) => `<div class="measure ${index < 2 ? "signal" : ""}"><small>${esc(label)}</small><strong>${esc(value)} <em>${esc(unit)}</em></strong><span class="telemetry-bar"><i style="width:${Math.min(92, 42 + index * 12)}%"></i></span></div>`).join("")
    : `<p class="metadata">Nessuna misura inserita.</p>`;
}

function shell(content, active = state.page) {
  return `<div class="app">
    <header class="topbar">
      <div class="brand"><img src="./icons/icon.svg" alt=""><div>FRIGO<span>HUB</span><small>Knowledge for HVACR</small></div></div>
      <div class="top-actions"><button class="icon-button" data-nav="activity" aria-label="Attività">${icon("bell")}</button><span class="avatar">MR</span></div>
    </header>
    ${content}
    <nav class="bottom-nav" aria-label="Navigazione principale">
      ${nav("home", "⌂", "Home", active)}${nav("search", "⌕", "Cerca", active)}
      ${nav("new", "+", "Nuovo caso", active, true)}${nav("activity", "♧", "Attività", active)}${nav("profile", "♙", "Profilo", active)}
    </nav>${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ""}</div>`;
}
function nav(page, symbol, label, active, main = false) {
  return `<button class="nav-button ${active === page ? "active" : ""} ${main ? "main" : ""}" data-nav="${page}"><span class="nav-symbol">${symbol}</span><span>${label}</span></button>`;
}
function searchBox(value = "") {
  return `<form class="search-shell" data-search-form>${icon("search", 27)}<input class="search-input" name="q" value="${esc(value)}" placeholder="Cerca errore, sintomo, modello, refrigerante..." autocomplete="off"><button class="voice-button" type="button" aria-label="Ricerca vocale">${icon("mic", 19)}</button><button class="filter-button" data-toggle-filters type="button">${icon("filter")}<span>Filtri</span></button></form>`;
}
function caseCard(item) {
  const voted = state.votes.includes(item.id);
  const confidence = item.status === "verified" ? "96%" : item.status === "diagnosis" ? "72%" : "OPEN";
  return `<article class="case-card" data-open-case="${esc(item.id)}">
    <div class="case-status-line"><span class="badge ${statusClass(item.status)}">${statusLabel(item.status)}</span><span class="case-code">FH-${esc(item.id.slice(-3).toUpperCase())}</span></div>
    <div class="case-body"><h3>${esc(item.title)}</h3><div class="metadata terminal-meta">${esc(item.type)} / ${esc(item.brand)} / ${esc(item.refrigerant)}</div>
      <div class="tag-row">${item.tags.map((tag, i) => `<span class="tag ${i === 0 ? "alert" : ""}">${esc(tag)}</span>`).join("")}</div>
      <div class="case-metrics"><span>${(item.diagnoses || []).length} diagnosi</span><button class="useful" data-vote="${esc(item.id)}">${voted ? "✓ utile" : "utile"} ${item.useful + (voted ? 1 : 0)}</button><span>${esc(item.age)}</span></div></div>
    <div class="confidence"><small>CONFIDENCE</small><strong>${confidence}</strong></div></article>`;
}
const quick = (page, symbol, title, text, primary = false) => `<button class="quick-card ${primary ? "primary" : ""}" data-nav="${page}"><span class="quick-icon">${symbol}</span><strong>${title}</strong><small>${text}</small></button>`;
const stat = (value, label, symbol) => `<div class="stat"><span class="stat-dot">${symbol}</span><div><strong>${value}</strong><small>${label}</small></div></div>`;

function home() {
  const cases = getCases();
  const openCases = cases.filter(item => item.status !== "verified");
  return shell(`<section class="hero"><div class="blueprint-grid"></div><div class="scan-line"></div><div class="hero-content">
      <div class="hero-copy"><span class="system-online"><i></i> SYSTEM ONLINE / HVAC NETWORK ACTIVE</span><h1>DIAGNOSTICA.<br><span>RISOLVI.</span> VERIFICA.</h1><p>Database tecnico HVAC del futuro.<br>Casi reali, misure strutturate e soluzioni verificate.</p></div>
      <div class="network-panel"><span>NETWORK STATUS</span><strong>127 <small>CASES INDEXED</small></strong><strong>86 <small>VERIFIED</small></strong><strong>94% <small>RELIABILITY</small></strong></div>
      ${searchBox()}<div class="quick-filters">${["R410A","Alta pressione","VRF","Chiller","R32","Inverter","Daikin","Mitsubishi"].map(tag => `<button type="button" class="hud-chip">${tag}</button>`).join("")}</div>
    </div></section>
    <main class="content">
      <section class="section"><div class="section-heading"><div><span class="eyebrow dark">CORE OPERATIONS</span><h2>Casi diagnostici in evidenza</h2></div><button class="link-button" data-nav="search">Database completo ›</button></div>
        <div class="case-list diagnostic-grid">${cases.slice(0, 3).map(caseCard).join("")}</div></section>
      <section class="section"><div class="section-heading"><div><span class="eyebrow dark">QUICK ACCESS</span><h2>Azioni rapide</h2></div></div><div class="quick-grid">
        ${quick("new", "+", "Nuovo caso", "Crea un caso HVAC", true)}${quick("search", "⌕", "Cerca casi", "Trova soluzioni verificate")}
        ${quick("verified", "✓", "Casi verificati", "Soluzioni confermate")}${quick("search", "!", "Diagnosi aperte", "Supporta la rete")}${quick("profile", "↗", "Tech score", "Controlla il livello")}
      </div></section>
      <section class="home-columns section"><div class="weekly-card"><div><span class="eyebrow dark">TECHNICIAN SCORE</span><h2>Senior Operator</h2><p>La reputazione cresce con diagnosi utili e soluzioni verificate.</p><div class="rank-line"><span style="width:74%"></span></div><small>1.420 XP / 2.000 XP verso Master</small></div><div class="weekly-grid"><div><strong>+42</strong><span>XP settimana</span></div><div><strong>92%</strong><span>Accuratezza</span></div><div><strong>31</strong><span>Diagnosi corrette</span></div></div></div>
        <aside class="leaderboard-card compact"><div class="leader-head"><span class="eyebrow">NETWORK RANK</span><h2>#08</h2><p>Specialisti Chiller / settimana</p></div><button class="leader-cta" data-nav="profile">Apri profilo tecnico →</button></aside>
      </section>
      <section class="section challenge-zone"><div class="section-heading"><div><span class="eyebrow dark">OPEN SIGNALS</span><h2>Diagnosi aperte</h2></div><button class="link-button" data-nav="search">Esplora i casi ›</button></div>
        <div class="challenge-grid">${openCases.slice(0,3).map(challengeCard).join("") || `<div class="empty">Nessuna sfida aperta al momento.</div>`}</div>
      </section>
    </main>`, "home");
}
function leader(position, name, specialty, score, highlight = false) {
  return `<div class="leader-row ${highlight === "me" ? "me" : ""}"><span class="leader-position">${position}</span><span class="leader-avatar">${name.split(" ").map(part => part[0]).join("")}</span><div><strong>${name}</strong><small>${specialty}</small></div><b>${score}</b></div>`;
}
function challengeCard(item) {
  return `<article class="challenge-card" data-open-case="${esc(item.id)}"><div><span class="challenge-status">Sfida aperta</span><h3>${esc(item.title)}</h3><p>${esc(item.type)} · ${esc(item.brand)} · ${esc(item.refrigerant)}</p></div><div class="challenge-foot"><span>+15 XP diagnosi utile</span><button>Partecipa →</button></div></article>`;
}

function filterDrawer() {
  return `<form class="filter-drawer" data-filter-form><div class="section-heading"><h2>Filtri avanzati</h2><button class="link-button" type="button" data-clear-filters>Azzera</button></div>
    <div class="form-grid"><div class="field"><label>Tipo impianto</label><select name="type"><option value="">Tutti</option>${["Split","Pompa di calore","Chiller","VRF / VRV","Rooftop"].map(x => `<option ${state.filters.type === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Refrigerante</label><select name="refrigerant"><option value="">Tutti</option>${["R32","R410A","R134a","R407C"].map(x => `<option ${state.filters.refrigerant === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stato</label><select name="status"><option value="">Tutti</option><option value="verified" ${state.filters.status === "verified" ? "selected" : ""}>Verificato</option><option value="open" ${state.filters.status === "open" ? "selected" : ""}>Da risolvere</option><option value="pending" ${state.filters.status === "pending" ? "selected" : ""}>Da verificare</option></select></div>
    <div class="field"><label>Utilità minima</label><select name="minUseful"><option value="">Qualsiasi</option><option value="10" ${state.filters.minUseful === "10" ? "selected" : ""}>10 conferme</option><option value="20" ${state.filters.minUseful === "20" ? "selected" : ""}>20 conferme</option></select></div></div>
    <button class="primary-button" type="submit">Applica filtri</button></form>`;
}
function searchPage() {
  const q = state.query.trim().toLowerCase();
  const results = getCases().filter((item) => {
    const text = [item.title, item.brand, item.type, item.refrigerant, item.symptom, ...item.tags].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!state.filters.type || item.type === state.filters.type) &&
      (!state.filters.refrigerant || item.refrigerant === state.filters.refrigerant) &&
      (!state.filters.status || item.status === state.filters.status) &&
      (!state.filters.minUseful || item.useful >= Number(state.filters.minUseful));
  });
  return shell(`<section class="hero"><div class="hero-content"><h1>Cerca casi HVAC</h1><p>Parti da un sintomo, un errore o una misura.</p>${searchBox(state.query)}</div></section>
    <main class="content">${state.filtersOpen ? filterDrawer() : ""}
      <section class="section"><div class="chips"><button class="chip active">Tutti</button><button class="chip">Verificati</button><button class="chip">Da risolvere</button><button class="chip">R32</button><button class="chip">Pompe di calore</button></div></section>
      <section class="section"><div class="section-heading"><h2>${results.length} casi trovati</h2><button class="link-button">Più pertinenti ▾</button></div>
        ${results.length ? `<div class="case-list">${results.map(caseCard).join("")}</div>` : `<div class="empty"><strong>Nessun caso corrispondente.</strong><br><br>Pubblica una richiesta rapida e completala dopo l'intervento.<br><br><button class="primary-button" data-nav="new">+ Nuovo caso</button></div>`}</section>
    </main>`, "search");
}

function detailPage() {
  const item = findCase(); if (!item) return home();
  const saved = state.saved.includes(item.id), voted = state.votes.includes(item.id);
  return shell(`<main class="content detail-terminal"><div class="page-head"><button class="back" data-back>‹</button><div><span class="eyebrow dark">CASE INTELLIGENCE / FH-${esc(item.id.slice(-3).toUpperCase())}</span><h1>${esc(item.title)}</h1><div class="metadata terminal-meta">${esc(item.type)} / ${esc(item.brand)} / ${esc(item.refrigerant)}</div></div><span class="badge ${statusClass(item.status)}">${statusLabel(item.status)}</span></div>
    <div class="detail-grid"><div>
      <section class="detail-card section"><span class="section-code">01 / OVERVIEW</span><h2>Sintomo principale</h2><p>${esc(item.symptom)}</p><div class="tag-row">${item.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div></section>
      <section class="detail-card section telemetry-panel"><div class="section-heading"><div><span class="section-code">02 / TELEMETRY</span><h2>Misure iniziali</h2></div>${item.status !== "verified" ? `<button class="link-button" data-flow="measure">+ Aggiungi</button>` : ""}</div><div class="measure-grid">${measureTiles(item.measurements)}</div></section>
      <section class="detail-card section diagnosis-timeline"><div class="section-heading"><div><span class="section-code">03 / DIAGNOSTIC TIMELINE</span><h2>Diagnosi proposte</h2></div>${item.status !== "verified" ? `<button class="link-button" data-flow="diagnose">+ Proponi</button>` : ""}</div>
        ${(item.diagnoses || []).length ? item.diagnoses.map(diag => `<div class="diagnosis"><strong>${esc(diag.category)} · confidenza ${esc(diag.confidence)}/5</strong><p>${esc(diag.text)}</p><small>${esc(diag.author)}</small></div>`).join("") : `<p class="metadata">Nessuna diagnosi proposta.</p>`}</section>
      ${item.solution ? `<section class="detail-card solution section"><span class="section-code">04 / MOST LIKELY SOLUTION</span><h2>Soluzione ${item.status === "verified" ? "verificata" : "da verificare"}</h2><p><strong>Causa:</strong> ${esc(item.cause)}</p><p><strong>Intervento:</strong> ${esc(item.solution)}</p></section>` : ""}
      ${item.verification ? `<section class="detail-card verification section"><h2>Verifica tecnica</h2><p>Qualità dati <strong>${item.verification.data}/5</strong> · soluzione <strong>${item.verification.solution}/5</strong></p><p>${esc(item.verification.note)}</p><small>${esc(item.verification.author)}</small></section>` : ""}
    </div><aside><section class="detail-card action-panel section"><span class="section-code">ACTION PANEL</span><h2>Azioni</h2><div class="stack-buttons">
      <button class="primary-button" data-vote="${esc(item.id)}">${voted ? "✓ Utile" : "Utile per la diagnosi"}</button><button class="secondary-button" data-save="${esc(item.id)}">${saved ? "✓ Salvato" : "Salva caso"}</button>
      ${item.status !== "verified" ? `<button class="secondary-button" data-flow="measure">Aggiungi misure</button><button class="secondary-button" data-flow="diagnose">Proponi diagnosi</button>` : ""}
      ${item.status === "open" || item.status === "diagnosis" ? `<button class="secondary-button" data-flow="resolve">Inserisci soluzione</button>` : ""}
      ${item.status === "pending" ? `<button class="primary-button" data-flow="verify">Verifica caso</button>` : ""}
    </div></section><section class="detail-card section"><h2>Contributo</h2><p><strong>${esc(item.author)}</strong></p><p class="metadata">${esc(item.age)} · ${item.useful + (voted ? 1 : 0)} tecnici lo hanno trovato utile</p></section></aside></div>
  </main>`, "search");
}

function caseFormPage(kind) {
  const item = findCase();
  const configs = {
    measure: ["Inserisci misure", "Registra valori strutturati rilevati sul campo.", `<div class="measure-editor">${measureRow("BP","bar")}${measureRow("AP","bar")}${measureRow("SH","K")}${measureRow("SC","K")}${measureRow("T esterna","°C")}${measureRow("Corrente","A")}</div>`, "Salva misure"],
    diagnose: ["Proponi diagnosi", "Aggiungi un'ipotesi leggibile e verificabile.", `<div class="field"><label>Categoria *</label><select name="category" required><option>Refrigerante</option><option>Espansione</option><option>Scambio termico</option><option>Elettrico</option><option>Sensore</option><option>Meccanico</option></select></div><div class="field"><label>Confidenza *</label><select name="confidence"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div><div class="field"><label>Spiegazione *</label><textarea name="text" required placeholder="Cosa sospetti e perché?"></textarea></div>`, "Invia diagnosi"],
    resolve: ["Inserisci soluzione", "Separa causa effettiva e intervento effettuato.", `<div class="field"><label>Causa effettiva *</label><textarea name="cause" required placeholder="Qual era il problema reale?"></textarea></div><div class="field"><label>Intervento *</label><textarea name="solution" required placeholder="Cosa è stato fatto e con quale risultato?"></textarea></div>`, "Invia per verifica"],
    verify: ["Verifica il caso", "Conferma qualità dei dati e correttezza della soluzione.", `<div class="form-grid"><div class="field"><label>Qualità dati *</label><select name="data"><option>3</option><option>4</option><option selected>5</option></select></div><div class="field"><label>Qualità soluzione *</label><select name="solutionScore"><option>3</option><option>4</option><option selected>5</option></select></div></div><div class="field"><label>Nota tecnica *</label><textarea name="note" required placeholder="Perché la verifica è affidabile?"></textarea></div>`, "Approva verifica"]
  };
  if (!item || !configs[kind]) return home();
  const [title, subtitle, fields, submit] = configs[kind];
  return shell(`<main class="content"><div class="page-head"><button class="back" data-back-detail>‹</button><div><h1>${title}</h1><div class="metadata">${subtitle}</div></div></div><div class="context-strip"><strong>${esc(item.title)}</strong><span>${esc(item.type)} · ${esc(item.brand)} · ${esc(item.refrigerant)}</span></div><form class="detail-card form" data-flow-form="${kind}">${fields}<div class="button-row"><button class="secondary-button" type="button" data-back-detail>Annulla</button><button class="primary-button" type="submit">${submit}</button></div></form></main>`, "search");
}
function measureRow(label, unit) {
  return `<div class="measure-input"><label>${label}</label><input name="m_${label}" inputmode="decimal" placeholder="--"><span>${unit}</span></div>`;
}
function newCasePage() {
  return shell(`<main class="content"><div class="page-head"><button class="back" data-back>‹</button><div><h1>Nuovo caso rapido</h1><div class="metadata">Pubblica una richiesta utile in meno di 3 minuti.</div></div></div>
    <form class="detail-card form" data-case-form><div class="form-grid"><div class="field"><label>Tipo impianto *</label><select name="type" required><option>Split</option><option>Pompa di calore</option><option>Chiller</option><option>VRF / VRV</option><option>Rooftop</option></select></div><div class="field"><label>Marca *</label><select name="brand" required><option>Daikin</option><option>Carrier</option><option>Mitsubishi</option><option>LG</option><option>Samsung</option></select></div><div class="field"><label>Refrigerante *</label><select name="refrigerant" required><option>R32</option><option>R410A</option><option>R134a</option><option>R407C</option><option>R290</option></select></div><div class="field"><label>Codice errore</label><input name="error" placeholder="Es. U4, E7"></div></div><div class="field"><label>Titolo del caso *</label><input name="title" required placeholder="Es. Non raffredda e BP bassa"></div><div class="field"><label>Sintomo principale *</label><select name="symptom" required><option>Non raffredda</option><option>Raffredda poco</option><option>Alta pressione</option><option>Bassa pressione</option><option>Compressore non parte</option><option>Errore comunicazione</option></select></div><div class="field"><label>Descrizione breve</label><textarea name="description" placeholder="Aggiungi il minimo contesto utile."></textarea></div><div class="button-row"><button class="secondary-button" type="button" data-toast="Bozza salvata sul dispositivo">Salva bozza</button><button class="primary-button" type="submit">Pubblica richiesta</button></div></form>
  </main>`, "new");
}
function activityPage() {
  const items = state.activities.length ? state.activities : [
    { text: "Giulia P. ha verificato il caso Allarme E7 - sovracorrente compressore.", age: "1 g fa", kind: "verify" },
    { text: "Un nuovo caso Daikin R32 è compatibile con la tua specializzazione.", age: "2 h fa", kind: "info" },
    { text: "Luca B. ha trovato utile una tua diagnosi.", age: "5 h fa", kind: "useful" }
  ];
  return shell(`<main class="content"><div class="page-head"><h1>Attività</h1></div><div class="activity-list">${items.map(item => `<article class="activity-item"><span class="activity-dot ${esc(item.kind)}"></span><div><strong>${esc(item.text)}</strong><small>${esc(item.age)}</small></div></article>`).join("")}</div></main>`, "activity");
}
function profilePage() {
  return shell(`<main class="content"><section class="profile-hero"><div class="profile-avatar">MR</div><div><span class="eyebrow">TECHNICIAN ID / FH-008</span><h1>Marco R.</h1><p>Senior HVAC Operator · Lombardia</p><div class="tag-row"><span class="badge">Fondatore</span><span class="badge">Senior</span><span class="badge">Specialista</span></div></div><div class="score-ring"><strong>92</strong><span>TECH SCORE</span></div></section><section class="stats profile-stats">${stat("92%", "Affidabilità", "✓")}${stat("18", "Soluzioni verificate", "▤")}${stat("31", "Diagnosi corrette", "+")}${stat("146", "Contributi utili", "↗")}</section><section class="detail-card section"><span class="section-code">SPECIALIZATION MATRIX</span><h2>Specializzazioni</h2><div class="tag-row"><span class="tag">Chiller</span><span class="tag">Pompe di calore</span><span class="tag">Diagnosi elettrica</span><span class="tag">R32</span></div><div class="activity-heatmap">${Array.from({length:42},(_,i)=>`<i class="${i%7===0||i%5===0?"hot":i%3===0?"mid":""}"></i>`).join("")}</div></section><section class="detail-card"><span class="section-code">TECHNICAL REPUTATION</span><h2>Reputazione tecnica</h2><p class="metadata">La reputazione deriva da soluzioni verificate e diagnosi utili, non da follower o like.</p></section></main>`, "profile");
}
function placeholderPage(title, text, active = "home") { return shell(`<main class="content"><div class="page-head"><h1>${title}</h1></div><div class="empty">${text}</div></main>`, active); }

function render() {
  const views = {
    home, search: searchPage, detail: detailPage, new: newCasePage, activity: activityPage, profile: profilePage,
    measure: () => caseFormPage("measure"), diagnose: () => caseFormPage("diagnose"), resolve: () => caseFormPage("resolve"), verify: () => caseFormPage("verify"),
    mycases: () => shell(`<main class="content"><div class="page-head"><h1>I miei casi</h1></div>${state.localCases.length ? `<div class="case-list">${state.localCases.map(caseCard).join("")}</div>` : `<div class="empty">Le bozze e i casi pubblicati compariranno qui.</div>`}</main>`, "home"),
    verified: () => { state.filters.status = "verified"; return searchPage(); },
    useful: () => shell(`<main class="content"><div class="page-head"><h1>Più utili</h1></div><div class="case-list">${getCases().sort((a,b) => b.useful-a.useful).map(caseCard).join("")}</div></main>`, "home")
  };
  document.querySelector("#app").innerHTML = (views[state.page] || home)();
}

document.addEventListener("click", (event) => {
  const navTarget = event.target.closest("[data-nav]"); if (navTarget) return navigate(navTarget.dataset.nav);
  const card = event.target.closest("[data-open-case]"); if (card && !event.target.closest("[data-vote]")) return navigate("detail", card.dataset.openCase);
  if (event.target.closest("[data-back]")) return navigate("home");
  if (event.target.closest("[data-back-detail]")) return navigate("detail", state.currentId);
  const flow = event.target.closest("[data-flow]"); if (flow) return navigate(flow.dataset.flow, state.currentId);
  if (event.target.closest("[data-toggle-filters]")) {
    state.filtersOpen = !state.filtersOpen;
    return state.page === "search" ? render() : navigate("search");
  }
  if (event.target.closest("[data-clear-filters]")) { state.filters = { type: "", refrigerant: "", status: "", minUseful: "" }; return render(); }
  const vote = event.target.closest("[data-vote]"); if (vote) {
    event.stopPropagation(); const id = vote.dataset.vote;
    state.votes = state.votes.includes(id) ? state.votes.filter(x => x !== id) : [...state.votes, id]; persist();
    return toast(state.votes.includes(id) ? "Segnalato come utile per la diagnosi" : "Valutazione rimossa");
  }
  const saveButton = event.target.closest("[data-save]"); if (saveButton) {
    const id = saveButton.dataset.save; state.saved = state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id]; persist();
    return toast(state.saved.includes(id) ? "Caso salvato" : "Caso rimosso dai salvati");
  }
  const toastButton = event.target.closest("[data-toast]"); if (toastButton) return toast(toastButton.dataset.toast);
});

document.addEventListener("submit", (event) => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
  if (event.target.matches("[data-search-form]")) { state.query = data.q || ""; return navigate("search"); }
  if (event.target.matches("[data-filter-form]")) { state.filters = data; state.filtersOpen = false; return render(); }
  if (event.target.matches("[data-case-form]")) {
    const item = { id: `local-${Date.now()}`, title: data.title, type: data.type, brand: data.brand, refrigerant: data.refrigerant, status: "open", age: "adesso", author: "Marco R.", tags: [data.symptom, data.error || "Nuovo caso", "Da risolvere"], art: "ice", useful: 0, symptom: data.description || data.symptom, measurements: [], diagnoses: [], cause: "", solution: "", verification: null };
    state.localCases.unshift(item); addActivity(`Hai pubblicato il caso ${item.title}.`, item.id, "info"); persist(); return navigate("detail", item.id);
  }
  const kind = event.target.dataset.flowForm; const item = findCase(); if (!kind || !item) return;
  if (kind === "measure") {
    const units = { BP:"bar", AP:"bar", SH:"K", SC:"K", "T esterna":"°C", Corrente:"A" };
    const measurements = Object.entries(data).filter(([, value]) => value).map(([key, value]) => [key.slice(2), value, units[key.slice(2)]]);
    updateLocalCase(item.id, { measurements }); addActivity(`Hai aggiunto ${measurements.length} misure al caso ${item.title}.`, item.id, "info");
  }
  if (kind === "diagnose") {
    updateLocalCase(item.id, { status: "diagnosis", diagnoses: [...(item.diagnoses || []), { category: data.category, confidence: data.confidence, text: data.text, author: "Marco R." }] });
    addActivity(`Hai proposto una diagnosi per ${item.title}.`, item.id, "info");
  }
  if (kind === "resolve") {
    updateLocalCase(item.id, { status: "pending", cause: data.cause, solution: data.solution });
    addActivity(`Il caso ${item.title} attende una verifica tecnica.`, item.id, "verify");
  }
  if (kind === "verify") {
    updateLocalCase(item.id, { status: "verified", verification: { data: data.data, solution: data.solutionScore, author: "Marco R.", note: data.note } });
    addActivity(`Hai verificato il caso ${item.title}.`, item.id, "verify");
  }
  persist(); navigate("detail", item.id); toast({ measure:"Misure salvate", diagnose:"Diagnosi inviata", resolve:"Caso inviato per verifica", verify:"Verifica completata" }[kind]);
});

window.addEventListener("online", () => toast("Connessione ripristinata"));
window.addEventListener("offline", () => toast("Offline: le bozze restano sul dispositivo"));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
render();
