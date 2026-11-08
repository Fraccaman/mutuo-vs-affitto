// Preset inclusi, selezionabili dal menu "Preset" del pannello parametri.
//
// Ogni preset è un oggetto JSON (si può copiare in un file .json e caricarlo dal sito):
// {
//   "name": "Nome mostrato nel menu",                  obbligatorio
//   "description": "Una riga di spiegazione",         facoltativo
//   "base": "risks",      da quale scenario partire: "default" (valori di base del modello),
//                         "post", "stat", "real" (dati città + statistica), "risks" (dati città + rischi
//                         di lungo periodo). Default "risks", lo scenario di partenza del sito.
//   "city": "BO",         capoluogo (sigla, vedi js/data/cities/); facoltativo
//   "priceSource": "omi", fonte di prezzi e affitti della città ("annunci", "omi", ...); facoltativo
//   "params": { ... }     qualsiasi parametro del pannello, con la chiave di js/ui/schema.js.
//                         Percentuali come frazioni (20% = 0.2), sì/no come true/false,
//                         menu con il valore dell'opzione (es. "mortgageType": "variable").
// }
// L'ordine di applicazione è: base → città e fonte → params. Le chiavi sconosciute sono ignorate
// e segnalate. "Esporta JSON" nel sito produce un preset completo con tutti i parametri.

const PRESET_LIBRARY = [
  {
    "id": "post",
    "name": "Ipotesi del post",
    "description": "Lo scenario deterministico del post Reddit su Bologna: un solo futuro, tutto ai tassi medi.",
    "base": "post"
  },
  {
    "id": "stat",
    "name": "Post + statistica",
    "description": "Le ipotesi del post, ma con migliaia di futuri casuali.",
    "base": "stat"
  },
  {
    "id": "real",
    "name": "Dati città + statistica",
    "description": "Prezzi, affitti, crescite e volatilità stimati dai dati della città, fisco italiano, eventi di vita.",
    "base": "real"
  },
  {
    "id": "risks",
    "name": "Dati città + rischi di lungo periodo",
    "description": "Aggiunge declino demografico, rischio della singola casa e obbligo di classe energetica (ipotesi da adattare).",
    "base": "risks"
  },
  {
    "id": "omi",
    "name": "Affitti e prezzi da contratti registrati (OMI)",
    "description": "Come i dati città, ma con i valori OMI dell'Agenzia delle Entrate invece dei prezzi richiesti negli annunci.",
    "base": "risks",
    "priceSource": "omi"
  },
  {
    "id": "house-bear",
    "name": "Pessimista sulla casa",
    "description": "Prezzi fermi in termini nominali, affitti che crescono solo con l'inflazione, manutenzione alta, mutuo variabile.",
    "base": "risks",
    "params": {
      "houseGrowth": 0,
      "rentGrowth": 0.02,
      "maintPct": 0.015,
      "mortgageType": "variable",
      "houseMuUncertainty": 0.015
    }
  },
  {
    "id": "equity-bear",
    "name": "Pessimista sulla borsa",
    "description": "Rendimento ETF più basso, crisi più frequenti e chi affitta investe solo l'80% del risparmio.",
    "base": "risks",
    "params": {
      "etfReturn": 0.055,
      "rsPBullBear": 0.04,
      "etfMuUncertainty": 0.02,
      "investFCF": 0.8
    }
  },
  {
    "id": "short-stay",
    "name": "Resto pochi anni",
    "description": "Orizzonte di 7 anni e traslochi forzati più probabili: il caso in cui comprare pesa di più.",
    "base": "risks",
    "params": {
      "horizon": 7,
      "moveProb": 0.05
    }
  }
];
