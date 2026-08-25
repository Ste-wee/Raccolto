import { NOMI_MESI_COMPLETI } from '../lib/seasonality'

const INIZIALI = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D']

interface Props {
  mesiStagione: number[]
  meseCorrente: number
}

/** Striscia dei 12 mesi: evidenzia quelli di stagione e, più marcato, il mese corrente. */
export function MesiStrip({ mesiStagione, meseCorrente }: Props) {
  const nomiInStagione = mesiStagione
    .slice()
    .sort((a, b) => a - b)
    .map(m => NOMI_MESI_COMPLETI[m - 1])
    .join(', ')

  return (
    <div className="mesi-strip" role="img" aria-label={`Di stagione in: ${nomiInStagione}`}>
      {INIZIALI.map((iniziale, indice) => {
        const mese = indice + 1
        const inStagione = mesiStagione.includes(mese)
        const corrente = mese === meseCorrente
        const classi = ['mese-cella']
        if (inStagione) classi.push('mese-attivo')
        if (corrente) classi.push('mese-corrente')
        return (
          <span key={indice} className={classi.join(' ')} title={NOMI_MESI_COMPLETI[indice]}>
            {iniziale}
          </span>
        )
      })}
    </div>
  )
}
