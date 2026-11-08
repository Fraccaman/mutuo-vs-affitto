// Generatori casuali riproducibili (stesso seed = stessi risultati).

// PRNG veloce a 32 bit
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normale standard (metodo polare di Marsaglia)
function makeGauss(rng) {
  let spare = null;
  return function () {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u, v, s;
    do { u = rng() * 2 - 1; v = rng() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const m = Math.sqrt(-2 * Math.log(s) / s);
    spare = v * m;
    return u * m;
  };
}

// Student-t a varianza unitaria
function studentT(gauss, df) {
  let chi = 0;
  for (let i = 0; i < df; i++) { const g = gauss(); chi += g * g; }
  const t = gauss() / Math.sqrt(chi / df);
  return t * Math.sqrt((df - 2) / df);
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
