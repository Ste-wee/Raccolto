import { useMemo } from 'react'
import { elencoCompleto, eDiStagione } from '../../lib/seasonality'
import { FoodIcon } from '../../components/FoodIcon'
import { CalendarioBadge } from '../../components/CalendarioBadge'

export function StagionalitaPage() {
  const meseCorrente = new Date().getMonth() + 1
  const prodotti = useMemo(() => elencoCompleto(), [])

  return (
    <section className="page">
      <h2>🍅 Stagionalità</h2>
      <ul className="griglia-stagione">
        {prodotti.map(p => {
          const stagione = eDiStagione(p.nome, meseCorrente)
          return (
            <li key={p.nome} className="card-stagione">
              <FoodIcon nome={p.nome} categoria={p.categoria} dimensione={40} />
              <div className="info-alimento">
                <div className="nome-alimento">{p.nome}</div>
                <div className="categoria-alimento">{p.categoria}</div>
              </div>
              <span className="calendario-indicatore">
                <CalendarioBadge diStagione={stagione} />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
