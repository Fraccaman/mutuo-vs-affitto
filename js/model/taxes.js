// Calcoli fiscali italiani (2026): costi d'acquisto prima casa e netto da RAL.
// Dipende da: nessun altro modulo.

// Costi d'acquisto prima casa. taxCredit = registro pagato su un precedente acquisto (riacquisto entro un anno).
function primaCasaCosts(p, price, loan, taxCredit = 0) {
  let taxes;
  if (p.sellerType === 'builder') taxes = price * 0.04 + 600;
  else taxes = Math.max(1000, p.renditaCatastale * 1.05 * 110 * 0.02) + 100;
  taxes = Math.max(p.sellerType === 'builder' ? 600 : 100, taxes - taxCredit);
  const agency = price * p.agencyBuyPct * 1.22;
  const substitute = loan * 0.0025;
  const notary = loan > 0 ? p.notaryCost : p.notaryCost * 0.6;   // senza nuovo atto di mutuo
  const bank = loan > 0 ? p.bankCosts : 0;
  const total = taxes + agency + substitute + notary + bank;
  return { taxes, agency, substitute, notary, bank, total, cadastral: p.renditaCatastale * 1.05 * 110 };
}

// Scaglioni IRPEF 2026
const IRPEF = [[28000, 0.23], [50000, 0.33], [Infinity, 0.43]];

function progressive(income, brackets) {
  let tax = 0, prev = 0;
  for (const [limit, rate] of brackets) {
    if (income <= prev) break;
    tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
  }
  return tax;
}

// Detrazione per lavoro dipendente (art. 13 TUIR, valori dal 2022)
function employeeDeduction(r) {
  let d;
  if (r <= 15000) d = 1955;
  else if (r <= 28000) d = 1910 + 1190 * (28000 - r) / 13000;
  else if (r <= 50000) d = 1910 * (50000 - r) / 22000;
  else d = 0;
  if (r > 25000 && r <= 35000) d += 65;
  return d;
}

/**
 * Stima del netto annuo da RAL per un dipendente senza familiari a carico.
 * city.taxes: { regional: [[limite, aliquota], ...], municipalRate, municipalExemption }
 */
function netFromRal(ral, city) {
  const inps = ral * 0.0919;
  const r = Math.max(0, ral - inps);
  const gross = progressive(r, IRPEF);
  const det = employeeDeduction(r);
  // Taglio del cuneo (L. 207/2024): somma esente fino a 20k, ulteriore detrazione 20k–40k
  let bonus = 0, extra = 0;
  if (r <= 8500) bonus = r * 0.071;
  else if (r <= 15000) bonus = r * 0.053;
  else if (r <= 20000) bonus = r * 0.048;
  else if (r <= 32000) extra = 1000;
  else if (r <= 40000) extra = 1000 * (40000 - r) / 8000;
  // Trattamento integrativo (fino a 15k, se l'imposta supera la detrazione)
  const ti = r <= 15000 && gross > det - 75 ? 1200 : 0;
  const irpef = Math.max(0, gross - det - extra);
  // le addizionali sono dovute solo se è dovuta l'IRPEF (no tax area)
  const t = city.taxes;
  const regional = irpef > 0 ? progressive(r, t.regional) : 0;
  const municipal = irpef > 0 && r > t.municipalExemption ? r * t.municipalRate : 0;
  const net = r - irpef - regional - municipal + bonus + ti;
  return { ral, inps, taxable: r, gross, det, extra, bonus, ti, irpef, regional, municipal, net };
}

// Detrazione IRPEF 19% sulla provvigione dell'agenzia per l'acquisto prima casa (max 1.000 € di provvigione)
const AGENCY_DEDUCTION_RATE = 0.19;
const AGENCY_DEDUCTION_CAP = 1000;
function agencyDeduction(costs) {
  return Math.min(costs.agency, AGENCY_DEDUCTION_CAP) * AGENCY_DEDUCTION_RATE;
}

// Netto annuo di uno scenario: calcolato dalla RAL con le tasse della città, oppure inserito a mano
function scenarioNet(p, city) {
  return p.netFromRal ? netFromRal(p.ral, city).net : p.netMonthly * p.monthsPerYear;
}
