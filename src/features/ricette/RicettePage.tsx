import { useState } from 'react'
import { cercaProposteWeb, generaProposteAI, generaMenuSettimanale } from '../../lib/gemini'
import { store } from '../../lib/storage'
import type { Ricetta, VoceMenuSettimanale } from '../../lib/types'

function Nutrienti({ ricetta }: { ricetta: Ricetta }) {
  if (!ricetta.calorie && !ricetta.proteineGrammi) return null
  return (
    <div className="chip-nutrienti">
      {ricetta.calorie && <span className="chip-nutriente">{Math.round(ricetta.calorie)} kcal</span>}
      {ricetta.proteineGrammi && <span className="chip-nutriente">{Math.round(ricetta.proteineGrammi)}g prot</span>}
      {ricetta.carboidratiGrammi && <span className="chip-nutriente">{Math.round(ricetta.carboidratiGrammi)}g carb</span>}
      {ricetta.grassiGrammi && <span className="chip-nutriente">{Math.round(ricetta.grassiGrammi)}g grassi</span>}
    </div>
  )
}

function CorpoRicetta({ ricetta }: { ricetta: Ricetta }) {
  return (
    <>
      <h4>Ingredienti</h4>
      <ul>
        {ricetta.ingredienti.map((ing, i) => (
          <li key={i}>{ing}</li>
        ))}
      </ul>
      <h4>Preparazione</h4>
      <ol>
        {ricetta.passi.map((passo, i) => (
          <li key={i}>{passo}</li>
        ))}
      </ol>
      {ricetta.note && <p className="note">{ricetta.note}</p>}
      {ricetta.origine === 'web' && ricetta.fonti && ricetta.fonti.length > 0 && (
        <div className="fonti">
          <h4>Fonti consultate</h4>
          <ul className="lista-fonti">
            {ricetta.fonti.map((fonte, i) => (
              <li key={i}>
                <a href={fonte.url} target="_blank" rel="noreferrer">
                  {fonte.titolo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {ricetta.origine === 'ai' && (
        <p className="nota-origine">Ricetta creata dall'AI: non proviene da una fonte esistente.</p>
      )}
    </>
  )
}

function CardRicetta({ ricetta, onTogglePreferita }: { ricetta: Ricetta; onTogglePreferita?: () => void }) {
  return (
    <article className="ricetta">
      <h3>
        {ricetta.titolo}
        <span className="azioni-ricetta">
          {onTogglePreferita && (
            <button className="cuore" onClick={onTogglePreferita} aria-label="Segna come preferita">
              {ricetta.preferita ? '❤️' : '🤍'}
            </button>
          )}
          <span className="tempo">{ricetta.tempoPreparazioneMinuti} min</span>
        </span>
      </h3>
      <Nutrienti ricetta={ricetta} />
      <CorpoRicetta ricetta={ricetta} />
    </article>
  )
}

function CardProposta({ ricetta, onScegli }: { ricetta: Ricetta; onScegli: () => void }) {
  return (
    <details className="proposta">
      <summary>
        <span className="proposta-info">
          <span className="proposta-titolo">{ricetta.titolo}</span>
          <span className="proposta-meta">
            {ricetta.tempoPreparazioneMinuti} min
            {ricetta.calorie ? ` · ${Math.round(ricetta.calorie)} kcal` : ''}
            {ricetta.origine === 'web' ? ' · dal web' : ' · AI'}
          </span>
        </span>
      </summary>
      <div className="proposta-corpo">
        <CorpoRicetta ricetta={ricetta} />
        <button className="bottone-primario" onClick={onScegli}>
          Scegli questa ricetta
        </button>
      </div>
    </details>
  )
}

export function RicettePage() {
  const [tempo, setTempo] = useState(30)
  const [pasto, setPasto] = useState('cena')
  const [porzioni, setPorzioni] = useState(1)
  const [ricette, setRicette] = useState<Ricetta[]>(store.getRicette())
  const [menuSettimanale, setMenuSettimanale] = useState<VoceMenuSettimanale[]>(store.getMenuSettimanale())
  const [proposteWeb, setProposteWeb] = useState<Ricetta[]>([])
  const [proposteAI, setProposteAI] = useState<Ricetta[]>([])
  const [cercando, setCercando] = useState(false)
  const [generandoMenu, setGenerandoMenu] = useState(false)
  const [errori, setErrori] = useState<string[]>([])

  function parametri() {
    const settimane = store.getSpesa()
    const ultimaSettimana = settimane[settimane.length - 1]
    return {
      pianoAlimentare: store.getPiano(),
      ingredientiDisponibili: ultimaSettimana?.items.map(i => i.nome) ?? [],
      ingredientiEsclusi: store.getIngredientiEsclusi(),
      tempoMinuti: tempo,
      pasto,
      porzioni
    }
  }

  async function trovaProposte() {
    setCercando(true)
    setErrori([])
    setProposteWeb([])
    setProposteAI([])

    const args = parametri()
    // Le due ricerche sono indipendenti: se una fallisce l'altra deve comunque arrivare.
    const [web, ai] = await Promise.allSettled([cercaProposteWeb(args), generaProposteAI(args)])

    const problemi: string[] = []
    if (web.status === 'fulfilled') setProposteWeb(web.value)
    else problemi.push(`Ricerca dal web non riuscita: ${web.reason.message}`)
    if (ai.status === 'fulfilled') setProposteAI(ai.value)
    else problemi.push(`Proposte AI non riuscite: ${ai.reason.message}`)

    setErrori(problemi)
    setCercando(false)
  }

  function scegli(ricetta: Ricetta) {
    store.addRicetta(ricetta)
    setRicette(store.getRicette())
    setProposteWeb([])
    setProposteAI([])
  }

  async function generaMenu() {
    setGenerandoMenu(true)
    setErrori([])
    try {
      const menu = await generaMenuSettimanale(parametri())
      store.setMenuSettimanale(menu)
      setMenuSettimanale(menu)
    } catch (e) {
      setErrori([(e as Error).message])
    } finally {
      setGenerandoMenu(false)
    }
  }

  function togglePreferita(indice: number) {
    const aggiornate = ricette.map((r, i) => (i === indice ? { ...r, preferita: !r.preferita } : r))
    setRicette(aggiornate)
    store.setRicette(aggiornate)
  }

  const ciSonoProposte = proposteWeb.length > 0 || proposteAI.length > 0

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Ricette</h2>
          <p className="descrizione">Sei proposte tra cui scegliere: tre trovate online, tre create dall'AI.</p>
        </div>
      </header>

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
        <button className="bottone-primario" onClick={trovaProposte} disabled={cercando}>
          {cercando ? 'Ricerca in corso...' : 'Trova 6 proposte'}
        </button>
        <button className="bottone-secondario" onClick={generaMenu} disabled={generandoMenu}>
          {generandoMenu ? 'Generazione menu...' : 'Genera menu settimanale'}
        </button>
      </div>

      {errori.map((errore, i) => (
        <p key={i} className="errore">
          {errore}
        </p>
      ))}

      {ciSonoProposte && (
        <div className="proposte">
          {proposteWeb.length > 0 && (
            <>
              <h3 className="titolo-gruppo">
                Trovate online
                <span className="etichetta-origine web">con fonti</span>
              </h3>
              {proposteWeb.map((r, i) => (
                <CardProposta key={`web-${i}`} ricetta={r} onScegli={() => scegli(r)} />
              ))}
            </>
          )}
          {proposteAI.length > 0 && (
            <>
              <h3 className="titolo-gruppo">
                Create dall'AI
                <span className="etichetta-origine ai">senza fonte</span>
              </h3>
              {proposteAI.map((r, i) => (
                <CardProposta key={`ai-${i}`} ricetta={r} onScegli={() => scegli(r)} />
              ))}
            </>
          )}
        </div>
      )}

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

      {ricette.length > 0 && (
        <div className="lista-ricette">
          <h3 className="titolo-gruppo">Le tue ricette</h3>
          {ricette.map((r, i) => (
            <CardRicetta key={i} ricetta={r} onTogglePreferita={() => togglePreferita(i)} />
          ))}
        </div>
      )}

      {ricette.length === 0 && menuSettimanale.length === 0 && !ciSonoProposte && !cercando && (
        <p className="stato">Nessuna ricetta ancora. Premi "Trova 6 proposte" per iniziare.</p>
      )}
    </section>
  )
}
