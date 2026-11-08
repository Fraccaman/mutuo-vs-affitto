// Preset: menu a tendina con i preset inclusi (js/data/presets.js) e quelli salvati dall'utente,
// caricamento da file o testo JSON con controllo dei valori, esportazione dello scenario corrente.
// Dipende da: data/presets.js, ui/schema.js (FIELDS, PRESETS), ui/state.js, ui/form.js.

const USER_PRESETS_KEY = 'compro-affitto.presets';
const PRESET_BASES = { default: () => ({ ...DEFAULTS }), ...PRESETS };
// Scenario di partenza del sito e base dei preset JSON senza "base"
const DEFAULT_PRESET_BASE = 'risks';

// ---------- Controllo ----------
/**
 * Controlla un preset (oggetto o testo JSON). Restituisce { preset, errors, warnings }:
 * con errori il preset non va applicato; gli avvisi segnalano chiavi ignorate o valori
 * fuori dai limiti del pannello (applicati comunque).
 */
function validatePreset(input) {
  const errors = [], warnings = [];
  let obj = input;
  if (typeof input === 'string') {
    try { obj = JSON.parse(input); } catch (e) { return { preset: null, errors: [`JSON non valido: ${e.message}`], warnings }; }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { preset: null, errors: ['Il preset deve essere un oggetto JSON { ... }'], warnings };

  const known = new Set(['id', 'name', 'description', 'base', 'city', 'priceSource', 'params']);
  for (const k of Object.keys(obj)) if (!known.has(k)) warnings.push(`Chiave “${k}” ignorata (ammesse: ${[...known].join(', ')})`);

  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : null;
  if (!name) errors.push('Manca “name”: il nome da mostrare nel menu');
  const base = obj.base ?? DEFAULT_PRESET_BASE;
  if (!PRESET_BASES[base]) errors.push(`“base” deve essere uno tra ${Object.keys(PRESET_BASES).join(', ')} (trovato “${base}”)`);
  const city = obj.city ?? null;
  if (city !== null && !CITIES[city]) errors.push(`“city” sconosciuta: “${city}” (disponibili: ${Object.keys(CITIES).join(', ')})`);
  const cityObj = CITIES[city ?? state.city];
  const priceSource = obj.priceSource ?? null;
  if (priceSource !== null && cityObj && !cityObj.market[priceSource]) errors.push(`“priceSource” “${priceSource}” non esiste per ${cityObj.name} (disponibili: ${Object.keys(cityObj.market).join(', ')})`);

  const params = {};
  if (obj.params !== undefined && (typeof obj.params !== 'object' || obj.params === null || Array.isArray(obj.params))) {
    errors.push('“params” deve essere un oggetto { "chiave": valore }');
  } else {
    for (const [k, v] of Object.entries(obj.params || {})) {
      const f = FIELDS.find(x => x.key === k);
      if (!f) { warnings.push(`Parametro “${k}” sconosciuto, ignorato`); continue; }
      if (k === 'priceSource') { warnings.push('Usa “priceSource” fuori da “params”'); continue; }
      // percentuale scritta in punti (20 invece di 0.2): errore, non avviso
      const err = checkValue(f, v) || (f.type === 'pct' && f.max !== undefined && v * 100 > f.max && v > 1
        ? `${v} è una percentuale scritta in punti: usa le frazioni (${v}% = ${+(v / 100).toFixed(6)})` : null);
      if (err) { errors.push(`${k}: ${err}`); continue; }
      const range = rangeWarning(f, v);
      if (range) warnings.push(`${k}: ${range}`);
      params[k] = v;
    }
  }
  if (errors.length) return { preset: null, errors, warnings };
  return { preset: { id: obj.id, name, description: obj.description || '', base, city, priceSource, params }, errors, warnings };
}

// Tipo del valore rispetto al campo; null se va bene
function checkValue(f, v) {
  if (f.type === 'bool') return typeof v === 'boolean' ? null : 'serve true o false';
  if (f.type === 'select') {
    if (typeof f.options === 'function') return typeof v === 'string' ? null : 'serve un testo';
    const ok = f.options.map(o => o[0]);
    return ok.includes(v) ? null : `valori ammessi: ${ok.join(', ')}`;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'serve un numero';
  if (f.type === 'int' && !Number.isInteger(v)) return 'serve un numero intero';
  return null;
}

// Limiti del pannello (per le percentuali sono in punti: il JSON usa frazioni)
function rangeWarning(f, v) {
  if (!['pct', 'num', 'int', 'eur'].includes(f.type)) return null;
  const shown = f.type === 'pct' ? v * 100 : v;
  const u = f.type === 'pct' ? '%' : '';
  if (f.min !== undefined && shown < f.min) return `${fmtNum(shown)}${u} sotto il minimo ${f.min}${u}`;
  if (f.max !== undefined && shown > f.max) return `${fmtNum(shown)}${u} sopra il massimo ${f.max}${u}${f.type === 'pct' && v > 1 ? ' (le percentuali vanno scritte come frazioni: 20% = 0.2)' : ''}`;
  return null;
}

// ---------- Applicazione ed esportazione ----------
// Base → città e fonte → parametri. Ricostruisce il form se cambia città.
function applyPreset(preset) {
  const prevCity = state.city;
  if (preset.city) state.city = preset.city;
  Object.assign(state, PRESET_BASES[preset.base]());
  if (preset.priceSource) {
    state.priceSource = preset.priceSource;
    Object.assign(state, cityParams(currentCity(), preset.priceSource));
  }
  Object.assign(state, preset.params);
  if (state.city !== prevCity) { $('city').value = state.city; buildForm(); renderCity(); }
  syncForm(); scheduleRun();
}

// Scenario corrente come preset completo: tutti i parametri, applicabile da solo (base "default")
function currentAsPreset(name) {
  const params = {};
  for (const f of FIELDS) if (f.key !== 'priceSource' && state[f.key] !== undefined) params[f.key] = state[f.key];
  return { name, description: `Esportato il ${new Date().toLocaleDateString(LOCALE)}`, base: 'default', city: state.city, priceSource: state.priceSource, params };
}

// ---------- Preset dell'utente (salvati nel browser) ----------
function loadUserPresets() {
  try {
    const list = JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || '[]');
    return Array.isArray(list) ? list.filter(p => validatePreset(p).preset) : [];
  } catch { return []; }
}
function saveUserPresets(list) {
  try { localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(list)); return true; } catch { return false; }
}

// ---------- Interfaccia ----------
let presetSelected = '';

function buildPresetSelect() {
  const user = loadUserPresets();
  const opt = (v, p) => `<option value="${v}" title="${(p.description || '').replace(/"/g, '&quot;')}">${p.name.replace(/</g, '&lt;')}</option>`;
  $('preset-select').innerHTML = `<option value="">Scegli un preset…</option>
    <optgroup label="Inclusi">${PRESET_LIBRARY.map((p, i) => opt('lib:' + i, p)).join('')}</optgroup>
    ${user.length ? `<optgroup label="I miei preset">${user.map((p, i) => opt('user:' + i, p)).join('')}</optgroup>` : ''}`;
  $('preset-select').value = presetSelected;
  $('preset-delete').hidden = !presetSelected.startsWith('user:');
  const p = presetById(presetSelected);
  $('preset-desc').textContent = p ? p.description || '' : '';
}

function presetById(v) {
  const [kind, i] = v.split(':');
  return kind === 'lib' ? PRESET_LIBRARY[+i] : kind === 'user' ? loadUserPresets()[+i] : null;
}

function selectPreset(v) {
  presetSelected = v;
  const raw = presetById(v);
  if (raw) {
    const { preset, errors } = validatePreset(raw);
    if (preset) applyPreset(preset);
    else alert('Preset non valido:\n' + errors.join('\n'));
  }
  buildPresetSelect();
}

// Finestra per incollare/caricare un JSON, con l'esito del controllo
function openPresetDialog(text = '') {
  const dlg = $('preset-dialog');
  $('preset-json').value = text;
  $('preset-msg').innerHTML = '';
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  $('preset-json').focus();
}

function applyFromDialog(save) {
  const { preset, errors, warnings } = validatePreset($('preset-json').value);
  const list = (cls, items) => items.length ? `<ul class="${cls}">${items.map(x => `<li>${x.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : '';
  if (!preset) { $('preset-msg').innerHTML = list('err', errors) + list('warn', warnings); return; }
  applyPreset(preset);
  if (save) {
    const user = loadUserPresets().filter(p => p.name !== preset.name);
    user.push(stripPreset(preset));
    saveUserPresets(user);
    presetSelected = 'user:' + (user.length - 1);
  } else presetSelected = '';
  buildPresetSelect();
  if (warnings.length) { $('preset-msg').innerHTML = `<p>Applicato, con avvisi:</p>${list('warn', warnings)}`; return; }
  $('preset-dialog').close();
}

// Preset senza campi vuoti, pronto da salvare o esportare
function stripPreset(p) {
  const out = { name: p.name };
  if (p.description) out.description = p.description;
  out.base = p.base;
  if (p.city) out.city = p.city;
  if (p.priceSource) out.priceSource = p.priceSource;
  if (p.params && Object.keys(p.params).length) out.params = p.params;
  return out;
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset';

function bindPresets() {
  // all'avvio senza link condiviso il menu mostra il preset di partenza
  const start = PRESET_LIBRARY.findIndex(p => p.id === DEFAULT_PRESET_BASE);
  if (location.hash.length <= 1 && start >= 0) presetSelected = 'lib:' + start;
  buildPresetSelect();
  $('preset-select').addEventListener('change', e => selectPreset(e.target.value));
  // dopo una modifica a mano il menu ricorda il preset di partenza
  $('form').addEventListener('input', () => { if (presetSelected) $('preset-desc').textContent = 'Modificato rispetto al preset.'; });
  $('preset-import').addEventListener('click', () => openPresetDialog());
  $('preset-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) openPresetDialog(await file.text());
  });
  $('preset-export').addEventListener('click', () => {
    const name = prompt('Nome del preset da esportare:', `Scenario ${currentCity().name}`);
    if (name) downloadJson(currentAsPreset(name.trim()), slug(name) + '.json');
  });
  $('preset-save').addEventListener('click', () => {
    const name = prompt('Salva lo scenario corrente nel browser come:', `Il mio scenario ${currentCity().name}`);
    if (!name) return;
    const p = currentAsPreset(name.trim());
    const user = loadUserPresets().filter(x => x.name !== p.name);
    user.push(p);
    if (!saveUserPresets(user)) { alert('Il browser non permette di salvare: usa “Esporta JSON”.'); return; }
    presetSelected = 'user:' + (user.length - 1);
    buildPresetSelect();
  });
  $('preset-delete').addEventListener('click', () => {
    const [, i] = presetSelected.split(':');
    const user = loadUserPresets();
    if (!user[+i] || !confirm(`Eliminare il preset “${user[+i].name}”?`)) return;
    user.splice(+i, 1);
    saveUserPresets(user);
    presetSelected = '';
    buildPresetSelect();
  });
  $('preset-apply').addEventListener('click', () => applyFromDialog(false));
  $('preset-apply-save').addEventListener('click', () => applyFromDialog(true));
  $('preset-cancel').addEventListener('click', () => $('preset-dialog').close());
  $('preset-template').addEventListener('click', () => {
    $('preset-json').value = JSON.stringify({ name: 'Il mio preset', description: 'Cosa cambia', base: DEFAULT_PRESET_BASE, city: state.city, params: { downPct: 0.3, mortgageRate: 0.03, horizon: 20 } }, null, 2);
  });
  $('preset-copy-current').addEventListener('click', () => {
    $('preset-json').value = JSON.stringify(currentAsPreset('Scenario corrente'), null, 2);
  });
}
