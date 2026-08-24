import { useMemo } from 'react'
import { prodottiDiStagione } from '../../lib/seasonality'

export function StagionalitaPage() {
  const meseCorrente = new Date().getMonth() + 1
  const diStagione = useMemo(() => prodottiDiStagione(undefined, meseCorrente), [meseCorrente])

  return (
    <section className="page">
      <h2>🍅 Di stagione questo mese</h2>
      <ul className="grid">
        {diStagione.map(p => (
          <li key={p.nome} className={`card ${p.categoria}`}>
            <span className="nome">{p.nome}</span>
            <span className="categoria">{p.categoria}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
