// Napoli: dati e fonti.

const SRC_NA = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/napoli' },
  srOmi: { name: 'Agenzia Entrate – OMI, Statistiche regionali Campania 2017–2026 (anni 2016–2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_CAMPANIA.pdf/d2bba606-78d0-5edf-aec4-88315668479d' },
  srOmi2020: { name: 'Agenzia Entrate – OMI, Statistiche regionali Campania 2020 (anno 2019)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/2555996/SR2020_Campania.pdf/c963ac68-8fdd-0bd8-dc68-ba0004e450c8' },
  notaOmi2014: { name: 'Agenzia Entrate – OMI, Nota territoriale Napoli II sem. 2014 (numero indice quotazioni dal 2004)', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/note_semestrali_2014/Napoli_Nota_Terr_II_sem_2014.pdf' },
  notaOmi2011: { name: 'Agenzia Entrate – OMI, Nota territoriale Napoli II sem. 2011', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/Napoli_Nota_Territoriale_II_sem2011_5luglio2012.pdf' },
  mef: { name: 'MEF – Dipartimento Finanze, redditi IRPEF su base comunale (open data, anni d’imposta 2016–2024)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/v_4_0_0/contenuti/Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_2023.zip' },
  immobiliare: { name: 'Immobiliare.it, mercato immobiliare: Napoli (ott. 2026)', url: 'https://www.immobiliare.it/en/mercato-immobiliare/' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2026 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  tecnocasa: { name: 'Ufficio Studi Gruppo Tecnocasa, “La rivalutazione degli immobili nel tempo” (set. 2026)', url: 'https://cdn-tecnocasagroup.medialabtc.it/it/sites/2/2026/09/La-rivalutazione-degli-immobili-nel-tempo-Gruppo-Tecnocasa.pdf' },
  affittiBrevi: { name: 'Il Post: Napoli e gli affitti brevi (Inside Airbnb, giu. 2025)', url: 'https://www.ilpost.it/2025/06/30/napoli-limitazioni-affitti-brevi/' },
  addizionali: { name: 'TuttoCalcolato: addizionali IRPEF Napoli 2026', url: 'https://tuttocalcolato.it/calcolo/irpef/napoli/' },
  jobpricing: { name: 'JobPricing, Geography Index 2026 (RAL/RGA 2025 per regione e provincia)', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  perizia: { name: 'Tribunale di Napoli, perizia: A/2 cl. 6, 7,5 vani, Via San Domenico (Vomero), rendita 1.200,76 €', url: 'https://www.garavirtuale.it/media/213/4286647/14820793_perizia.pdf' },
};

CITIES.NA = {
  name: 'Napoli',
  region: 'Campania',
  color: 4,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[15000, 0.0173], [28000, 0.0296], [50000, 0.032], [Infinity, 0.0333]],   // include la maggiorazione del piano di rientro sanitario
    municipalRate: 0.01,         // 1% dopo il Patto per Napoli
    municipalExemption: 12000,   // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_NA.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, ott. 2026)',
      pricePerSqm: 3044,
      rentPerSqmMonth: 15.77,
      note: 'Prezzi richiesti (+1,2% e affitti +8,2% in un anno). La trattativa abbassa il prezzo d’acquisto; per un nuovo affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_NA.immobiliare,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 2403,
      rentPerSqmMonth: 8.0,
      note: 'Valori medi delle 61 zone OMI (da 1.050 a 5.900 €/m²; canoni da 4,8 a 14,1 €/m²/mese). Includono canoni concordati e vecchi contratti: sottostimano il costo di un nuovo affitto, che negli annunci è quasi il doppio.',
      source: SRC_NA.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '8.031 (+3,0%)', SRC_NA.casalens],
    ['Valore medio per abitazione venduta 2025', '~200.500 € (95 m² medi)', SRC_NA.casalens],
    ['Acquisti con mutuo (persone fisiche)', '44,7%', SRC_NA.casalens],
    ['Mutuo medio 2025', '172.000 € al 3,83% iniziale medio', SRC_NA.casalens],
    ['Rendimento lordo da affitto (OMI)', '~4,3% (3,5%–4,3% per zona)', SRC_NA.casalens],
    ['Reddito imponibile medio per contribuente (2023)', '23.564 €', SRC_NA.mef],
    ['Reddito complessivo mediano (2023, stima per interpolazione sulle classi MEF)', '~18.000 €', SRC_NA.mef],
    ['Affitti richiesti 2020 → 2026', '12,2 → 15,3 €/m² (+25,5%)', SRC_NA.affittiSky],
    ['Affitti brevi (Inside Airbnb, 2025)', 'oltre 10.000, +800% in 9 anni, 90% nel centro storico', SRC_NA.affittiBrevi],
    ['Prezzi rispetto a 20 anni fa (Tecnocasa)', '−32,4% (ma +17,1% negli ultimi 10 anni)', SRC_NA.tecnocasa],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_NA.notaOmi2014, SRC_NA.notaOmi2011, SRC_NA.srOmi, SRC_NA.srOmi2020],
      note: '2008–2014: numero indice OMI delle quotazioni, 2° semestre su 2° semestre (letto dal grafico della Nota territoriale 2014, verificato sulle tabelle 2011 e 2014). 2016–2025: variazione annua della quotazione media OMI (Statistiche regionali Campania). 2015 non disponibile.',
      data: {
        2008: 1.47, 2009: -1.37, 2010: -0.08, 2011: -2.01, 2012: -2.92, 2013: -5.94, 2014: 3.2,
        2016: -2.4, 2017: -0.71, 2018: -0.1, 2019: -0.3, 2020: -4.6, 2021: 1.4, 2022: 1.6, 2023: 2.1, 2024: 0.9, 2025: 0.1,
      },
    },
    // Il salto 2024-1 → 2024-2 (+13%) è la revisione decennale delle zone OMI: a parità di zone l'Agenzia indica +0,9% nel 2024
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_NA.casalens],
      data: {
        '2016-1': 2104, '2016-2': 2083, '2017-1': 2076, '2017-2': 2077, '2018-1': 2074, '2018-2': 2061,
        '2019-1': 2052, '2019-2': 2053, '2020-1': 1946, '2020-2': 1960, '2021-1': 1961, '2021-2': 1972,
        '2022-1': 1990, '2022-2': 2008, '2023-1': 2037, '2023-2': 2066, '2024-1': 2086, '2024-2': 2359,
        '2025-1': 2364, '2025-2': 2377, '2026-1': 2403,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_NA.mef],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (imponibile / contribuenti).',
      data: { 2016: 20643, 2017: 20737, 2018: 21029, 2019: 21040, 2020: 20902, 2021: 21749, 2022: 22780, 2023: 23564 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6 },
    },
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_NA.affittiSky],
      data: { 2020: 12.2, 2021: 11.8, 2022: 12.0, 2023: 12.6, 2024: 14.3, 2025: 14.5, 2026: 15.3 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per le altre città; la fascia 50–85 m² è la più compravenduta a Napoli (29% nel 2025).' },
    renditaCatastale: { value: 800, why: 'Stima: 5 vani × ~160 €/vano, tariffa di un A/2 di classe 6 al Vomero (da una perizia del Tribunale). Un A/3 o una zona periferica ha una rendita più bassa. Verificare sulla visura catastale.', source: SRC_NA.perizia },
    mortgageRate: { value: 0.0383, why: 'Tasso iniziale medio dei mutui a Napoli nel 2025 (OMI), 0,88 punti sotto il 2024.', source: SRC_NA.casalens },
    ral: { value: 30300, why: 'RAL media in Campania nel 2025 (JobPricing). Il campione pesa verso i dipendenti a tempo pieno: l’imponibile medio dichiarato a Napoli è più basso (23.564 € nel 2023, pensionati inclusi).', source: SRC_NA.jobpricing },
    houseGrowth: { value: 0.01, why: 'Il prezzo medio OMI 2016–2026 cresce dell’1,3% l’anno solo per il salto della revisione delle zone 2024; a parità di zone è quasi fermo, mentre Tecnocasa stima +17,1% in 10 anni (~1,6% l’anno). 1% come valore intermedio.', source: SRC_NA.tecnocasa },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2008–2025.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: a Napoli è quasi nulla (anni positivi e negativi si alternano), a differenza di Bologna e Milano.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo OMI ~4,3%); valore prudente.' },
    rentGrowth: { value: 0.03, why: 'Crescita dei canoni di mercato per nuovi contratti (1 punto sopra l’inflazione del 2%). Affitti richiesti +25,5% nel 2020–2026 (~3,9% l’anno), quasi tutto nel 2024 e nel 2026, spinti dagli affitti brevi. Nel lungo periodo non possono crescere molto più dei redditi (+1,9% l’anno): 3% come compromesso.' },
    rentVol: { value: 0.03, why: 'Affitti richiesti molto variabili (da −3,3% a +13,5% annuo); serie troppo corta per stimarla.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio dichiarato 2016–2023.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
