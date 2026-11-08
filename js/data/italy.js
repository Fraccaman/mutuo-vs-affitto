// Fisco italiano (2026): parametri di default e note mostrate in UI.
// I calcoli (imposte prima casa, netto da RAL) sono in js/model/taxes.js.

const ITALY_PARAMS = {
  cgTax: 0.26,             // imposta sostitutiva su plusvalenze ETF
  stampDuty: 0.002,        // imposta di bollo 0,2% annuo sul dossier titoli
  interestDeduction: true, // detrazione IRPEF 19% interessi mutuo prima casa
  deductionRate: 0.19,
  deductionCap: 4000,      // tetto interessi detraibili (max 760 €/anno)
  detailedBuyCosts: true,  // imposte prima casa calcolate da rendita catastale
  sellerType: 'private',
  notaryCost: 4300,        // rogito (~2.500 €) + atto di mutuo (~1.800 €)
  agencyBuyPct: 0.03,      // provvigione tipica 2–4% + IVA
  bankCosts: 1000,         // istruttoria + perizia
  sellCostPct: 0.0366,     // provvigione agenzia 3% + IVA 22%
  rentModel: 'contract',   // contratto 4+4 a canone libero
  rentContractYears: 8,
  cedolareSecca: false,
  rentIndexation: 0.75,    // aggiornamento al 75% della variazione ISTAT FOI
  inflation: 0.02,         // obiettivo BCE
  monthsPerYear: 13,       // tredicesima
  ownerFixedMonthly: 0,    // IMU esente su prima casa (non di lusso)
  unempReplacement: 0.6,   // NASpI: ~75% della retribuzione con tetto, decrescente nel tempo
};

const ITALY_NOTES = [
  'Plusvalenze ETF tassate al 26% solo alla vendita (differimento fiscale incluso nel modello).',
  'Imposta di bollo 0,2% annuo sul valore del dossier titoli (ignorata nel post originale).',
  'Detrazione 19% sugli interessi del mutuo prima casa, fino a 4.000 € di interessi l’anno.',
  'Prima casa da privato: imposta di registro 2% sul valore catastale (rendita × 1,05 × 110, minimo 1.000 €) + ipotecaria e catastale 50 € ciascuna. Da impresa: IVA 4% sul prezzo + registro, ipotecaria e catastale 200 € ciascuna.',
  'Mutuo prima casa: imposta sostitutiva 0,25% sul capitale. Provvigione dell’agenzia detraibile al 19% fino a 1.000 €.',
  'Rivendita e riacquisto entro un anno: credito d’imposta pari al registro pagato sul primo acquisto. Vendere entro 5 anni senza ricomprare fa perdere le agevolazioni (non modellato).',
  'Under 36: le agevolazioni (esenzione imposte e sostitutiva) sono scadute per i rogiti dal 2025 salvo proroghe; non incluse.',
  'IMU esente sulla prima casa salvo categorie di lusso A/1, A/8, A/9. TARI pagata sia da chi possiede sia da chi affitta: non incide sul confronto.',
  'Affitto a canone libero 4+4: canone aggiornato ogni anno al 75% dell’inflazione ISTAT (nessun aggiornamento con cedolare secca); al rinnovo dopo 8 anni o a ogni trasloco si riparte dal prezzo di mercato.',
  'Plusvalenza sulla vendita della prima casa esente (o dopo 5 anni dall’acquisto).',
  'Disoccupazione: NASpI circa 75% della retribuzione (con tetto, cala dal 6° mese): media ~60% del netto.',
  'Gli ETF armonizzati UE ad accumulazione (es. VWCE) non distribuiscono: nessuna tassa fino alla vendita.',
  'Netto da RAL: IRPEF 2026 (23% fino a 28.000 €, 33% fino a 50.000 €, 43% oltre), contributi INPS 9,19%, detrazioni lavoro dipendente, taglio del cuneo (L. 207/2024), addizionali regionale e comunale della città. Stima per dipendente senza familiari a carico.',
];
