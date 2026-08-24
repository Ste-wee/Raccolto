export interface Alimento {
  nome: string
  quantita?: string
}

export interface Pasto {
  nome: string
  alimenti: Alimento[]
}

export interface PianoAlimentare {
  pasti: Pasto[]
  note?: string
  /** Allergie, intolleranze o divieti espliciti — mostrati come avviso, non solo come nota generica */
  avvisi?: string[]
  creatoIl: string
}

export interface SpesaItem {
  nome: string
  quantita?: string
  categoria?: string
  /** prezzo stimato in euro per la voce (manuale o stimato dall'AI) */
  prezzo?: number
  /** true se il prodotto è già disponibile in dispensa e non va ricomprato */
  giaInDispensa?: boolean
}

export interface SpesaSettimana {
  settimana: string
  items: SpesaItem[]
  /** lista suggerita dall'AI a partire dal piano alimentare, prima di fare la spesa */
  suggeriti?: SpesaItem[]
}

export interface Ricetta {
  titolo: string
  tempoPreparazioneMinuti: number
  ingredienti: string[]
  passi: string[]
  note?: string
  porzioni?: number
  calorie?: number
  proteineGrammi?: number
  carboidratiGrammi?: number
  grassiGrammi?: number
  preferita?: boolean
  creataIl: string
}

export interface VoceMenuSettimanale {
  giorno: string
  pasto: string
  ricetta: Ricetta
}

export interface AderenzaGiorno {
  data: string
  pastiFatti: string[]
}

export interface PromemoriaSpesa {
  attivo: boolean
  giornoSettimana: number
  ora: number
  minuto: number
}

export interface PromemoriaPasti {
  attivo: boolean
}
