// Scheda "Perché vince chi vince" (vista semplice e avanzata): costo vero di abitare anno per anno,
// voci del primo anno, forze in gioco e punti in cui il risultato si ribalta, con pulsanti per provarli.
// Dipende da: model/analysis.js, ui/format.js, ui/state.js, ui/form.js (syncForm, applyMarket).

function renderWhy(ids, p, det, be) {
  const b = housingCostBreakdown(p);
  const ber = breakEvenRent(p);
  const cross = crossoverYear(det.nwB, det.nwR);
  for (const id of ids) {
    const el = $(id);
    const open = el.querySelector('details.why-detail')?.open ?? false;   // mantiene la tabella aperta
    el.innerHTML = whyHtml(id, p, det, be, b, ber, cross, open);
    renderWhyChart(id + '-chart', b);
    el.querySelectorAll('[data-try]').forEach(btn => btn.addEventListener('click', () => tryChange(btn.dataset)));
  }
}

// Pulsanti "prova": cambiano un parametro e ricalcolano
function tryChange(d) {
  if (d.try === 'priceSource') { state.priceSource = d.v; applyMarket(); }
  else state[d.try] = +d.v;
  syncForm(); scheduleRun();
}

function whyHtml(id, p, det, be, b, ber, cross, open) {
  const H = b.H, d = det.det;
  const finalGap = det.nwB[H] - det.nwR[H];
  const buyWins = finalGap >= 0;
  const gap0 = b.totRent - b.totBuy;                       // > 0: il primo anno costa meno comprare
  const m = v => fmtEur(v / 12);
  const sign = v => (v < 0 ? '−' : '') + fmtEur(Math.abs(v));
  const tile = (label, value, sub, cls = '') => `<div class="why-kpi ${cls}"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;

  // ---- Frase iniziale: chi vince e perché, in una riga
  const lead = buyWins === (b.cumGap >= 0)
    ? `In ${H} anni abitare costa in tutto <b>${fmtK(Math.abs(b.cumGap))}</b> in meno a chi ${b.cumGap >= 0 ? 'compra' : 'affitta'}: è questa differenza, investita o accumulata nella casa, che lo porta avanti.`
    : `Anche se in ${H} anni abitare costa in tutto ${fmtK(Math.abs(b.cumGap))} in meno a chi ${b.cumGap >= 0 ? 'compra' : 'affitta'}, conta di più quando si paga: ${buyWins ? 'la casa accumula valore con la leva' : 'il capitale iniziale investito subito cresce più a lungo'}.`;

  // ---- Numeri chiave
  const kpis = `<div class="why-kpis">
    ${tile('Costo vero comprando', `${m(b.totBuy)}/mese`, 'primo anno, la quota capitale esclusa', 'buy')}
    ${tile('Costo vero affittando', `${m(b.totRent)}/mese`, `primo anno, sale a ${m(b.years.at(-1).rent)} all’anno ${H}`, 'rent')}
    ${tile(`Differenza in ${H} anni`, `${b.cumGap >= 0 ? '+' : '−'}${fmtK(Math.abs(b.cumGap))}`, `a favore di chi ${b.cumGap >= 0 ? 'compra' : 'affitta'}, senza rendimenti`)}
    ${tile('Patrimonio finale', `${buyWins ? '+' : '−'}${fmtK(Math.abs(finalGap))}`, `a favore di chi ${buyWins ? 'compra' : 'affitta'}, scenario medio${cross != null && cross > 0 ? ` · sorpasso all’anno ${cross}` : ''}`)}
  </div>`;

  // ---- Grafico
  const chartNote = b.firstCheaper == null
    ? 'Affittare costa meno in ogni anno.'
    : b.firstCheaper === 1 ? 'Comprare costa meno fin dal primo anno.' : `Comprare costa meno dall’anno ${b.firstCheaper}.`;
  const chart = `<h3>Costo vero di abitare, anno per anno</h3>
    <p class="caption">${chartNote} Il costo di chi compra sale col tempo anche se la rata è ferma: man mano che il mutuo si ripaga cresce il capitale fermo nella casa, che avrebbe reso come gli ETF${b.payoffYear && b.payoffYear < b.H ? `, e dopo l’ultima rata (anno ${b.payoffYear}) restano manutenzione e spese` : ''}. Passa il mouse su un anno per le voci.</p>
    <div class="chart small"><canvas id="${id}-chart"></canvas></div>`;

  // ---- Tabella del primo anno (richiudibile)
  const rows = b.rows.map(r => `<tr><td>${r.label}<div class="desc muted">${r.note}</div></td>
    <td class="num">${r.buy ? sign(r.buy) : '–'}${r.buy ? `<small>${fmtPct(r.buyPct, 1)} del prezzo</small>` : ''}</td>
    <td class="num">${r.rent ? sign(r.rent) : '–'}${r.rent ? `<small>${fmtPct(r.rentPct, 1)} del prezzo</small>` : ''}</td></tr>`).join('');
  const table = `<details class="why-detail"${open ? ' open' : ''}><summary>Voce per voce, primo anno <small>compro ${fmtEur(b.totBuy)} · affitto ${fmtEur(b.totRent)} all’anno</small></summary>
    <div class="table-wrap"><table class="why-table"><thead><tr><th>Costo annuo</th><th class="num">Compro</th><th class="num">Affitto</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>Totale</td><td class="num ${gap0 >= 0 ? 'win' : ''}">${sign(b.totBuy)}<small>${fmtPct(b.totBuy / b.price, 1)} del prezzo</small></td><td class="num ${gap0 < 0 ? 'win' : ''}">${sign(b.totRent)}<small>${fmtPct(b.totRent / b.price, 1)} del prezzo</small></td></tr></tfoot>
    </table></div>
    <p class="caption">Rendimento ETF netto di TER, bollo e tasse sulle plusvalenze: ${fmtPct(b.etfNet, 1)} l’anno. È il rendimento che chi compra rinuncia a ottenere sui soldi messi nella casa.</p></details>`;

  // ---- Forze in gioco
  const fB = d.fcfB[0], fR = d.fcfR[0];
  const saveTxt = v => v >= 0 ? `risparmia ${fmtEur(v)}` : `è in rosso di ${fmtEur(-v)}`;
  const force = (title, big, text, tone) => `<div class="why-force ${tone || ''}"><span>${title}</span><b>${big}</b><p>${text}</p></div>`;
  const forces = [
    force('Affitto contro interessi', `${fmtPct(b.yield0, 1)} vs ${fmtPct(b.rate, 2)}`,
      `L’affitto vale il ${fmtPct(b.yield0, 1)} del prezzo all’anno, il mutuo costa il ${fmtPct(b.rate, 2)}. ${b.yield0 > b.rate ? 'Prendere a prestito costa meno che pagare un affitto: favorisce chi compra.' : 'Pagare l’affitto costa meno degli interessi: favorisce chi affitta.'}`,
      b.yield0 > b.rate ? 'buy' : 'rent'),
    force('Rata ferma, affitto che cresce', `${fmtEur(b.rentMonth0)} → ${fmtEur(b.rentMonthH)}`,
      `${p.mortgageType === 'variable' ? 'La rata segue l’Euribor ma non l’inflazione' : `La rata resta ${fmtEur(b.pay)} per ${p.mortgageYears} anni, poi sparisce`}; l’affitto cresce del ${fmtPct(p.rentGrowth, 1)} l’anno.`,
      p.rentGrowth > 0 ? 'buy' : ''),
    force('Leva', `${fmtPct(b.leveredGrowth, 1)} vs ${fmtPct(b.etfNet, 1)}`,
      `${fmtK(b.capital)} controllano una casa da ${fmtK(b.price)}: con prezzi a ${fmtPct(p.houseGrowth, 1)} l’anno il guadagno vale il ${fmtPct(b.leveredGrowth, 1)} del capitale, contro il ${fmtPct(b.etfNet, 1)} netto degli ETF. Amplifica anche i cali.`,
      Math.abs(b.leveredGrowth - b.etfNet) < 0.005 ? '' : b.leveredGrowth > b.etfNet ? 'buy' : 'rent'),
    force('Risparmio del primo mese', `${fB >= 0 ? '+' : '−'}${fmtEur(Math.abs(fB))} / ${fR >= 0 ? '+' : '−'}${fmtEur(Math.abs(fR))}`,
      `Chi compra ${saveTxt(fB)}, chi affitta ${saveTxt(fR)}. ${fR < 100 ? 'Chi affitta ha poco o nulla da investire ed erode il capitale iniziale: “affitta e investi la differenza” qui non funziona.' : `Chi affitta vince solo se investe davvero questa differenza ogni mese${p.investFCF < 1 ? ` (ipotesi: ne investe il ${fmtPct(p.investFCF)})` : ''}.`}`,
      fR < 100 ? 'buy' : fR > fB ? 'rent' : ''),
  ];

  // ---- Dove si ribalta, con pulsanti per provarlo
  const tryBtn = (key, v, label) => ` <button type="button" class="link" data-try="${key}" data-v="${v}">${label}</button>`;
  const flips = [];
  if (ber != null) {
    const now = p.rentPerSqmYear / 12, be12 = ber / 12;
    flips.push(`<b>Affitto</b>: ${buyWins ? 'chi affitta pareggia' : 'chi compra pareggia'} con un canone di <b>${fmtNum(be12, 1)} €/m²</b> al mese, cioè ${fmtEur(be12 * p.sqm)} (oggi ${fmtNum(now, 1)} €/m², ${fmtPct(Math.abs(1 - be12 / now))} ${be12 < now ? 'in meno' : 'in più'}).${tryBtn('rentPerSqmYear', +ber.toFixed(1), 'prova')}`);
  }
  const market = currentCity().market;
  const otherSrc = Object.entries(market).find(([k]) => k !== state.priceSource && k === (state.priceSource === 'omi' ? 'annunci' : 'omi'));
  if (otherSrc) {
    const [k, mk] = otherSrc;
    flips.push(`<b>Fonte dei prezzi</b>: con ${mk.label} affitto ${fmtNum(mk.rentPerSqmMonth, 1)} €/m² e prezzo ${fmtEur(mk.pricePerSqm)}/m² (canone/prezzo ${fmtPct(mk.rentPerSqmMonth * 12 / mk.pricePerSqm, 1)}, oggi ${fmtPct(b.yield0, 1)}).${tryBtn('priceSource', k, 'prova')}`);
  }
  if (be != null) flips.push(`<b>ETF</b>: per pareggiare serve un rendimento del <b>${fmtPct(be, 1)}</b> l’anno (ipotesi ${fmtPct(p.etfReturn, 1)}).${tryBtn('etfReturn', +be.toFixed(4), 'prova')}`);
  const trans = b.rows.find(r => r.key === 'trans').buy * H;
  flips.push(`<b>Orizzonte</b>: acquisto e vendita costano circa ${fmtK(trans)}. ${cross == null ? 'Nello scenario medio chi compra non passa mai avanti.' : cross > 0 ? `Nello scenario medio chi compra passa avanti all’anno <b>${cross}</b>: se vendi prima, conviene affittare.` : 'Nello scenario medio chi compra è avanti da subito.'}${H > 10 ? tryBtn('horizon', 10, 'prova 10 anni') : ''}${H > 5 ? tryBtn('horizon', 5, '5 anni') : ''}`);

  // ---- Ipotesi da controllare
  const drift = b.yieldH > b.yield0 * 1.3 ? 'up' : b.yieldH < b.yield0 / 1.3 ? 'down' : null;
  const warn = drift ? `<p class="why-warn"><b>Ipotesi da controllare.</b> Con affitti al +${fmtPct(p.rentGrowth, 1)} e case al +${fmtPct(p.houseGrowth, 1)} per ${H} anni, l’affitto arriverebbe a valere il <b>${fmtPct(b.yieldH, 1)}</b> del prezzo (oggi ${fmtPct(b.yield0, 1)}). ${drift === 'up'
    ? 'Per così tanto tempo è poco probabile: o gli affitti rallentano o i prezzi salgono. Questa ipotesi favorisce chi compra.'
    : 'Prezzi che crescono molto più degli affitti per così tanto tempo sono poco probabili. Questa ipotesi favorisce chi compra tramite la crescita della casa.'}${tryBtn('rentGrowth', p.inflation, 'prova affitti = inflazione')}</p>` : '';

  return `<h2>Perché vince ${buyWins ? 'chi compra' : 'chi affitta'}</h2>
    <p class="why-lead">${lead}</p>
    ${kpis}
    ${chart}
    ${table}
    <h3>Le forze in gioco</h3>
    <p class="caption">Il colore indica chi è favorito: <b style="color:var(--buy)">blu</b> chi compra, <b style="color:var(--rent)">arancio</b> chi affitta.</p>
    <div class="why-forces">${forces.join('')}</div>
    <h3>Dove si ribalta</h3>
    <ul class="why-list">${flips.map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="caption">I pulsanti “prova” cambiano il parametro nel pannello; i preset riportano ai valori di partenza.</p>
    ${warn}`;
}

// Costo vero mensile di chi compra e di chi affitta, anno per anno; tooltip con le voci
function renderWhyChart(canvasId, b) {
  const B = css('--buy'), R = css('--rent');
  const ys = b.years;
  const labels = {
    interest: 'interessi', opportunity: 'rendimento perso', maint: 'manutenzione', fixed: 'spese fisse',
    trans: 'compravendita', growth: 'crescita casa', rent: 'canone',
  };
  chart(canvasId, {
    type: 'line',
    data: { labels: ys.map(x => x.y), datasets: [
      { label: 'Compro: costo vero', data: ys.map(x => x.buy / 12), borderColor: B, backgroundColor: alpha(B, 0.12), borderWidth: 2.5, pointRadius: 0, fill: false },
      { label: 'Affitto: costo vero', data: ys.map(x => x.rent / 12), borderColor: R, backgroundColor: alpha(R, 0.15), borderWidth: 2.5, pointRadius: 0, fill: '-1' },
    ] },
    options: {
      maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { boxHeight: 2 } },
        tooltip: { callbacks: {
          title: t => 'Anno ' + t[0].label,
          label: c => `${c.dataset.label}: ${fmtEur(c.parsed.y)}/mese`,
          afterBody: t => {
            const x = ys[t[0].dataIndex];
            const parts = Object.entries(x.parts).filter(([, v]) => Math.abs(v) > 1).map(([k, v]) => `  ${labels[k]} ${v < 0 ? '−' : ''}${fmtEur(Math.abs(v) / 12)}`);
            return ['', 'Compro:', ...parts, `Differenza: ${fmtEur(Math.abs(x.rent - x.buy) / 12)}/mese a favore di chi ${x.buy <= x.rent ? 'compra' : 'affitta'}`];
          },
        } },
      },
      scales: { x: { title: { display: true, text: 'Anno' } }, y: { min: 0, ticks: { callback: v => fmtEur(v) } } },
    },
  });
}
