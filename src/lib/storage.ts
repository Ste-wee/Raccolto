import type {
  PianoAlimentare,
  SpesaSettimana,
  Ricetta,
  AderenzaGiorno,
  VoceMenuSettimanale,
  PromemoriaSpesa,
  PromemoriaPasti
} from './types'

const KEYS = {
  piano: 'raccolto.piano-alimentare',
  spesa: 'raccolto.spesa',
  ricette: 'raccolto.ricette',
  dispensa: 'raccolto.dispensa',
  aderenza: 'raccolto.aderenza',
  ricetteEscluse: 'raccolto.ingredienti-esclusi',
  storicoPiani: 'raccolto.storico-piani',
  menuSettimanale: 'raccolto.menu-settimanale',
  promemoriaSpesa: 'raccolto.promemoria-spesa',
  promemoriaPasti: 'raccolto.promemoria-pasti'
}

const PROMEMORIA_SPESA_DEFAULT: PromemoriaSpesa = { attivo: false, giornoSettimana: 6, ora: 9, minuto: 0 }
const PROMEMORIA_PASTI_DEFAULT: PromemoriaPasti = { attivo: false }

function leggi<T>(chiave: string, valoreDefault: T): T {
  const raw = localStorage.getItem(chiave)
  if (!raw) return valoreDefault
  try {
    return JSON.parse(raw) as T
  } catch {
    return valoreDefault
  }
}

function scrivi<T>(chiave: string, valore: T) {
  localStorage.setItem(chiave, JSON.stringify(valore))
}

export const store = {
  getPiano(): PianoAlimentare | null {
    return leggi<PianoAlimentare | null>(KEYS.piano, null)
  },
  setPiano(piano: PianoAlimentare) {
    const attuale = store.getPiano()
    if (attuale) {
      const storico = store.getStoricoPiani()
      storico.unshift(attuale)
      scrivi(KEYS.storicoPiani, storico)
    }
    scrivi(KEYS.piano, piano)
  },

  // --- versioni precedenti del piano, più recente prima ---
  getStoricoPiani(): PianoAlimentare[] {
    return leggi<PianoAlimentare[]>(KEYS.storicoPiani, [])
  },

  getSpesa(): SpesaSettimana[] {
    return leggi<SpesaSettimana[]>(KEYS.spesa, [])
  },
  setSpesa(settimane: SpesaSettimana[]) {
    scrivi(KEYS.spesa, settimane)
  },
  upsertSettimana(settimana: SpesaSettimana) {
    const tutte = store.getSpesa()
    const indice = tutte.findIndex(s => s.settimana === settimana.settimana)
    if (indice >= 0) {
      tutte[indice] = settimana
    } else {
      tutte.push(settimana)
    }
    store.setSpesa(tutte)
  },

  getRicette(): Ricetta[] {
    return leggi<Ricetta[]>(KEYS.ricette, [])
  },
  addRicetta(ricetta: Ricetta) {
    const tutte = store.getRicette()
    tutte.unshift(ricetta)
    scrivi(KEYS.ricette, tutte)
  },
  setRicette(ricette: Ricetta[]) {
    scrivi(KEYS.ricette, ricette)
  },

  // --- dispensa: alimenti sempre disponibili, da non riproporre nella spesa ---
  getDispensa(): string[] {
    return leggi<string[]>(KEYS.dispensa, [])
  },
  setDispensa(articoli: string[]) {
    scrivi(KEYS.dispensa, articoli)
  },

  // --- aderenza giornaliera al piano alimentare ---
  getAderenza(): AderenzaGiorno[] {
    return leggi<AderenzaGiorno[]>(KEYS.aderenza, [])
  },
  getAderenzaGiorno(data: string): AderenzaGiorno {
    return store.getAderenza().find(a => a.data === data) ?? { data, pastiFatti: [] }
  },
  setAderenzaGiorno(giorno: AderenzaGiorno) {
    const tutte = store.getAderenza()
    const indice = tutte.findIndex(a => a.data === giorno.data)
    if (indice >= 0) {
      tutte[indice] = giorno
    } else {
      tutte.push(giorno)
    }
    scrivi(KEYS.aderenza, tutte)
  },

  // --- ingredienti da escludere sempre dalle ricette generate ---
  getIngredientiEsclusi(): string[] {
    return leggi<string[]>(KEYS.ricetteEscluse, [])
  },
  setIngredientiEsclusi(ingredienti: string[]) {
    scrivi(KEYS.ricetteEscluse, ingredienti)
  },

  // --- menu settimanale generato dall'AI ---
  getMenuSettimanale(): VoceMenuSettimanale[] {
    return leggi<VoceMenuSettimanale[]>(KEYS.menuSettimanale, [])
  },
  setMenuSettimanale(menu: VoceMenuSettimanale[]) {
    scrivi(KEYS.menuSettimanale, menu)
  },

  // --- promemoria ---
  getPromemoriaSpesa(): PromemoriaSpesa {
    return leggi<PromemoriaSpesa>(KEYS.promemoriaSpesa, PROMEMORIA_SPESA_DEFAULT)
  },
  setPromemoriaSpesa(impostazioni: PromemoriaSpesa) {
    scrivi(KEYS.promemoriaSpesa, impostazioni)
  },
  getPromemoriaPasti(): PromemoriaPasti {
    return leggi<PromemoriaPasti>(KEYS.promemoriaPasti, PROMEMORIA_PASTI_DEFAULT)
  },
  setPromemoriaPasti(impostazioni: PromemoriaPasti) {
    scrivi(KEYS.promemoriaPasti, impostazioni)
  }
}
