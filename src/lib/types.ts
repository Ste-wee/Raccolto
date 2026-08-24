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
  creatoIl: string
}

export interface SpesaItem {
  nome: string
  quantita?: string
  categoria?: string
}

export interface SpesaSettimana {
  settimana: string
  items: SpesaItem[]
}

export interface Ricetta {
  titolo: string
  tempoPreparazioneMinuti: number
  ingredienti: string[]
  passi: string[]
  note?: string
  creataIl: string
}
