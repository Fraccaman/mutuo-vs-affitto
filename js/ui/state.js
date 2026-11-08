// Stato dell'applicazione (parametri + vista) e sua serializzazione nell'URL (#...).
// Dipende da: ui/schema.js, data/cities.js, model/taxes.js.

let state = { city: DEFAULT_CITY };
Object.assign(state, PRESETS.risks());   // dati città + rischi di lungo periodo; il preset legge state.city
const VIEWS = ['simple', 'advanced', 'overview'];
let view = 'simple';
let cmpSalary = 'city';     // scheda Insieme, stipendio nelle altre città: 'city' (RAL media locale) | 'mine' (il mio)

function loadFromUrl() {
  const q = new URLSearchParams(location.hash.slice(1));
  if (q.has('city') && CITIES[q.get('city')] && q.get('city') !== state.city) {
    // parametri della città; quelli presenti nel link li sovrascrivono subito dopo
    state.city = q.get('city');
    const source = marketSource(currentCity(), q.get('priceSource'));
    Object.assign(state, cityParams(currentCity(), source), { priceSource: source });
  }
  if (VIEWS.includes(q.get('view'))) view = q.get('view');
  if (['city', 'mine'].includes(q.get('cmp'))) cmpSalary = q.get('cmp');
  for (const f of FIELDS) {
    if (!q.has(f.key)) continue;
    const v = q.get(f.key);
    if (f.type === 'select') { if (fieldOptions(f).some(o => o[0] === v)) state[f.key] = v; }
    else state[f.key] = f.type === 'bool' ? v === '1' : Number(v);
  }
}

function saveToUrl() {
  const q = new URLSearchParams({ view, city: state.city, cmp: cmpSalary });
  for (const f of FIELDS) {
    const v = state[f.key];
    q.set(f.key, f.type === 'bool' ? (v ? '1' : '0') : f.type === 'select' ? v : String(+v.toPrecision(10)));
  }
  history.replaceState(null, '', '#' + q.toString());
}

const currentCity = () => CITIES[state.city];

const annualNet = () => scenarioNet(state, currentCity());
// Netto per mensilità (come lo stipendio in busta paga)
const netPerPayslip = () => annualNet() / state.monthsPerYear;

// Parametri passati al modello
const modelParams = () => ({ ...state, netMonthly: netPerPayslip() });
