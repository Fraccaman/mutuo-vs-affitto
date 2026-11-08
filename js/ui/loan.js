// Box "Mutuo concedibile?": rata/reddito e mutuo/valore rispetto ai limiti della banca.
// Dipende da: model/analysis.js (loanCheck), ui/format.js, ui/state.js.

function renderLoanCheck() {
  const ralToNet = state.netFromRal ? ral => netFromRal(ral, currentCity()).net : null;
  const c = loanCheck(state, annualNet(), ralToNet), el = $('loan-check');
  el.className = 'card loan ' + (c.ok ? 'ok' : 'ko');
  const grid = `<div class="loan-grid">
    <div><span>Rata / netto mensile</span><b class="${c.okDTI ? '' : 'bad'}">${fmtPct(c.dti, 0)}</b><small>limite ${fmtPct(state.maxDTI)}</small></div>
    <div><span>Mutuo / valore casa</span><b class="${c.okLTV ? '' : 'bad'}">${fmtPct(c.ltv, 0)}</b><small>limite ${fmtPct(state.maxLTV)}</small></div>
    <div><span>Rata</span><b>${fmtEur(c.pay)}</b><small>massima ${fmtEur(c.maxPay)}</small></div>
    <div><span>Mutuo</span><b>${fmtK(c.loan)}</b><small>massimo ${fmtK(c.maxLoan)}</small></div>
  </div>`;
  if (c.ok) {
    el.innerHTML = `<h2>✓ Mutuo concedibile</h2><p class="caption">Con un netto di ${fmtEur(c.net)} al mese (annuo / 12) la rata rientra nei limiti tipici delle banche.</p>${grid}`;
    return;
  }

  const fixes = [];
  if (c.downPctNeeded <= 0.95) fixes.push(`<li>Anticipo del <b>${fmtPct(c.downPctNeeded, 0)}</b> (${fmtEur(c.downNeeded)}; con le spese servono ${fmtEur(c.capitalNeeded)} di risparmi) <button type="button" class="link" data-fix="downPct" data-v="${Math.ceil(c.downPctNeeded * 100) / 100}">applica</button></li>`);
  if (c.maxSqm >= 20) fixes.push(`<li>Casa più piccola: al massimo <b>${c.maxSqm} m²</b> a ${fmtEur(state.pricePerSqm)}/m² con l’anticipo attuale <button type="button" class="link" data-fix="sqm" data-v="${c.maxSqm}">applica</button></li>`);
  fixes.push(c.ralNeeded
    ? `<li>Reddito più alto: RAL di almeno <b>${fmtEur(c.ralNeeded)}</b> (netto ${fmtEur(c.netNeeded)} al mese), per esempio con un secondo reddito in famiglia</li>`
    : `<li>Reddito più alto: netto di almeno <b>${fmtEur(c.netNeeded)}</b> al mese</li>`);
  if (state.mortgageYears < 30) fixes.push(`<li>Durata più lunga (oggi ${state.mortgageYears} anni)</li>`);

  const why = (!c.okDTI ? `La rata (${fmtEur(c.pay)}) supera il ${fmtPct(state.maxDTI)} del netto mensile (${fmtEur(c.net)}). ` : '')
    + (!c.okLTV ? `Il mutuo supera l’${fmtPct(state.maxLTV)} del valore della casa. ` : '');
  el.innerHTML = `<h2>✗ Mutuo probabilmente non concedibile</h2>
    <p class="caption">${why}La simulazione continua comunque, ma nella realtà la banca chiederebbe di cambiare qualcosa:</p>
    ${grid}<ul class="plain">${fixes.join('')}</ul>`;
  el.querySelectorAll('[data-fix]').forEach(b => b.addEventListener('click', () => {
    state[b.dataset.fix] = +b.dataset.v;
    syncForm(); scheduleRun();
  }));
}
