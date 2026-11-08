// Simulazione di un singolo futuro: compro con mutuo vs affitto e investo in ETF.
// Dipende da: random.js, finance.js, equity.js, taxes.js.
//
// Simulazione mensile, risultati annuali (indice 0 = oggi). In ogni percorso entrambe le
// strategie vivono lo stesso futuro (borsa, inflazione, licenziamenti, traslochi): si
// confrontano strategie, non fortuna.
//
// Modelli stocastici:
//  - Azioni: lognormale, Student-t (code grasse) o regime switching bull/bear (Hardy 2001).
//  - Incertezza sui parametri: il rendimento atteso di ETF e casa è estratto per percorso.
//  - Inflazione: AR(1), oppure regimi normale/shock con media di lungo periodo invariata.
//  - Affitti: inflazione + componente propria; contratto 4+4 con aggiornamento ISTAT.
//  - Casa: crescita con momentum; il rapporto prezzo/affitto torna alla media nel lungo periodo.
//  - Euribor: Vasicek annuale legato all'inflazione (per il mutuo variabile).
//  - Eventi: disoccupazione con NASpI e traslochi forzati (chi possiede vende e ricompra).
//  - Rischi di lungo periodo (spenti di default, solo stocastico):
//     · declino demografico: scenario estratto per percorso; affitti e prezzi crescono meno
//       e vendere costa di più (meno compratori);
//     · rischio della singola casa: la tua casa si scosta dal mercato (passeggiata casuale a
//       media invariata) e il quartiere può degradare (salto negativo raro);
//     · obbligo di classe energetica: in un anno incerto o riqualifichi (paghi) o la casa
//       subisce uno sconto permanente; il proprietario di chi affitta ribalta parte del costo.
//    Il valore della casa propria è: valore di mercato × fattore proprio (rischio specifico,
//    quartiere, classe energetica). Un trasloco forzato realizza la differenza.

const DEBT_SPREAD = 0.03;   // chi resta senza ETF si indebita al tasso del mutuo + 3%

// NASpI in quota del reddito: piena per 6 mesi, poi −3% al mese, zero dopo la durata massima
function naspiShare(p, monthsUnemployed) {
  const k = monthsUnemployed;
  if (k >= p.unempMaxMonths) return 0;
  return p.unempReplacement * (k < 6 ? 1 : Math.pow(0.97, k - 5));
}

/**
 * Simula un percorso.
 * @param p          parametri (vedi DEFAULTS)
 * @param rng        generatore uniforme [0, 1)
 * @param stochastic false = scenario deterministico (tutto ai tassi medi)
 * @param detail     true = registra serie e costi cumulati per i grafici
 * @returns { nwB, nwR, houseEqB, det, moves, unempSpells, bearMonths, highYears, underwater, risks }
 *          nwB/nwR = patrimonio liquidato per anno (compro / affitto)
 *          underwater = in almeno un anno la casa (al netto dei costi di vendita) valeva meno del mutuo
 *          risks = quali rischi di lungo periodo si sono verificati in questo percorso
 */
function simulatePath(p, rng, stochastic, detail = false) {
  const gauss = makeGauss(rng);
  const sv = stochastic ? 1 : 0;
  const H = Math.round(p.horizon);
  const nMonths = p.mortgageYears * 12;
  const variable = p.mortgageType === 'variable';

  // ---- Acquisto e mutuo
  const { price, down } = purchase(p);
  let loan = price - down;
  const costs0 = buyCosts(p, price, loan);
  let registroPaid = costs0.taxes || 0;   // imposte pagate sull'ultimo acquisto: credito d'imposta se si ricompra
  let euribor = p.euribor0;
  let rate = initialRate(p);
  let pay = payment(loan, rate, nMonths);
  let monthsPaid = 0;

  // ---- Affitto, reddito e spese (valori mensili)
  const rent0 = p.sqm * p.rentPerSqmYear / 12;
  let rentM = rent0;         // canone pagato dall'inquilino
  let marketM = rent0;       // canone di mercato per un nuovo contratto
  const contract = p.rentModel === 'contract';
  let contractAge = 0, prevInfl = p.inflation, newContract = false;
  let income = p.netMonthly * p.monthsPerYear / 12;
  let living = p.living;
  let ownerFixed = p.ownerFixedMonthly;
  let condo = p.condoMonthly;

  // ---- Azioni (parametri estratti per percorso: incertezza sul rendimento atteso)
  const etfMu = p.etfReturn + sv * p.etfMuUncertainty * gauss();
  const houseMu = p.houseGrowth + sv * p.houseMuUncertainty * gauss();
  const muLogA = Math.log(1 + Math.max(etfMu, -0.9));
  const muM = muLogA / 12;
  const sM = p.etfVol / Math.sqrt(12);
  const rs = p.equityModel === 'rs' ? rsSetup(p, muLogA) : null;
  let bear = rs ? rng() < rs.piBear : false;
  const annVol = equityAnnualVol(p) || 1;
  const terM = p.ter / 12;
  const tDf = Math.max(3, Math.round(p.tDf));

  // ---- Casa: crescita con momentum, ancorata agli affitti nel lungo periodo tramite il
  // ritorno alla media del rapporto prezzo/affitto (prDev = scostamento in log dalla tendenza)
  const houseLogMu = Math.log(1 + Math.max(houseMu, -0.9));
  const prSlope = houseLogMu - Math.log(1 + p.rentGrowth);
  let rentIdx = 1, prDev = 0, hMom = 0, logH = Math.log(price), house = price;

  // ---- Rischi di lungo periodo. Si estraggono numeri casuali solo se attivi, così con i
  // rischi spenti i percorsi restano identici a prima.
  const declined = sv && p.declineProb > 0 && rng() < p.declineProb;
  const declineDrift = declined ? p.declineDrift : 0;
  const sellCost = p.sellCostPct + (declined ? p.declineSellDiscount : 0);
  const epbdLast = Math.max(p.epbdFrom, p.epbdTo);
  const epbdYear = sv && p.epbdProb > 0 && rng() < p.epbdProb
    ? Math.round(p.epbdFrom) + Math.floor(rng() * (Math.round(epbdLast) - Math.round(p.epbdFrom) + 1)) : -1;
  // fattore della casa propria rispetto al mercato: exp(idio + hood) × brown
  let idio = 0, hood = 0, brown = 1, hoodShocks = 0, epbdAction = null;
  let energySaveB = 0, energySaveR = 0;   // risparmio in bolletta dopo la riqualificazione (€/mese)
  const ownValue = () => house * Math.exp(idio + hood) * brown;
  let underwater = false, idioLow = false;

  // ---- Inflazione: con i regimi la media di lungo periodo (shock inclusi) resta p.inflation
  const inflRS = p.inflModel === 'rs';
  const piHigh = inflRS ? p.inflPNormHigh / Math.max(1e-9, p.inflPNormHigh + p.inflPHighNorm) : 0;
  const inflNormMean = inflRS ? (p.inflation - piHigh * p.inflHighMean) / (1 - piHigh) : p.inflation;
  let inflHigh = inflRS && sv ? rng() < piHigh : false, inflDevN = 0, highYears = 0;

  // ---- Portafogli: chi affitta investe subito anticipo + costi d'acquisto
  const B = newPortfolio();
  const R = newPortfolio();
  invest(R, down + costs0.total - p.renterUpfrontCosts, p.cgTax);

  let inflDev = 0, cpi = 1, unempLeft = 0, unempElapsed = 0;
  let moves = 0, unempSpells = 0, bearMonths = 0;

  // ---- Registrazione dei risultati
  const nwB = [], nwR = [], cpiArr = [];
  const det = detail ? {
    fcfB: [], fcfR: [], rent: [], marketRent: [], housingB: [], housingR: [], income: [],
    house: [], loan: [], equityB: [], pfB: [], pfR: [],
    payment: pay, price, down, buyCosts: costs0.total,
    // costi cumulati non recuperabili (nominali)
    cum: { interest: 0, maint: 0, ownerCondo: 0, transB: costs0.total, taxB: 0, deductions: 0, rent: 0, tenantCondo: 0, transR: p.renterUpfrontCosts, taxR: 0, principal: 0 },
  } : null;
  const cum = det ? det.cum : null;

  let houseEquity = 0;   // casa al netto di costi di vendita e mutuo residuo
  const record = () => {
    const own = ownValue();
    houseEquity = own * (1 - sellCost) - loan;
    if (houseEquity < 0 && nwB.length > 0) underwater = true;   // dal primo anno, come pEverNeg
    const etfB = pfNet(B, p.cgTax), etfR = pfNet(R, p.cgTax);
    nwB.push(houseEquity + etfB);
    nwR.push(etfR);
    cpiArr.push(cpi);
    if (det) { det.house.push(own); det.loan.push(loan); det.pfB.push(etfB); det.pfR.push(etfR); det.equityB.push(houseEquity); }
  };
  record();

  const logR = new Float64Array(12);   // log-rendimenti azionari mensili dell'anno

  for (let y = 0; y < H; y++) {
    // ---- Shock azionari dell'anno (generati prima per correlarli alla casa)
    let logSum = 0;
    for (let m = 0; m < 12; m++) {
      if (!sv) logR[m] = muM;
      else if (rs) {
        if (bear) { if (rng() < p.rsPBearBull) bear = false; }
        else if (rng() < p.rsPBullBear) bear = true;
        if (bear) bearMonths++;
        const e = gauss();
        logR[m] = bear ? rs.muBear + rs.sBear * e : rs.muBull + rs.sBull * e;
      } else {
        const e = p.equityModel === 't' ? studentT(gauss, tDf) : gauss();
        logR[m] = muM + sM * e;
      }
      logSum += logR[m];
    }
    const zEq = sv ? clamp((logSum - 12 * muM) / annVol, -4, 4) : 0;

    // ---- Shock macro annuali: inflazione, affitti, stipendi, casa, Euribor
    let infl = p.inflation, rg = p.rentGrowth, sg = p.salaryGrowth;
    let hgLog = houseLogMu;
    if (sv) {
      if (inflRS) {
        if (inflHigh) { if (rng() < p.inflPHighNorm) inflHigh = false; }
        else if (rng() < p.inflPNormHigh) inflHigh = true;
      }
      const zI = gauss();
      if (inflHigh) {
        highYears++;
        infl = p.inflHighMean + p.inflHighVol * zI;
        inflDevN *= p.inflAR;   // la componente normale si spegne durante lo shock
      } else {
        inflDevN = p.inflAR * inflDevN + p.inflVol * Math.sqrt(1 - p.inflAR ** 2) * zI;
        infl = inflNormMean + inflDevN;
      }
      inflDev = infl - p.inflation;
      rg = p.rentGrowth + declineDrift + inflDev + p.rentVol * gauss();
      sg = p.salaryGrowth + inflDev + p.salaryVol * gauss();
      // casa: momentum + ritorno alla media del rapporto prezzo/affitto + inflazione
      const zH = p.houseEquityCorr * zEq + Math.sqrt(1 - p.houseEquityCorr ** 2) * gauss();
      hMom = p.houseAR * hMom - p.houseMeanRev * prDev + p.houseVol * zH;
      // nel declino prezzi e affitti perdono la stessa crescita: il rapporto prezzo/affitto regge
      hgLog = houseLogMu + declineDrift + inflDev + hMom;
      // Euribor: segue il livello dell'inflazione (la BCE alza i tassi quando sale)
      const zInfl = clamp(inflDev / Math.max(p.inflVol, 0.005), -4, 4);
      const zE = p.euriborInflCorr * zInfl + Math.sqrt(1 - p.euriborInflCorr ** 2) * gauss();
      euribor += p.euriborSpeed * (p.euriborLong - euribor) + p.euriborVol * zE;
    } else {
      euribor += p.euriborSpeed * (p.euriborLong - euribor);
    }

    // ---- Affitto, stipendio e spese aggiornati a inizio anno (dal secondo anno)
    if (y > 0) {
      marketM *= 1 + rg;
      if (!contract) rentM = marketM;
      else {
        contractAge++;
        if (newContract || (p.rentContractYears > 0 && contractAge >= p.rentContractYears)) {
          rentM = marketM; contractAge = 0; newContract = false;   // rinnovo o nuovo contratto a mercato
        } else if (!p.cedolareSecca) {
          rentM *= 1 + p.rentIndexation * Math.max(0, prevInfl);   // aggiornamento ISTAT
        }
      }
      income *= 1 + sg;
      living *= 1 + infl;
      ownerFixed *= 1 + infl;
      condo *= 1 + infl;
      energySaveB *= 1 + infl;
      energySaveR *= 1 + infl;
    }

    // ---- Obbligo di classe energetica a inizio anno
    if (y === epbdYear) {
      const own = ownValue();
      const cost = p.sqm * p.epbdCostPerSqm * cpi * (1 - p.epbdIncentive);   // al netto degli incentivi
      const loss = own * p.epbdBrownDiscount;                                  // sconto se non riqualifichi
      const saving = p.epbdEnergySaving * cpi;
      // 'auto': riqualifica se costa meno di quanto perderesti, tutto in valore attuale.
      // Lo sconto si paga alla vendita (cresce col prezzo della casa); i soldi dei lavori invece
      // avrebbero reso come gli ETF; le bollette risparmiate sono una rendita fino all'orizzonte.
      const rem = H - y;
      const lossPV = loss * (1 - sellCost) * Math.pow((1 + houseMu) / (1 + etfMu), rem);   // sconto realizzato alla vendita
      const rr = (1 + etfMu) / (1 + p.inflation) - 1;
      const savePV = saving * 12 * (Math.abs(rr) > 1e-6 ? (1 - Math.pow(1 + rr, -rem)) / rr : rem);
      const renovate = p.epbdChoice === 'renovate' || (p.epbdChoice === 'auto' && cost < lossPV + savePV);
      if (renovate) {
        invest(B, -cost, p.cgTax);
        energySaveB = saving;
        if (cum) cum.maint += cost;
      } else {
        brown *= 1 - p.epbdBrownDiscount;
      }
      epbdAction = renovate ? 'renovate' : 'discount';
      // chi affitta: il proprietario riqualifica e alza il canone di mercato recuperando una quota
      // del costo allo stesso rendimento da locazione (canone/valore); l'inquilino risparmia in bolletta
      // l'aumento per migliorie vale anche sul contratto in corso, insieme al risparmio in bolletta
      const bump = 1 + p.epbdPassThrough * cost / Math.max(house, 1);
      marketM *= bump;
      rentM *= bump;
      energySaveR = saving;
    }

    // ---- Prezzo della casa a fine anno, distribuito sui mesi
    rentIdx *= 1 + rg;
    logH += hgLog;
    prDev = logH - Math.log(price) - Math.log(Math.max(rentIdx, 1e-6)) - prSlope * (y + 1);
    const houseEnd = Math.exp(logH);
    const hgM = Math.pow(Math.max(houseEnd, 1) / house, 1 / 12) - 1;

    // ---- Mutuo variabile: rata ricalcolata a inizio anno
    if (variable && loan > 1e-6 && y > 0) {
      rate = Math.max(0, euribor) + p.mortgageSpread;
      pay = payment(loan, rate, nMonths - monthsPaid);
    }

    // ---- Disoccupazione: inizia in un mese casuale dell'anno
    let unempStart = -1;
    if (sv && p.unempProb > 0 && unempLeft <= 0 && rng() < p.unempProb) {
      unempStart = Math.floor(rng() * 12);
      unempSpells++;
    }

    // ---- Mesi dell'anno
    let yearInterest = 0, sumFB = 0, sumFR = 0, sumHB = 0, sumHR = 0, sumInc = 0;
    const debtRateM = (rate + DEBT_SPREAD) / 12;
    for (let m = 0; m < 12; m++) {
      const growth = Math.exp(logR[m]) * (1 - terM);
      B.v *= growth; R.v *= growth;
      if (B.debt > 0) B.debt *= 1 + debtRateM;
      if (R.debt > 0) R.debt *= 1 + debtRateM;

      house *= 1 + hgM;
      let mortgagePay = 0;
      if (loan > 1e-6) {
        const interest = loan * rate / 12;
        const principal = Math.min(loan, pay - interest);
        loan -= principal;
        yearInterest += interest;
        mortgagePay = interest + principal;
        if (cum) { cum.interest += interest; cum.principal += principal; }
        monthsPaid++;
      }

      if (m === unempStart) { unempLeft = Math.max(1, Math.round(p.unempMonths * (-Math.log(1 - rng() * 0.999)))); unempElapsed = 0; }
      let inc = income;
      if (unempLeft > 0) { inc = income * naspiShare(p, unempElapsed); unempLeft--; unempElapsed++; }

      // flusso di cassa libero: investito se positivo, prelevato dagli ETF se negativo
      const maint = house * p.maintPct / 12;
      const tenantCondo = condo * p.tenantCondoShare;
      const housingB = mortgagePay + maint + ownerFixed + condo - energySaveB;
      const housingR = rentM + tenantCondo - energySaveR;
      const fB = inc - living - housingB;
      const fR = inc - living - housingR;
      sumFB += fB; sumFR += fR;
      if (cum) {
        sumHB += housingB; sumHR += housingR; sumInc += inc;
        cum.maint += maint; cum.ownerCondo += ownerFixed + condo;
        cum.rent += rentM; cum.tenantCondo += tenantCondo;
      }
      invest(B, fB >= 0 ? fB * p.investFCF : fB, p.cgTax);
      invest(R, fR >= 0 ? fR * p.investFCF : fR, p.cgTax);
    }

    // ---- Fine anno: bollo e detrazioni
    const stB = wealthTax(B, p.stampDuty);
    const stR = wealthTax(R, p.stampDuty);
    if (cum) { cum.taxB += stB; cum.taxR += stR; }
    if (p.interestDeduction && yearInterest > 0) {
      const ded = Math.min(yearInterest, p.deductionCap) * p.deductionRate;
      invest(B, ded * p.investFCF, p.cgTax);
      if (cum) cum.deductions += ded;
    }
    // detrazione sulla provvigione dell'agenzia, nella dichiarazione successiva
    if (y === 0 && p.detailedBuyCosts) {
      const ded = agencyDeduction(costs0);
      invest(B, ded * p.investFCF, p.cgTax);
      if (cum) cum.deductions += ded;
    }

    // ---- Rischio della singola casa a fine anno: scostamento dal mercato e degrado del quartiere.
    // La passeggiata casuale ha media invariata (−σ²/2): aggiunge rischio, non toglie rendimento.
    if (sv && p.houseIdioVol > 0) idio += p.houseIdioVol * gauss() - p.houseIdioVol ** 2 / 2;
    if (sv && p.hoodShockProb > 0 && rng() < p.hoodShockProb) {
      hood += Math.log(Math.max(0.01, 1 - p.hoodShockSize));
      hoodShocks++;
    }

    // ---- Trasloco forzato a fine anno
    if (sv && p.moveProb > 0 && y < H - 1 && rng() < p.moveProb) {
      moves++;
      // Chi possiede vende e ricompra una casa equivalente. Il mutuo non si trasferisce: si
      // estingue e se ne apre uno nuovo dello stesso importo residuo al tasso del momento
      // (il fisso segue l'Euribor), con nuovi costi e credito d'imposta sul registro già pagato
      // (solo la parte pagata davvero sull'ultimo acquisto, non quella già compensata).
      const rebuyCosts = buyCosts(p, house, loan, registroPaid);
      const rebuy = rebuyCosts.total;
      registroPaid = rebuyCosts.taxes || 0;
      if (loan > 1e-6) {
        rate = variable ? Math.max(0, euribor) + p.mortgageSpread : Math.max(0.005, p.mortgageRate + euribor - p.euribor0);
        pay = payment(loan, rate, nMonths - monthsPaid);
      }
      // Si vende la propria casa (valore proprio) e se ne compra una media (valore di mercato):
      // un quartiere degradato o una casa da riqualificare diventano una perdita realizzata.
      const own = ownValue();
      const costB = own * sellCost + rebuy + p.moveCost + (house - own);
      // la nuova casa è una casa media: niente scostamenti, sconti o risparmi della vecchia
      if (Math.exp(idio) < 0.9) idioLow = true;   // perdita specifica realizzata con la vendita
      idio = 0; hood = 0; brown = 1; energySaveB = 0;
      const costR = p.moveCost + marketM * p.renterMoveMonths;
      invest(B, -costB, p.cgTax);
      invest(R, -costR, p.cgTax);
      if (cum) { cum.transB += costB; cum.transR += costR; }
      newContract = true;
    }

    cpi *= 1 + infl;
    prevInfl = infl;
    if (det) {
      det.fcfB.push(sumFB / 12); det.fcfR.push(sumFR / 12);
      det.rent.push(rentM); det.marketRent.push(marketM);
      det.housingB.push(sumHB / 12); det.housingR.push(sumHR / 12); det.income.push(sumInc / 12);
    }
    record();
  }

  if (cum) {
    // costi alla liquidazione finale: vendita casa e tasse sulle plusvalenze ETF
    cum.transB += ownValue() * sellCost;
    cum.taxB += unrealizedGain(B) * p.cgTax;
    cum.taxR += unrealizedGain(R) * p.cgTax;
  }
  if (p.realTerms) {
    for (let i = 0; i < nwB.length; i++) { nwB[i] /= cpiArr[i]; nwR[i] /= cpiArr[i]; }
  }
  const houseEqB = p.realTerms ? houseEquity / cpi : houseEquity;
  const risks = {
    declined,
    hood: hoodShocks > 0,
    idioLow: idioLow || Math.exp(idio) < 0.9,   // casa (attuale o venduta) ≥10% sotto il mercato
    epbd: epbdYear >= 0 && epbdYear < H,
    epbdAction,
  };
  return { nwB, nwR, houseEqB, det, moves, unempSpells, bearMonths, highYears, underwater, risks };
}

// Scenario deterministico: un solo futuro, tutto ai tassi medi (il metodo del post originale)
function deterministic(p) {
  return simulatePath(p, mulberry32(1), false, true);
}
