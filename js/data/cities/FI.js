// Firenze: dati e fonti.
const SRC_FI = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/firenze' },
  srOmi: { name: 'Agenzia Entrate – OMI, Statistiche regionali Toscana 2026 (anno 2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_TOSCANA.pdf/afc7c5f8-e23a-8873-66c8-45d4a15801d0' },
  srOmiArchivio: { name: 'Agenzia Entrate – OMI, Statistiche regionali Toscana 2017–2025 (anni 2016–2024, archivio)', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/pubblicazioni/statistiche-regionali/archivio-statistiche-regionali' },
  notaOmi2014: { name: 'Agenzia Entrate – OMI, Nota territoriale Firenze II sem. 2014 (numero indice quotazioni dal 2004)', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/note_semestrali_2014/Firenze_Nota_Terr_II_sem_2014.pdf' },
  ance2015: { name: 'ANCE Toscana su dati OMI, Il mercato immobiliare residenziale nel 2015 (prezzi capoluoghi 2015/2014)', url: 'https://toscana.ance.it/wp-content/uploads/archivet/25238-RP160004%20%20MERCATO%20IMMOBILIARE%20RESIDENZIALE.pdf' },
  annunci: { name: 'La Nazione: Osservatorio Immobiliare.it Insights sul mercato toscano, 1° trim. 2026 (21 apr. 2026)', url: 'https://www.lanazione.it/arezzo/cronaca/immobili-in-toscana-nei-primi-tre-mesi-prosegue-la-crescita-di-prezzi-di-vendita-4-7-g8g35bha' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2026 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  tecnocasa: { name: 'QuiFinanza su dati Ufficio Studi Tecnocasa: Firenze +2,4% nel 2° sem. 2025 (mag. 2026)', url: 'https://quifinanza.it/mercato-immobiliare/comprare-casa-firenze-maggio-2026/991995/' },
  mef: { name: 'MEF – Dipartimento Finanze, redditi IRPEF su base comunale (open data, anni d’imposta 2016–2024, Comune di Firenze D612)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes' },
  jobpricing: { name: 'JobPricing, Geography Index 2026 (RAL/RGA 2025 per regione e provincia)', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  airmap: { name: 'AirMap Firenze, Politecnico di Torino – FULL (mag. 2026): Airbnb 2017–2024', url: 'https://full.polito.it/wp-content/uploads/2026/05/Airmap-Firenze-compressed.pdf' },
  bankitalia: { name: 'Banca d’Italia – IRPET, Turismo e mercato immobiliare (workshop, Firenze 20 mar. 2026)', url: 'https://www.irpet.it/wp-content/uploads/2026/02/Turismo-e-mercato-immobiliare.pdf' },
  unifi: { name: 'Università di Firenze, elenco immobili di proprietà con dati catastali (mag. 2024)', url: 'https://amministrazionetrasparente.unifi.it/upload/sub/personale/trasparenza/beni_immobiliari_gestione_patrimonio/proprieta_2024.pdf' },
  addizionali: { name: 'TuttoCalcolato: addizionali IRPEF Firenze 2026 (dati MEF)', url: 'https://tuttocalcolato.it/calcolo/irpef/firenze/' },
};

CITIES.FI = {
  name: 'Firenze',
  region: 'Toscana',
  color: 2,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[15000, 0.0142], [28000, 0.0143], [50000, 0.0332], [Infinity, 0.0333]],
    municipalRate: 0.002,         // 0,2%: delibera n. 47/2014, invariata nel 2026
    municipalExemption: 25000,    // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_FI.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, 1° trim. 2026)',
      pricePerSqm: 4733,
      rentPerSqmMonth: 20.8,
      note: 'Prezzi richiesti (+6,3% su un anno, affitti −2,6% con l’offerta in affitto quasi raddoppiata). La trattativa abbassa il prezzo d’acquisto; per un nuovo contratto d’affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_FI.annunci,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 3130,
      rentPerSqmMonth: 10.7,
      note: 'Valori medi delle 33 zone OMI (da 1.950 a 5.600 €/m²; canoni da 7,8 a 14,0 €/m²/mese). Includono canoni concordati e vecchi contratti: sottostimano il costo di un nuovo affitto, che negli annunci è quasi il doppio.',
      source: SRC_FI.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '4.643 (−3,8%, in calo dal 2023)', SRC_FI.srOmi],
    ['Valore medio per abitazione venduta 2025', '~283.700 € (98,8 m² medi)', SRC_FI.casalens],
    ['Acquisti con mutuo (persone fisiche)', '54,1%', SRC_FI.casalens],
    ['Mutuo medio 2025', '210.300 € al 3,34% iniziale medio (Toscana)', SRC_FI.casalens],
    ['Rendimento lordo da affitto (OMI)', '~4,1% (3,4%–5,1% per zona)', SRC_FI.casalens],
    ['Reddito imponibile medio per contribuente (2024)', '28.177 €', SRC_FI.mef],
    ['Affitti richiesti 2020 → 2026 (immobiliare.it)', '15,7 → 21,7 €/m² (+38,1%)', SRC_FI.affittiSky],
    ['Contratti transitori 2025 (OMI)', '7.712 abitazioni, l’8,9% dello stock: record tra le grandi città', SRC_FI.casalens],
    ['Alloggi Airbnb attivi (2024)', '17.559, l’82,6% interi appartamenti (+13% dal 2017)', SRC_FI.airmap],
    ['Affitti brevi (Banca d’Italia)', 'prima città italiana per Airbnb su abitazioni; quasi metà delle case non occupate da residenti è su Airbnb', SRC_FI.bankitalia],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_FI.notaOmi2014, SRC_FI.ance2015, SRC_FI.srOmiArchivio, SRC_FI.srOmi],
      note: '2008–2014: numero indice OMI delle quotazioni del capoluogo, 2° semestre su 2° semestre (letto dal grafico della Nota territoriale 2014, verificato sulla tabella: −1,3% nel 2° sem. 2014). 2015: OMI via ANCE Toscana (media annua). 2016–2025: variazione annua della quotazione media OMI del capoluogo (Statistiche regionali Toscana; dal 2024 a parità di zone dopo la revisione decennale). Le quotazioni OMI oscillano meno dei prezzi di agenzia: Tecnocasa indicava +3,4% nel 2019, OMI +0,5%.',
      data: {
        2008: 0.44, 2009: -0.44, 2010: -0.66, 2011: -1.18, 2012: -1.86, 2013: -2.95, 2014: -2.65, 2015: -2.5,
        2016: -2.25, 2017: -3.1, 2018: -0.38, 2019: 0.5, 2020: -0.4, 2021: 0.3, 2022: 0.5, 2023: 0.6, 2024: 1.1, 2025: 2.1,
      },
    },
    // Il salto 2024-1 → 2024-2 (+3,6%) coincide con la revisione decennale delle zone OMI: a parità di zone l'Agenzia indica +1,1% nel 2024
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_FI.casalens],
      data: {
        '2016-1': 2773, '2016-2': 2727, '2017-1': 2686, '2017-2': 2665, '2018-1': 2660, '2018-2': 2663,
        '2019-1': 2675, '2019-2': 2683, '2020-1': 2686, '2020-2': 2677, '2021-1': 2692, '2021-2': 2716,
        '2022-1': 2727, '2022-2': 2725, '2023-1': 2745, '2023-2': 2767, '2024-1': 2778, '2024-2': 2877,
        '2025-1': 2949, '2025-2': 3003, '2026-1': 3130,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_FI.mef],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (imponibile / contribuenti).',
      data: { 2016: 24001, 2017: 23959, 2018: 24547, 2019: 24444, 2020: 23666, 2021: 24769, 2022: 26133, 2023: 27206, 2024: 28177 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6, 2024: 1.0 },
    },
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_FI.affittiSky],
      data: { 2020: 15.7, 2021: 14.7, 2022: 15.9, 2023: 17.9, 2024: 20.2, 2025: 21.3, 2026: 21.7 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per le altre città; la fascia 50–85 m² è la più compravenduta a Firenze (1.617 abitazioni nel 2025, 35% del totale).' },
    renditaCatastale: { value: 750, why: 'Stima: un A/2 di classe 3 e 5 vani in via della Rovere (Rifredi) ha rendita 735,95 €; un A/3 di classe 3 in via Brunetto Latini ~150 €/vano (599 € per 4 vani). In centro un A/2 supera i 200 €/vano (>1.000 € per 5 vani). Verificare sulla visura catastale.', source: SRC_FI.unifi },
    mortgageRate: { value: 0.0334, why: 'Tasso iniziale medio dei mutui in Toscana nel 2025 (OMI); dato regionale, non comunale.', source: SRC_FI.casalens },
    ral: { value: 33500, why: 'Stima: retribuzione globale media in provincia di Firenze 34.112 € (JobPricing, 2025) riportata alla sola parte fissa con il rapporto RAL/RGA della Toscana (31.931 / 32.515 €). È una media dei dipendenti privati: l’imponibile medio dichiarato a Firenze è più basso (28.177 € nel 2024, pensionati inclusi).', source: SRC_FI.jobpricing },
    houseGrowth: { value: 0.015, why: 'Il prezzo medio OMI 2016–2026 cresce dell’1,2% l’anno, gonfiato dalla revisione delle zone 2024 (+3,6% in un semestre contro +1,1% a parità di zone); senza il salto ~1%. A parità di zone le quotazioni erano ferme o in calo fino al 2020 e accelerano ora (+1,1% nel 2024, +2,1% nel 2025, +4,2% nel 1° sem. 2026; Tecnocasa +2,4% nel 2° sem. 2025). 1,5% come valore intermedio.', source: SRC_FI.srOmi },
    houseVol: { value: 0.015, why: 'Le quotazioni OMI di Firenze si muovono pochissimo: calibrata sulla serie storica la volatilità sarebbe ~0,5%, poco credibile (le quotazioni OMI oscillano meno dei prezzi reali; Tecnocasa +3,4% nel 2019 contro OMI +0,5%). Fissata all’1,5%, vicino a Roma e Verona.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: cali consecutivi dal 2009 al 2017, rialzi consecutivi dal 2021 al 2025.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo OMI ~4,1%); valore prudente.' },
    rentGrowth: { value: 0.03, why: 'Crescita dei canoni di mercato per nuovi contratti (1 punto sopra l’inflazione del 2%). Affitti richiesti +38,1% nel 2020–2026 (~5,5% l’anno), spinti da affitti brevi e contratti transitori, ma +1,9% nell’ultimo anno e −2,6% nel 1° trim. 2026 con l’offerta in affitto quasi raddoppiata. Nel lungo periodo non possono crescere molto più dei redditi (+2,0% l’anno): 3% come compromesso.' },
    rentVol: { value: 0.03, why: 'Affitti richiesti molto variabili (da −6,4% a +12,8% annuo); serie troppo corta per stimarla.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio dichiarato 2016–2024.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
