import { useState } from 'react'
import { PhotoUpload } from '../../components/PhotoUpload'
import { estraiScontrino, generaListaSpesa } from '../../lib/gemini'
import { store } from '../../lib/storage'
import { eDiStagione, prodottoConosciuto, prossimaStagione } from '../../lib/seasonality'
import type { SpesaItem } from '../../lib/types'

function settimanaCorrente(): string {
  const ora = new Date()
  const gennaio1 = new Date(ora.getFullYear(), 0, 1)
  const giorni = Math.floor((ora.getTime() - gennaio1.getTime()) / 86400000)
  const numeroSettimana = Math.ceil((giorni + gennaio1.getDay() + 1) / 7)
  return `${ora.getFullYear()}-W${String(numeroSettimana).padStart(2, '0')}`
}

const ORDINE_REPARTI = ['verdura', 'frutta', 'carne', 'pesce', 'altro']

function raggruppaPerReparto(items: SpesaItem[]): [string, SpesaItem[]][] {
  const gruppi = new Map<string, SpesaItem[]>()
  for (const item of items) {
    const reparto = item.categoria || 'altro'
    if (!gruppi.has(reparto)) gruppi.set(reparto, [])
    gruppi.get(reparto)!.push(item)
  }
  return ORDINE_REPARTI.filter(r => gruppi.has(r)).map(r => [r, gruppi.get(r)!])
}

export function SpesaPage() {
  const settimana = settimanaCorrente()
  const settimanaSalvata = store.getSpesa().find(s => s.settimana === settimana)
  const [items, setItems] = useState<SpesaItem[]>(settimanaSalvata?.items ?? [])
  const [suggeriti, setSuggeriti] = useState<SpesaItem[]>(settimanaSalvata?.suggeriti ?? [])

  const [nome, setNome] = useState('')
  const [quantita, setQuantita] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [generandoLista, setGenerandoLista] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  function salva(nuoviItems: SpesaItem[], nuoviSuggeriti = suggeriti) {
    setItems(nuoviItems)
    setSuggeriti(nuoviSuggeriti)
    store.upsertSettimana({ settimana, items: nuoviItems, suggeriti: nuoviSuggeriti })
  }

  function aggiungiManuale() {
    if (!nome.trim()) return
    salva([...items, { nome: nome.trim(), quantita: quantita.trim() || undefined }])
    setNome('')
    setQuantita('')
  }

  function rimuovi(indice: number) {
    salva(items.filter((_, i) => i !== indice))
  }

  async function handleScontrino(base64: string, mimeType: string) {
    setCaricamento(true)
    setErrore(null)
    try {
      const estratti = await estraiScontrino(base64, mimeType)
      salva([...items, ...estratti])
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setCaricamento(false)
    }
  }

  async function generaLista() {
    const piano = store.getPiano()
    if (!piano) {
      setErrore('Carica prima il piano alimentare nella sezione Piano.')
      return
    }
    setGenerandoLista(true)
    setErrore(null)
    try {
      const lista = await generaListaSpesa(piano, store.getDispensa())
      salva(items, lista)
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setGenerandoLista(false)
    }
  }

  function spuntaSuggerito(item: SpesaItem) {
    salva(
      [...items, item],
      suggeriti.filter(s => s.nome !== item.nome)
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Spesa</h2>
          <p className="descrizione">Settimana {settimana}</p>
        </div>
      </header>

      <button className="bottone-secondario" onClick={generaLista} disabled={generandoLista}>
        {generandoLista ? 'Generazione...' : 'Genera lista dal piano alimentare'}
      </button>

      {errore && <p className="errore">{errore}</p>}

      {suggeriti.length > 0 && (
        <div className="lista-suggerita">
          <h3>Suggeriti dal piano</h3>
          {suggeriti.map((item, i) => (
            <div key={i} className="voce-suggerita">
              <span>
                {item.nome}
                {item.quantita ? ` — ${item.quantita}` : ''}
              </span>
              <button onClick={() => spuntaSuggerito(item)}>Aggiungi</button>
            </div>
          ))}
        </div>
      )}

      <div className="form-riga">
        <input
          placeholder="prodotto"
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && aggiungiManuale()}
        />
        <input
          placeholder="quantità (opz.)"
          value={quantita}
          onChange={e => setQuantita(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && aggiungiManuale()}
        />
        <button onClick={aggiungiManuale}>Aggiungi</button>
      </div>

      <PhotoUpload label="Carica foto scontrino" onImage={handleScontrino} />
      {caricamento && <p className="stato">Lettura scontrino in corso...</p>}

      {raggruppaPerReparto(items).map(([reparto, voci]) => (
        <div key={reparto} className="gruppo-reparto">
          <h3 className="titolo-reparto">{reparto}</h3>
          <ul className="lista-spesa">
            {voci.map((item, i) => {
              const conosciuto = prodottoConosciuto(item.nome)
              const stagione = eDiStagione(item.nome)
              const indiceGlobale = items.indexOf(item)
              return (
                <li key={i}>
                  <span className="voce-nome">
                    {item.nome}
                    {item.quantita ? ` — ${item.quantita}` : ''}
                  </span>
                  {!conosciuto ? (
                    <span className="badge sconosciuto" title="Prodotto non presente nel database di stagionalità">
                      non in database
                    </span>
                  ) : stagione ? (
                    <span className="badge stagione">di stagione</span>
                  ) : (
                    <span className="badge fuori-stagione" title={`Torna di stagione: ${prossimaStagione(item.nome)[0] ?? '—'}`}>
                      fuori stagione
                    </span>
                  )}
                  <button className="rimuovi" onClick={() => rimuovi(indiceGlobale)}>
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {items.length === 0 && <p className="stato">Nessun prodotto ancora per questa settimana.</p>}
    </section>
  )
}
