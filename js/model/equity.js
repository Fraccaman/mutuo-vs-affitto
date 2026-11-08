// Modelli dei rendimenti azionari.
// Dipende da: random.js.

// Regime switching lognormale (Hardy 2001): drift e volatilità mensili per i regimi bull/bear,
// con drift tali che la media stazionaria del log-rendimento annuo sia muAnnualLog.
function rsSetup(p, muAnnualLog) {
  const piBear = p.rsPBullBear / Math.max(1e-9, p.rsPBullBear + p.rsPBearBull);
  const muBull = (muAnnualLog - piBear * p.rsBearGap) / 12;
  const muBear = muBull + p.rsBearGap / 12;
  return { piBear, muBull, muBear, sBull: p.rsBullVol / Math.sqrt(12), sBear: p.rsBearVol / Math.sqrt(12) };
}

// Volatilità annua del log-rendimento, per standardizzare lo shock annuale correlato alla casa.
// Per il regime switching non c'è una formula chiusa semplice: stima numerica, con cache.
const volCache = new Map();
function equityAnnualVol(p) {
  if (p.equityModel !== 'rs') return p.etfVol;
  const key = [p.rsBullVol, p.rsBearVol, p.rsBearGap, p.rsPBullBear, p.rsPBearBull].join('|');
  if (volCache.has(key)) return volCache.get(key);
  const rng = mulberry32(12345), g = makeGauss(rng), rs = rsSetup(p, 0);
  const n = 4000;
  let bear = rng() < rs.piBear, s1 = 0, s2 = 0;
  for (let y = 0; y < n; y++) {
    let l = 0;
    for (let m = 0; m < 12; m++) {
      if (bear) { if (rng() < p.rsPBearBull) bear = false; } else if (rng() < p.rsPBullBear) bear = true;
      l += bear ? rs.muBear + rs.sBear * g() : rs.muBull + rs.sBull * g();
    }
    s1 += l; s2 += l * l;
  }
  const v = Math.sqrt(Math.max(1e-8, s2 / n - (s1 / n) ** 2));
  volCache.set(key, v);
  return v;
}
