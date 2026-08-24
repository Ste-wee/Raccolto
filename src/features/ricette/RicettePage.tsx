import { useState } from 'react'
import { generaRicetta } from '../../lib/gemini'
import { store } from '../../lib/storage'
import type { Ricetta } from '../../lib/types'

export function RicettePage() {
  const [tempo, setTempo] = useState(30)
  const [pasto, setPasto] = useState('cena')
  const [ricette, setRicette] = useState<Ricetta[]>(store.getRicette())
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  async function genera() {
    setCaricamento(true)
    setErrore(null)
    try {
      const piano = store.getPiano()
      const settimane = store.getSpesa()
      const ultimaSettimana = settimane[settimane.length - 1]
      const ingredienti = ultimaSettimana?.items.map(i => i.nome) ?? []

      const ricetta = await generaRicetta({
        pianoAlimentare: piano,
        ingredientiDisponibili: ingredienti,
        tempoMinuti: tempo,
        pasto
      })

      store.addRicetta(ricetta)
      setRicette(store.getRicette())
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <section className="page">
      <h2>👩‍🍳 Ricette</h2>
      <p className="descrizione">
        Genera una ricetta in base al piano alimentare, alla spesa dell'ultima settimana e al tempo che hai a disposizione.
      </p>

      <div className="form-riga">
        <label>
          Pasto
          <select value={pasto} onChange={e => setPasto(e.target.value)}>
            <option value="colazione">Colazione</option>
            <option value="spuntino">Spuntino</option>
            <option value="pranzo">Pranzo</option>
            <option value="cena">Cena</option>
          </select>
        </label>
        <label>
          Tempo max (minuti)
          <input type="number" value={tempo} min={5} step={5} onChange={e => setTempo(Number(e.target.value))} />
        </label>
        <button onClick={genera} disabled={caricamento}>
          {caricamento ? 'Generazione...' : 'Genera ricetta'}
        </button>
      </div>

      {errore && <p className="errore">{errore}</p>}

      <div className="lista-ricette">
        {ricette.map((r, i) => (
          <article key={i} className="ricetta">
            <h3>
              {r.titolo} <span className="tempo">{r.tempoPreparazioneMinuti} min</span>
            </h3>
            <h4>Ingredienti</h4>
            <ul>
              {r.ingredienti.map((ing, j) => (
                <li key={j}>{ing}</li>
              ))}
            </ul>
            <h4>Preparazione</h4>
            <ol>
              {r.passi.map((passo, j) => (
                <li key={j}>{passo}</li>
              ))}
            </ol>
            {r.note && <p className="note">{r.note}</p>}
          </article>
        ))}
      </div>

      {ricette.length === 0 && !caricamento && <p className="stato">Nessuna ricetta generata ancora.</p>}
    </section>
  )
}
