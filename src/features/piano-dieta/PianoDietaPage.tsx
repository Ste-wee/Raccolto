import { useState } from 'react'
import { PhotoUpload } from '../../components/PhotoUpload'
import { estraiPianoAlimentare } from '../../lib/gemini'
import { store } from '../../lib/storage'
import type { PianoAlimentare } from '../../lib/types'

export function PianoDietaPage() {
  const [piano, setPiano] = useState<PianoAlimentare | null>(store.getPiano())
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  async function handleImage(base64: string, mimeType: string) {
    setCaricamento(true)
    setErrore(null)
    try {
      const risultato = await estraiPianoAlimentare(base64, mimeType)
      setPiano(risultato)
      store.setPiano(risultato)
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <section className="page">
      <h2>📋 Piano alimentare</h2>
      <p className="descrizione">
        Carica una foto del foglio del/della dietologo/a: l'AI lo trasforma in un piano strutturato.
      </p>

      <PhotoUpload label="Carica foto piano alimentare" onImage={handleImage} />
      {caricamento && <p className="stato">Lettura in corso...</p>}
      {errore && <p className="errore">{errore}</p>}

      {piano && (
        <div className="piano">
          {piano.pasti.map((pasto, i) => (
            <div key={i} className="pasto">
              <h3>{pasto.nome}</h3>
              <ul>
                {pasto.alimenti.map((alimento, j) => (
                  <li key={j}>
                    {alimento.nome}
                    {alimento.quantita ? ` — ${alimento.quantita}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {piano.note && (
            <p className="note">
              <strong>Note:</strong> {piano.note}
            </p>
          )}
        </div>
      )}

      {!piano && !caricamento && <p className="stato">Nessun piano caricato ancora.</p>}
    </section>
  )
}
