import seasonalProduce from '../data/seasonal-produce.json'

export type Categoria = 'frutta' | 'verdura' | 'carne'

export interface ProdottoStagionale {
  nome: string
  categoria: Categoria
  mesiStagione: number[]
}

const NOMI_MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
]

function tuttiIProdotti(): ProdottoStagionale[] {
  return Object.entries(seasonalProduce).map(([nome, dati]) => ({
    nome,
    categoria: dati.categoria as Categoria,
    mesiStagione: dati.mesi_stagione
  }))
}

/** true se il prodotto è di stagione nel mese indicato (1-12, default: mese corrente) */
export function eDiStagione(nomeProdotto: string, mese: number = new Date().getMonth() + 1): boolean {
  const prodotto = tuttiIProdotti().find(p => p.nome === nomeProdotto.toLowerCase())
  if (!prodotto) return false
  return prodotto.mesiStagione.includes(mese)
}

/** restituisce i prossimi mesi (nomi) in cui il prodotto sarà di stagione, a partire da ora */
export function prossimaStagione(nomeProdotto: string, meseAttuale: number = new Date().getMonth() + 1): string[] {
  const prodotto = tuttiIProdotti().find(p => p.nome === nomeProdotto.toLowerCase())
  if (!prodotto) return []
  return prodotto.mesiStagione
    .filter(m => m !== meseAttuale)
    .sort((a, b) => {
      const distanzaA = (a - meseAttuale + 12) % 12
      const distanzaB = (b - meseAttuale + 12) % 12
      return distanzaA - distanzaB
    })
    .map(m => NOMI_MESI[m - 1])
}

export function prodottiDiStagione(categoria?: Categoria, mese: number = new Date().getMonth() + 1): ProdottoStagionale[] {
  return tuttiIProdotti()
    .filter(p => (categoria ? p.categoria === categoria : true))
    .filter(p => p.mesiStagione.includes(mese))
}

export function elencoCompleto(): ProdottoStagionale[] {
  return tuttiIProdotti()
}
