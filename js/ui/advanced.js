// Vista avanzata: KPI, verdetto statistico, rischio, grafici Monte Carlo, composizione del
// patrimonio, heatmap, sensitività e tabella anno per anno.
// Dipende da: model/*, ui/format.js, ui/state.js.

function renderAdvancedView(p, mc, det, tor, be, cross) {
  renderKpis(mc, det, be, cross);
  renderVerdict(mc, det, be, cross);
  renderFan(mc, det);
  renderMix(det);
  renderHeatmap(p);
  // grafici e tabelle che esistono solo con la simulazione stocastica
  $('prob').closest('.grid2').hidden = !mc;
  $('risk-card').hidden = !mc;
  $('risks-card').hidden = !mc || !mc.risks.length;
  if (mc) { renderProb(mc); renderHist(mc); renderRisk(mc); renderRisks(mc); }
  renderTornado(tor);
  renderTable(det);
}

// ---------- Riepilogo ----------
function kpi(label, value, sub, cls = '') {
  return `<div class="kpi ${cls}"><div class="k-label">${label}</div><div class="k-value">${value}</div><div class="k-sub">${sub}</div></div>`;
}

function renderKpis(mc, det, be, cross) {
  const H = det.nwB.length - 1;
  const el = $('kpis');
  const unit = state.realTerms ? ' (€ di oggi)' : '';
  if (mc) {
    el.innerHTML =
      kpi('Probabilità che comprare vinca', fmtPct(mc.pBuyWins[H]), `a ${H} anni · IC 95% ${fmtPct(mc.pCI[H][0])}–${fmtPct(mc.pCI[H][1])} su ${state.nSims.toLocaleString(LOCALE)} simulazioni`, 'buy') +
      kpi('Patrimonio mediano compro', fmtK(mc.buyQ[2][H]), `90% dei casi: ${fmtK(mc.buyQ[0][H])} – ${fmtK(mc.buyQ[4][H])}${unit}`, 'buy') +
      kpi('Patrimonio mediano affitto', fmtK(mc.rentQ[2][H]), `90% dei casi: ${fmtK(mc.rentQ[0][H])} – ${fmtK(mc.rentQ[4][H])}${unit}`, 'rent') +
      kpi('ETF necessario per pareggio', be == null ? 'n/d' : fmtPct(be, 1), `contro ${fmtPct(state.etfReturn, 1)} ipotizzato (deterministico)`);
  } else {
    el.innerHTML =
      kpi('Patrimonio compro', fmtK(det.nwB[H]), `a ${H} anni${unit}`, 'buy') +
      kpi('Patrimonio affitto + ETF', fmtK(det.nwR[H]), `a ${H} anni${unit}`, 'rent') +
      kpi('Sorpasso di chi compra', cross == null ? 'mai' : cross === 0 ? 'subito' : `anno ${cross}`, 'e resta avanti') +
      kpi('ETF necessario per pareggio', be == null ? 'n/d' : fmtPct(be, 1), `contro ${fmtPct(state.etfReturn, 1)} ipotizzato`);
  }
}

function renderVerdict(mc, det, be, cross) {
  const H = det.nwB.length - 1;
  const el = $('verdict');
  if (!mc) {
    el.innerHTML = `<h2>Un solo futuro</h2><p>Con un unico scenario in cui tutto cresce ai tassi medi, ${det.nwB[H] > det.nwR[H] ? 'comprare vince' : 'affittare vince'} di <b>${fmtK(Math.abs(det.nwB[H] - det.nwR[H]))}</b> a ${H} anni${cross != null && cross > 0 ? `, con sorpasso all'anno ${cross}` : ''}.</p>
      <p>Ma il futuro non è una media: attiva <b>Simulazione stocastica</b> (o il preset <b>Dati città + statistica</b>) per vedere con che probabilità succede davvero.</p>`;
    return;
  }
  const p = mc.pBuyWins;
  const at = y => p[Math.min(y, H)];
  const coin = p.findIndex((v, i) => i > 0 && v >= 0.5);
  const medDiff = mc.diffQ[2][H];
  const lines = [];
  lines.push(`A <b>${H} anni</b> comprare vince nel <b>${fmtPct(p[H])}</b> delle simulazioni. Vantaggio mediano di chi compra: <b>${signed(medDiff)}</b>; nel 5% dei casi peggiori per chi compra: <b>${signed(mc.diffQ[0][H])}</b>, nel 5% migliori: <b>${signed(mc.diffQ[4][H])}</b>.`);
  if (H >= 5) lines.push(`Se vendi dopo <b>5 anni</b> la probabilità che comprare convenga è ${fmtPct(at(5))}${H >= 10 ? `, a 10 anni ${fmtPct(at(10))}` : ''}.`);
  lines.push(coin < 0 ? `Comprare non diventa mai più probabile che affittare nell’orizzonte simulato.` : `Comprare diventa più probabile che affittare dall’anno <b>${coin}</b>.`);
  const ceWin = mc.buy.ce > mc.rent.ce;
  lines.push(`Corretto per il rischio (avversione γ = ${state.riskAversion}), il patrimonio "equivalente certo" è <b>${fmtK(mc.buy.ce)}</b> comprando e <b>${fmtK(mc.rent.ce)}</b> affittando: ${ceWin ? 'comprare' : 'affittare'} è preferibile per chi non ama il rischio. La media favorisce chi ha più coda destra (${mc.rent.mean > mc.buy.mean ? 'affitto + ETF' : 'compro'}), la mediana e l'equivalente certo chi è più stabile.`);
  if (be != null) lines.push(`Per pareggiare nello scenario medio l’ETF deve rendere <b>${fmtPct(be, 1)}</b> annuo composto (ipotesi: ${fmtPct(state.etfReturn, 1)}).`);
  const ev = mc.events, evs = [];
  if (state.moveProb > 0) evs.push(`almeno un trasloco forzato nel ${fmtPct(ev.pAnyMove)} dei futuri`);
  if (state.unempProb > 0) evs.push(`${ev.unempPerPath.toLocaleString(LOCALE, { maximumFractionDigits: 1 })} periodi di disoccupazione in media`);
  if (state.equityModel === 'rs') evs.push(`mercato in crisi il ${fmtPct(ev.bearShare)} del tempo`);
  if (state.inflModel === 'rs') evs.push(`inflazione da shock (~${fmtPct(state.inflHighMean, 1)}) nel ${fmtPct(ev.inflHighShare)} degli anni`);
  if (evs.length) lines.push(`Eventi simulati: ${evs.join(', ')}.`);
  el.innerHTML = `<h2>Cosa dice la statistica</h2>${lines.map(l => `<p>${l}</p>`).join('')}`;
}

function renderRisk(mc) {
  const rows = [
    ['Media', 'mean', 'Influenzata dai pochi casi molto fortunati'],
    ['Mediana', 'median', 'Il caso "tipico": metà dei futuri sta sopra, metà sotto'],
    ['5° percentile', 'p5', 'Un futuro su 20 va peggio di così'],
    ['CVaR 5%', 'cvar5', 'Media del peggior 5% dei futuri (expected shortfall)'],
    ['95° percentile', 'p95', 'Un futuro su 20 va meglio di così'],
    [`Equivalente certo (γ = ${state.riskAversion})`, 'ce', 'Somma sicura che vale quanto la scommessa, per chi è avverso al rischio'],
  ];
  const H = Math.round(state.horizon);
  const cell = (k) => { const b = mc.buy[k], r = mc.rent[k]; return `<td class="${b >= r ? 'win' : ''}">${fmtK(b)}</td><td class="${r > b ? 'win' : ''}">${fmtK(r)}</td>`; };
  $('risk').innerHTML = `<thead><tr><th>Patrimonio a ${H} anni</th><th>Compro</th><th>Affitto + ETF</th><th class="desc">Significato</th></tr></thead><tbody>
    ${rows.map(([l, k, d]) => `<tr><td>${l}</td>${cell(k)}<td class="desc">${d}</td></tr>`).join('')}
    <tr><td>P(patrimonio &lt; capitale iniziale ${fmtK(mc.start)})</td><td>${fmtPct(mc.buy.pBelowStart, 1)}</td><td>${fmtPct(mc.rent.pBelowStart, 1)}</td><td class="desc">Probabilità di avere meno di quanto avevi all'inizio${state.realTerms ? ' (in euro di oggi)' : ' (nominale)'}</td></tr>
    <tr><td>P(debiti in qualche anno)</td><td>${fmtPct(mc.tail.buy.pEverNeg, 1)}</td><td>${fmtPct(mc.tail.rent.pEverNeg, 1)}</td><td class="desc">Probabilità che, vendendo tutto in quell'anno, resti un debito: il mutuo in Italia si ripaga anche se la casa vale meno</td></tr>
    <tr><td>P(debiti alla fine)</td><td>${fmtPct(mc.tail.buy.pEndNeg, 1)}</td><td>${fmtPct(mc.tail.rent.pEndNeg, 1)}</td><td class="desc">Patrimonio negativo dopo ${H} anni</td></tr>
    <tr><td>P(casa vale meno del mutuo)</td><td>${fmtPct(mc.tail.buy.pUnderwater, 1)}</td><td>–</td><td class="desc">In almeno un anno la casa, al netto dei costi di vendita, non basta a estinguere il mutuo</td></tr>
  </tbody>`;
}

// Rischi di lungo periodo: risultato nei futuri in cui l'evento succede e in quelli in cui no
function renderRisks(mc) {
  if (!mc.risks.length) { $('risks').innerHTML = ''; return; }
  const H = Math.round(state.horizon);
  const pw = s => s ? fmtPct(s.pWin) : '–';
  const md = s => s ? signed(s.median) : '–';
  $('risks').innerHTML = `<thead><tr><th>Evento</th><th>Succede in</th><th>P(compro vince) se succede</th><th>se non succede</th><th>Vantaggio mediano compro se succede</th><th>se non succede</th></tr></thead><tbody>
    ${mc.risks.map(r => `<tr><td>${r.label}<div class="desc muted">${r.desc}</div></td><td>${fmtPct(r.share)}</td><td>${pw(r.with)}</td><td>${pw(r.without)}</td><td>${md(r.with)}</td><td>${md(r.without)}</td></tr>`).join('')}
  </tbody>`;
  $('risks-note').textContent = `Vantaggio di chi compra a ${H} anni. Gli eventi possono succedere insieme nello stesso futuro.`;
}

// ---------- Grafici ----------
// Patrimonio nel tempo: mediana e bande 25–75° e 5–95° percentile, più lo scenario deterministico
function renderFan(mc, det) {
  const B = css('--buy'), R = css('--rent');
  const labels = (mc ? mc.years : det.nwB.map((_, i) => i));
  const ds = [];
  const band = (q, color, name) => {
    ds.push({ label: name + ' 5°', data: q[0], borderWidth: 0, pointRadius: 0, fill: false, _band: true });
    ds.push({ label: name + ' 95°', data: q[4], borderWidth: 0, pointRadius: 0, backgroundColor: alpha(color, 0.12), fill: '-1', _band: true });
    ds.push({ label: name + ' 25°', data: q[1], borderWidth: 0, pointRadius: 0, fill: false, _band: true });
    ds.push({ label: name + ' 75°', data: q[3], borderWidth: 0, pointRadius: 0, backgroundColor: alpha(color, 0.22), fill: '-1', _band: true });
  };
  if (mc) {
    band(mc.buyQ, B, 'Compro'); band(mc.rentQ, R, 'Affitto');
    ds.push({ label: 'Compro (mediana)', data: mc.buyQ[2], borderColor: B, backgroundColor: B, borderWidth: 2.5, pointRadius: 0 });
    ds.push({ label: 'Affitto + ETF (mediana)', data: mc.rentQ[2], borderColor: R, backgroundColor: R, borderWidth: 2.5, pointRadius: 0 });
  }
  ds.push({ label: 'Compro (deterministico)', data: det.nwB, borderColor: B, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, hidden: false });
  ds.push({ label: 'Affitto (deterministico)', data: det.nwR, borderColor: R, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 });
  chart('fan', {
    type: 'line',
    data: { labels, datasets: ds },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { filter: i => !ds[i.datasetIndex]._band, boxHeight: 2 } },
        tooltip: { filter: i => !ds[i.datasetIndex]._band, callbacks: { title: t => 'Anno ' + t[0].label, label: c => `${c.dataset.label}: ${fmtK(c.parsed.y)}` } },
      },
      scales: { x: { title: { display: true, text: 'Anno' } }, y: { ticks: { callback: v => fmtK(v) } } },
    },
  });
}

// P(compro vince) per anno di vendita
function renderProb(mc) {
  chart('prob', {
    type: 'line',
    data: { labels: mc.years, datasets: [{ label: 'P(compro vince)', data: mc.pBuyWins, borderColor: css('--buy'), backgroundColor: alpha(css('--buy'), 0.15), fill: 'origin', pointRadius: 0, borderWidth: 2 },
      { label: '50%', data: mc.years.map(() => 0.5), borderColor: css('--muted'), borderDash: [3, 3], pointRadius: 0, borderWidth: 1 }] },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: t => 'Vendi all’anno ' + t[0].label, label: c => c.datasetIndex ? null : 'Compro vince nel ' + fmtPct(c.parsed.y) + ' dei casi' } } },
      scales: { x: { title: { display: true, text: 'Anno' } }, y: { min: 0, max: 1, ticks: { callback: v => fmtPct(v) } } },
    },
  });
}

// Istogramma del vantaggio finale (1° e 99° percentile come estremi)
function renderHist(mc) {
  const d = mc.finalDiff;
  const lo = d[Math.floor(d.length * 0.01)], hi = d[Math.floor(d.length * 0.99)];
  const bins = 40, w = (hi - lo) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of d) { const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w))); counts[i]++; }
  const centers = counts.map((_, i) => lo + (i + 0.5) * w);
  chart('hist', {
    type: 'bar',
    data: { labels: centers, datasets: [{ data: counts.map(c => c / d.length), backgroundColor: centers.map(c => c >= 0 ? css('--buy') : css('--rent')), barPercentage: 1, categoryPercentage: 1 }] },
    options: {
      maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: t => 'Δ ≈ ' + signed(+t[0].label), label: c => fmtPct(c.parsed.y, 1) + ' delle simulazioni' } } },
      scales: { x: { ticks: { callback: (v, i) => signed(centers[i]), maxTicksLimit: 6 } }, y: { ticks: { callback: v => fmtPct(v) } } },
    },
  });
}

// Sensitività: un parametro alla volta
function renderTornado(t) {
  const fmtDelta = r => r.unit === 'pp' ? `±${(r.delta * 100).toLocaleString(LOCALE)} pp` : `±${r.delta} €`;
  chart('tornado', {
    type: 'bar',
    data: {
      labels: t.rows.map(r => `${r.label} (${fmtDelta(r)})`),
      datasets: [
        { label: 'Parametro più basso', data: t.rows.map(r => [t.baseDiff, r.low]), backgroundColor: alpha(css('--rent'), 0.8) },
        { label: 'Parametro più alto', data: t.rows.map(r => [t.baseDiff, r.high]), backgroundColor: alpha(css('--buy'), 0.8) },
      ],
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false, animation: false,
      plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: vantaggio compro ${signed(c.raw[1])}` } } },
      scales: { x: { ticks: { callback: v => signed(v) }, title: { display: true, text: `Vantaggio compro a fine orizzonte (base ${signed(t.baseDiff)})` } }, y: { stacked: true } },
    },
  });
}

// Tabella anno per anno dello scenario deterministico
function renderTable(det) {
  const d = det.det;
  const H = det.nwB.length - 1;
  const step = H > 30 ? 5 : 1;
  const unit = state.realTerms ? ' (€ di oggi)' : '';   // le altre colonne restano nominali
  let rows = '';
  for (let y = 1; y <= H; y++) {
    if (step > 1 && y % step && y !== 1 && y !== H) continue;
    const w = det.nwB[y] > det.nwR[y];
    rows += `<tr><td>${y}</td><td class="${w ? 'win' : ''}">${fmtK(det.nwB[y])}</td><td class="${!w ? 'win' : ''}">${fmtK(det.nwR[y])}</td>
      <td>${fmtEur(d.fcfB[y - 1])}</td><td>${fmtEur(d.fcfR[y - 1])}</td><td>${fmtEur(d.rent[y - 1])}${state.rentModel === 'contract' && Math.abs(d.rent[y - 1] - d.marketRent[y - 1]) > 1 ? ` <span class="muted">(mercato ${fmtEur(d.marketRent[y - 1])})</span>` : ''}</td><td>${fmtK(d.house[y])}</td><td>${fmtK(d.loan[y])}</td></tr>`;
  }
  $('table').innerHTML = `<thead><tr><th>Anno</th><th>Compro${unit}</th><th>Affitto + ETF${unit}</th><th>Risparmio/mese compro</th><th>Risparmio/mese affitto</th><th>Affitto pagato/mese</th><th>Valore casa</th><th>Debito residuo</th></tr></thead><tbody>${rows}</tbody>`;
}

// Composizione del patrimonio: casa netta + ETF (compro) contro ETF (affitto)
function renderMix(det) {
  const d = det.det, H = det.nwB.length - 1;
  const step = H <= 10 ? 1 : H <= 20 ? 2 : 5;
  const yrs = []; for (let y = step; y <= H; y += step) yrs.push(y); if (yrs.at(-1) !== H) yrs.push(H);
  const B = css('--buy'), R = css('--rent');
  chart('a-mix', {
    type: 'bar',
    data: { labels: yrs.map(y => 'Anno ' + y), datasets: [
      { label: 'Compro: casa (netta)', data: yrs.map(y => d.equityB[y]), backgroundColor: B, stack: 'b', borderRadius: 4, borderSkipped: false, borderColor: css('--surface'), borderWidth: 1 },
      { label: 'Compro: ETF', data: yrs.map(y => d.pfB[y]), backgroundColor: alpha(B, 0.45), stack: 'b', borderRadius: 4, borderSkipped: false, borderColor: css('--surface'), borderWidth: 1 },
      { label: 'Affitto: ETF', data: yrs.map(y => d.pfR[y]), backgroundColor: R, stack: 'r', borderRadius: 4, borderSkipped: false, borderColor: css('--surface'), borderWidth: 1 },
    ] },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtK(c.parsed.y)}`, footer: t => { const i = t[0].dataIndex, y = yrs[i]; return `Totale compro ${fmtK(d.equityB[y] + d.pfB[y])} · affitto ${fmtK(d.pfR[y])} (nominali)`; } } } },
      scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtK(v) } } },
    },
  });
}

// Heatmap: chi vince al variare di rendimento ETF (colonne) e crescita della casa (righe)
// La griglia costa ~60 scenari: si calcola quando la card è visibile
function renderHeatmap(p) {
  lazy($('a-heat').closest('.card'), () => {
    const H = Math.round(p.horizon);
    const { etf, house, values } = sensitivityGrid(p);
    const all = values.flat();
    const maxAbs = Math.max(...all.map(Math.abs), 1);
    const text = css('--text');
    let html = `<div class="heat" style="grid-template-columns: 110px repeat(${etf.length}, minmax(0, 1fr))">`;
    html += `<div class="hd axis">casa ↓ / ETF →</div>` + etf.map(e => `<div class="hd">${fmtPct(e, 0)}</div>`).join('');
    house.forEach((h, i) => {
      html += `<div class="hd">${fmtPct(h, 1)}</div>`;
      etf.forEach((e, j) => {
        const v = values[i][j], t = v / maxAbs;
        const isCurrent = Math.abs(e - p.etfReturn) < 1e-9 && Math.abs(h - p.houseGrowth) < 1e-9;
        const ink = Math.abs(t) > 0.55 ? '#fff' : text;   // testo bianco sulle celle sature
        html += `<div class="cell${isCurrent ? ' cur' : ''}" style="background:${divergingColor(t)};color:${ink}" title="ETF ${fmtPct(e, 1)}, casa ${fmtPct(h, 1)}/anno: ${v >= 0 ? 'compro' : 'affitto'} avanti di ${fmtK(Math.abs(v))}">${v >= 0 ? '+' : '−'}${fmtK(Math.abs(v))}</div>`;
      });
    });
    $('a-heat').innerHTML = html + '</div>';
    const rentWins = all.filter(v => v < 0).length;
    $('a-heat-caption').innerHTML = `Vantaggio di chi compra dopo ${H} anni nello scenario medio, variando il rendimento dell’ETF (colonne) e la crescita annua dei prezzi delle case (righe). <b style="color:var(--buy)">Blu</b> = vince chi compra, <b style="color:var(--rent)">arancio</b> = vince chi affitta; la casella bordata è l’ipotesi attuale. Affittare vince in ${rentWins} combinazioni su ${all.length}.`;
  });
}
