// Verona: dati e fonti.
const SRC_VR = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/verona' },
  srOmi: { name: 'Agenzia Entrate – OMI, Statistiche regionali Veneto 2026 (anno 2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_VENETO.pdf/b9d7b4cb-c99d-7191-ca20-902b5540bbc9' },
  srOmiArchivio: { name: 'Agenzia Entrate – OMI, archivio Statistiche regionali Veneto 2018–2025 (anni 2017–2024)', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi/pubblicazioni/statistiche-regionali/archivio-statistiche-regionali' },
  srOmi2017: { name: 'Agenzia Entrate – OMI, Statistiche regionali Veneto 2017 (anno 2016)', url: 'https://www1.agenziaentrate.gov.it/mt/osservatorio/statistiche-regionali/SR_2017_veneto.pdf' },
  riOmi: { name: 'Agenzia Entrate – OMI, Rapporto Immobiliare 2026 residenziale (mutui per regione, 2025)', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/263076/RI2026_Residenziale20260521.pdf/892125df-86a3-c21a-f8a1-86323f45ae93' },
  tecnocasa1318: { name: 'Gruppo Tecnocasa, Speciale mercato immobiliare Verona: trend prezzi 2013–2018 (apr. 2019)', url: 'https://news.tecnocasagroup.it/ufficio-stampa/comunicati-stampa/mercato-immobiliare-locale/speciale-mercato-immobiliare-verona/' },
  tecnocasaIndice: { name: 'Verona Economia su dati Tecnocasa: indice prezzi Verona 2011 = 100, minimo 75,2 nel 2015 (giu. 2022)', url: 'https://veronaeconomia.it/2022/06/06/leggi-notizia/argomenti/economia/come-cambiato-il-mercato-immobiliare-in-10-anni-a-verona-trend-in-ripresa.html' },
  tecnocasa10: { name: 'idealista/news su dati Tecnocasa: Verona +38,0% nel 2016–2026, 1° sem. 2026 +4,9% (8 ott. 2026)', url: 'https://www.idealista.it/news/node/473329' },
  immobiliare: { name: 'Immobiliare.it, mercato immobiliare: Verona (ott. 2026, serie mensile dal 2018)', url: 'https://www.immobiliare.it/mercato-immobiliare/veneto/verona/' },
  nomisma: { name: 'VeronaSera: Nomisma, 1° Osservatorio Immobiliare 2026 (2 apr. 2026)', url: 'https://www.veronasera.it/economia/nomisma-mercato-immobiliare.html' },
  mef: { name: 'MEF – Dipartimento Finanze, open data IRPEF su base comunale, anni d’imposta 2016–2024 (Comune di Verona, L781)', url: 'https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes' },
  jobpricing: { name: 'JobPricing, Geography Index 2026 (RAL/RGA 2025 per regione e provincia)', url: 'https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf' },
  perizia: { name: 'Perizia di stima, Tribunale di Verona: A/3 cl. 3, 6,5 vani, z.c. 3, Via Valeggio, rendita 604,25 €', url: 'https://www.venditepubblichenotarili.notariato.it/allegati/gav/24806/perizia678.pdf' },
  addizionali: { name: 'TuttoCalcolato: addizionali IRPEF Verona 2026 (dati MEF, delibera n. 9/2023)', url: 'https://tuttocalcolato.it/calcolo/irpef/verona/' },
};

CITIES.VR = {
  name: 'Verona',
  region: 'Veneto',
  color: 7,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[Infinity, 0.0123]],   // aliquota unica di base, nessuna maggiorazione regionale
    municipalRate: 0.008,
    municipalExemption: 12000,        // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_VR.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, ott. 2026)',
      pricePerSqm: 2933,
      rentPerSqmMonth: 12.32,
      note: 'Prezzi richiesti (+5,9% in un anno, affitti +0,5%): la trattativa abbassa il prezzo d’acquisto; per un nuovo contratto d’affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_VR.immobiliare,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 2173,
      rentPerSqmMonth: 9.9,
      note: 'Valori medi delle 15 zone OMI residenziali (da 950 a 4.700 €/m²; canoni da 7 a 15,5 €/m²/mese, media di 13 zone). Includono canoni concordati e vecchi contratti: sottostimano il costo di un nuovo affitto.',
      source: SRC_VR.casalens,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '3.723 (+7,7%), 105 m² in media', SRC_VR.srOmi],
    ['Nuovi contratti d’affitto 2025', '8.917 (+7,0%), metà a canone concordato di lungo periodo', SRC_VR.srOmi],
    ['Acquisti con mutuo (persone fisiche, Veneto)', '50,9%', SRC_VR.riOmi],
    ['Mutuo medio 2025 (Veneto)', '138.800 € al 3,23% iniziale medio, 25,4 anni', SRC_VR.riOmi],
    ['Rendimento lordo da affitto (OMI)', '~5,1% (4,2%–6,7% per zona)', SRC_VR.casalens],
    ['Reddito imponibile medio per contribuente (2024)', '27.188 €', SRC_VR.mef],
    ['Reddito complessivo mediano (2024, stima per interpolazione sulle classi MEF)', '~23.700 €', SRC_VR.mef],
    ['Affitti richiesti 2020 → 2026 (immobiliare.it, medie annue)', '10,6 → 12,35 €/m² (+17%)', SRC_VR.immobiliare],
    ['Canoni (Nomisma)', '+4,6% nell’ultimo anno, +17% sul 2022', SRC_VR.nomisma],
    ['Prezzi 2016 → 2026 (Tecnocasa)', '+38,0%, terza tra le grandi città dopo Milano e Bologna', SRC_VR.tecnocasa10],
  ],
  history: {
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_VR.tecnocasaIndice, SRC_VR.tecnocasa1318, SRC_VR.srOmi2017, SRC_VR.srOmiArchivio, SRC_VR.srOmi],
      note: '2012: stima derivata da Tecnocasa (indice 2011 = 100, minimo 75,2 nel 2015, diviso per le variazioni 2013–2015). 2013–2015: Tecnocasa (prezzi delle agenzie). 2016–2025: variazione annua della quotazione media OMI del capoluogo (Statistiche regionali Veneto, edizioni 2017–2026). Cambio di fonte nel 2016 (Tecnocasa +1,1%, OMI −1,3%). 2008–2011 non disponibili. Il rialzo 2024–2025 (+8,3%, +10,1%) è il più forte del Veneto.',
      data: {
        2012: -8.2, 2013: -10.5, 2014: -5.6, 2015: -3.0,
        2016: -1.33, 2017: -1.40, 2018: 0.20, 2019: -0.8, 2020: -1.1, 2021: 1.7, 2022: 1.9, 2023: 3.3, 2024: 8.3, 2025: 10.1,
      },
    },
    // Revisione decennale delle zone OMI nel 2024 anche a Verona (zone ridisegnate), ma nessun salto nella serie: +3,6% nel 2° sem. 2024, in linea con i semestri vicini
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_VR.casalens],
      data: {
        '2016-1': 1615, '2016-2': 1592, '2017-1': 1558, '2017-2': 1550, '2018-1': 1578, '2018-2': 1603,
        '2019-1': 1573, '2019-2': 1579, '2020-1': 1577, '2020-2': 1617, '2021-1': 1646, '2021-2': 1671,
        '2022-1': 1710, '2022-2': 1715, '2023-1': 1754, '2023-2': 1817, '2024-1': 1865, '2024-2': 1933,
        '2025-1': 2002, '2025-2': 2083, '2026-1': 2173,
      },
    },
    medianIncome: {
      label: 'Reddito imponibile medio per contribuente €',
      unit: '€',
      source: [SRC_VR.mef],
      note: 'Media: il MEF non pubblica la mediana per comune. Calcolata dagli open data MEF (imponibile / numero contribuenti).',
      data: { 2016: 23255, 2017: 23186, 2018: 23666, 2019: 23755, 2020: 23385, 2021: 24330, 2022: 25339, 2023: 26270, 2024: 27188 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6, 2024: 1.0 },
    },
    // Medie annue dei valori mensili del grafico immobiliare.it (2026: gen.–ott.)
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_VR.immobiliare],
      data: { 2019: 10.41, 2020: 10.58, 2021: 10.12, 2022: 10.45, 2023: 10.96, 2024: 11.56, 2025: 12.16, 2026: 12.35 },
    },
  },
  params: {
    sqm: { value: 70, why: 'Stesso taglio usato per le altre città; la fascia 50–85 m² è tra le più compravendute (la superficie media venduta a Verona è 105 m²).' },
    renditaCatastale: { value: 650, why: 'Stima: un A/3 di classe 3 in zona censuaria 3 vale ~93 €/vano (perizia del Tribunale), cioè ~465 € per 5 vani; un A/2 semicentrale di classe 3–4 sta intorno a 130–150 €/vano, cioè 650–760 €. Verificare sulla visura catastale.', source: SRC_VR.perizia },
    mortgageRate: { value: 0.0323, why: 'Tasso iniziale medio dei mutui in Veneto nel 2025 (OMI), 0,25 punti sotto il 2024; dato regionale, non comunale.', source: SRC_VR.riOmi },
    ral: { value: 33100, why: 'RAL media in Veneto nel 2025 (JobPricing); la retribuzione globale media in provincia di Verona è 33.635 €. Il campione pesa verso i dipendenti a tempo pieno: l’imponibile medio dichiarato a Verona è più basso (27.188 € nel 2024, pensionati inclusi).', source: SRC_VR.jobpricing },
    houseGrowth: { from: 'omiCagr', why: 'Crescita media annua del prezzo OMI 2016–2026 (~3%). Quasi tutta concentrata nel 2023–2026 (+20% in tre anni); fino al 2022 i prezzi crescevano meno dell’1% l’anno. Tecnocasa stima +38% in 10 anni (~3,3% l’anno). Boom difficilmente ripetibile: valuta di abbassarla.' },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2012–2025.' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: cali consecutivi nel 2012–2017, rialzi consecutivi e crescenti nel 2021–2025.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo OMI ~5,1%); valore prudente.' },
    rentGrowth: { value: 0.025, why: 'Crescita dei canoni di mercato per nuovi contratti: affitti richiesti +2,6% l’anno nel 2020–2026 (immobiliare.it), +5% l’anno nel 2023–2025 ma quasi fermi nell’ultimo anno (+0,5%); Nomisma +17% dal 2022. Nel lungo periodo non possono crescere molto più dei redditi (+2,0% l’anno).' },
    rentVol: { value: 0.03, why: 'Affitti richiesti variabili (da −4,3% nel 2021 a +5,5% nel 2024); serie corta, valore stimato.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito imponibile medio dichiarato 2016–2024.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito medio (al netto dell’inflazione NIC).' },
  },
};
