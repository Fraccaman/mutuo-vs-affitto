// Bologna: dati e fonti.

const SRC_BO = {
  casalens: { name: 'CasaLens su dati OMI – Agenzia delle Entrate (2026)', url: 'https://casalens.it/citta/bologna' },
  redditi: { name: 'Comune di Bologna, “I redditi dichiarati”, anno d’imposta 2023 (nov. 2025)', url: 'https://inumeridibolognametropolitana.it/sites/inumeridibolognametropolitana.it/files/economia/redditi/report_redditi.pdf' },
  nomisma2012: { name: 'Nomisma via BolognaToday, Speciale grandi città (contenuto sponsorizzato)', url: 'https://www.bolognatoday.it/economia/speciale-grandi-citta-mercato-immobiliare-bologna-1794115.html' },
  nomismaPeak: { name: 'Nomisma via il Resto del Carlino: prezzi ~25% sotto i massimi 2008', url: 'https://www.ilrestodelcarlino.it/bologna/economia/nomisma-casa-51e2d2e1' },
  affittiSky: { name: 'Sky TG24: affitti al m² nelle grandi città, 2020–2025 (immobiliare.it)', url: 'https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti' },
  affittiCna: { name: 'BolognaToday: CNA su dati Agenzia Entrate, 70 m² da 860 a 1.250 €/mese (2019–2025)', url: 'https://www.bolognatoday.it/casa/affitti-bologna-costo-case-stipendi-cna.html' },
  affittiNomisma: { name: 'Radio Bologna: Nomisma, affitti +34,1% 2018–2024', url: 'https://radiabo.it/bologna-e-dintorni/bologna-affitti-34-in-sei-anni-e-la-terza-grande-citta-italiana-per-rincari/' },
  realadvisor: { name: 'RealAdvisor, Bologna (ago. 2026)', url: 'https://realadvisor.it/it/mercato-immobiliare/comune-bologna-it' },
  addizionali: { name: 'TuttoCalcolato: addizionali IRPEF Bologna 2026', url: 'https://tuttocalcolato.it/calcolo/irpef/bologna/' },
  irpef: { name: 'InformazioneFiscale: scaglioni IRPEF 2026', url: 'https://www.informazionefiscale.it/IRPEF-scaglioni-aliquote-calcolo' },
};

CITIES.BO = {
  name: 'Bologna',
  region: 'Emilia-Romagna',
  color: 1,   // slot della palette --cat-N (css/base.css) nei grafici di confronto
  taxes: {
    regional: [[15000, 0.0133], [28000, 0.0193], [50000, 0.0278], [Infinity, 0.0333]],
    municipalRate: 0.008,
    municipalExemption: 15000, // sotto la soglia esente, sopra si paga su tutto il reddito
    source: SRC_BO.addizionali,
  },
  market: {
    annunci: {
      label: 'Annunci (immobiliare.it, lug. 2026)',
      pricePerSqm: 3835,
      rentPerSqmMonth: 16.44,
      note: 'Prezzi richiesti: la trattativa abbassa il prezzo d’acquisto; per un nuovo contratto d’affitto sono il riferimento più vicino a ciò che si paga.',
      source: SRC_BO.casalens,
    },
    omi: {
      label: 'OMI (Agenzia Entrate, 1° sem. 2026)',
      pricePerSqm: 2998,
      rentPerSqmMonth: 11.9,
      note: 'Valori medi di compravendite e contratti in essere (inclusi canoni concordati e vecchi contratti): sottostimano il costo di un nuovo affitto.',
      source: SRC_BO.casalens,
    },
    post: {
      label: 'Post Reddit (3.600 €/m², 169 €/m²/anno)',
      pricePerSqm: 3600,
      rentPerSqmMonth: 169 / 12,
      note: 'Valori usati nel post originale (media comunale, simili a RealAdvisor: 3.615 €/m²).',
      source: SRC_BO.realadvisor,
    },
  },
  facts: [
    ['Compravendite residenziali 2025', '6.089 (+5,2%)', SRC_BO.casalens],
    ['Valore medio per abitazione venduta 2025', '268.200 €', SRC_BO.casalens],
    ['Acquisti con mutuo (persone fisiche)', '54,6%', SRC_BO.casalens],
    ['Mutuo medio 2025', '179.500 € al 3,25% iniziale medio', SRC_BO.casalens],
    ['Rendimento lordo da affitto (OMI)', '~4,8% (3,7%–6,1% per zona)', SRC_BO.casalens],
    ['Reddito imponibile medio per contribuente (2023)', '28.573 €', SRC_BO.redditi],
    ['Reddito imponibile mediano (2023)', '22.778 €', SRC_BO.redditi],
    ['Affitti 70 m², 2019 → 2025', '860 → 1.250 €/mese (+45%)', SRC_BO.affittiCna],
    ['Affitti 2018 → 2024 (Nomisma)', '+34,1%', SRC_BO.affittiNomisma],
    ['Prezzi rispetto al picco 2008 (Nomisma)', 'circa −25%', SRC_BO.nomismaPeak],
  ],
  history: {
    // Variazioni annue % dei prezzi di compravendita
    housePriceYoY: {
      label: 'Prezzi case, variazione annua',
      unit: '%',
      source: [SRC_BO.nomisma2012, SRC_BO.casalens],
      note: '2008–2011: Nomisma (fonte secondaria). 2017–2025: OMI, 2° semestre su 2° semestre. 2012–2016 non disponibili.',
      data: {
        2008: -7.6, 2009: -7.0, 2010: -3.3, 2011: -3.4,
        2017: -1.56, 2018: 0.44, 2019: 0.24, 2020: 1.10, 2021: 0.94, 2022: 1.08, 2023: 2.98, 2024: 4.27, 2025: 4.41,
      },
    },
    // Prezzo medio OMI €/m², semestrale
    omiPrice: {
      label: 'Prezzo medio OMI €/m²',
      unit: '€/m²',
      source: [SRC_BO.casalens],
      data: {
        '2016-1': 2582, '2016-2': 2561, '2017-1': 2543, '2017-2': 2521, '2018-1': 2521, '2018-2': 2532,
        '2019-1': 2529, '2019-2': 2538, '2020-1': 2550, '2020-2': 2566, '2021-1': 2591, '2021-2': 2590,
        '2022-1': 2595, '2022-2': 2618, '2023-1': 2644, '2023-2': 2696, '2024-1': 2751, '2024-2': 2811,
        '2025-1': 2868, '2025-2': 2935, '2026-1': 2998,
      },
    },
    // Reddito imponibile mediano per contribuente, € e inflazione NIC %
    medianIncome: {
      label: 'Reddito imponibile mediano €',
      unit: '€',
      source: [SRC_BO.redditi],
      data: { 2016: 19573, 2017: 19573, 2018: 19965, 2019: 20061, 2020: 19952, 2021: 20505, 2022: 21373, 2023: 22778 },
      inflation: { 2016: 0.2, 2017: 0.9, 2018: 1.4, 2019: 0.4, 2020: -0.5, 2021: 2.1, 2022: 9.0, 2023: 5.6 },
    },
    // Affitti richiesti €/m²/mese (immobiliare.it)
    rentAsking: {
      label: 'Affitto richiesto €/m²/mese',
      unit: '€/m²',
      source: [SRC_BO.affittiSky, SRC_BO.casalens],
      data: { 2020: 14.0, 2025: 17.1, 2026: 16.44 },
    },
  },
  // Parametri impostati dalla città. 'from' = calcolato dalle serie storiche nel browser.
  params: {
    sqm: { value: 70, why: 'Taglio usato nel post e nelle statistiche CNA sugli affitti.' },
    renditaCatastale: { value: 800, why: 'Stima per un A/3 di 5 vani in zona semicentrale: valore catastale ~92.000 €, molto sotto il prezzo di mercato. Verificare sulla visura catastale.' },
    mortgageRate: { value: 0.0325, why: 'Tasso iniziale medio dei mutui a Bologna nel 2025 (OMI).', source: SRC_BO.casalens },
    ral: { value: 35200, why: 'RAL usata nel post. Riferimento: imponibile medio 28.573 €, mediano 22.778 € (tutti i contribuenti, pensionati inclusi).', source: SRC_BO.redditi },
    houseGrowth: { from: 'omiCagr', why: 'Crescita media annua del prezzo OMI 2016–2026. Include un decennio partito da prezzi depressi dopo la crisi.' },
    houseVol: { from: 'houseVolMatched', why: 'Calibrata perché la variabilità annua simulata dei prezzi (con momentum e inflazione) sia pari a quella storica 2008–2025 (~3,8%).' },
    houseAR: { from: 'houseAR', why: 'Autocorrelazione delle variazioni annue: i prezzi delle case hanno forte momentum.' },
    houseMeanRev: { value: 0.1, why: 'Il rapporto prezzo/affitto tende a tornare in linea (rendimento lordo ~4,8%); valore prudente.' },
    rentGrowth: { value: 0.03, why: 'Crescita dei canoni di mercato per nuovi contratti (1 punto sopra l’inflazione del 2%). Affitti +4–6% l’anno nel 2018–2025 (Nomisma, CNA, immobiliare.it), ma −3,6% nell’ultimo anno e nel lungo periodo non possono crescere molto più dei redditi (+2,2% l’anno): 3% come compromesso.' },
    rentVol: { value: 0.025, why: 'Affitti volatili nel recente passato (da +7% a −3,6% annuo); serie troppo corta per stimarla.' },
    salaryGrowth: { from: 'incomeCagr', why: 'Crescita annua del reddito mediano dichiarato 2016–2023.' },
    salaryVol: { from: 'incomeRealVol', why: 'Volatilità della crescita reale del reddito mediano (al netto dell’inflazione NIC).' },
  },
};
