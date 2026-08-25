import { useMemo, useState } from 'react'
import { eDiStagione, raggruppaPerCategoria, NOMI_MESI_COMPLETI, type Categoria } from '../../lib/seasonality'
import { FoodIcon } from '../../components/FoodIcon'
import { MesiStrip } from '../../components/MesiStrip'

const ETICHETTE: Record<Categoria, string> = {
  verdura: 'Verdura',
  frutta: 'Frutta',
  carne: 'Carne',
  pesce: 'Pesce'
}

export function StagionalitaPage() {
  const meseCorrente = new Date().getMonth() + 1
  const gruppi = useMemo(() => raggruppaPerCategoria(meseCorrente), [meseCorrente])
  const [soloDiStagione, setSoloDiStagione] = useState(false)

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Stagionalità</h2>
          <p className="descrizione">Siamo a {NOMI_MESI_COMPLETI[meseCorrente - 1]}</p>
        </div>
        <button
          className={soloDiStagione ? 'pillola-filtro attiva' : 'pillola-filtro'}
          onClick={() => setSoloDiStagione(!soloDiStagione)}
        >
          {soloDiStagione ? 'Tutti' : 'Solo di stagione'}
        </button>
      </header>

      {gruppi.map(gruppo => {
        const prodotti = soloDiStagione
          ? gruppo.prodotti.filter(p => p.mesiStagione.includes(meseCorrente))
          : gruppo.prodotti
        if (prodotti.length === 0) return null
        const quantiInStagione = gruppo.prodotti.filter(p => p.mesiStagione.includes(meseCorrente)).length

        return (
          <div key={gruppo.categoria} className="reparto">
            <h3 className="reparto-titolo">
              {ETICHETTE[gruppo.categoria]}
              <span className="reparto-conta">{quantiInStagione} di stagione</span>
            </h3>
            <ul className="lista-prodotti">
              {prodotti.map(prodotto => {
                const inStagione = eDiStagione(prodotto.nome, meseCorrente)
                return (
                  <li key={prodotto.nome} className={inStagione ? 'card-prodotto in-stagione' : 'card-prodotto'}>
                    <div className="card-prodotto-testa">
                      <FoodIcon nome={prodotto.nome} categoria={prodotto.categoria} dimensione={34} />
                      <span className="nome-alimento">{prodotto.nome}</span>
                      <span className={inStagione ? 'badge stagione' : 'badge fuori-stagione'}>
                        {inStagione ? 'di stagione' : 'fuori stagione'}
                      </span>
                    </div>
                    <MesiStrip mesiStagione={prodotto.mesiStagione} meseCorrente={meseCorrente} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
