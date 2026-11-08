# Compro o Affitto?

Simulatore Monte Carlo: comprare casa con mutuo vs affittare e investire la differenza in ETF.
Sito statico (HTML + JS, nessuna build), pensato per GitHub Pages.

- Ogni parametro è modificabile dalla UI e salvato nel link (`#...`) per condividere lo scenario.
- Fisco italiano (`js/data/italy.js`, calcoli in `js/model/taxes.js`): plusvalenze 26%, bollo 0,2%, detrazione interessi, netto da RAL (IRPEF 2026 + addizionali).
- Selettore capoluogo (`js/data/cities/`: Bologna, Firenze, Milano, Napoli, Palermo, Roma, Verona): prezzi/affitti per fonte (annunci, OMI, post), serie storiche con fonti; volatilità, momentum e crescite sono stimati nel browser dalle serie.
- Preset "Ipotesi del post" riproduce lo scenario deterministico del post Reddit su Bologna (738k vs 496k a 30 anni).
- Scheda "Insieme" (`js/model/compare.js`, `js/ui/overview.js`): tutte le città a confronto con lo stesso scenario personale. La città selezionata usa i parametri attuali; per le altre valgono prezzi e affitti (stessa fonte), tasso del mutuo, rendita catastale, crescite e volatilità dalle serie storiche, addizionali e, a scelta, la RAL media locale. Mostra probabilità che comprare convenga, rata e affitto sul netto, canone/prezzo, anni di stipendio per comprare, patrimonio finale, probabilità anno per anno, indici storici di prezzi OMI e affitti richiesti, tabella riassuntiva.

## Preset

Menu "Preset" nel pannello parametri: preset inclusi (`js/data/presets.js`) e preset salvati nel browser.
Ogni preset è JSON e può cambiare qualsiasi parametro:

```json
{
  "name": "Pessimista sulla casa",
  "description": "Prezzi fermi, affitti con l'inflazione",
  "base": "real",
  "city": "BO",
  "priceSource": "omi",
  "params": { "houseGrowth": 0, "rentGrowth": 0.02, "mortgageType": "variable" }
}
```

- `base`: scenario di partenza (`default`, `post`, `stat`, `real`, `risks`; se manca `risks`, cioè dati città + rischi di lungo periodo); poi si applicano città, fonte e `params`.
- Chiavi dei parametri: quelle di `js/ui/schema.js`, mostrate anche nel box "i" di ogni campo. Percentuali come frazioni (20% = 0,2).
- Dal sito: "Incolla JSON" o "Carica file" per caricare (con controllo di chiavi, tipi e limiti), "Esporta JSON" per scaricare lo scenario corrente con tutti i parametri, "Salva" per aggiungerlo al menu.
- Per aggiungere un preset incluso: un oggetto in più in `PRESET_LIBRARY` (i test controllano che sia valido).

## Modelli statistici

- Azioni: lognormale, Student-t (code grasse) o regime switching bull/bear (RSLN, Hardy 2001)
- Incertezza sui parametri: rendimento atteso di ETF e casa estratto per ogni simulazione
- Casa cointegrata con gli affitti: rapporto prezzo/affitto con momentum e ritorno alla media
- Inflazione AR(1); Euribor Vasicek per il mutuo variabile
- Eventi di vita: disoccupazione e traslochi forzati
- Rischi di lungo periodo (attivi nello scenario di partenza, preset "Dati città + rischi di lungo periodo", sono ipotesi da adattare):
  - declino demografico: scenario per percorso, prezzi e affitti crescono meno, vendere costa di più
  - rischio della singola casa: scostamento casuale dal mercato a media invariata + degrado del quartiere (salto raro); un trasloco forzato realizza la perdita
  - obbligo di classe energetica: anno incerto; lavori (al netto degli incentivi, poi risparmio in bolletta) oppure sconto permanente, scelti confrontando i valori attualizzati; il proprietario ribalta una parte del costo sull'affitto
- Metriche di rischio: CVaR 5%, equivalente certo CRRA, IC di Wilson sulle probabilità, probabilità di restare coi debiti (il mutuo si ripaga anche se la casa vale meno), casa che vale meno del mutuo, risultato con e senza ciascun rischio

## Fonti dei dati

Tutte le fonti sono anche in `js/data/cities/<SIGLA>.js` (oggetto `SRC_<SIGLA>`) e visibili nel sito nella scheda "Dati della città" (vista avanzata). Le statistiche derivate (crescita media, volatilità, autocorrelazione) sono calcolate nel browser a partire dalle serie grezze qui sotto.

### Bologna: prezzi e affitti attuali

| Dato | Fonte |
|---|---|
| Prezzi e affitti da annunci (3.835 €/m², 16,44 €/m²/mese, lug. 2026) | [CasaLens](https://casalens.it/citta/bologna) su dati immobiliare.it |
| Prezzi e affitti OMI (2.998 €/m², 11,9 €/m²/mese, 1° sem. 2026) | [CasaLens](https://casalens.it/citta/bologna) su dati OMI – Agenzia delle Entrate |
| Prezzo medio comunale usato nel post (3.600 €/m²) | [RealAdvisor](https://realadvisor.it/it/mercato-immobiliare/comune-bologna-it) |
| Compravendite, valore medio, quota con mutuo, mutuo medio e tasso iniziale 3,25% (2025) | [CasaLens](https://casalens.it/citta/bologna) su dati OMI |

### Bologna: serie storiche

| Serie | Uso nel modello | Fonte |
|---|---|---|
| Variazione annua prezzi 2008–2011 | volatilità e momentum dei prezzi | Nomisma via [BolognaToday](https://www.bolognatoday.it/economia/speciale-grandi-citta-mercato-immobiliare-bologna-1794115.html) (fonte secondaria) |
| Variazione annua prezzi 2017–2025 e prezzo OMI semestrale 2016–2026 | crescita attesa, volatilità e autocorrelazione dei prezzi | [CasaLens](https://casalens.it/citta/bologna) su dati OMI |
| Prezzi circa −25% rispetto al picco 2008 | contesto | Nomisma via [il Resto del Carlino](https://www.ilrestodelcarlino.it/bologna/economia/nomisma-casa-51e2d2e1) |
| Reddito imponibile mediano e medio 2016–2023 | crescita e volatilità dello stipendio | [Comune di Bologna, “I redditi dichiarati”](https://inumeridibolognametropolitana.it/sites/inumeridibolognametropolitana.it/files/economia/redditi/report_redditi.pdf) |
| Inflazione NIC 2016–2023 | crescita reale dei redditi | ISTAT |
| Affitti richiesti 2020–2025 | crescita e volatilità degli affitti | [Sky TG24](https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti) su dati immobiliare.it |
| Affitto di 70 m² 2019–2025 (da 860 a 1.250 €/mese) | crescita degli affitti | CNA su dati Agenzia Entrate, via [BolognaToday](https://www.bolognatoday.it/casa/affitti-bologna-costo-case-stipendi-cna.html) |
| Affitti +34,1% 2018–2024 | crescita degli affitti | Nomisma via [Radio Bologna](https://radiabo.it/bologna-e-dintorni/bologna-affitti-34-in-sei-anni-e-la-terza-grande-citta-italiana-per-rincari/) |

### Milano

| Dato | Uso nel modello | Fonte |
|---|---|---|
| Prezzi e affitti da annunci (5.675 €/m², 22,3 €/m²/mese, 1° sem. 2026) | prezzo e affitto iniziali | Immobiliare.it Insights via [Moneta](https://www.monetaweb.it/mutui-e-casa/a-milano-lieve-calo-degli-affitti-ma-i-prezzi-di-vendita-salgono-ancora/) |
| Prezzi e affitti OMI, prezzo OMI semestrale 2016–2026, variazioni annue 2017–2025, compravendite e mutui | crescita attesa, volatilità e momentum dei prezzi | [CasaLens](https://casalens.it/citta/milano) su dati OMI |
| Variazioni annue prezzi 2008–2016 | volatilità e momentum dei prezzi | Tecnocasa via [Infobuild](https://www.infobuild.it/quotazioni-delle-abitazioni-milano-diminuite-3/) e [Tecnocasa](https://news.tecnocasagroup.it/ufficio-stampa/comunicati-stampa/mercato-immobiliare-locale/speciale-mercato-immobiliare-milano/) |
| Reddito imponibile medio 2016–2024 | crescita e volatilità dello stipendio | [MEF, open data IRPEF comunali](https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes) |
| RAL di riferimento (39.000 €) | stipendio iniziale | [JobPricing, Geography Index](https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf) |
| Affitti richiesti 2020–2026 | crescita e volatilità degli affitti | [Sky TG24](https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti) su dati immobiliare.it |
| Addizionali Lombardia e Milano 2026 | netto da RAL | [TuttoCalcolato](https://tuttocalcolato.it/calcolo/irpef/milano/) |

La serie dei prezzi cambia fonte nel 2017 (Tecnocasa prima, OMI dopo). La crescita della casa calcolata da OMI (~4% l’anno) include il boom 2021–2024.

### Napoli

| Dato | Uso nel modello | Fonte |
|---|---|---|
| Prezzi e affitti da annunci (3.044 €/m², 15,77 €/m²/mese, ott. 2026) | prezzo e affitto iniziali | [Immobiliare.it](https://www.immobiliare.it/en/mercato-immobiliare/) |
| Prezzi e affitti OMI, prezzo OMI semestrale 2016–2026, compravendite e mutui | contesto | [CasaLens](https://casalens.it/citta/napoli) su dati OMI |
| Variazioni annue prezzi 2008–2014 | volatilità e momentum dei prezzi | [OMI, Nota territoriale Napoli 2014](https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/note_semestrali_2014/Napoli_Nota_Terr_II_sem_2014.pdf) e [2011](https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/Napoli_Nota_Territoriale_II_sem2011_5luglio2012.pdf) |
| Variazioni annue prezzi 2016–2025 | volatilità e momentum dei prezzi | [OMI, Statistiche regionali Campania](https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_CAMPANIA.pdf/d2bba606-78d0-5edf-aec4-88315668479d) |
| Crescita dei prezzi negli ultimi 10 anni (+17,1%) | crescita attesa (1%) | [Tecnocasa](https://cdn-tecnocasagroup.medialabtc.it/it/sites/2/2026/09/La-rivalutazione-degli-immobili-nel-tempo-Gruppo-Tecnocasa.pdf) |
| Reddito imponibile medio 2016–2023 | crescita e volatilità dello stipendio | [MEF, open data IRPEF comunali](https://www1.finanze.gov.it/finanze/analisi_stat/public/v_4_0_0/contenuti/Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_2023.zip) |
| RAL di riferimento (30.300 €) | stipendio iniziale | [JobPricing, Geography Index](https://jpcondivisi.s3.eu-west-1.amazonaws.com/Whitepaper-guide+e+altri+documenti+/Up+to+date/JP_Geography_Index.pdf) |
| Affitti richiesti 2020–2026 | crescita e volatilità degli affitti | [Sky TG24](https://tg24.sky.it/economia/2026/10/11/affitti-prezzi-canone-aumenti) su dati immobiliare.it |
| Addizionali Campania e Napoli 2026 | netto da RAL | [TuttoCalcolato](https://tuttocalcolato.it/calcolo/irpef/napoli/) |

Il prezzo medio OMI di Napoli salta del 13% nel 2024 per la revisione delle zone, non per un rialzo reale: per questo la crescita della casa è fissata all’1% invece di essere calcolata dalla serie. Manca il 2015.

### Roma, Firenze, Verona, Palermo

Stesso schema delle altre città; l’elenco completo delle fonti è in `js/data/cities/<SIGLA>.js` e nella scheda della città.

| Città | Prezzi e affitti attuali | Variazioni annue dei prezzi | Redditi, RAL, addizionali |
|---|---|---|---|
| Roma | Annunci [Immobiliare.it](https://www.immobiliare.it/mercato-immobiliare/lazio/roma/) (set. 2026), OMI via [CasaLens](https://casalens.it/citta/roma) | 2008–2014 [Nota territoriale OMI 2014](https://www1.agenziaentrate.gov.it/mt/osservatorio/note%20territoriali%20semestrali/note_semestrali_2014/Roma_Nota_Terr_II_sem_2014.pdf), 2016–2025 [Statistiche regionali OMI Lazio](https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_LAZIO.pdf/7f69a843-2b7f-c36f-6bd6-0b8108ab0817) | MEF open data 2016–2024, JobPricing, [Regione Lazio](https://www.regione.lazio.it/sites/default/files/2026-01/Addizionale-regionale-2026.pdf) |
| Firenze | Immobiliare.it Insights via [La Nazione](https://www.lanazione.it/arezzo/cronaca/immobili-in-toscana-nei-primi-tre-mesi-prosegue-la-crescita-di-prezzi-di-vendita-4-7-g8g35bha) (1° trim. 2026), OMI via [CasaLens](https://casalens.it/citta/firenze) | 2008–2014 Nota territoriale OMI, 2015 ANCE Toscana, 2016–2025 [Statistiche regionali OMI Toscana](https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_TOSCANA.pdf/afc7c5f8-e23a-8873-66c8-45d4a15801d0) | MEF open data 2016–2024, JobPricing, [TuttoCalcolato](https://tuttocalcolato.it/calcolo/irpef/firenze/) |
| Verona | Annunci [Immobiliare.it](https://www.immobiliare.it/mercato-immobiliare/veneto/verona/) (ott. 2026), OMI via [CasaLens](https://casalens.it/citta/verona) | 2012–2015 Tecnocasa, 2016–2025 [Statistiche regionali OMI Veneto](https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_VENETO.pdf/b9d7b4cb-c99d-7191-ca20-902b5540bbc9) | MEF open data 2016–2024, JobPricing, [TuttoCalcolato](https://tuttocalcolato.it/calcolo/irpef/verona/) |
| Palermo | Immobiliare.it Insights via [La Sicilia](https://www.lasicilia.it/news/economia/3072003/mattone-in-sicilia-palermo-spinge-sull-acceleratore-catania-frena-tra-stasi-dei-prezzi-e-calo-dei-volumi.html) (1° sem. 2026), OMI via [CasaLens](https://casalens.it/citta/palermo) | 2008–2015 Tecnocasa via [Infobuild](https://www.infobuild.it/in-contrazione-i-prezzi-delle-case-nelle-grandi-citta/), 2016–2025 [Statistiche regionali OMI Sicilia](https://www.agenziaentrate.gov.it/portale/documents/20143/10101383/SR2026_SICILIA.pdf/b575aaaa-07ba-80e7-8782-336c625400c8) | MEF open data 2016–2024, JobPricing, [MEF aliquote comunali 2026](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/download/download.php?anno=2026) |

Scelte da sapere: a Roma e Palermo la crescita della casa calcolata da OMI 2016–2026 è circa zero (il decennio include il calo fino al 2021); a Verona è ~3% (boom 2023–2026). A Firenze crescita (1,5%) e volatilità (1,5%) sono fissate a mano perché la serie OMI è distorta dalla revisione delle zone 2024 e quasi immobile. A Roma l’addizionale regionale sotto i 28.000 € è sovrastimata (agevolazione non modellata).

### Fisco

| Dato | Fonte |
|---|---|
| Scaglioni IRPEF 2026, detrazioni da lavoro dipendente, taglio del cuneo (L. 207/2024) | [InformazioneFiscale](https://www.informazionefiscale.it/IRPEF-scaglioni-aliquote-calcolo), TUIR art. 13 |
| Addizionali regionale Emilia-Romagna e comunale Bologna 2026 | [TuttoCalcolato](https://tuttocalcolato.it/calcolo/irpef/bologna/) (da verificare sul sito del MEF) |
| Imposte prima casa, sostitutiva sul mutuo, detrazioni 19%, bollo 0,2%, plusvalenze 26%, credito d’imposta sul riacquisto | normativa vigente, riassunta in `js/data/italy.js` (`ITALY_NOTES`) |

### Modelli di mercato (non specifici della città)

- **Azioni**: regime switching lognormal (Hardy 2001, *North American Actuarial Journal*). Parametri scelti per un rendimento composto del 7% e una volatilità annua intorno al 17%, in linea con la storia dell’azionario globale (MSCI World).
- **Inflazione**: media di lungo periodo al 2% (obiettivo BCE). Il regime "shock" è calibrato sul 2022–2023 (NIC 9,0% e 5,6%).
- **Euribor**: modello di Vasicek legato all’inflazione. I parametri sono ipotesi ragionevoli, non stime econometriche.
- **Ipotesi del post**: il preset "Ipotesi del post" usa i valori del post Reddit originale su Bologna.

Alcuni valori sono stime da verificare: rendita catastale (650–1.100 € a seconda della città), TER dell’ETF, aliquote delle addizionali. Fuori da Bologna il reddito è la media (il MEF non pubblica la mediana per comune) e la RAL è una media regionale o provinciale.