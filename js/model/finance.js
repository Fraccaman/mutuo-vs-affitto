// Mutuo, costi d'acquisto e portafoglio ETF.
// Dipende da: taxes.js (primaCasaCosts).

// ---------- Mutuo ----------
// Rata mensile francese
function payment(loan, rate, months) {
  if (loan <= 0 || months <= 0) return 0;
  const r = rate / 12;
  if (Math.abs(r) < 1e-12) return loan / months;
  return loan * r / (1 - Math.pow(1 + r, -months));
}

// Capitale finanziabile con una data rata (inverso di payment)
function loanFromPayment(pay, rate, months) {
  const r = rate / 12;
  if (Math.abs(r) < 1e-12) return pay * months;
  return pay * (1 - Math.pow(1 + r, -months)) / r;
}

// Tasso del primo anno: fisso oppure Euribor di oggi + spread
function initialRate(p) {
  return p.mortgageType === 'variable' ? Math.max(0, p.euribor0) + p.mortgageSpread : p.mortgageRate;
}

// ---------- Acquisto ----------
// Prezzo, anticipo e mutuo iniziali
function purchase(p) {
  const price = p.sqm * p.pricePerSqm;
  const down = price * p.downPct;
  return { price, down, loan: price - down };
}

// Costi d'acquisto: dettagliati (imposte prima casa, notaio, agenzia, banca) oppure forfettari.
// taxCredit = registro pagato su un acquisto precedente (riacquisto entro un anno).
function buyCosts(p, price, loan, taxCredit = 0) {
  return p.detailedBuyCosts ? primaCasaCosts(p, price, loan, taxCredit) : { total: price * p.buyCostPct };
}

// Capitale iniziale di chi compra (anticipo + costi): chi affitta investe la stessa somma
function startingCapital(p) {
  const { price, down, loan } = purchase(p);
  return down + buyCosts(p, price, loan).total;
}

// ---------- Portafoglio ETF ----------
// v = valore di mercato, b = costo fiscale (base), debt = debito se i risparmi non bastano
const newPortfolio = () => ({ v: 0, b: 0, debt: 0 });

// Versa (amount > 0) o preleva (amount < 0). Un prelievo vende ETF pagando il capital gain;
// se gli ETF non bastano, la differenza diventa debito.
function invest(pf, amount, cgTax) {
  if (amount >= 0) {
    if (pf.debt > 0) { const d = Math.min(pf.debt, amount); pf.debt -= d; amount -= d; }
    pf.v += amount; pf.b += amount;
    return;
  }
  let need = -amount;
  if (pf.v > 0) {
    const gainFrac = pf.v > pf.b ? (pf.v - pf.b) / pf.v : 0;
    const netPerEuro = 1 - gainFrac * cgTax;
    const gross = Math.min(pf.v, need / netPerEuro);
    pf.b -= pf.b * (gross / pf.v);
    pf.v -= gross;
    need -= gross * netPerEuro;
  }
  if (need > 1e-9) pf.debt += need;
}

// Costo patrimoniale (bollo): riduce valore e base in proporzione, senza tassare plusvalenze
function wealthTax(pf, rate) {
  if (pf.v <= 0 || rate <= 0) return 0;
  const cost = pf.v * rate;
  pf.b *= 1 - rate; pf.v -= cost;
  return cost;
}

// Plusvalenza latente tassabile e valore netto se si vendesse tutto oggi
const unrealizedGain = pf => Math.max(0, pf.v - pf.b);
const pfNet = (pf, cgTax) => pf.v - unrealizedGain(pf) * cgTax - pf.debt;
