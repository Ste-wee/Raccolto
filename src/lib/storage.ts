import type { PianoAlimentare, SpesaSettimana, Ricetta } from './types'

const KEYS = {
  piano: 'raccolto.piano-alimentare',
  spesa: 'raccolto.spesa',
  ricette: 'raccolto.ricette'
}

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
    scrivi(KEYS.piano, piano)
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
  }
}
