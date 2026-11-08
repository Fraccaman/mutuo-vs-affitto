// Formattazione di numeri, colori del tema e grafici Chart.js.

const $ = id => document.getElementById(id);

// ---------- Numeri ----------
const LOCALE = 'it-IT';
const NF = {
  k: new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }),
  m: new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 2 }),
  eur: new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
};
const pctFormats = new Map();
const fmtK = v => (Math.abs(v) >= 1e6 ? NF.m : NF.k).format(v);       // 250K €, 1,11 Mln €
const fmtEur = v => NF.eur.format(v);                                  // 1.234 €
const fmtPct = (v, d = 0) => {                                         // 12,5%
  if (!pctFormats.has(d)) pctFormats.set(d, new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: d, minimumFractionDigits: d }));
  return pctFormats.get(d).format(v);
};
const fmtNum = (v, d = 2) => v.toLocaleString(LOCALE, { maximumFractionDigits: d });
const listIt = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a.at(-1) : (a[0] ?? '');   // a, b e c
const signed = v => (v >= 0 ? '+' : '−') + fmtK(Math.abs(v));

// Link a una fonte { name, url }
const srcLink = s => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`;

// ---------- Colori del tema (variabili CSS) ----------
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

// Scala divergente per la heatmap. t in [-1, 1]: -1 = affitto, 0 = neutro, +1 = compro
function divergingColor(t) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const a = rgb(css('--heat-mid')), b = rgb(t >= 0 ? css('--buy') : css('--rent'));
  const k = Math.min(1, Math.abs(t));
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

// ---------- Grafici ----------
Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
const charts = {};

// ---------- Disegno pigro ----------
// lazy(el, fn): fn disegna il contenuto di el quando el arriva vicino alla finestra visibile. Le card
// fuori schermo o in una scheda nascosta non si disegnano finché non servono; una nuova chiamata per
// lo stesso elemento sostituisce quella in attesa, così si disegna solo l'ultima versione.
const lazyQueue = new Map();
const lazyObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting || !lazyQueue.has(e.target)) continue;
    const fn = lazyQueue.get(e.target);
    lazyQueue.delete(e.target);
    lazyObserver.unobserve(e.target);
    e.target.classList.remove('lazy-wait');
    fn();
  }
}, { rootMargin: '400px 0px' }) : null;

function lazy(el, fn) {
  if (!lazyObserver) return fn();
  lazyQueue.set(el, fn);
  el.classList.add('lazy-wait');
  lazyObserver.unobserve(el);   // osservarlo di nuovo genera subito un avviso se è già visibile
  lazyObserver.observe(el);
}

// Crea (o ricrea) il grafico nel canvas con l'id dato, con i colori del tema corrente, quando è visibile
function chart(id, cfg) {
  const canvas = $(id);
  lazy(canvas.parentElement, () => {
    if (charts[id]) charts[id].destroy();
    Chart.defaults.color = css('--muted');
    Chart.defaults.borderColor = css('--grid');
    charts[id] = new Chart(canvas, cfg);
  });
}
