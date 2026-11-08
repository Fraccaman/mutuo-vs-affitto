// Scheda "Insieme": tutte le città a confronto con lo stesso scenario personale.
// Dipende da: model/compare.js, model/*, ui/format.js, ui/state.js, ui/simple.js (likelihood, who, twoSideLegend).

const overview = { key: null, results: null, order: null };
let pal = {};   // colori del tema, letti una volta per disegno

// Nomi delle fonti di prezzi e affitti (le etichette delle città aggiungono la data)
const SOURCE_NAMES = { annunci: 'Annunci (immobiliare.it)', omi: 'OMI (Agenzia delle Entrate)', post: 'Post Reddit' };

// Colore fisso della città: slot della palette categorica dichiarato nei suoi dati (css/base.css)
const cityColor = key => css(`--cat-${CITIES[key].color}`) || pal.muted;

// Ricalcola se lo scenario è cambiato, poi disegna. Lo scenario medio è immediato; il Monte Carlo gira
// una città alla volta per non bloccare la pagina e si ferma se nel frattempo arriva un nuovo ricalcolo.
function renderOverview() {
  const base = modelParams();
  const key = JSON.stringify([base, cmpSalary]);
  if (overview.key === key) {   // già calcolato (ridisegna, es. cambio tema) o calcolo in corso
    if (overview.results) drawOverview(overview.results);
    return;
  }
  overview.key = key;
  overview.results = null;
  const names = Object.keys(CITIES).sort((a, b) => CITIES[a].name.localeCompare(CITIES[b].name, LOCALE));
  const results = names.map(k => cityOutcome(cityScenario(base, k, cmpSalary)));
  const done = () => { overview.results = results; setBusy(null); drawOverview(results); };
  if (!base.stochastic) return done();
  drawOverview(results, true);
  let i = 0;
  const step = () => {
    if (overview.key !== key) return;   // superato da un ricalcolo più recente
    if (i >= results.length) return done();
    setBusy(`Simulo ${results[i].name}… (${i + 1} di ${results.length})`);
    setTimeout(() => {   // lascia disegnare il messaggio prima di calcolare
      if (overview.key !== key) return;
      results[i] = withMc(results[i], monteCarlo(results[i].p));
      i++;
      step();
    }, 0);
  };
  step();
}

function setBusy(text) {
  $('view-overview').classList.toggle('busy', !!text);
  const el = $('cmp-progress');
  el.hidden = !text;
  el.textContent = text || '';
}

// partial = Monte Carlo in corso: solo le schede che bastano allo scenario medio
function drawOverview(res, partial = false) {
  pal = { buy: css('--buy'), rent: css('--rent'), muted: css('--muted'), surface: css('--surface') };
  const stoch = !partial && !!res[0].mc;
  // stesso ordine in tutti i grafici, dalla città più favorevole a comprare; durante il calcolo resta
  // quello precedente, così le righe non saltano quando arrivano le probabilità
  const ord = partial && overview.order
    ? overview.order.map(k => res.find(r => r.key === k))
    : [...res].sort((a, b) => (stoch ? b.pWin - a.pWin : b.diff - a.diff));
  if (!partial) overview.order = ord.map(r => r.key);
  drawIntro(res);
  drawMonthly(ord); drawShare(ord); drawYield(ord); drawYears(ord);
  drawIndex('cmp-omi', ord, 'omiPrice', { base: () => 0, raw: v => `${fmtEur(v)}/m²`, title: k => { const [y, s] = k.split('-'); return `${s}° sem. ${y}`; }, xTicks: semesterTicks });
  drawIndex('cmp-rents', ord, 'rentAsking', { base: d => d[2020] ?? null, raw: v => `${fmtNum(v, 1)} €/m²/mese`, pointRadius: 3 });
  drawRentsCaption(ord);
  if (partial) {
    if (!$('cmp-verdict').innerHTML) $('cmp-verdict').innerHTML = '<p class="caption">Simulazione in corso…</p>';
    return;
  }
  drawVerdict(res, ord, stoch); drawWealth(ord, stoch); drawProb(ord, stoch); drawTable(ord, stoch);
}

// Fonte usata: dove la città non ce l'ha, il confronto usa gli annunci
function sourceText() {
  const src = state.priceSource, missing = Object.values(CITIES).filter(c => !c.market[src]).map(c => c.name);
  return (SOURCE_NAMES[src] || src) + (missing.length ? ` (a ${listIt(missing)} gli annunci)` : '');
}

function drawIntro(res) {
  const s = state, cur = currentCity();
  $('cmp-intro').innerHTML = `Stessa persona in ${res.length} capoluoghi: casa di <b>${fmtNum(s.sqm, 0)} m²</b>, anticipo ${fmtPct(s.downPct)}, mutuo ${s.mortgageType === 'variable' ? 'variabile' : 'fisso'} a ${s.mortgageYears} anni, ETF al ${fmtPct(s.etfReturn, 1)}, orizzonte <b>${Math.round(s.horizon)} anni</b>, eventi e rischi come nel pannello. Cambiano solo i dati della città: prezzo e affitto al m² (${sourceText()}), tasso del mutuo, rendita catastale, crescite e volatilità stimate dalle sue serie storiche, addizionali IRPEF${cmpSalary === 'city' ? ' e stipendio (RAL media locale)' : ''}. <b>${cur.name}</b> è esattamente lo scenario delle altre schede.`;
  $('cmp-salary-mine').textContent = `Lo stesso di ${cur.name} (${s.netFromRal ? `RAL ${fmtK(s.ral)}` : `netto ${fmtEur(s.netMonthly)} × ${s.monthsPerYear}`})`;
}

// ---------- Verdetto per città ----------
function drawVerdict(res, ord, stoch) {
  const H = res[0].H;
  $('cmp-verdict-title').textContent = stoch ? 'Dove comprare conviene di più' : 'Dove comprare conviene di più (scenario medio)';
  $('cmp-verdict-caption').textContent = stoch
    ? `Futuri su 100 in cui, dopo ${H} anni, chi compra ha più patrimonio di chi affitta e investe la differenza. Città in ordine, dalla più favorevole a comprare.`
    : `Vantaggio di chi compra dopo ${H} anni in un solo futuro in cui tutto cresce ai tassi medi. Attiva la simulazione stocastica per avere delle probabilità.`;
  const maxAbs = Math.max(...res.map(r => Math.abs(r.diff)), 1);
  $('cmp-verdict').innerHTML = ord.map(r => {
    const cur = r.key === state.city;
    // con il Monte Carlo la barra è la probabilità; senza, una barra divergente dal centro
    const w = Math.abs(r.diff) / maxAbs * 50;
    const [track, fill, word, med] = stoch
      ? ['', `width:${(r.pWin * 100).toFixed(1)}%`, `<b>${fmtPct(r.pWin)}</b> · ${likelihood(r.pWin)}`, `nel caso tipico ${who(r.diff)} è avanti di ${fmtK(Math.abs(r.diff))}`]
      : [' div', `left:${(r.diff >= 0 ? 50 : 50 - w).toFixed(1)}%;width:${w.toFixed(1)}%`, `<b>${signed(r.diff)}</b>`, `${who(r.diff)} è avanti`];
    return `<div class="cmp-row${cur ? ' cur' : ''}"><span class="name">${r.name}${cur ? '<small>città selezionata</small>' : ''}</span>
      <div class="track${track}"><div class="fill${!stoch && r.diff < 0 ? ' r' : ''}" style="${fill}"></div><i class="mid"></i></div>
      <span class="word">${word}</span><span class="med">${med}</span></div>`;
  }).join('') + twoSideLegend;
  $('cmp-insight').innerHTML = insightHtml(res, ord, stoch);
}

// Due o tre frasi che riassumono il confronto
function insightHtml(res, ord, stoch) {
  const n = res.length, best = ord[0], worst = ord.at(-1);
  const byYield = [...res].sort((a, b) => b.grossYield - a.grossYield);
  const out = [];
  if (stoch) {
    const nBuy = res.filter(r => r.pWin > 0.5).length;
    out.push(`Con queste ipotesi comprare è più probabile che affittare in <b>${nBuy} città su ${n}</b>. Conviene di più a <b>${best.name}</b> (${fmtPct(best.pWin)}) e di meno a <b>${worst.name}</b> (${fmtPct(worst.pWin)}).`);
  } else {
    const nBuy = res.filter(r => r.diff > 0).length;
    out.push(`Nello scenario medio comprare vince in <b>${nBuy} città su ${n}</b>. Il vantaggio più grande è a <b>${best.name}</b> (${signed(best.diff)}), il più piccolo a <b>${worst.name}</b> (${signed(worst.diff)}).`);
  }
  const hi = byYield.slice(0, 2), lo = byYield.at(-1);
  out.push(`Una chiave di lettura è il rapporto tra canone e prezzo: a ${hi.map(r => `${r.name} (${fmtPct(r.grossYield, 1)})`).join(' e ')} l’affitto costa di più rispetto alla casa e comprare parte avvantaggiato; a ${lo.name} (${fmtPct(lo.grossYield, 1)}) il confronto è più equilibrato. Contano poi il tasso del mutuo, la crescita attesa dei prezzi e quanto resta da investire a chi affitta.`);
  const deficit = res.filter(r => r.det.det.fcfR[0] < 0).map(r => r.name);
  if (deficit.length) out.push(`A ${listIt(deficit)} affitto e spese di vita superano lo stipendio netto: chi affitta non ha nulla da investire, consuma il capitale iniziale${res.some(r => r.wealthR < 0) ? ' e in molti futuri finisce con dei debiti' : ''}.`);
  const noLoan = res.filter(r => !r.dtiOk).map(r => r.name);
  if (noLoan.length) out.push(`A ${listIt(noLoan)} la rata supera il ${fmtPct(state.maxDTI)} del netto${cmpSalary === 'city' ? ' medio della città' : ''}: la banca probabilmente non concederebbe il mutuo e il risultato vale solo in teoria.`);
  return out.map(t => `<p>${t}</p>`).join('');
}

// ---------- Grafici a barre orizzontali, una riga per città ----------
const CMP_BAR = { maxBarThickness: 22, borderRadius: 4, borderSkipped: 'start' };
const bars = (label, data, color) => ({ label, data, backgroundColor: color, ...CMP_BAR });
// Coppia compro / affitto con i colori delle due strategie
const buyRent = (ord, [lb, fb], [lr, fr]) => [bars(lb, ord.map(fb), pal.buy), bars(lr, ord.map(fr), pal.rent)];

// La città selezionata in grassetto, tooltip su tutta la riga
function barChart(id, ord, datasets, { xTicks, x = {}, tooltip = {}, plugins = {}, extra = [] } = {}) {
  chart(id, {
    type: 'bar',
    data: { labels: ord.map(r => r.name), datasets },
    options: {
      indexAxis: 'y', maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', axis: 'y', intersect: false },
      plugins: { legend: { display: datasets.length > 1, labels: { boxWidth: 10, boxHeight: 10 } }, tooltip: { callbacks: tooltip }, ...plugins },
      scales: {
        x: { beginAtZero: true, ticks: { callback: xTicks }, ...x },
        y: { grid: { display: false }, ticks: { font: c => ({ weight: ord[c.index]?.key === state.city ? 'bold' : 'normal' }) } },
      },
    },
    plugins: extra,
  });
}

// Linea verticale di riferimento (es. rata massima concessa dalla banca)
const vlinePlugin = {
  id: 'vline',
  afterDatasetsDraw(ch, _args, o) {
    if (!o || o.value == null || !ch.scales.x) return;
    const { ctx, chartArea: a } = ch, x = ch.scales.x.getPixelForValue(o.value);
    if (x < a.left || x > a.right) return;
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = pal.muted; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke();
    ctx.font = `11px ${Chart.defaults.font.family}`; ctx.textBaseline = 'top';
    const left = x + 6 + ctx.measureText(o.label).width <= a.right;
    ctx.textAlign = left ? 'left' : 'right';
    ctx.fillText(o.label, x + (left ? 6 : -6), a.top + 2);
    ctx.restore();
  },
};

const netFooter = ord => t => { const r = ord[t[0].dataIndex]; return `Netto medio ${fmtEur(r.net)}/mese · casa ${fmtK(r.price)}${r.dtiOk ? '' : ` · rata oltre il ${fmtPct(state.maxDTI)}: mutuo probabilmente non concedibile`}`; };

function drawMonthly(ord) {
  barChart('cmp-monthly', ord, buyRent(ord, ['Rata del mutuo', r => r.payment], ['Affitto', r => r.rent]), {
    xTicks: v => fmtEur(v),
    tooltip: { label: c => `${c.dataset.label}: ${fmtEur(c.parsed.x)}/mese`, footer: netFooter(ord) },
  });
}

function drawShare(ord) {
  barChart('cmp-share', ord, buyRent(ord, ['Rata / netto', r => r.dti], ['Affitto / netto', r => r.rentShare]), {
    xTicks: v => fmtPct(v), x: { suggestedMax: Math.max(state.maxDTI, ...ord.map(r => Math.max(r.dti, r.rentShare))) * 1.15 },
    tooltip: { label: c => `${c.dataset.label}: ${fmtPct(c.parsed.x)}`, footer: netFooter(ord) },
    plugins: { vline: { value: state.maxDTI, label: `limite banca ${fmtPct(state.maxDTI)}` } },
    extra: [vlinePlugin],
  });
}

// Rendimento lordo da affitto per fonte: non dipende dallo scenario, solo dai dati delle città
function drawYield(ord) {
  const srcs = ['annunci', 'omi'], market = (r, k) => CITIES[r.key].market[k];
  const y = (r, k) => { const m = market(r, k); return m ? m.rentPerSqmMonth * 12 / m.pricePerSqm : null; };
  barChart('cmp-yield', ord, srcs.map((k, i) => bars(SOURCE_NAMES[k], ord.map(r => y(r, k)), i ? alpha(pal.buy, 0.45) : pal.buy)), {
    xTicks: v => fmtPct(v, 1),
    tooltip: { label: c => {
      const m = market(ord[c.dataIndex], srcs[c.datasetIndex]);
      return `${c.dataset.label}: ${fmtPct(c.parsed.x, 1)} (${fmtNum(m.rentPerSqmMonth, 1)} €/m²/mese su ${fmtEur(m.pricePerSqm)}/m²)`;
    } },
  });
}

function drawYears(ord) {
  barChart('cmp-years', ord, [bars('Anni di stipendio netto', ord.map(r => r.yearsOfNet), pal.buy)], {
    xTicks: v => fmtNum(v, 0),
    tooltip: { label: c => { const r = ord[c.dataIndex]; return `${fmtNum(c.parsed.x, 1)} anni di stipendio netto (casa ${fmtK(r.price)}, netto ${fmtK(r.net * 12)} l’anno)`; } },
  });
}

function drawWealth(ord, stoch) {
  const H = ord[0].H;
  $('cmp-wealth-title').textContent = `Patrimonio dopo ${H} anni`;
  $('cmp-wealth-caption').textContent = (stoch ? 'Mediana dei futuri simulati: metà va meglio, metà peggio. ' : 'Scenario medio: un solo futuro, tutto ai tassi medi. ')
    + 'Casa venduta al netto di costi di vendita e mutuo residuo, ETF venduti e tassati. ' + (state.realTerms ? 'In euro di oggi.' : 'In euro nominali.');
  barChart('cmp-wealth', ord, buyRent(ord, ['Compro', r => r.wealthB], ['Affitto + ETF', r => r.wealthR]), {
    xTicks: v => fmtK(v),
    tooltip: {
      label: c => `${c.dataset.label}: ${fmtK(c.parsed.x)}`,
      footer: t => {
        const { mc } = ord[t[0].dataIndex];
        return mc ? [`90% dei futuri: compro ${fmtK(mc.buyQ[0][H])} – ${fmtK(mc.buyQ[4][H])}`, `affitto ${fmtK(mc.rentQ[0][H])} – ${fmtK(mc.rentQ[4][H])}`] : [];
      },
    },
  });
}

// ---------- Grafici a linee, una per città ----------
function cityLine(r, data, extra = {}) {
  const col = cityColor(r.key), cur = r.key === state.city;
  return { label: r.name, data, borderColor: col, backgroundColor: col, borderWidth: cur ? 3 : 2, pointRadius: 0, pointHoverRadius: 5,
    pointBorderColor: pal.surface, pointBorderWidth: 2, pointHoverBorderColor: pal.surface, pointHoverBorderWidth: 2, spanGaps: true, order: cur ? 0 : 1, ...extra };
}

// Opzioni comuni: tooltip con tutte le città all'indice, dalla più alta; i dataset _ref (linee di
// riferimento) e i punti mancanti sono esclusi da legenda e tooltip
function lineChart(id, labels, datasets, { title, label, y, x = {} }) {
  const shown = i => !datasets[i.datasetIndex]._ref;
  chart(id, {
    type: 'line',
    data: { labels, datasets },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { filter: shown, boxWidth: 18, boxHeight: 2 } },
        tooltip: { filter: i => shown(i) && i.parsed.y != null, itemSort: (a, b) => b.parsed.y - a.parsed.y, callbacks: { title, label } },
      },
      scales: { x, y },
    },
  });
}

function drawProb(ord, stoch) {
  const H = ord[0].H, years = Array.from({ length: H + 1 }, (_, i) => i);
  $('cmp-prob-title').textContent = stoch ? 'Probabilità che comprare vinca, anno per anno' : 'Vantaggio di chi compra, anno per anno';
  $('cmp-prob-caption').textContent = stoch
    ? 'Quota di futuri in cui chi compra è avanti se vende (o smette di affittare) in quell’anno. Sopra la linea del 50% comprare conviene più spesso che no.'
    : 'Patrimonio compro − patrimonio affitto nello scenario medio, per anno di vendita o uscita. Sopra lo zero vince chi compra.';
  const ds = ord.map(r => cityLine(r, stoch ? r.mc.pBuyWins : years.map(y => r.det.nwB[y] - r.det.nwR[y])));
  ds.push({ data: years.map(() => stoch ? 0.5 : 0), borderColor: pal.muted, borderDash: [4, 3], borderWidth: 1, pointRadius: 0, pointHoverRadius: 0, _ref: true });
  lineChart('cmp-prob', years, ds, {
    title: t => `Vendi all’anno ${t[0].label}`,
    label: c => `${c.dataset.label}: ${stoch ? fmtPct(c.parsed.y) : signed(c.parsed.y)}`,
    x: { title: { display: true, text: 'Anno' } },
    y: stoch ? { min: 0, max: 1, ticks: { callback: v => fmtPct(v) } } : { ticks: { callback: v => signed(v) } },
  });
}

// Serie storica di ogni città come indice = 100 al valore base (base(data) o il primo disponibile)
function drawIndex(id, ord, series, { base, raw, title, xTicks, pointRadius = 0 }) {
  const keys = [...new Set(ord.flatMap(r => Object.keys(CITIES[r.key].history[series].data)))].sort();
  const ds = ord.map(r => {
    const d = CITIES[r.key].history[series].data, b = base(d) || d[keys.find(k => d[k] != null)];
    return cityLine(r, keys.map(k => d[k] != null ? d[k] / b * 100 : null), { pointRadius, _raw: keys.map(k => d[k]) });
  });
  lineChart(id, keys, ds, {
    title: title && (t => title(keys[t[0].dataIndex])),
    label: c => `${c.dataset.label}: ${fmtNum(c.parsed.y, 0)} (${raw(c.dataset._raw[c.dataIndex])})`,
    x: xTicks ? { ticks: { autoSkip: false, maxRotation: 0, callback: xTicks(keys) } } : {},
    y: { ticks: { callback: v => fmtNum(v, 0) } },
  });
}

// Semestri 'AAAA-S': un'etichetta per anno (1° semestre), un anno sì e uno no se il grafico è stretto
const semesterTicks = keys => function (v, i) {
  const [y, s] = keys[i].split('-'), every = this.width < 480 ? 2 : 1;
  return s === '1' && (y - keys[0].slice(0, 4)) % every === 0 ? y : '';
};

function drawRentsCaption(ord) {
  const short = ord.map(r => [r.name, Object.keys(CITIES[r.key].history.rentAsking.data).length]).filter(([, n]) => n < 5);
  $('cmp-rents-caption').textContent = 'Canoni richiesti negli annunci (immobiliare.it), indice 2020 = 100.'
    + short.map(([name, n]) => ` Per ${name} sono disponibili solo ${n} anni.`).join('');
}

// ---------- Tabella ----------
function drawTable(ord, stoch) {
  const H = ord[0].H, n = ord[0].p.nSims;
  $('cmp-table-caption').textContent = `${stoch ? `${n.toLocaleString(LOCALE)} futuri simulati per città, stesso seed. ` : 'Scenario medio. '}Casa di ${fmtNum(state.sqm, 0)} m², prezzi e affitti da ${sourceText()}. Netto medio mensile = netto annuo / 12.${state.realTerms ? ' Patrimoni in euro di oggi.' : ''} Evidenziata la strategia con più patrimonio.`;
  const th = ['Città', 'Prezzo €/m²', 'Affitto €/m²/mese', 'Canone / prezzo', 'Casa', 'Capitale iniziale', 'Netto / mese', 'Rata', 'Affitto / mese', 'Rata / netto',
    stoch ? `P(compro vince) a ${H} anni` : `Vantaggio compro a ${H} anni`, stoch ? 'Compro (mediana)' : 'Compro', stoch ? 'Affitto + ETF (mediana)' : 'Affitto + ETF', 'ETF per pareggio'];
  const rows = ord.map(r => {
    const cur = r.key === state.city, p = r.p;
    return `<tr${cur ? ' class="cur"' : ''}><td>${r.name}${cur ? ' <span class="muted">selezionata</span>' : ''}</td><td>${fmtEur(p.pricePerSqm)}</td><td>${fmtNum(p.rentPerSqmYear / 12, 2)} €</td><td>${fmtPct(r.grossYield, 1)}</td>
      <td>${fmtK(r.price)}</td><td>${fmtK(r.capital)}</td><td>${fmtEur(r.net)}</td><td>${fmtEur(r.payment)}</td><td>${fmtEur(r.rent)}</td><td class="${r.dtiOk ? '' : 'bad'}">${fmtPct(r.dti)}</td>
      <td>${stoch ? fmtPct(r.pWin) : signed(r.diff)}</td><td class="${r.wealthB >= r.wealthR ? 'win' : ''}">${fmtK(r.wealthB)}</td><td class="${r.wealthR > r.wealthB ? 'win' : ''}">${fmtK(r.wealthR)}</td><td>${r.be == null ? 'n/d' : fmtPct(r.be, 1)}</td></tr>`;
  }).join('');
  $('cmp-table').innerHTML = `<thead><tr>${th.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody>`;
}
