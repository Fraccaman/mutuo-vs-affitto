// Palermo: dati e fonti.
const SRC_PA = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/palermo' },
  srOmi: { name: 'Agenzia Entrate – OMI, Statistiche regionali Sicilia 2026 (anno 2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_SICILIA.pdf/b575aaaa-07ba-80e7-8782-336c625400c8' },
  srOmiArchivio: { name: 'Agenzia Entrate – OMI, archivio Statistiche regionali Sicilia 2017–2025 (anni 2016–2024)', url: 'https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi/pubblicazioni/statistiche-regionali/archivio-statistiche-regionali' },
  tecnocasa0714: { name: 'Infobuild su dati Tecnocasa: prezzi Palermo, variazioni annue 2007–2014 (giu. 2015)', url: 'https://www.infobuild.it/in-contrazione-i-prezzi-delle-case-nelle-grandi-citta/' },
  tecnocasa2015: { name: 'Infobuild su dati Tecnocasa: Palermo −2,3% nel 1° sem. 2015, −37,4% dall’inizio del calo (nov. 2015)', url: 'https://www.infobuild.it/il-mattone-dal-2007-al-2015/' },
  tecnocasaPeak: { name: 'idealista/news su dati Tecnocasa: Palermo −38,2% dal 1° sem. 2007 al 2° sem. 2015 (giu. 2016)', url: 'https://www.idealista.it/news/finanza/economia/2016/06/29/120285-tecnocasa-dal-2007-al-2015-in-italia-prezzi-giu-quasi-del-40-lanalisi-delle-grandi-citta' },
  mef: { name: 'MEF – Dipartimento Finanze, open data IRPEF su base comunale, anni d’imposta 2016–2024 (Comune di Palermo, G273)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes' },
  annunci: { name: 'La Sicilia: Immobiliare.it Insights, Market Monitor Palermo 1° sem. 2026 (9 set. 2026)', url: 'https://www.lasicilia.it/news/economia/3072003/mattone-in-sicilia-palermo-spinge-sull-acceleratore-catania-frena-tra-stasi-dei-prezzi-e-calo-dei-volumi.html' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2026 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  airmap: { name: 'FULL – Politecnico di Torino, AirMap Palermo: Airbnb 2017–2024 (mag. 2026)', url: 'https://full.polito.it/wp-content/uploads/2026/05/Airmap-Palermo-compressed.pdf' },
  addizionali: { name: 'MEF – Dipartimento Finanze, aliquote addizionale comunale IRPEF 2026 (Palermo: delibera n. 137 del 15/04/2026, 1,03%, nessuna esenzione)', url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/download.php?anno=2026' },
  jobpricing: { name: 'JobPricing, Geography Index 2026 (RAL/RGA 2025 per regione e provincia)', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  perizia: { name: 'Tribunale di Palermo, perizia R.G.E. 541/2010: A/2 cl. 7, 5,5 vani, via Malaspina, rendita 781,14 €', url: 'https://www.astegiudiziarie.it/allegato/Perizia-PA-EI-541-2010-C-3.pdf/2253692' },
};

CITIES.PA = {
  name: 'Palermo',
  region: 'Sicilia',
  color: 5,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[Infinity, 0.0123]],   // aliquota unica 1,23% (Regione Siciliana, anno d'imposta 2026)
    municipalRate: 0.0103,            // 1,03%: confermata nel 2026, evitato l'aumento all'1,404% chiesto dal Patto per Palermo
    municipalExemption: 0,            // nessuna soglia di esenzione
    source: SRC_PA.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, 1° sem. 2026)',
      pricePerSqm: 1565,
      rentPerSqmMonth: 9.7,
      note: 'Prezzi richiesti (+3,8% su un anno, affitti +6,2%). La trattativa abbassa il prezzo d’acquisto; per un nuovo affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_PA.annunci,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 1377,
      rentPerSqmMonth: 4.6,
      note: 'Valori medi delle 49 zone OMI (da 750 a 2.950 €/m²; canoni da 3,0 a 9,0 €/m²/mese). Includono canoni concordati e vecchi contratti: sottostimano il costo di un nuovo affitto, che negli annunci è più del doppio.',
      source: SRC_PA.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '7.140 (+9,4%)', SRC_PA.srOmi],
    ['Valore medio per abitazione venduta 2025', '~132.800 € (107,8 m² medi)', SRC_PA.casalens],
    ['Acquisti con mutuo (persone fisiche)', '44,8%', SRC_PA.casalens],
    ['Mutuo medio 2025', '135.900 € al 3,43% iniziale medio (Sicilia)', SRC_PA.casalens],
    ['Rendimento lordo da affitto (OMI)', '~3,9% (3,0%–6,4% per zona)', SRC_PA.casalens],
    ['Reddito imponibile medio per contribuente (2024)', '22.543 €', SRC_PA.mef],
    ['Reddito complessivo mediano (2024, stima per interpolazione sulle classi MEF)', '~19.600 €', SRC_PA.mef],
    ['Affitti richiesti 2020 → 2026', '7,1 → 9,7 €/m² (+35,8%)', SRC_PA.affittiSky],
    ['Affitti brevi su Airbnb (2024)', '10.493 alloggi, +52,2% dal 2017; 75,6% case intere, concentrati nel centro storico', SRC_PA.airmap],
    ['Prezzi dal 2007 al 2015 (Tecnocasa)', '−38,2%', SRC_PA.tecnocasaPeak],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_PA.tecnocasa0714, SRC_PA.tecnocasa2015, SRC_PA.tecnocasaPeak, SRC_PA.srOmiArchivio, SRC_PA.srOmi],
      note: '2008–2014: Tecnocasa via Infobuild (fonte secondaria). 2015: stima da dati Tecnocasa (−2,3% nel 1° semestre; perdita dal 2007 da −37,4% a −38,2% nel 2° semestre, quindi ~−1,3%). 2016–2025: variazione annua della quotazione media OMI del capoluogo (Statistiche regionali Sicilia). Cambio di fonte nel 2016: Tecnocasa (prezzi delle agenzie) oscilla più di OMI.',
      data: {
        2008: -7.1, 2009: -4.0, 2010: -2.7, 2011: -7.1, 2012: -9.9, 2013: -8.3, 2014: -4.5, 2015: -3.6,
        2016: -3.58, 2017: -1.2, 2018: -2.55, 2019: -0.7, 2020: -3.8, 2021: -0.3, 2022: 1.3, 2023: 3.6, 2024: 0.5, 2025: 1.3,
      },
    },
    // Nessun salto nel 2024-2: la revisione delle zone OMI non distorce la serie di Palermo
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_PA.casalens],
      data: {
        '2016-1': 1360, '2016-2': 1356, '2017-1': 1356, '2017-2': 1333, '2018-1': 1310, '2018-2': 1317,
        '2019-1': 1317, '2019-2': 1299, '2020-1': 1261, '2020-2': 1257, '2021-1': 1254, '2021-2': 1245,
        '2022-1': 1256, '2022-2': 1295, '2023-1': 1328, '2023-2': 1331, '2024-1': 1337, '2024-2': 1345,
        '2025-1': 1357, '2025-2': 1370, '2026-1': 1377,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_PA.mef],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (reddito imponibile / numero contribuenti).',
      data: { 2016: 19385, 2017: 19289, 2018: 19657, 2019: 19519, 2020: 19311, 2021: 19985, 2022: 20828, 2023: 21740, 2024: 22543 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6, 2024: 1.0 },
    },
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_PA.affittiSky],
      data: { 2020: 7.1, 2021: 7.1, 2022: 7.3, 2023: 7.9, 2024: 8.7, 2025: 9.3, 2026: 9.7 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per le altre città. A Palermo le case compravendute sono più grandi (107,8 m² medi nel 2025); la fascia 50–85 m² vale il 23% delle compravendite.' },
    renditaCatastale: { value: 700, why: 'Stima: 5 vani × ~140 €/vano, tariffa di un A/2 di classe 7 in zona semicentrale (via Malaspina, da una perizia del Tribunale). Le tariffe cambiano molto per zona censuaria: un A/2 in periferia può avere meno di 70 €/vano. Verificare sulla visura catastale.', source: SRC_PA.perizia },
    mortgageRate: { value: 0.0343, why: 'Tasso iniziale medio dei mutui in Sicilia nel 2025 (OMI); dato regionale, non comunale.', source: SRC_PA.casalens },
    ral: { value: 29400, why: 'RAL media in Sicilia nel 2025 (JobPricing); in provincia di Palermo la retribuzione globale media è più alta (31.399 €, variabile inclusa). Il campione pesa verso i dipendenti a tempo pieno: l’imponibile medio dichiarato a Palermo è più basso (22.543 € nel 2024, pensionati inclusi).', source: SRC_PA.jobpricing },
    houseGrowth: { from: 'omiCagr', why: 'Crescita media annua del prezzo OMI 2016–2026: quasi nulla (~0,1% l’anno), somma di un calo fino al 2021 e di una ripresa del ~2,3% l’anno dal 2° semestre 2021. Nessuna distorsione dalla revisione delle zone 2024. Valore prudente: gli annunci crescono più in fretta (+3,8% nell’ultimo anno).' },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2008–2025.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: a Palermo i prezzi sono scesi per 14 anni di fila (2008–2021), poi quattro anni di rialzi.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo OMI ~3,9%, ma ~7% sui valori degli annunci); valore prudente.' },
    rentGrowth: { value: 0.03, why: 'Crescita dei canoni di mercato per nuovi contratti (1 punto sopra l’inflazione del 2%). Affitti richiesti +35,8% nel 2020–2026 (~5,3% l’anno), spinti dagli affitti brevi e da un’offerta scarsa; nel 2026 l’offerta in affitto cresce di oltre il 20%. Nel lungo periodo non possono crescere molto più dei redditi (+1,9% l’anno): 3% come compromesso.' },
    rentVol: { value: 0.03, why: 'Affitti richiesti variabili (da 0% a +10% annuo nel 2020–2026); serie troppo corta per stimarla.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio dichiarato 2016–2024.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
