// Vista semplice: verdetto, patrimonio finale, orizzonte, primo mese, fattori chiave,
// costo mensile della casa e costi non recuperabili.
// Dipende da: model/*, ui/format.js, ui/state.js.

function verdictWords(pr) {
  if (pr >= 0.8) return ['Comprare conviene quasi sempre', 'buy'];
  if (pr >= 0.6) return ['Comprare conviene più spesso', 'buy'];
  if (pr > 0.4) return ['È quasi testa o croce', 'even'];
  if (pr > 0.2) return ['Affittare e investire conviene più spesso', 'rent'];
  return ['Affittare e investire conviene quasi sempre', 'rent'];
}
const likelihood = pr => pr >= 0.8 ? 'molto probabile' : pr >= 0.6 ? 'probabile' : pr > 0.4 ? 'testa o croce' : pr > 0.2 ? 'improbabile' : 'molto improbabile';
const who = d => d >= 0 ? 'chi compra' : 'chi affitta';
const twoSideLegend = '<div class="legend"><span>compro vince</span><span class="r">affitto vince</span></div>';

function renderSimpleView(mc, det, tor, be) {
  renderHero(mc, det);
  renderWealth(mc, det);
  renderHorizon(mc, det);
  renderFirstMonth(det);
  renderDrivers(tor);
  renderSimpleNotes(mc, det, be);
  renderHousing(det);
  renderCosts(det);
}

// 1. Verdetto con waffle "N futuri su 100"
function renderHero(mc, det) {
  const H = det.nwB.length - 1, hero = $('s-hero');
  if (!mc) {
    const diff = finalDiff(det);
    hero.className = 'card hero ' + (diff >= 0 ? 'buy' : 'rent');
    hero.innerHTML = `<h2>${diff >= 0 ? 'Comprare conviene' : 'Affittare e investire conviene'} nello scenario medio</h2>
      <p class="lead">Se tutto va esattamente come le medie ipotizzate, dopo ${H} anni ${who(diff)} è avanti di <b>${fmtK(Math.abs(diff))}</b>.</p>
      <p>Ma il futuro non va mai “nella media”. Attiva <b>Simulazione stocastica</b> nei parametri per sapere quanto è probabile.</p>`;
    return;
  }
  const pr = mc.pBuyWins[H], n = Math.round(pr * 100);
  const [title, cls] = verdictWords(pr);
  const med = mc.diffQ[2][H];
  const waffle = Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? 'b' : ''}"></i>`).join('');
  const drivers = ['borsa', 'prezzi delle case', 'affitti', 'inflazione'];
  if (state.unempProb > 0) drivers.push('perdita del lavoro');
  if (state.moveProb > 0) drivers.push('traslochi');
  const events = listIt(drivers);
  hero.className = 'card hero ' + cls;
  hero.innerHTML = `<div class="hero-grid">
    <div><div class="waffle" aria-label="${n} futuri su 100 in cui comprare conviene">${waffle}</div>${twoSideLegend}</div>
    <div><h2>${title}</h2>
    <p class="lead">In <b>${n} futuri su 100</b> simulati, dopo ${H} anni chi compra casa ha più patrimonio di chi affitta e investe la differenza in ETF.</p>
    <p>Nel caso tipico ${who(med)} finisce avanti di <b>${fmtK(Math.abs(med))}</b>. Abbiamo simulato ${state.nSims.toLocaleString(LOCALE)} futuri diversi per ${events}.</p></div>
  </div>`;
}

// 2. Patrimonio finale, diviso in casa (illiquida) e liquidità (ETF)
function renderWealth(mc, det) {
  const H = det.nwB.length - 1, d = det.det;
  // [titolo, sottotitolo, compro, affitto, parte casa di compro]
  const rows = mc
    ? [['Caso tipico', 'metà dei futuri va meglio, metà peggio', mc.buy.median, mc.rent.median, mc.buy.houseAt(0.5)],
       ['Se va male', '1 futuro su 10 va peggio di così', mc.buy.p10, mc.rent.p10, mc.buy.houseAt(0.1)],
       ['Se va bene', '1 futuro su 10 va meglio di così', mc.buy.p90, mc.rent.p90, mc.buy.houseAt(0.9)]]
    : [['Scenario medio', 'un solo futuro, tutto ai tassi medi', det.nwB[H], det.nwR[H], det.nwB[H] * d.equityB[H] / (d.equityB[H] + d.pfB[H] || 1)]];
  const max = Math.max(...rows.flatMap(r => [r[2], r[3], r[4], r[2] - r[4]]), 1);
  const w = v => Math.max(0, v) / max * 100;
  const buyBar = (tot, home) => {
    const liq = tot - home;
    return `<div class="bar"><div class="track split"><div class="fill" style="width:${w(home)}%" title="Casa: ${fmtK(home)}"></div><div class="fill liq" style="width:${w(liq)}%" title="Liquidi: ${fmtK(liq)}"></div></div>
      <div class="val">Compro: ${fmtK(tot)}<small>casa ${fmtK(home)} · ${liq < 0 ? `debiti ${fmtK(-liq)}` : `liquidi ${fmtK(liq)}`}</small></div></div>`;
  };
  const rentBar = v => `<div class="bar r"><div class="track split"><div class="fill liq" style="width:${w(v)}%" title="Liquidi: ${fmtK(v)}"></div></div>
    <div class="val">Affitto: ${fmtK(v)}<small>${v < 0 ? 'solo debiti, nessuna casa' : 'tutto liquido'}</small></div></div>`;

  $('s-wealth-title').textContent = `Quanto avrai dopo ${H} anni`;
  $('s-wealth').innerHTML = rows.map(([t, sub, b, r, h]) => `<div class="wealth-row"><div class="what"><b>${t}</b><small>${sub}</small></div>
    <div class="bars">${buyBar(b, h)}${rentBar(r)}</div></div>`).join('') +
    `<div class="legend wealth-legend"><span class="home">casa (al netto di mutuo e costi di vendita)</span><span class="liq">liquidi chi compra (ETF netti)</span><span class="liq r">liquidi chi affitta (ETF netti)</span></div>`;
  const deflator = Math.pow(1 + state.inflation, H);
  $('s-wealth-caption').innerHTML = `Patrimonio = casa (valore meno costi di vendita e mutuo residuo, <b>immobilizzato</b>: lo incassi solo vendendo) + liquidi (ETF al netto delle tasse, vendibili in pochi giorni). `
    + (mc ? 'Nei percentili la divisione casa/liquidi è la media dei futuri vicini a quel risultato. ' : '')
    + (state.realTerms ? 'Valori in euro di oggi.' : `Valori in euro del ${new Date().getFullYear() + H}: con inflazione al ${fmtPct(state.inflation, 1)}, 100 € di allora valgono circa ${fmtEur(100 / deflator)} di oggi.`);
}

// 3. Probabilità che comprare convenga in base a quando vendi
function renderHorizon(mc, det) {
  const H = det.nwB.length - 1;
  const years = [3, 5, 10, 15, 20, 25, 30, 40].filter(y => y < H).concat(H);
  $('s-horizon').innerHTML = years.map(y => {
    if (mc) {
      const pr = mc.pBuyWins[y];
      return `<div class="hz"><span>${y} anni</span><div class="track"><div class="fill" style="width:${pr * 100}%"></div></div><span class="word"><b>${fmtPct(pr)}</b> · ${likelihood(pr)}</span></div>`;
    }
    const diff = det.nwB[y] - det.nwR[y];
    return `<div class="hz"><span>${y} anni</span><div class="track"><div class="fill" style="width:${diff >= 0 ? 100 : 0}%"></div></div><span class="word">${diff >= 0 ? 'compro' : 'affitto'} ${signed(Math.abs(diff))}</span></div>`;
  }).join('') + twoSideLegend;
}

// 4. Bilancio del primo mese
function renderFirstMonth(det) {
  const d = det.det;
  const net = annualNet() / 12;
  const maint = d.price * state.maintPct / 12;
  $('s-month').innerHTML = `<table class="month"><thead><tr><th></th><th>Compro</th><th>Affitto</th></tr></thead><tbody>
    <tr><td>Stipendio netto (media con ${state.monthsPerYear} mensilità)</td><td>${fmtEur(net)}</td><td>${fmtEur(net)}</td></tr>
    <tr><td>Spese di vita</td><td>−${fmtEur(state.living)}</td><td>−${fmtEur(state.living)}</td></tr>
    <tr><td>Rata mutuo</td><td>−${fmtEur(d.payment)}</td><td>–</td></tr>
    <tr><td>Manutenzione${state.ownerFixedMonthly ? ' e assicurazione' : ''}</td><td>−${fmtEur(maint + state.ownerFixedMonthly)}</td><td>–</td></tr>
    ${state.condoMonthly ? `<tr><td>Condominio</td><td>−${fmtEur(state.condoMonthly)}</td><td>−${fmtEur(state.condoMonthly * state.tenantCondoShare)}</td></tr>` : ''}
    <tr><td>Affitto</td><td>–</td><td>−${fmtEur(d.rent[0])}</td></tr>
    <tr class="total"><td>Resta da investire ogni mese</td><td>${fmtEur(d.fcfB[0])}</td><td>${fmtEur(d.fcfR[0])}</td></tr>
    <tr><td>Soldi usati all’inizio</td><td>${fmtEur(d.down + d.buyCosts)}</td><td>${fmtEur(d.down + d.buyCosts - state.renterUpfrontCosts)}</td></tr>
  </tbody></table>
  <p class="caption" style="margin-top:.6rem">All’inizio chi compra usa i risparmi per anticipo e spese d’acquisto; chi affitta investe la stessa somma in ETF${state.renterUpfrontCosts ? ` (meno ${fmtEur(state.renterUpfrontCosts)} di costi iniziali dell’affitto)` : ''}.</p>`;
}

// 5. I tre parametri che spostano di più il risultato (dalla sensitività)
function renderDrivers(tor) {
  const fmtDelta = r => {
    const v = +(r.delta * 100).toFixed(2);
    return r.unit === 'pp' ? `${fmtNum(v)} ${v === 1 ? 'punto' : 'punti'}` : `${r.delta} €/m² l’anno`;
  };
  $('s-drivers').innerHTML = `<p>Nello scenario medio, dopo ${Math.round(state.horizon)} anni ${who(tor.baseDiff)} è avanti di <b>${fmtK(Math.abs(tor.baseDiff))}</b>. I tre fattori che spostano di più il risultato:</p>
    <ol class="drivers">${tor.rows.slice(0, 3).map(r => `<li><b>${r.label}</b>: con ${fmtDelta(r)} in meno ${who(r.low)} è avanti di ${fmtK(Math.abs(r.low))}; con ${fmtDelta(r)} in più ${who(r.high)} è avanti di ${fmtK(Math.abs(r.high))}.</li>`).join('')}</ol>`;
}

// 6. Avvertenze in base allo scenario
function renderSimpleNotes(mc, det, be) {
  const d = det.det, notes = [];
  if (d.fcfR[0] < 50) notes.push(`Con questo affitto chi affitta riesce a risparmiare poco o nulla (${fmtEur(d.fcfR[0])} al mese): “affitta e investi” funziona solo se resta qualcosa da investire.`);
  if (d.fcfB[0] < 0) notes.push(`Nei primi anni chi compra spende più di quanto guadagna (${fmtEur(d.fcfB[0])} al mese) e deve attingere ai risparmi.`);
  if (be != null) notes.push(`Per far vincere chi affitta nello scenario medio, l’ETF dovrebbe rendere in media il <b>${fmtPct(be, 1)}</b> l’anno (ipotesi attuale: ${fmtPct(state.etfReturn, 1)}). Storicamente l’azionario globale ha reso circa 7–8% nominale.`);
  if (mc) notes.push(`Nei futuri peggiori (1 su 20) chi affitta finisce sotto ${fmtK(mc.rent.p5)}, chi compra sotto ${fmtK(mc.buy.p5)}: l’affitto + ETF ha risultati molto più variabili.`);
  if (mc && mc.tail.buy.pEverNeg > 0.005) notes.push(`Nel ${fmtPct(mc.tail.buy.pEverNeg, 1)} dei futuri chi compra, vendendo tutto in un anno sfortunato, resterebbe con un debito (chi affitta nel ${fmtPct(mc.tail.rent.pEverNeg, 1)}): in Italia il mutuo si ripaga anche se la casa vale meno.`);
  notes.push('Il confronto vale solo se chi affitta investe davvero ogni mese la differenza, anche quando la borsa crolla.');
  notes.push('La casa è un unico bene in un’unica città ed è difficile da vendere in fretta; l’ETF è diversificato e liquido ma oscilla di più nel breve periodo.');
  $('s-notes').innerHTML = notes.map(n => `<li>${n}</li>`).join('');
}

// Infografica: uscite mensili per la casa anno per anno, con lo stipendio come riferimento
function renderHousing(det) {
  const d = det.det, years = d.housingB.map((_, i) => i + 1);
  const B = css('--buy'), R = css('--rent'), M = css('--muted');
  chart('s-housing', {
    type: 'line',
    data: { labels: years, datasets: [
      { label: 'Compro: rata + spese', data: d.housingB, borderColor: B, backgroundColor: B, borderWidth: 2, pointRadius: 0 },
      { label: 'Affitto + condominio', data: d.housingR, borderColor: R, backgroundColor: R, borderWidth: 2, pointRadius: 0 },
      { label: 'Stipendio netto', data: d.income, borderColor: M, backgroundColor: M, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0 },
    ] },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { boxHeight: 2 } },
        tooltip: { callbacks: {
          title: t => 'Anno ' + t[0].label,
          label: c => `${c.dataset.label}: ${fmtEur(c.parsed.y)}/mese`,
          afterBody: t => { const i = t[0].dataIndex; return `Quota dello stipendio: compro ${fmtPct(d.housingB[i] / d.income[i])}, affitto ${fmtPct(d.housingR[i] / d.income[i])}`; },
        } },
      },
      scales: { x: { title: { display: true, text: 'Anno' } }, y: { min: 0, ticks: { callback: v => fmtEur(v) } } },
    },
  });
}

// Infografica: costi che non diventano patrimonio, cumulati sull'orizzonte
function renderCosts(det) {
  const c = det.det.cum, H = det.nwB.length - 1;
  // [voce, spiegazione, compro, affitto]
  const rows = [
    ['Affitto', 'canone pagato', 0, c.rent],
    ['Interessi del mutuo', c.deductions ? `al lordo di ${fmtK(c.deductions)} di detrazioni` : 'la quota capitale non è un costo: diventa casa', c.interest, 0],
    ['Manutenzione', 'ordinaria e straordinaria, in media', c.maint, 0],
    ['Condominio e assicurazione', 'chi affitta paga i servizi', c.ownerCondo, c.tenantCondo],
    ['Compravendita e traslochi', 'imposte, notaio, agenzia, banca, vendita finale', c.transB, c.transR],
    ['Tasse sugli investimenti', 'bollo e plusvalenze ETF', c.taxB, c.taxR],
  ].filter(r => r[2] > 0 || r[3] > 0);
  const totB = rows.reduce((s, r) => s + r[2], 0) - c.deductions, totR = rows.reduce((s, r) => s + r[3], 0);
  const max = Math.max(...rows.flatMap(r => [r[2], r[3]]), 1);
  const bar = (v, cls, label) => `<div class="bar ${cls}"><div class="track"><div class="fill" style="width:${v / max * 100}%"></div></div><div class="val">${label}: ${v ? fmtK(v) : '–'}</div></div>`;
  $('s-costs-caption').textContent = `Totale in ${H} anni, scenario medio, euro nominali. Sono i costi che non si trasformano in patrimonio: chi affitta li paga soprattutto come canone, chi compra come interessi, manutenzione e imposte.`;
  $('s-costs').innerHTML = rows.map(([t, sub, b, r]) => `<div class="cost-row"><div><b>${t}</b><small>${sub}</small></div><div class="bars">${bar(b, '', 'Compro')}${bar(r, 'r', 'Affitto')}</div></div>`).join('') +
    `<div class="cost-row total"><div>Totale${c.deductions ? '<small>compro: al netto delle detrazioni</small>' : ''}</div><div><span style="color:var(--text)">Compro ${fmtK(totB)} · Affitto ${fmtK(totR)}</span> <span class="muted">→ ${totB < totR ? 'chi compra' : 'chi affitta'} spende ${fmtK(Math.abs(totR - totB))} in meno</span></div></div>`;
}
