// Roma: dati e fonti.

const SRC_RM = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/roma' },
  srOmi: { name: 'Agenzia Entrate – OMI, Statistiche regionali Lazio 2026 (anno 2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_LAZIO.pdf/7f69a843-2b7f-c36f-6bd6-0b8108ab0817' },
  srOmiArch: { name: 'Agenzia Entrate – OMI, Statistiche regionali Lazio 2017–2025 (anni 2016–2024, archivio)', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/pubblicazioni/statistiche-regionali/archivio-statistiche-regionali' },
  sr2017: { name: 'Agenzia Entrate – OMI, Statistiche regionali Lazio 2017 (anno 2016)', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/statistiche-regionali/SR_2017_lazio.pdf' },
  notaOmi2014: { name: 'Agenzia Entrate – OMI, Nota territoriale Roma II sem. 2014 (numero indice quotazioni dal 2004)', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/note_semestrali_2014/Roma_Nota_Terr_II_sem_2014.pdf' },
  notaOmi2011: { name: 'Agenzia Entrate – OMI, Nota territoriale Roma II sem. 2011', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/Roma_Nota_Territoriale_II_sem2011.pdf' },
  mef: { name: 'MEF – Dipartimento Finanze, open data IRPEF su base comunale, anni d’imposta 2016–2024 (Roma, H501)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes' },
  immobiliare: { name: 'Immobiliare.it, quotazioni immobiliari nel comune di Roma (set. 2026)', url: 'https://www.immobiliare.it/mercato-immobiliare/lazio/roma/' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2026 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  tecnocasa: { name: 'Ufficio Studi Gruppo Tecnocasa, “La rivalutazione degli immobili nel tempo” (set. 2026)', url: 'https://cdn-tecnocasagroup.medialabtc.it/it/sites/2/2026/09/La-rivalutazione-degli-immobili-nel-tempo-Gruppo-Tecnocasa.pdf' },
  addizionaleReg: { name: 'Regione Lazio: addizionale regionale IRPEF, anno d’imposta 2026 (L.R. 20/2025)', url: 'https://www.regione.lazio.it/sites/default/files/2026-01/Addizionale-regionale-2026.pdf' },
  jobpricing: { name: 'JobPricing, Geography Index 2026 (RAL/RGA 2025 per regione e provincia)', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  perizia: { name: 'Tribunale di Roma, perizia RGE 219/2023: A/2 cl. 2, 5 vani, Appio Latino, rendita 1.149,12 €', url: 'https://www.astegiudiziarie.it/allegato/Perizia-RM-EI-219-2023-C-4.pdf/2311436' },
};

CITIES.RM = {
  name: 'Roma',
  region: 'Lazio',
  color: 6,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    // Scaglioni 2026 (1,23% base + maggiorazione del piano di rientro sanitario). Chi ha imponibile fino a 28.000 € paga
    // l'1,73% su tutto il reddito; detrazione di 60 € tra 28.001 e 30.000 €. Agevolazioni non modellate: sotto i 28.000 € questi
    // scaglioni sovrastimano l'addizionale.
    regional: [[15000, 0.0173], [Infinity, 0.0333]],
    municipalRate: 0.009,        // Roma Capitale è l'unico comune che può superare lo 0,8%
    municipalExemption: 14000,   // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_RM.addizionaleReg,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, set. 2026)',
      pricePerSqm: 3875,
      rentPerSqmMonth: 19.1,
      note: 'Prezzi richiesti (+6,4% in un anno; affitto medio 2026 da Sky TG24 su dati immobiliare.it, +4,9% in un anno). La trattativa abbassa il prezzo d’acquisto; per un nuovo affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_RM.immobiliare,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 3098,
      rentPerSqmMonth: 12.4,
      note: 'Valori medi delle 211 zone OMI (da 950 a 10.300 €/m²; canoni da 6,2 a 23,6 €/m²/mese). Includono vecchi contratti e canoni agevolati (concordati), due terzi dei contratti registrati a Roma: sottostimano il costo di un nuovo affitto.',
      source: SRC_RM.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '37.293 (+6,2%)', SRC_RM.casalens],
    ['Valore medio per abitazione venduta 2025', '~270.200 €', SRC_RM.casalens],
    ['Acquisti con mutuo (persone fisiche)', '59,0%', SRC_RM.casalens],
    ['Mutuo medio 2025', '193.400 € al 3,49% iniziale medio (Lazio)', SRC_RM.casalens],
    ['Rendimento lordo da affitto (OMI)', '~5,0% (3,1%–7,6% per zona)', SRC_RM.casalens],
    ['Reddito imponibile medio per contribuente (2024)', '29.209 €', SRC_RM.mef],
    ['Reddito complessivo mediano (2024, stima per interpolazione sulle classi MEF)', '~24.100 €', SRC_RM.mef],
    ['Affitti richiesti 2020 → 2026 (immobiliare.it)', '14,7 → 19,1 €/m² (+29,9%)', SRC_RM.affittiSky],
    ['Abitazioni locate nel 2025 (OMI)', '54.506 (+2,5%), 66% a canone agevolato', SRC_RM.srOmi],
    ['Prezzi rispetto a 20 e 10 anni fa (Tecnocasa)', '−29,8% e −1,2% (+9,7% negli ultimi 5 anni)', SRC_RM.tecnocasa],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_RM.notaOmi2014, SRC_RM.notaOmi2011, SRC_RM.sr2017, SRC_RM.srOmiArch, SRC_RM.srOmi],
      note: '2008–2014: numero indice OMI delle quotazioni di Roma capoluogo, 2° semestre su 2° semestre (letto dalle etichette del grafico della Nota territoriale 2014, verificato sul valore 2011 della Nota 2011). 2016–2025: variazione annua della quotazione media OMI del capoluogo (Statistiche regionali Lazio, edizioni 2017–2026). 2015 non disponibile.',
      data: {
        2008: -0.07, 2009: -2.64, 2010: -0.37, 2011: 1.76, 2012: -0.43, 2013: -4.14, 2014: -3.63,
        2016: -4.91, 2017: -3.24, 2018: -2.4, 2019: -2.6, 2020: -1.5, 2021: -0.5, 2022: 1.5, 2023: 0.7, 2024: 1.3, 2025: 3.4,
      },
    },
    // La revisione decennale delle zone OMI di Roma è del 2° sem. 2025: la serie è ricostruita a zone omogenee, nessun salto
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_RM.casalens],
      data: {
        '2016-1': 3099, '2016-2': 3052, '2017-1': 3004, '2017-2': 2985, '2018-1': 2941, '2018-2': 2913,
        '2019-1': 2866, '2019-2': 2838, '2020-1': 2817, '2020-2': 2798, '2021-1': 2794, '2021-2': 2814,
        '2022-1': 2835, '2022-2': 2861, '2023-1': 2865, '2023-2': 2861, '2024-1': 2884, '2024-2': 2914,
        '2025-1': 2970, '2025-2': 3032, '2026-1': 3098,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_RM.mef],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (imponibile / contribuenti).',
      data: { 2016: 24803, 2017: 24830, 2018: 25394, 2019: 25262, 2020: 24964, 2021: 25990, 2022: 27206, 2023: 28204, 2024: 29209 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6, 2024: 1.0 },
    },
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_RM.affittiSky],
      data: { 2020: 14.7, 2021: 13.9, 2022: 14.4, 2023: 15.0, 2024: 16.3, 2025: 18.2, 2026: 19.1 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per le altre città; le abitazioni compravendute a Roma sono più grandi (93,6 m² in media, OMI 2025).' },
    renditaCatastale: { value: 1100, why: 'Stima: un A/2 di classe 2 di 5 vani all’Appio Latino (semicentro) ha rendita 1.149 € (~230 €/vano, da una perizia del Tribunale). A Roma le tariffe d’estimo sono più alte che nelle altre città; un A/3 o una zona periferica ha una rendita più bassa. Verificare sulla visura catastale.', source: SRC_RM.perizia },
    mortgageRate: { value: 0.0349, why: 'Tasso iniziale medio dei mutui nel Lazio nel 2025 (OMI); dato regionale, non comunale.', source: SRC_RM.casalens },
    ral: { value: 35000, why: 'Stima: retribuzione media dei dipendenti privati in provincia di Roma 36.130 € (RGA, JobPricing 2025) senza la parte variabile, con il rapporto RAL/RGA del Lazio (34.200/35.222 €). È una media: l’imponibile medio dichiarato a Roma è 29.209 € (2024, pensionati inclusi), il mediano ~24.100 €.', source: SRC_RM.jobpricing },
    houseGrowth: { from: 'omiCagr', why: 'Crescita media annua del prezzo OMI 2016–2026: circa zero (3.099 → 3.098 €/m²), perché il decennio comprende la coda del calo iniziato nel 2008 (fino al 2021). Dal 2021 +2,1% l’anno (Tecnocasa: +9,7% in 5 anni): valuta di alzarla all’1–2%.' },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2008–2025.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: a Roma forte momentum, con cali consecutivi dal 2012 al 2021 e rialzi dal 2022.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo OMI ~5,0%, più alto delle altre città); valore prudente.' },
    rentGrowth: { value: 0.03, why: 'Crescita dei canoni di mercato per nuovi contratti (1 punto sopra l’inflazione del 2%). Affitti richiesti +29,9% nel 2020–2026 (~4,5% l’anno), quasi tutto nel 2024–2025. Nel lungo periodo non possono crescere molto più dei redditi (+2,1% l’anno): 3% come compromesso.' },
    rentVol: { value: 0.03, why: 'Affitti richiesti molto variabili (da −5,4% nel 2021 a +11,7% nel 2025); serie troppo corta per stimarla.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio dichiarato 2016–2024.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
