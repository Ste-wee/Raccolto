import { useState } from 'react'
import { PhotoUpload } from '../../components/PhotoUpload'
import { estraiScontrino } from '../../lib/gemini'
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

export function SpesaPage() {
  const settimana = settimanaCorrente()
  const [items, setItems] = useState<SpesaItem[]>(
    store.getSpesa().find(s => s.settimana === settimana)?.items ?? []
  )
  const [nome, setNome] = useState('')
  const [quantita, setQuantita] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  function salva(nuoviItems: SpesaItem[]) {
    setItems(nuoviItems)
    store.upsertSettimana({ settimana, items: nuoviItems })
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

  return (
    <section className="page">
      <h2>🛒 Spesa — settimana {settimana}</h2>

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
      {errore && <p className="errore">{errore}</p>}

      <ul className="lista-spesa">
        {items.map((item, i) => {
          const conosciuto = prodottoConosciuto(item.nome)
          const stagione = eDiStagione(item.nome)
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
              <button className="rimuovi" onClick={() => rimuovi(i)}>
                ✕
              </button>
            </li>
          )
        })}
      </ul>

      {items.length === 0 && <p className="stato">Nessun prodotto ancora per questa settimana.</p>}
    </section>
  )
}
