import seasonalProduce from '../data/seasonal-produce.json'

export type Categoria = 'frutta' | 'verdura' | 'carne' | 'pesce'

/** Ordine in cui mostrare i reparti nell'app */
export const ORDINE_CATEGORIE: Categoria[] = ['verdura', 'frutta', 'carne', 'pesce']

export const NOMI_MESI_COMPLETI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
]

export interface ProdottoStagionale {
  nome: string
  categoria: Categoria
  mesiStagione: number[]
}

const NOMI_MESI = NOMI_MESI_COMPLETI

function tuttiIProdotti(): ProdottoStagionale[] {
  return Object.entries(seasonalProduce).map(([nome, dati]) => ({
    nome,
    categoria: dati.categoria as Categoria,
    mesiStagione: dati.mesi_stagione
  }))
}

/** true se il prodotto è presente nel dataset di stagionalità */
export function prodottoConosciuto(nomeProdotto: string): boolean {
  return tuttiIProdotti().some(p => p.nome === nomeProdotto.toLowerCase())
}

/** true se il prodotto è di stagione nel mese indicato (1-12, default: mese corrente); false anche se il prodotto non è nel dataset */
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

/**
 * Raggruppa tutti i prodotti per reparto, nell'ordine di ORDINE_CATEGORIE.
 * Dentro ogni reparto mette prima quelli di stagione nel mese indicato.
 */
export function raggruppaPerCategoria(
  mese: number = new Date().getMonth() + 1
): { categoria: Categoria; prodotti: ProdottoStagionale[] }[] {
  return ORDINE_CATEGORIE.map(categoria => ({
    categoria,
    prodotti: tuttiIProdotti()
      .filter(p => p.categoria === categoria)
      .sort((a, b) => {
        const aInStagione = a.mesiStagione.includes(mese) ? 0 : 1
        const bInStagione = b.mesiStagione.includes(mese) ? 0 : 1
        return aInStagione - bInStagione || a.nome.localeCompare(b.nome, 'it')
      })
  })).filter(gruppo => gruppo.prodotti.length > 0)
}
