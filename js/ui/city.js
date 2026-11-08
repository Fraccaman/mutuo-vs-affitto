// Scheda "Dati della città" e note fiscali (vista avanzata).
// Dipende da: data/*, model/calibration.js, ui/format.js, ui/state.js.

function renderItalyNotes() {
  $('italy-notes').innerHTML = `<h3>Italia: regole fiscali</h3><ul>${ITALY_NOTES.map(n => `<li>${n}</li>`).join('')}</ul>`;
}
// Anni come intervalli consecutivi: [2008, 2009, 2010, 2017, 2018] → "2008–2010 e 2017–2018"
function yearRuns(years) {
  const runs = [];
  for (const y of years) {
    const last = runs.at(-1);
    if (last && y === last[1] + 1) last[1] = y; else runs.push([y, y]);
  }
  const parts = runs.map(([a, b]) => a === b ? `${a}` : `${a}–${b}`);
  return listIt(parts);
}

function renderCity() {
  const c = currentCity(), st = cityStats(c), cp = cityParams(c, state.priceSource);
  $('city-title').textContent = `Dati di ${c.name}`;
  // euro, metri quadri, coefficienti puri, altrimenti percentuali
  const fmtP = (k, v) => ['ral', 'renditaCatastale'].includes(k) ? fmtEur(v) : k === 'sqm' ? v + ' m²' : k.endsWith('AR') || k === 'houseMeanRev' ? fmtNum(v) : fmtPct(v, 2);
  const labels = { sqm: 'Superficie', renditaCatastale: 'Rendita catastale', mortgageRate: 'Tasso mutuo fisso', ral: 'RAL', houseGrowth: 'Crescita prezzo casa', houseVol: 'Volatilità prezzo casa', houseAR: 'Momentum prezzo casa', houseMeanRev: 'Ritorno alla media prezzo/affitto', rentGrowth: 'Crescita affitti', rentVol: 'Volatilità affitti', salaryGrowth: 'Crescita stipendio', salaryVol: 'Volatilità stipendio' };
  const markets = Object.values(c.market).map(m => `<tr><td>${m.label}</td><td>${fmtEur(m.pricePerSqm)}</td><td>${fmtNum(m.rentPerSqmMonth)} €</td><td>${fmtPct(m.rentPerSqmMonth * 12 / m.pricePerSqm, 1)}</td><td class="desc">${m.note} ${srcLink(m.source)}</td></tr>`).join('');
  const params = Object.entries(c.params).map(([k, d]) => `<tr><td>${labels[k] || k}</td><td>${fmtP(k, cp[k])}</td><td class="desc">${d.why}${d.source ? ' ' + srcLink(d.source) : ''}</td></tr>`).join('');
  const facts = c.facts.map(([l, v, src]) => `<tr><td>${l}</td><td>${v}</td><td class="desc">${srcLink(src)}</td></tr>`).join('');
  $('city-body').innerHTML = `
    <h3>Prezzi e affitti attuali</h3>
    <div class="table-wrap"><table><thead><tr><th>Fonte</th><th>Prezzo €/m²</th><th>Affitto €/m²/mese</th><th>Rendimento lordo</th><th class="desc">Note</th></tr></thead><tbody>${markets}</tbody></table></div>
    <h3>Cosa dicono le serie storiche</h3>
    <p class="caption">Prezzi: media ${fmtPct(st.houseMean, 1)}/anno e deviazione standard ${fmtPct(st.houseSd, 1)} su ${st.houseN} anni (${yearRuns(st.houseYears)}), autocorrelazione ${fmtNum(st.houseAR)}. OMI ${st.omiFrom}–${st.omiTo}: ${fmtPct(st.omiCagr, 1)}/anno. ${c.history.medianIncome.label.replace(/ €$/, '')} ${st.incomeFrom}–${st.incomeTo}: ${fmtPct(st.incomeCagr, 1)}/anno nominale, ${fmtPct(st.incomeRealCagr, 1)}/anno al netto dell’inflazione.</p>
    <div class="grid2">
      <div class="chart small"><canvas id="h-price"></canvas></div>
      <div class="chart small"><canvas id="h-income"></canvas></div>
    </div>
    <p class="caption">${c.history.housePriceYoY.note}${c.history.medianIncome.note ? ' ' + c.history.medianIncome.note : ''}</p>
    <h3>Parametri impostati per ${c.name}</h3>
    <div class="table-wrap"><table><thead><tr><th>Parametro</th><th>Valore</th><th class="desc">Perché</th></tr></thead><tbody>${params}</tbody></table></div>
    <h3>Altri dati</h3>
    <div class="table-wrap"><table><tbody>${facts}</tbody></table></div>
    <h3>Addizionali IRPEF</h3>
    <p class="caption">Regionale ${c.region}: ${c.taxes.regional.map(([l, r]) => `${fmtPct(r, 2)}${l === Infinity ? ' oltre' : ' fino a ' + fmtEur(l)}`).join(', ')}. Comunale ${fmtPct(c.taxes.municipalRate, 2)}${c.taxes.municipalExemption > 0 ? `, esente sotto ${fmtEur(c.taxes.municipalExemption)} (sopra si paga su tutto il reddito)` : ', senza soglia di esenzione'}. ${srcLink(c.taxes.source)}</p>
  `;
  const B = css('--buy'), R = css('--rent');
  const yoy = c.history.housePriceYoY.data;
  const ys = Object.keys(yoy).map(Number);
  const years = []; for (let y = Math.min(...ys); y <= Math.max(...ys); y++) years.push(y);
  chart('h-price', {
    type: 'bar',
    data: { labels: years, datasets: [{ label: 'Prezzi case, variazione annua', data: years.map(y => yoy[y] ?? null), backgroundColor: years.map(y => (yoy[y] ?? 0) >= 0 ? B : R) }] },
    options: { maintainAspectRatio: false, animation: false, plugins: { title: { display: true, text: 'Prezzi case: variazione annua (%)' }, legend: { display: false } }, scales: { y: { ticks: { callback: v => v + '%' } } } },
  });
  const inc = c.history.medianIncome;
  const iy = Object.keys(inc.data);
  let cpi = inc.data[iy[0]]; const real = iy.map((y, i) => { if (i) cpi *= 1 + inc.inflation[y] / 100; return Math.round(inc.data[iy[0]] * inc.data[y] / cpi); });
  chart('h-income', {
    type: 'line',
    data: { labels: iy, datasets: [
      { label: 'Nominale', data: iy.map(y => inc.data[y]), borderColor: B, pointRadius: 2 },
      { label: `Reale (€ ${iy[0]})`, data: real, borderColor: R, pointRadius: 2, borderDash: [4, 3] },
    ] },
    options: { maintainAspectRatio: false, animation: false, plugins: { title: { display: true, text: inc.label.replace(/ €$/, ' (€)') } }, scales: { y: { ticks: { callback: v => fmtK(v) } } } },
  });
}
