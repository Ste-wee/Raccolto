import { useState } from 'react'
import { generaRicetta, generaMenuSettimanale } from '../../lib/gemini'
import { store } from '../../lib/storage'
import type { Ricetta, VoceMenuSettimanale } from '../../lib/types'

function CardRicetta({ ricetta, onTogglePreferita }: { ricetta: Ricetta; onTogglePreferita?: () => void }) {
  return (
    <article className="ricetta">
      <h3>
        {ricetta.titolo}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onTogglePreferita && (
            <button className="cuore" onClick={onTogglePreferita} aria-label="Segna come preferita">
              {ricetta.preferita ? '❤️' : '🤍'}
            </button>
          )}
          <span className="tempo">{ricetta.tempoPreparazioneMinuti} min</span>
        </div>
      </h3>
      {(ricetta.calorie || ricetta.proteineGrammi) && (
        <div className="chip-nutrienti">
          {ricetta.calorie && <span className="chip-nutriente">{Math.round(ricetta.calorie)} kcal</span>}
          {ricetta.proteineGrammi && <span className="chip-nutriente">{Math.round(ricetta.proteineGrammi)}g prot</span>}
          {ricetta.carboidratiGrammi && <span className="chip-nutriente">{Math.round(ricetta.carboidratiGrammi)}g carb</span>}
          {ricetta.grassiGrammi && <span className="chip-nutriente">{Math.round(ricetta.grassiGrammi)}g grassi</span>}
        </div>
      )}
      <h4>Ingredienti</h4>
      <ul>
        {ricetta.ingredienti.map((ing, j) => (
          <li key={j}>{ing}</li>
        ))}
      </ul>
      <h4>Preparazione</h4>
      <ol>
        {ricetta.passi.map((passo, j) => (
          <li key={j}>{passo}</li>
        ))}
      </ol>
      {ricetta.note && <p className="note">{ricetta.note}</p>}
    </article>
  )
}

export function RicettePage() {
  const [tempo, setTempo] = useState(30)
  const [pasto, setPasto] = useState('cena')
  const [porzioni, setPorzioni] = useState(1)
  const [ricette, setRicette] = useState<Ricetta[]>(store.getRicette())
  const [menuSettimanale, setMenuSettimanale] = useState<VoceMenuSettimanale[]>(store.getMenuSettimanale())
  const [esclusi, setEsclusi] = useState<string[]>(store.getIngredientiEsclusi())
  const [nuovoEscluso, setNuovoEscluso] = useState('')
  const [mostraEsclusi, setMostraEsclusi] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [generandoMenu, setGenerandoMenu] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  function ingredientiDisponibili(): string[] {
    const settimane = store.getSpesa()
    const ultimaSettimana = settimane[settimane.length - 1]
    return ultimaSettimana?.items.map(i => i.nome) ?? []
  }

  async function genera() {
    setCaricamento(true)
    setErrore(null)
    try {
      const ricetta = await generaRicetta({
        pianoAlimentare: store.getPiano(),
        ingredientiDisponibili: ingredientiDisponibili(),
        ingredientiEsclusi: esclusi,
        tempoMinuti: tempo,
        pasto,
        porzioni
      })
      store.addRicetta(ricetta)
      setRicette(store.getRicette())
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setCaricamento(false)
    }
  }

  async function generaMenu() {
    setGenerandoMenu(true)
    setErrore(null)
    try {
      const menu = await generaMenuSettimanale({
        pianoAlimentare: store.getPiano(),
        ingredientiDisponibili: ingredientiDisponibili(),
        ingredientiEsclusi: esclusi,
        tempoMinuti: tempo,
        pasto,
        porzioni
      })
      store.setMenuSettimanale(menu)
      setMenuSettimanale(menu)
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setGenerandoMenu(false)
    }
  }

  function togglePreferita(indice: number) {
    const aggiornate = ricette.map((r, i) => (i === indice ? { ...r, preferita: !r.preferita } : r))
    setRicette(aggiornate)
    store.setRicette(aggiornate)
  }

  function aggiungiEscluso() {
    const valore = nuovoEscluso.trim()
    if (!valore || esclusi.includes(valore)) return
    const aggiornati = [...esclusi, valore]
    setEsclusi(aggiornati)
    store.setIngredientiEsclusi(aggiornati)
    setNuovoEscluso('')
  }

  function rimuoviEscluso(ingrediente: string) {
    const aggiornati = esclusi.filter(e => e !== ingrediente)
    setEsclusi(aggiornati)
    store.setIngredientiEsclusi(aggiornati)
  }

  return (
    <section className="page">
      <h2>👩‍🍳 Ricette</h2>
      <p className="descrizione">
        Genera ricette in base al piano alimentare, alla spesa dell'ultima settimana e al tempo che hai a disposizione.
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
        <label>
          Porzioni
          <input type="number" value={porzioni} min={1} step={1} onChange={e => setPorzioni(Number(e.target.value))} />
        </label>
        <button onClick={genera} disabled={caricamento}>
          {caricamento ? 'Generazione...' : 'Genera ricetta'}
        </button>
        <button className="bottone-secondario" onClick={generaMenu} disabled={generandoMenu}>
          {generandoMenu ? 'Generazione menu...' : 'Genera menu settimanale'}
        </button>
        <button className="bottone-secondario" onClick={() => setMostraEsclusi(!mostraEsclusi)}>
          {mostraEsclusi ? 'Nascondi esclusioni' : `Ingredienti da evitare (${esclusi.length})`}
        </button>
      </div>

      {mostraEsclusi && (
        <div className="dispensa">
          <p className="descrizione">Ingredienti che non vuoi mai nelle ricette generate.</p>
          <div className="form-riga">
            <input
              placeholder="es. funghi, olive"
              value={nuovoEscluso}
              onChange={e => setNuovoEscluso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aggiungiEscluso()}
            />
            <button onClick={aggiungiEscluso}>Aggiungi</button>
          </div>
          <div className="chip-lista">
            {esclusi.map(ingrediente => (
              <span key={ingrediente} className="chip">
                {ingrediente}
                <button onClick={() => rimuoviEscluso(ingrediente)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {errore && <p className="errore">{errore}</p>}

      {menuSettimanale.length > 0 && (
        <div className="menu-settimanale">
          <h3>Menu settimanale</h3>
          {menuSettimanale.map((voce, i) => (
            <details key={i} className="riga-menu">
              <summary>
                <span className="giorno-menu">{voce.giorno}</span>
                <span className="titolo-menu">{voce.ricetta.titolo}</span>
              </summary>
              <CardRicetta ricetta={voce.ricetta} />
            </details>
          ))}
        </div>
      )}

      <div className="lista-ricette">
        {ricette.map((r, i) => (
          <CardRicetta key={i} ricetta={r} onTogglePreferita={() => togglePreferita(i)} />
        ))}
      </div>

      {ricette.length === 0 && menuSettimanale.length === 0 && !caricamento && (
        <p className="stato">Nessuna ricetta generata ancora.</p>
      )}
    </section>
  )
}
