import { useEffect, useState } from 'react'
import { PhotoUpload } from '../../components/PhotoUpload'
import { estraiScontrino, generaListaSpesa } from '../../lib/gemini'
import { store } from '../../lib/storage'
import { eDiStagione, prodottoConosciuto, prossimaStagione } from '../../lib/seasonality'
import { pianificaPromemoriaSettimanale, richiediPermessoNotifiche } from '../../lib/notifiche'
import type { SpesaItem } from '../../lib/types'

const GIORNI_SETTIMANA = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

function settimanaCorrente(): string {
  const ora = new Date()
  const gennaio1 = new Date(ora.getFullYear(), 0, 1)
  const giorni = Math.floor((ora.getTime() - gennaio1.getTime()) / 86400000)
  const numeroSettimana = Math.ceil((giorni + gennaio1.getDay() + 1) / 7)
  return `${ora.getFullYear()}-W${String(numeroSettimana).padStart(2, '0')}`
}

const ORDINE_REPARTI = ['frutta', 'verdura', 'carne', 'altro']

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
  const [dispensa, setDispensa] = useState<string[]>(store.getDispensa())
  const [mostraDispensa, setMostraDispensa] = useState(false)
  const [nuovoArticoloDispensa, setNuovoArticoloDispensa] = useState('')
  const [promemoria, setPromemoria] = useState(store.getPromemoriaSpesa())

  useEffect(() => {
    if (!promemoria.attivo) return
    const annulla = pianificaPromemoriaSettimanale(
      promemoria.giornoSettimana,
      promemoria.ora,
      promemoria.minuto,
      'Giorno della spesa 🛒',
      'Ricordati di controllare la lista in Raccolto.'
    )
    return annulla
  }, [promemoria])

  async function aggiornaPromemoria(nuove: typeof promemoria) {
    if (nuove.attivo) {
      const concesso = await richiediPermessoNotifiche()
      if (!concesso) {
        setErrore('Permesso notifiche negato dal browser: attivalo nelle impostazioni del sito per usare i promemoria.')
        return
      }
    }
    setPromemoria(nuove)
    store.setPromemoriaSpesa(nuove)
  }

  const [nome, setNome] = useState('')
  const [quantita, setQuantita] = useState('')
  const [prezzo, setPrezzo] = useState('')
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
    salva([
      ...items,
      { nome: nome.trim(), quantita: quantita.trim() || undefined, prezzo: prezzo ? Number(prezzo) : undefined }
    ])
    setNome('')
    setQuantita('')
    setPrezzo('')
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
      const lista = await generaListaSpesa(piano, dispensa)
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

  function aggiungiADispensa(nomeArticolo: string) {
    const valore = nomeArticolo.trim()
    if (!valore || dispensa.includes(valore)) return
    const aggiornata = [...dispensa, valore]
    setDispensa(aggiornata)
    store.setDispensa(aggiornata)
  }

  function rimuoviDaDispensa(articolo: string) {
    const aggiornata = dispensa.filter(a => a !== articolo)
    setDispensa(aggiornata)
    store.setDispensa(aggiornata)
  }

  const costoTotale = items.reduce((totale, item) => totale + (item.prezzo ?? 0), 0)

  return (
    <section className="page">
      <h2>🛒 Spesa — settimana {settimana}</h2>

      <button className="bottone-secondario" onClick={generaLista} disabled={generandoLista}>
        {generandoLista ? 'Generazione...' : 'Genera lista dal piano alimentare'}
      </button>
      <button className="bottone-secondario" onClick={() => setMostraDispensa(!mostraDispensa)}>
        {mostraDispensa ? 'Nascondi dispensa' : `Dispensa (${dispensa.length})`}
      </button>

      <div className="promemoria">
        <label className="voce-checklist">
          <input
            type="checkbox"
            checked={promemoria.attivo}
            onChange={e => aggiornaPromemoria({ ...promemoria, attivo: e.target.checked })}
          />
          Ricordami di fare la spesa
        </label>
        {promemoria.attivo && (
          <div className="form-riga">
            <label>
              Giorno
              <select
                value={promemoria.giornoSettimana}
                onChange={e => aggiornaPromemoria({ ...promemoria, giornoSettimana: Number(e.target.value) })}
              >
                {GIORNI_SETTIMANA.map((giorno, i) => (
                  <option key={giorno} value={i}>
                    {giorno}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ora
              <input
                type="time"
                value={`${String(promemoria.ora).padStart(2, '0')}:${String(promemoria.minuto).padStart(2, '0')}`}
                onChange={e => {
                  const [ora, minuto] = e.target.value.split(':').map(Number)
                  aggiornaPromemoria({ ...promemoria, ora, minuto })
                }}
              />
            </label>
          </div>
        )}
        <p className="nota-promemoria">Funziona solo mentre l'app resta aperta nel browser.</p>
      </div>

      {mostraDispensa && (
        <div className="dispensa">
          <p className="descrizione">Articoli sempre disponibili, esclusi automaticamente dalla lista generata.</p>
          <div className="form-riga">
            <input
              placeholder="es. sale, olio, pasta"
              value={nuovoArticoloDispensa}
              onChange={e => setNuovoArticoloDispensa(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  aggiungiADispensa(nuovoArticoloDispensa)
                  setNuovoArticoloDispensa('')
                }
              }}
            />
            <button
              onClick={() => {
                aggiungiADispensa(nuovoArticoloDispensa)
                setNuovoArticoloDispensa('')
              }}
            >
              Aggiungi
            </button>
          </div>
          <div className="chip-lista">
            {dispensa.map(articolo => (
              <span key={articolo} className="chip">
                {articolo}
                <button onClick={() => rimuoviDaDispensa(articolo)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

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
        <input
          placeholder="prezzo € (opz.)"
          type="number"
          value={prezzo}
          onChange={e => setPrezzo(e.target.value)}
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
                    {item.prezzo ? ` (€${item.prezzo.toFixed(2)})` : ''}
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

      {costoTotale > 0 && (
        <p className="costo-totale">
          Totale stimato: <strong>€{costoTotale.toFixed(2)}</strong>
        </p>
      )}
    </section>
  )
}
