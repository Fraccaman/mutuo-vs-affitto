// Test del modello (nessuna dipendenza): node --test tests/*.test.js
// Carica i file di dati e modello come fa il browser (script classici nello stesso scope globale).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// stessi file e stesso ordine di index.html, solo dati e modello (niente DOM)
const files = [...html.matchAll(/<script src="(js\/(?:data|model)\/[^"]+)"/g)].map(m => m[1]);
for (const f of files) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const POST = { ...DEFAULTS, stochastic: false, stampDuty: 0, interestDeduction: false };
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≠ ${b} ± ${tol}`);

test('i file del modello sono caricati da index.html', () => {
  assert.ok(files.length >= 10);
  assert.equal(typeof simulatePath, 'function');
});

test('ipotesi del post: ~738k compro vs ~496k affitto a 30 anni', () => {
  const d = deterministic(POST);
  close(d.nwB[30], 738000, 2000, 'compro');
  close(d.nwR[30], 496000, 2000, 'affitto');
});

test('rata del mutuo e inversa', () => {
  const pay = payment(201600, 0.031, 360);
  close(pay, 860.8, 0.5);
  close(loanFromPayment(pay, 0.031, 360), 201600, 1e-6);
  assert.equal(payment(0, 0.03, 360), 0);
  close(payment(1200, 0, 12), 100, 1e-9);
});

test('portafoglio: prelievo tassa solo la plusvalenza, poi debito', () => {
  const pf = newPortfolio();
  invest(pf, 1000, 0.26);
  pf.v = 2000;                       // +1000 di plusvalenza
  invest(pf, -1000, 0.26);           // vende ~1149 lordi per avere 1000 netti
  close(pf.v, 2000 - 1000 / (1 - 0.5 * 0.26), 1e-9);
  invest(pf, -5000, 0.26);
  assert.equal(pf.v, 0);
  assert.ok(pf.debt > 0);
  invest(pf, pf.debt + 10, 0.26);    // i versamenti ripagano prima il debito
  assert.equal(pf.debt, 0);
  close(pf.v, 10, 1e-9);
});

test('netto da RAL 35.200 € a Bologna ≈ 26.000 €', () => {
  const n = netFromRal(35200, CITIES.BO).net;
  close(n, 26030, 300);
  assert.ok(netFromRal(50000, CITIES.BO).net > n);
});

test('costi prima casa da privato: registro 2% sul valore catastale (min 1.000 €)', () => {
  const c = primaCasaCosts({ ...DEFAULTS, ...ITALY_PARAMS, renditaCatastale: 800 }, 250000, 200000);
  close(c.taxes, 800 * 1.05 * 110 * 0.02 + 100, 1e-9);
  close(c.substitute, 500, 1e-9);
  close(c.agency, 250000 * 0.03 * 1.22, 1e-9);
});

test('statistiche: quantile, Wilson, CVaR', () => {
  const s = Float64Array.from([1, 2, 3, 4, 5]);
  assert.equal(quantile(s, 0.5), 3);
  assert.equal(quantile(s, 0.25), 2);
  const [lo, hi] = wilson(50, 100);
  assert.ok(lo < 0.5 && hi > 0.5 && hi - lo < 0.2);
  assert.equal(cvar(Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0.2), 1.5);
});

test('Monte Carlo riproducibile e coerente', () => {
  const p = { ...DEFAULTS, ...ITALY_PARAMS, ...cityParams(CITIES.BO, 'annunci'), netMonthly: 2000, nSims: 300, equityModel: 'rs', inflModel: 'rs', unempProb: 0.03, moveProb: 0.02 };
  const a = monteCarlo(p), b = monteCarlo(p);
  assert.deepEqual(a.pBuyWins, b.pBuyWins);
  for (const x of a.pBuyWins) assert.ok(x >= 0 && x <= 1);
  assert.ok(a.buy.p10 <= a.buy.median && a.buy.median <= a.buy.p90);
  for (const q of [0.1, 0.5, 0.9]) assert.ok(Number.isFinite(a.buy.houseAt(q)));
});

test("regimi d'inflazione: media di lungo periodo invariata", () => {
  const p = { ...POST, stochastic: true, inflModel: 'rs', horizon: 40 };
  // inflazione composta di un percorso = rapporto tra patrimonio nominale e reale (stesso seed)
  let logSum = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const nominal = simulatePath({ ...p, realTerms: false }, mulberry32(i), true).nwR[40];
    const real = simulatePath({ ...p, realTerms: true }, mulberry32(i), true).nwR[40];
    logSum += Math.log(nominal / real) / 40;
  }
  close(Math.exp(logSum / N) - 1, p.inflation, 0.004);
});

test('verifica mutuo: rata oltre il 33% del netto non è concedibile', () => {
  const p = { ...POST };
  const ok = loanCheck(p, 60000);
  assert.ok(ok.ok);
  const ko = loanCheck(p, 25000);
  assert.ok(!ko.ok && !ko.okDTI);
  // con l'anticipo suggerito la rata rientra nel limite
  const fixed = loanCheck({ ...p, downPct: Math.ceil(ko.downPctNeeded * 100) / 100 }, 25000);
  assert.ok(fixed.okDTI);
});

test('griglia di sensitività: più rendimento ETF favorisce chi affitta', () => {
  const g = sensitivityGrid(POST);
  const row = g.values[4];
  for (let j = 1; j < row.length; j++) assert.ok(row[j] < row[j - 1]);
});

test('ogni città ha dati completi e parametri plausibili', () => {
  const srcOk = s => s && /^https?:\/\//.test(s.url) && s.name;
  for (const [id, c] of Object.entries(CITIES)) {
    const where = `${id}:`;
    assert.ok(c.name && c.region, where);
    assert.equal(c.taxes.regional.at(-1)[0], Infinity, `${where} ultimo scaglione regionale`);
    assert.ok(srcOk(c.taxes.source), `${where} fonte addizionali`);
    assert.ok(c.market.annunci && c.market.omi, `${where} fonti di mercato`);
    for (const m of Object.values(c.market)) {
      assert.ok(m.pricePerSqm > 500 && m.pricePerSqm < 15000, `${where} prezzo ${m.pricePerSqm}`);
      assert.ok(m.rentPerSqmMonth > 3 && m.rentPerSqmMonth < 50, `${where} affitto ${m.rentPerSqmMonth}`);
      assert.ok(srcOk(m.source), `${where} fonte ${m.label}`);
    }
    for (const [, , s] of c.facts) assert.ok(srcOk(s), `${where} fonte di un dato`);
    // semestri OMI consecutivi, redditi con inflazione per ogni anno
    const omi = Object.keys(c.history.omiPrice.data);
    for (let i = 1; i < omi.length; i++) {
      const [y0, s0] = omi[i - 1].split('-').map(Number), [y1, s1] = omi[i].split('-').map(Number);
      assert.equal(y1 * 2 + s1, y0 * 2 + s0 + 1, `${where} semestri OMI non consecutivi: ${omi[i - 1]} → ${omi[i]}`);
    }
    const inc = c.history.medianIncome;
    for (const y of Object.keys(inc.data).slice(1)) assert.ok(Number.isFinite(inc.inflation[y]), `${where} inflazione ${y}`);
    const st = cityStats(c), p = cityParams(c, 'annunci');
    for (const [k, v] of Object.entries(p)) assert.ok(Number.isFinite(v), `${where} parametro ${k} = ${v}`);
    assert.ok(p.houseGrowth > -0.03 && p.houseGrowth < 0.08, `${where} crescita casa ${p.houseGrowth}`);
    assert.ok(p.houseVol > 0 && p.houseVol < 0.1, `${where} volatilità casa ${p.houseVol}`);
    assert.ok(st.houseN >= 5, `${where} poche variazioni annue dei prezzi`);
    assert.ok(netFromRal(p.ral, c).net > p.ral * 0.6, `${where} netto da RAL`);
  }
});

// ---------- Rischi di lungo periodo ----------
const RISK_BASE = { ...DEFAULTS, ...ITALY_PARAMS, ...cityParams(CITIES.BO, 'annunci'), netMonthly: 2200, nSims: 400 };

test('rischi spenti: percorsi identici a prima (nessun numero casuale in più)', () => {
  const a = simulatePath(RISK_BASE, mulberry32(7), true);
  const b = simulatePath({ ...RISK_BASE, declineDrift: -0.05, hoodShockSize: 0.9, epbdCostPerSqm: 2000 }, mulberry32(7), true);
  assert.deepEqual(a.nwB, b.nwB);
  assert.deepEqual(a.nwR, b.nwR);
  assert.equal(monteCarlo(RISK_BASE).risks.length, 0);
});

test('declino demografico: chi compra peggiora, chi affitta paga meno affitto', () => {
  const base = monteCarlo(RISK_BASE);
  const dec = monteCarlo({ ...RISK_BASE, declineProb: 1 });
  assert.ok(dec.buy.median < base.buy.median);
  assert.ok(dec.rent.median > base.rent.median);
  assert.ok(dec.pBuyWins.at(-1) < base.pBuyWins.at(-1));
  close(dec.risks[0].share, 1, 1e-12);
});

test('rischio della singola casa: media invariata, più dispersione', () => {
  const N = 2000, p = { ...RISK_BASE, houseIdioVol: 0.05 };
  let s0 = 0, s1 = 0, q0 = 0, q1 = 0;
  for (let i = 0; i < N; i++) {
    const a = simulatePath(RISK_BASE, mulberry32(i), true).houseEqB;
    const b = simulatePath(p, mulberry32(i), true).houseEqB;
    s0 += a; s1 += b; q0 += a * a; q1 += b * b;
  }
  const sd0 = Math.sqrt(q0 / N - (s0 / N) ** 2), sd1 = Math.sqrt(q1 / N - (s1 / N) ** 2);
  close(s1 / N, s0 / N, 0.05 * s0 / N, 'media della casa netta');
  assert.ok(sd1 > sd0 * 1.1, `dispersione ${sd1} vs ${sd0}`);
});

test('quartiere che degrada: valore della casa più basso', () => {
  const a = simulatePath(RISK_BASE, mulberry32(3), true);
  const b = simulatePath({ ...RISK_BASE, hoodShockProb: 1, hoodShockSize: 0.05 }, mulberry32(3), true);
  assert.ok(b.houseEqB < a.houseEqB);
  assert.ok(b.risks.hood);
});

test('obbligo energetico: costa a chi compra, in parte anche a chi affitta', () => {
  const p = { ...RISK_BASE, epbdProb: 1, epbdFrom: 5, epbdTo: 5, epbdEnergySaving: 0 };
  const base = monteCarlo(RISK_BASE);
  const ren = monteCarlo({ ...p, epbdChoice: 'renovate' });
  const dis = monteCarlo({ ...p, epbdChoice: 'discount' });
  const passNone = monteCarlo({ ...p, epbdChoice: 'renovate', epbdPassThrough: 0 });
  assert.ok(ren.buy.median < base.buy.median);
  assert.ok(dis.buy.median < base.buy.median);
  assert.ok(ren.rent.median < passNone.rent.median, 'il canone sale col ribaltamento');
  // 'auto' sceglie il male minore percorso per percorso
  const auto = monteCarlo({ ...p, epbdChoice: 'auto' });
  assert.ok(auto.buy.mean >= Math.max(ren.buy.mean, dis.buy.mean) - 2000);
});

test('code: probabilità di restare coi debiti coerenti', () => {
  const mc = monteCarlo({ ...RISK_BASE, ...PRESETS_RISK_PARAMS(), downPct: 0.05 });
  for (const s of [mc.tail.buy, mc.tail.rent]) for (const v of Object.values(s)) assert.ok(v >= 0 && v <= 1);
  assert.ok(mc.tail.buy.pEndNeg <= mc.tail.buy.pEverNeg);
  assert.ok(mc.tail.buy.pUnderwater > 0, 'con 5% di anticipo la casa va sott’acqua almeno a volte');
  for (const r of mc.risks) assert.ok(r.share >= 0 && r.share <= 1);
});

function PRESETS_RISK_PARAMS() {
  return { declineProb: 0.2, houseIdioVol: 0.03, hoodShockProb: 0.01, epbdProb: 0.4 };
}

test('casa sott’acqua: l’anno 0 (costi d’acquisto) non conta', () => {
  // anticipo 1%: all'acquisto la casa netta vale meno del mutuo, ma dopo un anno di +10% no
  const r = simulatePath({ ...POST, downPct: 0.01, houseGrowth: 0.1 }, mulberry32(1), false);
  assert.equal(r.underwater, false);
});

test('obbligo energetico con contratto in corso: il canone sale subito insieme al risparmio', () => {
  const p = { ...RISK_BASE, rentModel: 'contract', rentContractYears: 8, epbdProb: 1, epbdFrom: 2, epbdTo: 2, epbdEnergySaving: 0, epbdPassThrough: 1 };
  const a = simulatePath({ ...p, epbdProb: 0 }, mulberry32(5), true, true);
  const b = simulatePath(p, mulberry32(5), true, true);
  // stesso percorso tranne l'estrazione dell'anno: confronto il canone relativo prima/dopo
  assert.ok(b.det.rent[2] / b.det.rent[1] > a.det.rent[2] / a.det.rent[1]);
});

test('rischio specifico realizzato con un trasloco resta nella tabella', () => {
  const mc = monteCarlo({ ...RISK_BASE, houseIdioVol: 0.15, moveProb: 0.5 });
  assert.ok(mc.risks[0].share > 0.3, `quota ${mc.risks[0].share}`);
});

test('confronto tra città: la città selezionata resta com’è, le altre usano i propri dati', () => {
  const base = { ...RISK_BASE, city: 'BO', priceSource: 'annunci', netFromRal: true, ral: 35200, sqm: 85, nSims: 200, horizon: 10 };
  base.netMonthly = netFromRal(base.ral, CITIES.BO).net / base.monthsPerYear;
  assert.deepEqual(cityScenario(base, 'BO', 'city'), base);
  for (const k of Object.keys(CITIES)) {
    const p = cityScenario(base, k, 'city');
    assert.equal(p.sqm, 85, `${k}: la superficie è una scelta personale`);
    assert.equal(p.pricePerSqm, CITIES[k].market.annunci.pricePerSqm, `${k}: prezzo della città`);
    if (k !== 'BO') {
      assert.equal(p.ral, CITIES[k].params.ral.value, `${k}: RAL della città`);
      close(p.netMonthly, netFromRal(p.ral, CITIES[k]).net / p.monthsPerYear, 1e-9, `${k}: netto con le tasse della città`);
    }
    const o = withMc(cityOutcome(p), monteCarlo(p));
    const nums = { price: o.price, payment: o.payment, rent: o.rent, net: o.net, diff: o.diff, wealthB: o.wealthB, wealthR: o.wealthR, grossYield: o.grossYield, yearsOfNet: o.yearsOfNet, dti: o.dti };
    for (const [n, v] of Object.entries(nums)) assert.ok(Number.isFinite(v), `${k}: ${n} = ${v}`);
    assert.ok(o.pWin >= 0 && o.pWin <= 1, `${k}: probabilità`);
    close(o.wealthB, o.mc.buy.median, 1e-9);
    assert.equal(cityOutcome(p).pWin, null, 'senza Monte Carlo niente probabilità');
  }
  // colore fisso e unico per città
  const colors = Object.values(CITIES).map(c => c.color);
  assert.equal(new Set(colors).size, colors.length);
  for (const c of colors) assert.ok(Number.isInteger(c) && c >= 1 && c <= 7, `colore ${c}: slot --cat-1…7`);
  // 'mine': stessa RAL ovunque, netto con le addizionali della città
  const mi = cityScenario(base, 'MI', 'mine');
  assert.equal(mi.ral, 35200);
  close(mi.netMonthly, netFromRal(35200, CITIES.MI).net / 13, 1e-9);
  // 'mine' con netto inserito a mano: il netto non cambia
  assert.equal(cityScenario({ ...base, netFromRal: false, netMonthly: 1800 }, 'NA', 'mine').netMonthly, 1800);
  // fonte prezzi non disponibile nella città → annunci; tetto alle simulazioni
  assert.equal(cityScenario({ ...base, priceSource: 'post' }, 'RM').priceSource, 'annunci');
  assert.equal(cityScenario({ ...base, nSims: 20000 }, 'RM').nSims, COMPARE_MAX_SIMS);
});

test('perché vince: scomposizione dei costi coerente', () => {
  const p = { ...POST };
  const b = housingCostBreakdown(p);
  close(b.totBuy, b.rows.reduce((s, r) => s + r.buy, 0), 1e-9);
  // primo anno: interessi < rata × 12 e affitto = superficie × canone
  assert.ok(b.rows[0].buy > 0 && b.rows[0].buy < b.pay * 12);
  close(b.rows.find(r => r.key === 'rent').rent, p.sqm * p.rentPerSqmYear, 1e-9);
  // con l'affitto di pareggio lo scenario medio è in parità
  const ber = breakEvenRent(p);
  assert.ok(ber > 0);
  close(finalDiff(deterministic({ ...p, rentPerSqmYear: ber })), 0, 50);
});

// ---------- Preset JSON ----------
// La logica dei preset vive nell'interfaccia: carica schema e preset con gli stub minimi del DOM.
function loadPresetModule() {
  if (typeof validatePreset === 'function') return;
  vm.runInThisContext("var state = { city: 'BO' }; var fmtNum = v => String(v);");
  for (const f of ['js/ui/schema.js', 'js/ui/presets.js']) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

test('preset inclusi: tutti validi, senza avvisi', () => {
  loadPresetModule();
  assert.ok(PRESET_LIBRARY.length >= 4);
  const ids = new Set();
  for (const p of PRESET_LIBRARY) {
    const r = validatePreset(p);
    assert.deepEqual(r.errors, [], p.name);
    assert.deepEqual(r.warnings, [], p.name);
    assert.ok(!ids.has(p.id), `id duplicato ${p.id}`); ids.add(p.id);
    // il preset applicato produce parametri numerici finiti per il modello
    const s = { ...PRESET_BASES[r.preset.base](), ...r.preset.params };
    for (const f of FIELDS) if (['pct', 'num', 'int', 'eur'].includes(f.type)) assert.ok(Number.isFinite(s[f.key]), `${p.name}: ${f.key}`);
  }
});

test('preset JSON: errori e avvisi chiari', () => {
  loadPresetModule();
  assert.match(validatePreset('{ non json').errors[0], /JSON non valido/);
  assert.match(validatePreset('{"params":{}}').errors[0], /name/);
  assert.ok(validatePreset({ name: 'x', base: 'boh' }).errors.some(e => /base/.test(e)));
  assert.ok(validatePreset({ name: 'x', city: 'XX' }).errors.some(e => /city/.test(e)));
  assert.ok(validatePreset({ name: 'x', params: { mortgageType: 'mensile' } }).errors.some(e => /mortgageType/.test(e)));
  assert.ok(validatePreset({ name: 'x', params: { stochastic: 'si' } }).errors.some(e => /true o false/.test(e)));
  assert.ok(validatePreset({ name: 'x', params: { downPct: 20 } }).errors.some(e => /frazioni/.test(e)), 'percentuale scritta come 20 invece di 0.2');
  const w = validatePreset({ name: 'x', params: { horizon: 60, pippo: 1 } });
  assert.ok(w.preset, 'avvisi non bloccano');
  assert.ok(w.warnings.some(m => /massimo/.test(m)));
  assert.ok(w.warnings.some(m => /pippo/.test(m)));
  const ok = validatePreset(JSON.stringify({ name: 'Mio', city: 'BO', priceSource: 'omi', params: { downPct: 0.3, mortgageType: 'variable', realTerms: true } }));
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.preset.params.downPct, 0.3);
});
