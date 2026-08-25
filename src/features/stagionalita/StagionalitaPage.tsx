import { useMemo, useState } from 'react'
import { eDiStagione, raggruppaPerCategoria, NOMI_MESI_COMPLETI, type Categoria } from '../../lib/seasonality'
import { FoodIcon } from '../../components/FoodIcon'
import { MesiStrip } from '../../components/MesiStrip'
import {
  IconaAvanti,
  IconaIndietro,
  IconaVerdura,
  IconaFrutta,
  IconaCarne,
  IconaPesce
} from '../../components/Icone'

interface Aspetto {
  etichetta: string
  Icona: (props: { dimensione?: number }) => JSX.Element
  classe: string
}

const ASPETTO: Record<Categoria, Aspetto> = {
  verdura: { etichetta: 'Verdura', Icona: IconaVerdura, classe: 'verdura' },
  frutta: { etichetta: 'Frutta', Icona: IconaFrutta, classe: 'frutta' },
  carne: { etichetta: 'Carne', Icona: IconaCarne, classe: 'carne' },
  pesce: { etichetta: 'Pesce', Icona: IconaPesce, classe: 'pesce' }
}

export function StagionalitaPage() {
  const meseCorrente = new Date().getMonth() + 1
  const gruppi = useMemo(() => raggruppaPerCategoria(meseCorrente), [meseCorrente])
  const [apertaCategoria, setApertaCategoria] = useState<Categoria | null>(null)
  const [soloDiStagione, setSoloDiStagione] = useState(false)

  const gruppoAperto = gruppi.find(g => g.categoria === apertaCategoria)

  // --- elenco delle quattro categorie ---
  if (!gruppoAperto) {
    return (
      <section className="page">
        <header className="page-header">
          <div>
            <h2>Stagionalità</h2>
            <p className="descrizione">Siamo a {NOMI_MESI_COMPLETI[meseCorrente - 1]}</p>
          </div>
        </header>

        <ul className="lista-categorie">
          {gruppi.map(gruppo => {
            const aspetto = ASPETTO[gruppo.categoria]
            const inStagione = gruppo.prodotti.filter(p => p.mesiStagione.includes(meseCorrente)).length
            return (
              <li key={gruppo.categoria}>
                <button className="riga-categoria" onClick={() => setApertaCategoria(gruppo.categoria)}>
                  <span className={`cerchio-categoria ${aspetto.classe}`}>
                    <aspetto.Icona />
                  </span>
                  <span className="info-categoria">
                    <span className="nome-categoria">{aspetto.etichetta}</span>
                    <span className="conta-categoria">{gruppo.prodotti.length} prodotti</span>
                  </span>
                  <span className="badge stagione">{inStagione} ora</span>
                  <IconaAvanti />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  // --- dettaglio di una categoria ---
  const aspetto = ASPETTO[gruppoAperto.categoria]
  const prodotti = soloDiStagione
    ? gruppoAperto.prodotti.filter(p => p.mesiStagione.includes(meseCorrente))
    : gruppoAperto.prodotti

  return (
    <section className="page">
      <header className="page-header">
        <div className="titolo-con-indietro">
          <button
            className="bottone-indietro"
            onClick={() => {
              setApertaCategoria(null)
              setSoloDiStagione(false)
            }}
            aria-label="Torna alle categorie"
          >
            <IconaIndietro dimensione={18} />
          </button>
          <div>
            <h2>{aspetto.etichetta}</h2>
            <p className="descrizione">Siamo a {NOMI_MESI_COMPLETI[meseCorrente - 1]}</p>
          </div>
        </div>
        <button
          className={soloDiStagione ? 'pillola-filtro attiva' : 'pillola-filtro'}
          onClick={() => setSoloDiStagione(!soloDiStagione)}
        >
          {soloDiStagione ? 'Tutti' : 'Solo di stagione'}
        </button>
      </header>

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

      {prodotti.length === 0 && <p className="stato">Nessun prodotto di stagione in questo reparto adesso.</p>}
    </section>
  )
}
