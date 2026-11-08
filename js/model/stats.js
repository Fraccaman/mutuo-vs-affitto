// Statistiche descrittive e misure di rischio.

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

// Deviazione standard campionaria
function sd(a) {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}

// Quantile con interpolazione lineare (array ordinato crescente)
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Intervallo di confidenza di Wilson al 95% per una proporzione
function wilson(k, n, z = 1.96) {
  const ph = k / n, d = 1 + z * z / n;
  const c = (ph + z * z / (2 * n)) / d;
  const h = z * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

// Expected shortfall: media del peggior q% (array ordinato crescente)
function cvar(sorted, q) {
  const k = Math.max(1, Math.floor(sorted.length * q));
  let s = 0; for (let i = 0; i < k; i++) s += sorted[i];
  return s / k;
}

// Equivalente certo con utilità CRRA. Il patrimonio sotto la soglia è troncato
// (in pratica si sopravvive comunque, con pensione o welfare).
function certaintyEquivalent(arr, gamma, floor) {
  const n = arr.length;
  if (Math.abs(gamma - 1) < 1e-9) {
    let s = 0; for (const w of arr) s += Math.log(Math.max(w, floor));
    return Math.exp(s / n);
  }
  // scala per stabilità numerica
  let s = 0; for (const w of arr) s += Math.pow(Math.max(w, floor) / floor, 1 - gamma);
  return floor * Math.pow(s / n, 1 / (1 - gamma));
}

// Riassunto di una distribuzione di patrimoni (array ordinato crescente)
function summarize(sorted, riskAversion, floor) {
  let sum = 0; for (const v of sorted) sum += v;
  return {
    mean: sum / sorted.length,
    median: quantile(sorted, 0.5),
    p5: quantile(sorted, 0.05),
    p10: quantile(sorted, 0.10),
    p90: quantile(sorted, 0.90),
    p95: quantile(sorted, 0.95),
    cvar5: cvar(sorted, 0.05),
    ce: certaintyEquivalent(sorted, riskAversion, floor),
  };
}
