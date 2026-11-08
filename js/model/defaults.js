// Valori di default di tutti i parametri del simulatore.
// Sono le ipotesi del post Reddit originale; preset e città li sovrascrivono (js/ui/schema.js).

const DEFAULTS = {
  // Casa
  sqm: 70,
  pricePerSqm: 3600,
  downPct: 0.20,
  buyCostPct: 0.06,          // usato se il calcolo dettagliato è spento
  detailedBuyCosts: false,   // calcolo imposte prima casa + notaio + agenzia + banca
  sellerType: 'private',     // 'private' (registro 2% su valore catastale) | 'builder' (IVA 4%)
  renditaCatastale: 800,
  notaryCost: 4300,          // rogito + atto di mutuo
  agencyBuyPct: 0.03,        // provvigione agenzia (+ IVA 22%)
  bankCosts: 1000,           // istruttoria + perizia
  sellCostPct: 0.03,
  maintPct: 0.01,
  ownerFixedMonthly: 0,      // spese solo del proprietario: assicurazione, IMU se dovuta
  condoMonthly: 0,           // spese condominiali ordinarie totali €/mese
  tenantCondoShare: 0.7,     // quota a carico dell'inquilino (servizi: pulizie, luce, riscaldamento, ascensore)
  maxDTI: 0.33,              // rata massima concessa dalla banca, in % del netto
  maxLTV: 0.8,               // mutuo massimo in % del valore
  houseGrowth: 0.02,
  // Mutuo
  mortgageType: 'fixed',     // 'fixed' | 'variable'
  mortgageRate: 0.031,       // tasso fisso
  mortgageYears: 30,
  euribor0: 0.021,           // Euribor oggi
  euriborLong: 0.022,        // livello di lungo periodo
  euriborSpeed: 0.15,        // velocità ritorno alla media
  euriborVol: 0.008,         // volatilità annua
  euriborInflCorr: 0.5,
  mortgageSpread: 0.012,
  interestDeduction: false,
  deductionRate: 0.19,
  deductionCap: 4000,
  // Affitto
  rentPerSqmYear: 169,
  rentGrowth: 0.025,         // crescita affitti di mercato (nuovi contratti)
  rentModel: 'market',       // 'market' = sempre a prezzo di mercato | 'contract' = 4+4 con ISTAT
  rentContractYears: 8,      // dopo quanti anni il canone torna a prezzo di mercato
  cedolareSecca: false,      // con cedolare secca niente aggiornamento ISTAT
  rentIndexation: 0.75,      // quota della variazione ISTAT applicata ogni anno
  renterUpfrontCosts: 0,
  // Reddito e spese
  netMonthly: 1995,
  monthsPerYear: 13,
  salaryGrowth: 0.02,
  living: 1000,
  inflation: 0.02,
  // Investimento
  etfReturn: 0.07,
  ter: 0.0022,
  cgTax: 0.26,
  stampDuty: 0,
  investFCF: 1,
  // Eventi di vita
  unempProb: 0,              // probabilità annua di perdere il lavoro
  unempMonths: 8,            // durata media della disoccupazione
  unempReplacement: 0.6,     // sussidio / reddito precedente (primi 6 mesi)
  unempMaxMonths: 24,        // durata massima NASpI; poi reddito zero fino al nuovo lavoro
  moveProb: 0,               // probabilità annua di trasloco forzato
  moveCost: 1500,            // trasloco (entrambi)
  renterMoveMonths: 1,       // agenzia/doppio affitto per chi affitta, in mensilità
  // Rischi di lungo periodo (solo stocastico; spenti di default)
  declineProb: 0,            // probabilità che la città entri in declino demografico
  declineDrift: -0.015,      // crescita annua in meno di prezzi e affitti nel declino
  declineSellDiscount: 0.05, // sconto extra per vendere (meno compratori, tempi lunghi)
  houseIdioVol: 0,           // volatilità annua della tua casa rispetto al mercato
  hoodShockProb: 0,          // probabilità annua che il quartiere degradi
  hoodShockSize: 0.2,        // perdita di valore quando succede
  epbdProb: 0,               // probabilità di un obbligo di riqualificazione energetica
  epbdFrom: 7,               // primo anno possibile (da oggi)
  epbdTo: 15,                // ultimo anno possibile
  epbdCostPerSqm: 500,       // costo della riqualificazione €/m² (euro di oggi)
  epbdIncentive: 0.3,        // quota coperta da incentivi pubblici
  epbdBrownDiscount: 0.1,    // sconto permanente sul valore se non riqualifichi
  epbdChoice: 'auto',        // 'auto' | 'renovate' | 'discount'
  epbdEnergySaving: 40,      // risparmio in bolletta dopo i lavori €/mese (euro di oggi)
  epbdPassThrough: 0.5,      // quota del costo che il proprietario ribalta sull'inquilino
  // Orizzonte
  horizon: 30,
  realTerms: false,
  // Statistica
  stochastic: true,
  nSims: 3000,
  seed: 42,
  equityModel: 't',          // 'normal' | 't' | 'rs'
  etfVol: 0.16,
  tDf: 4,
  rsBullVol: 0.12,
  rsBearVol: 0.25,
  rsBearGap: -0.30,          // differenza di rendimento annuo bear − bull
  rsPBullBear: 0.03,         // prob. mensile di entrare in bear market
  rsPBearBull: 0.15,         // prob. mensile di uscirne
  etfMuUncertainty: 0,       // dev. std. del rendimento atteso ETF tra percorsi
  houseMuUncertainty: 0,     // dev. std. della crescita attesa casa tra percorsi
  houseVol: 0.04,
  houseAR: 0.5,              // momentum crescita prezzi
  houseMeanRev: 0.0,         // ritorno alla media del rapporto prezzo/affitto
  houseEquityCorr: 0.2,
  rentVol: 0.015,
  inflVol: 0.012,            // volatilità in regime normale
  inflAR: 0.6,
  inflModel: 'ar',           // 'ar' = AR(1) | 'rs' = regimi normale/shock (tipo 2022)
  inflHighMean: 0.075,       // inflazione media negli anni di shock
  inflHighVol: 0.02,
  inflPNormHigh: 0.04,       // prob. annua di entrare in uno shock inflazionistico
  inflPHighNorm: 0.5,        // prob. annua di uscirne (durata media 2 anni)
  salaryVol: 0.015,
  riskAversion: 2,           // CRRA per equivalente certo
};
