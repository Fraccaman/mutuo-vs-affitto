// Statistiche delle serie storiche di una città e parametri del simulatore che ne derivano.
// Dipende da: stats.js (mean, sd).

function cityStats(city) {
  const h = city.history;
  // prezzi: AR(1) stimato solo su coppie di anni consecutivi
  const yoy = Object.entries(h.housePriceYoY.data).map(([y, v]) => [+y, v / 100]);
  const avg = mean(yoy.map(x => x[1]));
  let num = 0, den = 0;
  const pairs = [];
  for (let i = 1; i < yoy.length; i++) if (yoy[i][0] === yoy[i - 1][0] + 1) pairs.push([yoy[i - 1][1], yoy[i][1]]);
  for (const [a, b] of pairs) { num += (a - avg) * (b - avg); den += (a - avg) ** 2; }
  const ar = den > 0 ? Math.max(0, Math.min(0.95, num / den)) : 0;   // senza coppie consecutive: nessun momentum
  const omi = Object.entries(h.omiPrice.data);
  const omiYears = (omi.length - 1) / 2;
  const omiCagr = Math.pow(omi.at(-1)[1] / omi[0][1], 1 / omiYears) - 1;
  // redditi
  const inc = Object.entries(h.medianIncome.data).map(([y, v]) => [+y, v]);
  const incomeCagr = Math.pow(inc.at(-1)[1] / inc[0][1], 1 / (inc.at(-1)[0] - inc[0][0])) - 1;
  const realG = [];
  for (let i = 1; i < inc.length; i++) realG.push(inc[i][1] / inc[i - 1][1] - 1 - h.medianIncome.inflation[inc[i][0]] / 100);
  return {
    houseMean: avg,
    houseSd: sd(yoy.map(x => x[1])),
    houseAR: +ar.toFixed(2),
    // volatilità delle sorprese tale che la variabilità totale simulata (momentum + inflazione ~1,2%)
    // sia pari a quella storica
    houseVolMatched: +(Math.sqrt(Math.max(0, sd(yoy.map(x => x[1])) ** 2 - 0.012 ** 2)) * Math.sqrt(1 - ar * ar)).toFixed(4),
    houseN: yoy.length,
    houseYears: yoy.map(x => x[0]),
    omiFrom: omi[0][0].split('-')[0], omiTo: omi.at(-1)[0].split('-')[0],
    incomeFrom: inc[0][0], incomeTo: inc.at(-1)[0],
    incomeRealCagr: +(Math.pow(realG.reduce((x, g) => x * (1 + g), 1), 1 / realG.length) - 1).toFixed(4),
    omiCagr: +omiCagr.toFixed(4),
    incomeCagr: +incomeCagr.toFixed(4),
    incomeRealVol: +sd(realG).toFixed(3),
  };
}

// Fonte prezzi disponibile nella città: quella chiesta oppure gli annunci
const marketSource = (city, source) => city.market[source] ? source : 'annunci';

// Parametri del simulatore per la città e la fonte prezzi scelta
function cityParams(city, source) {
  const st = cityStats(city);
  const out = {};
  for (const [k, def] of Object.entries(city.params)) out[k] = def.from ? st[def.from] : def.value;
  const m = city.market[marketSource(city, source)];
  out.pricePerSqm = m.pricePerSqm;
  out.rentPerSqmYear = +(m.rentPerSqmMonth * 12).toFixed(1);
  return out;
}
