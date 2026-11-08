// Avvio dell'applicazione: vista, ricalcolo e collegamento degli eventi.
// Caricato per ultimo: usa tutti gli altri moduli.

// Mostra una scheda e calcola ciò che le serve. Gli elementi condivisi dichiarano con data-views
// in quali schede compaiono (index.html).
function setView(v) {
  view = VIEWS.includes(v) ? v : 'simple';
  document.querySelectorAll('.tabs [data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  for (const k of VIEWS) $('view-' + k).hidden = view !== k;
  document.querySelectorAll('[data-views]').forEach(el => { el.hidden = !el.dataset.views.split(' ').includes(view); });
  if (view === 'overview' || mainDirty) run(); else saveToUrl();
  requestAnimationFrame(() => Object.values(charts).forEach(c => c.resize()));
}

// Ricalcolo con debounce: i campi numerici generano molti eventi mentre si scrive
let runTimer = null;
function scheduleRun() { clearTimeout(runTimer); runTimer = setTimeout(run, 150); }

// Le schede Semplice e Avanzata condividono lo stesso calcolo; la scheda Insieme ha il suo.
// Si calcola solo la scheda visibile: le altre si aggiornano quando vengono aperte.
let mainDirty = true;
function run() {
  saveToUrl();
  if (view === 'overview') { mainDirty = true; renderOverview(); return; }
  mainDirty = false;
  const p = modelParams();
  const det = deterministic(p);
  const mc = p.stochastic ? monteCarlo(p) : null;
  const tor = tornado(p);
  const be = breakEvenEtf(p);
  const cross = crossoverYear(det.nwB, det.nwR);

  renderSetup(det);
  renderLoanCheck();
  renderWhy(['s-why', 'a-why'], p, det, be);
  renderSimpleView(mc, det, tor, be);
  renderAdvancedView(p, mc, det, tor, be, cross);
}

function bindEvents() {
  const form = $('form');
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  bindTips();
  $('city').addEventListener('change', onCityChange);

  bindPresets();
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
    setView(b.dataset.goto);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  $('cmp-salary').addEventListener('change', e => { cmpSalary = e.target.value; saveToUrl(); renderOverview(); });

  $('share').addEventListener('click', async e => {
    saveToUrl();
    const label = e.currentTarget.querySelector('span');
    try { await navigator.clipboard.writeText(location.href); label.textContent = 'Copiato!'; }
    catch { prompt('Copia il link:', location.href); }
    setTimeout(() => (label.textContent = 'Copia link'), 1500);
  });
  $('to-params').addEventListener('click', () => $('params').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // i grafici leggono i colori dal CSS: ridisegna quando cambia il tema
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderCity(); run(); });
}

loadFromUrl();
buildCitySelect();
buildForm();
syncForm();
$('cmp-salary').value = cmpSalary;
renderItalyNotes();
renderCity();
bindEvents();
setView(view);   // calcola e disegna la scheda iniziale
