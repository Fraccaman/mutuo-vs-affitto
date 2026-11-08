// Analisi costruite sopra la simulazione: Monte Carlo, pareggio, sensitività, verifica del mutuo.
// Dipende da: simulate.js, stats.js, finance.js, taxes.js.

const finalDiff = r => { const H = r.nwB.length - 1; return r.nwB[H] - r.nwR[H]; };

// ---------- Monte Carlo ----------
const FAN_QUANTILES = [0.05, 0.25, 0.5, 0.75, 0.95];

/**
 * Simula p.nSims futuri e ne riassume la distribuzione.
 * buyQ/rentQ/diffQ[k][y] = quantile FAN_QUANTILES[k] all'anno y; pBuyWins[y] = P(compro > affitto).
 * buy/rent = riassunto all'orizzonte (media, percentili, CVaR, equivalente certo, ...).
 */
function monteCarlo(p) {
  const H = Math.round(p.horizon);
  const N = Math.max(1, Math.round(p.nSims));
  const rng = mulberry32(p.seed);
  const B = Array.from({ length: H + 1 }, () => new Float64Array(N));
  const R = Array.from({ length: H + 1 }, () => new Float64Array(N));
  const eqB = new Float64Array(N);
  const risks = [];
  let moves = 0, unemp = 0, bearMonths = 0, anyMove = 0, highYears = 0, underwater = 0, renovated = 0;
  for (let i = 0; i < N; i++) {
    const r = simulatePath(p, rng, true);
    eqB[i] = r.houseEqB;
    risks.push(r.risks);
    if (r.underwater) underwater++;
    if (r.risks.epbdAction === 'renovate') renovated++;
    for (let y = 0; y <= H; y++) { B[y][i] = r.nwB[y]; R[y][i] = r.nwR[y]; }
    moves += r.moves; unemp += r.unempSpells; bearMonths += r.bearMonths; highYears += r.highYears;
    if (r.moves) anyMove++;
  }

  const out = {
    years: [], pBuyWins: [], pCI: [],
    buyQ: FAN_QUANTILES.map(() => []), rentQ: FAN_QUANTILES.map(() => []), diffQ: FAN_QUANTILES.map(() => []),
  };
  for (let y = 0; y <= H; y++) {
    const diff = new Float64Array(N);
    let wins = 0;
    for (let i = 0; i < N; i++) { diff[i] = B[y][i] - R[y][i]; if (diff[i] > 0) wins++; }
    const sortedB = Float64Array.from(B[y]).sort();
    const sortedR = Float64Array.from(R[y]).sort();
    const sortedD = diff.sort();
    FAN_QUANTILES.forEach((q, k) => {
      out.buyQ[k].push(quantile(sortedB, q));
      out.rentQ[k].push(quantile(sortedR, q));
      out.diffQ[k].push(quantile(sortedD, q));
    });
    out.pBuyWins.push(wins / N);
    out.pCI.push(wilson(wins, N));
    out.years.push(y);
    if (y === H) {
      out.finalDiff = sortedD;
      out.start = startingCapital(p);
      const floor = Math.max(1000, out.start * 0.1);
      out.buy = summarize(sortedB, p.riskAversion, floor);
      out.rent = summarize(sortedR, p.riskAversion, floor);
      out.buy.pBelowStart = B[y].filter(v => v < out.start).length / N;
      out.rent.pBelowStart = R[y].filter(v => v < out.start).length / N;
      out.buy.houseAt = houseShareAt(B[y], eqB);
    }
  }
  out.events = { pAnyMove: anyMove / N, unempPerPath: unemp / N, bearShare: bearMonths / (N * H * 12), inflHighShare: highYears / (N * H) };

  // Code: restare coi debiti (patrimonio negativo) in qualche anno o alla fine
  const everNeg = A => { let k = 0; for (let i = 0; i < N; i++) { for (let y = 1; y <= H; y++) if (A[y][i] < 0) { k++; break; } } return k / N; };
  const endNeg = A => A[H].filter(v => v < 0).length / N;
  out.tail = {
    buy: { pEverNeg: everNeg(B), pEndNeg: endNeg(B), pUnderwater: underwater / N },
    rent: { pEverNeg: everNeg(R), pEndNeg: endNeg(R) },
  };

  // Rischi di lungo periodo: come cambia il risultato nei futuri in cui si verificano
  const diff = Float64Array.from({ length: N }, (_, i) => B[H][i] - R[H][i]);
  const epbdHits = risks.filter(r => r.epbd).length;
  const factors = [
    p.declineProb > 0 && ['Declino demografico', 'prezzi e affitti crescono meno, vendere costa di più', r => r.declined],
    p.houseIdioVol > 0 && ['La tua casa vale ≥10% meno del mercato', 'rischio specifico della singola casa', r => r.idioLow],
    p.hoodShockProb > 0 && ['Il quartiere degrada', `perdita del ${Math.round(p.hoodShockSize * 100)}% sul valore`, r => r.hood],
    p.epbdProb > 0 && ['Obbligo di classe energetica', epbdHits ? `quando arriva: lavori nel ${Math.round(renovated / epbdHits * 100)}% dei casi, altrimenti sconto sul valore` : 'non arriva mai entro l’orizzonte', r => r.epbd],
  ].filter(Boolean);
  out.risks = factors.map(([label, desc, test]) => ({ label, desc, ...splitBy(diff, risks.map(test)) }));
  return out;
}

// Divide i futuri in base a un evento: quota, P(compro vince) e vantaggio mediano con e senza
function splitBy(diff, flags) {
  const yes = [], no = [];
  flags.forEach((f, i) => (f ? yes : no).push(diff[i]));
  const stats = a => {
    if (!a.length) return null;
    const s = Float64Array.from(a).sort();
    return { pWin: a.filter(v => v > 0).length / a.length, median: quantile(s, 0.5), n: a.length };
  };
  return { share: yes.length / diff.length, with: stats(yes), without: stats(no) };
}

// Parte "casa" (netta) del patrimonio di chi compra al quantile q: media della casa netta
// nei futuri con patrimonio vicino a quel quantile (±2% delle simulazioni).
function houseShareAt(total, house) {
  const N = total.length;
  const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => total[a] - total[b]);
  const w = Math.max(1, Math.round(N * 0.02));
  return q => {
    const c = Math.round(q * (N - 1)), lo = Math.max(0, c - w), hi = Math.min(N - 1, c + w);
    let sum = 0;
    for (let k = lo; k <= hi; k++) sum += house[idx[k]];
    return sum / (hi - lo + 1);
  };
}

// ---------- Scenario deterministico ----------
// Rendimento ETF che rende indifferenti le due strategie (null se fuori da −5%…25%)
function breakEvenEtf(p) {
  const f = r => finalDiff(deterministic({ ...p, etfReturn: r }));
  let lo = -0.05, hi = 0.25;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}

// Primo anno da cui chi compra resta sempre avanti (null = mai)
function crossoverYear(nwB, nwR) {
  let year = null;
  for (let y = nwB.length - 1; y >= 0; y--) { if (nwB[y] > nwR[y]) year = y; else break; }
  return year;
}

// Sensitività: vantaggio finale di chi compra muovendo un parametro alla volta
const NON_NEGATIVE = new Set(['maintPct', 'agencyBuyPct', 'buyCostPct', 'sellCostPct', 'rentPerSqmYear', 'mortgageSpread', 'mortgageRate']);
function tornado(p) {
  const variable = p.mortgageType === 'variable';
  const items = [
    ['Rendimento ETF', 'etfReturn', 0.02, 'pp'],
    ['Crescita prezzo casa', 'houseGrowth', 0.01, 'pp'],
    ['Crescita affitti', 'rentGrowth', 0.01, 'pp'],
    [variable ? 'Spread mutuo' : 'Tasso mutuo', variable ? 'mortgageSpread' : 'mortgageRate', 0.01, 'pp'],
    ['Manutenzione', 'maintPct', 0.005, 'pp'],
    ['Crescita stipendio', 'salaryGrowth', 0.01, 'pp'],
    p.detailedBuyCosts ? ['Provvigione agenzia', 'agencyBuyPct', 0.01, 'pp'] : ['Costi acquisto', 'buyCostPct', 0.03, 'pp'],
    ['Inflazione', 'inflation', 0.01, 'pp'],
    ['Costi vendita', 'sellCostPct', 0.02, 'pp'],
    ['Affitto iniziale €/m²', 'rentPerSqmYear', 30, '€'],
  ];
  return {
    baseDiff: finalDiff(deterministic(p)),
    rows: items.map(([label, key, delta, unit]) => ({
      label, key, delta, unit,
      // costi e affitto non possono diventare negativi
      low: finalDiff(deterministic({ ...p, [key]: NON_NEGATIVE.has(key) ? Math.max(0, p[key] - delta) : p[key] - delta })),
      high: finalDiff(deterministic({ ...p, [key]: p[key] + delta })),
    })).sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low)),
  };
}

// Griglia rendimento ETF × crescita casa (scostamenti in punti percentuali dall'ipotesi attuale)
function sensitivityGrid(p, etfSteps = [-3, -2, -1, 0, 1, 2, 3], houseSteps = [2, 1.5, 1, 0.5, 0, -0.5, -1, -1.5, -2]) {
  const etf = etfSteps.map(d => +(p.etfReturn + d / 100).toFixed(4));
  const house = houseSteps.map(d => +(p.houseGrowth + d / 100).toFixed(4));
  const values = house.map(h => etf.map(e => finalDiff(deterministic({ ...p, etfReturn: e, houseGrowth: h }))));
  return { etf, house, values };
}

// ---------- Verifica del mutuo (regole tipiche delle banche) ----------
/**
 * Rata/reddito e mutuo/valore rispetto ai limiti della banca. Se non è concedibile,
 * propone anticipo, superficie o reddito compatibili.
 * annualNet = netto annuo: le banche ragionano sul netto annuo / 12.
 * netForRal = funzione RAL → netto annuo (per stimare la RAL necessaria), opzionale.
 */
function loanCheck(p, annualNet, netForRal) {
  const { price, loan } = purchase(p);
  const rate = initialRate(p);
  const n = p.mortgageYears * 12;
  const pay = payment(loan, rate, n);
  const net = annualNet / 12;
  const maxPay = p.maxDTI * net;
  const maxLoan = Math.min(loanFromPayment(maxPay, rate, n), price * p.maxLTV);
  const dti = net > 0 ? pay / net : Infinity, ltv = 1 - p.downPct;
  const okDTI = pay <= maxPay + 0.5, okLTV = ltv <= p.maxLTV + 1e-9;
  const out = { price, loan, rate, pay, net, maxPay, maxLoan, dti, ltv, ok: okDTI && okLTV, okDTI, okLTV };
  if (out.ok) return out;

  out.downNeeded = Math.max(0, price - maxLoan);
  out.downPctNeeded = out.downNeeded / price;
  out.capitalNeeded = out.downNeeded + buyCosts(p, price, maxLoan).total;
  const maxPriceAtDown = okLTV ? loanFromPayment(maxPay, rate, n) / Math.max(1e-9, 1 - p.downPct) : 0;
  out.maxSqm = Math.floor(maxPriceAtDown / p.pricePerSqm);
  out.netNeeded = pay / p.maxDTI;   // netto mensile necessario
  if (netForRal) {
    let lo = 0, hi = 500000;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (netForRal(mid) / 12 >= out.netNeeded) hi = mid; else lo = mid; }
    out.ralNeeded = hi;
  }
  return out;
}

// ---------- Perché vince chi vince ----------
/**
 * Costo "vero" di abitare, anno per anno, comprando o affittando (scenario medio).
 * Per chi compra la quota capitale della rata non è un costo (diventa casa); lo sono interessi,
 * manutenzione, spese fisse, il rendimento perso sul capitale fermo nella casa (casa − mutuo,
 * che avrebbe reso come gli ETF) e la compravendita spalmata sull'orizzonte. La crescita attesa
 * del prezzo è un guadagno e riduce il costo. Mutuo variabile: tasso iniziale costante.
 * rows = voci del primo anno (€ e % del prezzo); years[y] = { buy, rent, parts } per anno y.
 */
function housingCostBreakdown(p) {
  const { price, down, loan } = purchase(p);
  const buy0 = buyCosts(p, price, loan).total;
  const capital = down + buy0;
  const H = Math.max(1, Math.round(p.horizon));
  const rate = initialRate(p);
  const nMonths = p.mortgageYears * 12;
  const pay = payment(loan, rate, nMonths);

  // rendimento netto annuo dell'ETF: TER e bollo ogni anno, plusvalenze tassate alla vendita
  const r = p.etfReturn - p.ter - p.stampDuty;
  const etfNet = Math.pow(Math.max(0, Math.pow(1 + r, H) * (1 - p.cgTax) + p.cgTax), 1 / H) - 1;
  const priceH = price * Math.pow(1 + p.houseGrowth, H);
  const transB = (buy0 + priceH * p.sellCostPct) / H, transR = p.renterUpfrontCosts / H;

  const years = [];
  let debt = loan;
  for (let y = 0; y < H; y++) {
    const house = price * Math.pow(1 + p.houseGrowth, y);
    const infl = Math.pow(1 + p.inflation, y);
    const equity = house - debt;
    let interest = 0;
    for (let m = 0; m < 12 && debt > 1e-6; m++) { const i = debt * rate / 12; interest += i; debt -= Math.min(debt, pay - i); }
    const deduction = p.interestDeduction ? Math.min(interest, p.deductionCap) * p.deductionRate : 0;
    const condoY = p.condoMonthly * 12 * infl;
    const parts = {
      interest: interest - deduction,
      opportunity: equity * etfNet,
      maint: house * p.maintPct,
      fixed: condoY + p.ownerFixedMonthly * 12 * infl,
      trans: transB,
      growth: -house * p.houseGrowth,
    };
    const rentY = p.sqm * p.rentPerSqmYear * Math.pow(1 + p.rentGrowth, y);
    const rentParts = { rent: rentY, fixed: condoY * p.tenantCondoShare, trans: transR };
    const sum = o => Object.values(o).reduce((s, v) => s + v, 0);
    years.push({ y: y + 1, buy: sum(parts), rent: sum(rentParts), parts, rentParts, deduction, debtEnd: debt });
  }

  const y0 = years[0];
  const rows = [
    { key: 'interest', label: 'Interessi del mutuo', buy: y0.parts.interest, rent: 0,
      note: y0.deduction ? `al netto di ${Math.round(y0.deduction)} € di detrazione; la quota capitale diventa casa` : 'la quota capitale non è un costo: diventa casa' },
    { key: 'opportunity', label: 'Rendimento perso sul capitale', buy: y0.parts.opportunity, rent: 0,
      note: 'i soldi fermi nella casa (anticipo, poi le rate pagate) avrebbero reso come gli ETF' },
    { key: 'maint', label: 'Manutenzione', buy: y0.parts.maint, rent: 0, note: 'ordinaria e straordinaria, in media' },
    { key: 'fixed', label: 'Condominio, assicurazione, IMU', buy: y0.parts.fixed, rent: y0.rentParts.fixed,
      note: 'chi affitta paga solo i servizi del condominio' },
    { key: 'trans', label: 'Compravendita spalmata sugli anni', buy: transB, rent: transR,
      note: `acquisto + vendita finale divisi per ${H} anni` },
    { key: 'growth', label: 'Crescita del prezzo della casa', buy: y0.parts.growth, rent: 0,
      note: 'guadagno atteso, riduce il costo di chi compra' },
    { key: 'rent', label: 'Affitto', buy: 0, rent: y0.rentParts.rent, note: 'canone del primo anno' },
  ];
  for (const x of rows) { x.buyPct = x.buy / price; x.rentPct = x.rent / price; }

  // primo anno da cui abitare costa meno a chi compra (null = mai), e risparmio cumulato
  const firstCheaper = years.find(x => x.buy < x.rent)?.y ?? null;
  const cumGap = years.reduce((s, x) => s + x.rent - x.buy, 0);

  const rentMonth0 = p.sqm * p.rentPerSqmYear / 12;
  const rentMonthH = rentMonth0 * Math.pow(1 + p.rentGrowth, H);
  const leveredGrowth = capital > 0 ? price * p.houseGrowth / capital : 0;   // crescita casa sul capitale
  const yield0 = p.rentPerSqmYear / p.pricePerSqm;                           // canone / prezzo oggi
  const yieldH = yield0 * Math.pow((1 + p.rentGrowth) / (1 + p.houseGrowth), H);
  const payoffYear = loan > 0 && p.mortgageYears <= H ? p.mortgageYears : null;

  return { price, capital, rate, pay, etfNet, rows, totBuy: y0.buy, totRent: y0.rent, years, firstCheaper, cumGap,
    rentMonth0, rentMonthH, leveredGrowth, yield0, yieldH, payoffYear, H };
}

// Affitto €/m²/anno che rende indifferenti le due strategie nello scenario medio (null se fuori da 0…3×)
function breakEvenRent(p) {
  const f = x => finalDiff(deterministic({ ...p, rentPerSqmYear: x }));
  let lo = 0, hi = p.rentPerSqmYear * 3;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}
