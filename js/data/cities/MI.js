// Milano: dati e fonti.

const SRC_MI = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/milano' },
  annunci: { name: 'Moneta (Intesa Sanpaolo): Immobiliare.it Insights, Market Monitor Milano 1° sem. 2026 (8 set. 2026)', url: 'https://www.monetaweb.it/mutui-e-casa/a-milano-lieve-calo-degli-affitti-ma-i-prezzi-di-vendita-salgono-ancora/' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2026 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  affitti2018: { name: 'Il Giorno: canoni medi Milano da 17,4 a 23,3 €/m² (2018–2025, +34% nominale)', url: 'https://www.ilgiorno.it/milano/economia/airbnb-affitti-dati-inchiesta-m7ztutxe' },
  mef: { name: 'MEF – Dipartimento Finanze, open data IRPEF su base comunale, anni d’imposta 2016–2024 (Comune di Milano, F205)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes' },
  ilpost: { name: 'Il Post: redditi medi dei comuni, anno d’imposta 2024 (Milano 37.520 €)', url: 'https://www.ilpost.it/2026/04/27/comuni-redditi-alti-quali-sono-classifica-dati-grafici/' },
  tecnocasa0814: { name: 'Infobuild su dati Tecnocasa: prezzi Milano 2008–2013 (set. 2014)', url: 'https://www.infobuild.it/quotazioni-delle-abitazioni-milano-diminuite-3/' },
  tecnocasa1318: { name: 'Gruppo Tecnocasa, Speciale mercato immobiliare Milano: variazioni annue 2013–2018 (apr. 2019)', url: 'https://news.tecnocasagroup.it/ufficio-stampa/comunicati-stampa/mercato-immobiliare-locale/speciale-mercato-immobiliare-milano/' },
  nomismaPeak: { name: 'Nomisma, L’impatto della rigenerazione urbana sui prezzi delle abitazioni a Milano (nov. 2024)', url: 'https://www.nomisma.it/wp-content/uploads/2024/12/Paper-Impatto-rigenerazione-urbana-Milano_Nov2024.pdf' },
  jobpricing: { name: 'JobPricing, JP Geography Index (dati 2025): RGA media provincia di Milano 40.055 €', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  addizionali: { name: 'TuttoCalcolato: addizionali IRPEF Milano 2026 (dati MEF)', url: 'https://tuttocalcolato.it/calcolo/irpef/milano/' },
};

CITIES.MI = {
  name: 'Milano',
  region: 'Lombardia',
  color: 3,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[15000, 0.0123], [28000, 0.0158], [50000, 0.0172], [Infinity, 0.0173]],
    municipalRate: 0.008,
    municipalExemption: 23000, // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_MI.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, 1° sem. 2026)',
      pricePerSqm: 5675,
      rentPerSqmMonth: 22.3,
      note: 'Prezzi richiesti (+2,6% su un anno, affitti −0,9%): la trattativa abbassa il prezzo d’acquisto; per un nuovo contratto d’affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_MI.annunci,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 4953,
      rentPerSqmMonth: 16.4,
      note: 'Valori medi di compravendite e contratti in essere (inclusi canoni concordati e vecchi contratti): sottostimano il costo di un nuovo affitto. Forbice per zona molto ampia: 1.900–12.500 €/m².',
      source: SRC_MI.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '25.173 (+4,9%)', SRC_MI.casalens],
    ['Valore medio per abitazione venduta 2025', '439.700 €', SRC_MI.casalens],
    ['Acquisti con mutuo (persone fisiche)', '53,3%', SRC_MI.casalens],
    ['Mutuo medio 2025', '~256.300 € al 3,29% iniziale medio (Lombardia)', SRC_MI.casalens],
    ['Rendimento lordo da affitto (OMI)', '~4,0% (3,3%–5,2% per zona)', SRC_MI.casalens],
    ['Reddito imponibile medio per contribuente (2024)', '37.520 €', SRC_MI.mef],
    ['Reddito complessivo mediano (2024, stima per interpolazione sulle classi MEF)', '~25.900 €', SRC_MI.mef],
    ['Affitti richiesti 2020 → 2026 (immobiliare.it)', '19,7 → 22,3 €/m² (+13%)', SRC_MI.affittiSky],
    ['Affitti 2018 → 2025', '17,4 → 23,3 €/m² (+34% nominale)', SRC_MI.affitti2018],
    ['Prezzi reali rispetto al picco 2008 (Nomisma, 2024)', 'circa −10%', SRC_MI.nomismaPeak],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_MI.tecnocasa0814, SRC_MI.tecnocasa1318, SRC_MI.casalens],
      note: '2008–2012: Tecnocasa via Infobuild (fonte secondaria). 2013–2016: Tecnocasa. 2017–2025: OMI, 2° semestre su 2° semestre. Cambio di fonte nel 2017: Tecnocasa (prezzi delle agenzie) oscilla più di OMI.',
      data: {
        2008: -4.6, 2009: -2.1, 2010: -0.4, 2011: -2.3, 2012: -7.3,
        2013: -6.9, 2014: -5.5, 2015: -1.7, 2016: -0.1,
        2017: 0.36, 2018: 2.46, 2019: 2.31, 2020: -0.28, 2021: 4.06, 2022: 10.47, 2023: 9.10, 2024: 5.02, 2025: 4.52,
      },
    },
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_MI.casalens],
      data: {
        '2016-1': 3353, '2016-2': 3361, '2017-1': 3373, '2017-2': 3373, '2018-1': 3385, '2018-2': 3456,
        '2019-1': 3486, '2019-2': 3536, '2020-1': 3554, '2020-2': 3526, '2021-1': 3539, '2021-2': 3669,
        '2022-1': 3842, '2022-2': 4053, '2023-1': 4206, '2023-2': 4422, '2024-1': 4517, '2024-2': 4644,
        '2025-1': 4779, '2025-2': 4854, '2026-1': 4953,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_MI.mef, SRC_MI.ilpost],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (imponibile / contribuenti).',
      data: { 2016: 30737, 2017: 31279, 2018: 32382, 2019: 32330, 2020: 31778, 2021: 33703, 2022: 35282, 2023: 36408, 2024: 37520 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6, 2024: 1.0 },
    },
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_MI.affittiSky],
      data: { 2020: 19.7, 2021: 18.2, 2022: 20.1, 2023: 22.2, 2024: 22.4, 2025: 22.5, 2026: 22.3 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per Bologna; vicino alla superficie media dei contratti di locazione a Milano (68,6 m², OMI 2025).' },
    renditaCatastale: { value: 800, why: 'Stima per un A/3 di 5 vani in zona semicentrale (~160 €/vano da visure pubblicate). Un A/2 può superare i 1.000 €. Verificare sulla visura catastale.' },
    mortgageRate: { value: 0.0329, why: 'Tasso iniziale medio dei mutui in Lombardia nel 2025 (OMI); dato regionale, non comunale.', source: SRC_MI.casalens },
    ral: { value: 39000, why: 'Stima: retribuzione media dei dipendenti privati in provincia di Milano 40.055 € (JobPricing, 2025) senza la parte variabile. È una media trainata da quadri e dirigenti: la mediana del reddito complessivo è ~25.900 €.', source: SRC_MI.jobpricing },
    houseGrowth: { from: 'omiCagr', why: 'Crescita media annua del prezzo OMI 2016–2026. Comprende il boom 2021–2024 (Expo, rigenerazione urbana), difficilmente ripetibile: valuta di abbassarla.' },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2008–2025.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: cali consecutivi nel 2011–2014, rialzi consecutivi nel 2021–2025.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo ~4,0%, già basso); valore prudente.' },
    rentGrowth: { value: 0.025, why: 'Crescita dei canoni di mercato per nuovi contratti: +2,1% l’anno nel 2020–2026 (immobiliare.it), +4,3% nel 2018–2025, ma fermi o in calo nel 2024–2026. Nel lungo periodo non possono crescere molto più dei redditi (+2,5% l’anno).' },
    rentVol: { value: 0.03, why: 'Affitti volatili nel recente passato (−7,6% nel 2021, +10% nel 2022 e nel 2023, poi fermi); serie corta, valore stimato.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio 2016–2024. La media è spinta dai redditi alti: le retribuzioni dei dipendenti sono cresciute meno.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
