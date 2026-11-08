// Pannello parametri: form generato dallo schema, sincronizzazione con lo stato,
// riepilogo dei valori derivati e selettore della città.
// Dipende da: ui/schema.js, ui/state.js, ui/format.js, model/*.

const UNITS = { pct: '%', eur: '€' };

// Pulsante "i" accanto all'etichetta: apre il box con la spiegazione del parametro
const infoBtn = f => HELP[f.key] ? `<button type="button" class="info" data-help="${f.key}" aria-label="Cos’è: ${f.label.replace(/"/g, '&quot;')}">i</button>` : '';

function fieldHtml(f) {
  const id = 'f_' + f.key;
  if (f.type === 'bool') return `<div class="lbl"><label for="${id}"><input type="checkbox" id="${id}"> ${f.label}</label>${infoBtn(f)}</div>`;
  const lbl = `<div class="lbl"><label for="${id}">${f.label}</label>${infoBtn(f)}</div>`;
  if (f.type === 'select') {
    const options = fieldOptions(f).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    return `${lbl}<select id="${id}">${options}</select>`;
  }
  const unit = UNITS[f.type];
  const attrs = ['step', 'min', 'max'].filter(a => f[a] !== undefined).map(a => `${a}="${f[a]}"`).join(' ');
  return `${lbl}<div class="inp"><input type="number" id="${id}" ${attrs} inputmode="decimal">${unit ? `<span>${unit}</span>` : ''}</div>`;
}

// ---------- Box informativo dei parametri ----------
// Limiti e passo letti dallo schema (per le percentuali sono già in punti percentuali)
function boundsText(f) {
  if (f.type === 'bool') return 'Sì / no';
  if (f.type === 'select') return `${fieldOptions(f).length} opzioni`;
  const u = f.type === 'pct' ? '%' : f.type === 'eur' ? ' €' : '';
  const n = v => fmtNum(v) + u;
  const range = f.min !== undefined && f.max !== undefined ? `da ${n(f.min)} a ${n(f.max)}`
    : f.min !== undefined ? `almeno ${n(f.min)}` : f.max !== undefined ? `al massimo ${n(f.max)}` : 'nessun limite';
  return `Valori: ${range}${f.step !== undefined ? ` · passo ${n(f.step)}` : ''}${f.type === 'int' ? ' · intero' : ''}`;
}

let tipEl = null, tipBtn = null;

function showTip(btn) {
  const f = FIELDS.find(x => x.key === btn.dataset.help);
  if (!f) return;
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = 'param-tip';
    tipEl.className = 'tip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  tipEl.innerHTML = `<b class="tip-title">${f.label}</b><p>${HELP[f.key]}</p><p class="tip-meta">${boundsText(f)}<br>Chiave nei preset JSON: <code>${f.key}</code>${f.type === 'pct' ? ' (come frazione)' : ''}</p>`;
  tipEl.hidden = false;
  if (tipBtn) tipBtn.removeAttribute('aria-describedby');
  tipBtn = btn;
  btn.setAttribute('aria-describedby', 'param-tip');
  placeTip();
}

// Sotto il pulsante, oppure sopra se non c'è spazio; sempre dentro la finestra
function placeTip() {
  if (!tipEl || !tipBtn) return;
  const r = tipBtn.getBoundingClientRect(), gap = 8, pad = 12;
  const w = Math.min(320, innerWidth - 2 * pad);
  tipEl.style.width = w + 'px';
  const h = tipEl.offsetHeight;
  const left = clamp(r.left + r.width / 2 - w / 2, pad, innerWidth - w - pad);
  const below = r.bottom + gap + h <= innerHeight - pad;
  tipEl.style.left = left + 'px';
  tipEl.style.top = (below ? r.bottom + gap : Math.max(pad, r.top - gap - h)) + 'px';
}

function hideTip() {
  if (tipEl) tipEl.hidden = true;
  if (tipBtn) tipBtn.removeAttribute('aria-describedby');
  tipBtn = null;
}

// Hover e focus da tastiera mostrano il box; il tocco (mobile) lo apre e chiude
function bindTips() {
  const form = $('form');
  const btnOf = e => e.target.closest && e.target.closest('.info');
  form.addEventListener('mouseover', e => { const b = btnOf(e); if (b) showTip(b); });
  form.addEventListener('mouseout', e => { const b = btnOf(e); if (b && !b.contains(e.relatedTarget) && document.activeElement !== b) hideTip(); });
  form.addEventListener('focusin', e => { const b = btnOf(e); if (b) showTip(b); });
  form.addEventListener('focusout', e => { if (btnOf(e)) hideTip(); });
  form.addEventListener('click', e => {
    const b = btnOf(e);
    if (!b) return;
    e.preventDefault();
    showTip(b);   // si chiude toccando fuori, con Esc o togliendo il focus
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
  document.addEventListener('pointerdown', e => { if (tipBtn && !btnOf(e) && !(tipEl && tipEl.contains(e.target))) hideTip(); });
  $('params').addEventListener('scroll', hideTip, { passive: true });
  addEventListener('resize', placeTip);
  addEventListener('scroll', placeTip, { passive: true });
}

function buildForm() {
  const form = $('form');
  form.innerHTML = SCHEMA.map(g => `<fieldset><legend>${g.group}</legend>${g.fields.map(f =>
    `<div class="field${f.type === 'bool' ? ' bool' : f.type === 'select' ? ' select' : ''}" data-key="${f.key}">${fieldHtml(f)}</div>`).join('')}</fieldset>`).join('');
  // riepilogo dei valori derivati in fondo al primo gruppo (Casa)
  form.querySelector('fieldset').insertAdjacentHTML('beforeend', '<div id="derived" class="derived"></div>');
}

// Stato → form
function syncForm() {
  for (const f of FIELDS) {
    const el = $('f_' + f.key), v = state[f.key];
    if (f.type === 'bool') el.checked = !!v;
    else if (f.type === 'select') el.value = v;
    else el.value = f.type === 'pct' ? +(v * 100).toFixed(4) : v;
  }
  updateVisibility();
  updateDerived();
}

// Nasconde i campi non pertinenti (es. Euribor con tasso fisso)
function updateVisibility() {
  for (const f of FIELDS) {
    if (f.when) document.querySelector(`.field[data-key="${f.key}"]`).hidden = !f.when(state);
  }
}

// Form → stato
function onInput(e) {
  const key = e.target.id.replace(/^f_/, '');
  const f = FIELDS.find(x => x.key === key);
  if (!f) return;
  if (f.type === 'bool') state[key] = e.target.checked;
  else if (f.type === 'select') {
    state[key] = e.target.value;
    // cambiare fonte aggiorna prezzo e affitto della città
    if (key === 'priceSource') { applyMarket(); syncForm(); }
  } else {
    const v = parseFloat(e.target.value);
    if (!Number.isFinite(v)) return;
    state[key] = f.type === 'pct' ? v / 100 : f.type === 'int' ? Math.round(v) : v;
  }
  updateVisibility();
  updateDerived();
  if (key === 'priceSource') renderCity();   // la scheda mostra i parametri della fonte scelta
  scheduleRun();
}

// Riepilogo sotto i campi della casa: prezzo, costi, mutuo, rata, affitto, netto
function updateDerived() {
  const { price, down, loan } = purchase(state);
  const rate = initialRate(state);
  const pay = payment(loan, rate, state.mortgageYears * 12);
  const costs = buyCosts(state, price, loan);
  const costLine = state.detailedBuyCosts
    ? `<br>Costi d’acquisto <b>${fmtEur(costs.total)}</b> (${fmtPct(costs.total / price, 1)}): ${state.sellerType === 'builder' ? 'IVA e imposte' : `registro su valore catastale ${fmtEur(costs.cadastral)}`} ${fmtEur(costs.taxes)}, notaio ${fmtEur(costs.notary)}, agenzia ${fmtEur(costs.agency)}, sostitutiva mutuo ${fmtEur(costs.substitute)}, banca ${fmtEur(costs.bank)}`
    : '';
  const realRent = state.rentGrowth - state.inflation;
  $('derived').innerHTML = `Prezzo <b>${fmtEur(price)}</b> · Capitale iniziale <b>${fmtEur(down + costs.total)}</b>${costLine}<br>
    Mutuo <b>${fmtEur(loan)}</b> al ${fmtPct(rate, 2)} · Rata ${state.mortgageType === 'variable' ? 'iniziale ' : ''}<b>${fmtEur(pay)}</b>/mese · Affitto <b>${fmtEur(state.sqm * state.rentPerSqmYear / 12)}</b>/mese (mercato ${realRent >= 0 ? '+' : ''}${fmtPct(realRent, 1)}/anno oltre l’inflazione)<br>
    Netto mensile <b>${fmtEur(netPerPayslip())}</b> × ${state.monthsPerYear}${state.netFromRal ? ` (da RAL ${fmtEur(state.ral)}, ${currentCity().name})` : ''}`;
}

// ---------- Città ----------
// Prezzo e affitto dalla fonte scelta (annunci, OMI, post)
function applyMarket() {
  const m = currentCity().market[state.priceSource];
  if (!m) return;
  state.pricePerSqm = m.pricePerSqm;
  state.rentPerSqmYear = +(m.rentPerSqmMonth * 12).toFixed(1);
}

function buildCitySelect() {
  const sel = $('city');
  sel.innerHTML = Object.entries(CITIES).sort((a, b) => a[1].name.localeCompare(b[1].name, LOCALE)).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join('');
  sel.value = state.city;
}

function onCityChange(e) {
  state.city = e.target.value;
  state.priceSource = marketSource(currentCity(), state.priceSource);
  Object.assign(state, cityParams(currentCity(), state.priceSource));
  buildForm(); syncForm(); renderCity(); scheduleRun();
}
