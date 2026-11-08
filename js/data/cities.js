// Registro dei capoluoghi. Ogni città è in js/data/cities/<SIGLA>.js e fornisce:
//  - taxes: addizionali IRPEF regionale e comunale
//  - market: prezzi e affitti attuali per fonte (OMI = compravendite/contratti, annunci = prezzi richiesti)
//  - history: serie storiche grezze con fonte; le statistiche (media, volatilità, autocorrelazione)
//    sono calcolate nel browser da queste serie
//  - params: parametri del simulatore impostati per la città, ciascuno con motivazione
//  - color: slot della palette categorica (--cat-N in css/base.css), fisso, unico per città
//
// Per aggiungere un capoluogo: copiare un file di js/data/cities/, sostituire dati e fonti
// e aggiungerlo a index.html (dopo questo file).

const CITIES = {};
const DEFAULT_CITY = 'BO';
