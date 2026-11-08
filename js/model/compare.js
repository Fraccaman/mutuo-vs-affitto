// Confronto tra città (scheda "Insieme"): stesso scenario personale, dati di ogni capoluogo.
// Dipende da: data/cities.js, model/calibration.js, model/taxes.js, model/analysis.js.

// Tetto alle simulazioni per città: il confronto simula tutte le città a ogni ricalcolo
const COMPARE_MAX_SIMS = 4000;

/**
 * Parametri per simulare la città `key` partendo dallo scenario corrente `base` (modelParams()).
 * La città selezionata resta com'è (è lo scenario delle altre schede). Per le altre valgono prezzo e
 * affitto al m² (stessa fonte, se la città ce l'ha, altrimenti annunci), tasso del mutuo, rendita
 * catastale, crescite e volatilità stimate dalle serie storiche e addizionali IRPEF del capoluogo.
 * La superficie resta quella scelta. salary: 'city' = RAL media della città; 'mine' = reddito dello
 * scenario corrente (se calcolato dalla RAL, il netto usa le addizionali della città).
 */
function cityScenario(base, key, salary = 'city') {
  const nSims = Math.min(Math.round(base.nSims), COMPARE_MAX_SIMS);
  if (key === base.city) return { ...base, nSims };
  const city = CITIES[key], priceSource = marketSource(city, base.priceSource);
  const { sqm, ...cityP } = cityParams(city, priceSource);   // eslint-disable-line no-unused-vars
  const p = { ...base, ...cityP, city: key, priceSource, nSims, netFromRal: salary === 'city' || base.netFromRal };
  if (salary === 'mine') p.ral = base.ral;
  p.netMonthly = scenarioNet(p, city) / p.monthsPerYear;
  return p;
}

/**
 * Risultati di una città nello scenario medio; withMc aggiunge quelli del Monte Carlo.
 * Senza Monte Carlo (stocastico spento o in corso) le sintesi usano lo scenario medio.
 */
function cityOutcome(p) {
  const det = deterministic(p), d = det.det, H = det.nwB.length - 1;
  const loan = loanCheck(p, p.netMonthly * p.monthsPerYear);   // netto medio mensile = annuo / 12
  const rent = p.sqm * p.rentPerSqmYear / 12;
  return {
    key: p.city, name: CITIES[p.city].name, p, det, H,
    price: d.price, capital: d.down + d.buyCosts, payment: d.payment, rent,
    net: loan.net, dti: loan.dti, dtiOk: loan.okDTI,
    rentShare: loan.net > 0 ? rent / loan.net : Infinity,   // affitto / netto
    yearsOfNet: d.price / (loan.net * 12),                  // anni di stipendio netto per comprare
    grossYield: p.rentPerSqmYear / p.pricePerSqm,           // canone annuo / prezzo (rendimento lordo)
    be: breakEvenEtf(p),
    mc: null, pWin: null,
    diff: finalDiff(det), wealthB: det.nwB[H], wealthR: det.nwR[H],   // vantaggio di chi compra e patrimoni
  };
}

const withMc = (o, mc) => ({ ...o, mc, pWin: mc.pBuyWins[o.H], diff: mc.diffQ[2][o.H], wealthB: mc.buy.median, wealthR: mc.rent.median });
