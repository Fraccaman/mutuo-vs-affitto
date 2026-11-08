// Riquadro in cima ai risultati (vista semplice e avanzata): i principali dati di partenza
// della simulazione, per sapere a colpo d'occhio su cosa si basano i numeri.
// Dipende da: model/finance.js, ui/format.js, ui/state.js.

function renderSetup(det) {
  const s = state, d = det.det;
  const variable = s.mortgageType === 'variable';
  const rentM = s.sqm * s.rentPerSqmYear / 12;
  const net = netPerPayslip();
  const source = currentCity().market[s.priceSource];
  const H = Math.round(s.horizon);
  const item = (label, value, sub = '') => `<div><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;

  const items = [
    item('Città', currentCity().name, source ? source.label : ''),
    item('Casa', `${fmtNum(s.sqm, 0)} m² · ${fmtK(d.price)}`, `${fmtEur(s.pricePerSqm)}/m²`),
    item('Capitale iniziale', fmtK(d.down + d.buyCosts), `anticipo ${fmtPct(s.downPct)} + spese ${fmtK(d.buyCosts)}`),
    item('Mutuo', `${fmtK(d.price - d.down)} · ${s.mortgageYears} anni`, `${variable ? 'variabile' : 'fisso'} ${fmtPct(initialRate(s), 2)}`),
    item('Rata', `${fmtEur(d.payment)}/mese`, variable ? 'iniziale, cambia con l’Euribor' : 'costante'),
    item('Affitto', `${fmtEur(rentM)}/mese`, `${fmtEur(s.rentPerSqmYear / 12)}/m² · ${s.rentModel === 'contract' ? `contratto, mercato ogni ${s.rentContractYears} anni` : 'sempre a mercato'}`),
    item('Stipendio netto', `${fmtEur(net)} × ${s.monthsPerYear}`, s.netFromRal ? `da RAL ${fmtK(s.ral)}` : 'inserito a mano'),
    item('Spese di vita', `${fmtEur(s.living)}/mese`, 'casa esclusa'),
    item('ETF', `${fmtPct(s.etfReturn, 1)}/anno`, `TER ${fmtPct(s.ter, 2)} · investito ${fmtPct(s.investFCF)} del risparmio`),
    item('Crescite annue', `casa ${fmtPct(s.houseGrowth, 1)} · affitti ${fmtPct(s.rentGrowth, 1)}`, `stipendio ${fmtPct(s.salaryGrowth, 1)} · inflazione ${fmtPct(s.inflation, 1)}`),
    item('Orizzonte', `${H} anni`, s.realTerms ? 'in euro di oggi' : 'in euro nominali'),
    item('Simulazione', s.stochastic ? `${s.nSims.toLocaleString(LOCALE)} futuri` : 'un solo futuro medio', s.stochastic ? modelsText() : 'tutto cresce ai tassi medi'),
  ];

  const risks = activeRisks();
  const foot = s.stochastic && risks.length ? `<p class="setup-foot">Rischi attivi: ${risks.join(' · ')}.</p>` : '';
  const el = $('setup');
  const wasOpen = el.querySelector('details') ? el.querySelector('details').open : true;
  el.innerHTML = `<details class="setup"${wasOpen ? ' open' : ''}><summary>Dati di partenza <small>${currentCity().name}, ${fmtNum(s.sqm, 0)} m², ${fmtK(d.price)} contro ${fmtEur(rentM)}/mese di affitto, ${H} anni</small></summary>
    <div class="setup-grid">${items.join('')}</div>${foot}</details>`;
}

// Modelli statistici scelti, in breve
function modelsText() {
  const eq = { normal: 'borsa lognormale', t: 'borsa a code grasse', rs: 'borsa con crisi' }[state.equityModel];
  const infl = state.inflModel === 'rs' ? 'shock d’inflazione' : 'inflazione AR(1)';
  return `${eq} · ${infl}`;
}

// Eventi e rischi attivi, in parole
function activeRisks() {
  const s = state, out = [];
  if (s.unempProb > 0) out.push(`disoccupazione ${fmtPct(s.unempProb, 1)}/anno`);
  if (s.moveProb > 0) out.push(`trasloco forzato ${fmtPct(s.moveProb, 1)}/anno`);
  if (s.declineProb > 0) out.push(`declino demografico ${fmtPct(s.declineProb)}`);
  if (s.houseIdioVol > 0) out.push(`rischio della singola casa ±${fmtPct(s.houseIdioVol, 1)}/anno`);
  if (s.hoodShockProb > 0) out.push(`degrado del quartiere ${fmtPct(s.hoodShockProb, 1)}/anno (−${fmtPct(s.hoodShockSize)})`);
  if (s.epbdProb > 0) out.push(`obbligo energetico ${fmtPct(s.epbdProb)} tra ${s.epbdFrom} e ${s.epbdTo} anni`);
  return out;
}
