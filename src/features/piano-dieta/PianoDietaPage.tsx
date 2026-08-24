import { useEffect, useState } from 'react'
import { PhotoUpload } from '../../components/PhotoUpload'
import { estraiPianoAlimentare, generaRiepilogoDietologa } from '../../lib/gemini'
import { store } from '../../lib/storage'
import { oggiISO } from '../../lib/date'
import { ORARIO_PASTI, pianificaPromemoriaGiornaliero, richiediPermessoNotifiche } from '../../lib/notifiche'
import type { PianoAlimentare } from '../../lib/types'

function calcolaAderenzaPercentuale(piano: PianoAlimentare | null): number {
  if (!piano || piano.pasti.length === 0) return 0
  const ultimi7Giorni = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    data.setDate(data.getDate() - i)
    return data.toISOString().slice(0, 10)
  })
  const pastiPrevisti = piano.pasti.length * 7
  const pastiFatti = ultimi7Giorni.reduce((totale, data) => totale + store.getAderenzaGiorno(data).pastiFatti.length, 0)
  return pastiPrevisti === 0 ? 0 : Math.min(1, pastiFatti / pastiPrevisti)
}

export function PianoDietaPage() {
  const [piano, setPiano] = useState<PianoAlimentare | null>(store.getPiano())
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const data = oggiISO()
  const [pastiFatti, setPastiFatti] = useState<string[]>(store.getAderenzaGiorno(data).pastiFatti)
  const [riepilogo, setRiepilogo] = useState<string | null>(null)
  const [generandoRiepilogo, setGenerandoRiepilogo] = useState(false)
  const [copiato, setCopiato] = useState(false)
  const [promemoriaPasti, setPromemoriaPasti] = useState(store.getPromemoriaPasti())

  useEffect(() => {
    if (!promemoriaPasti.attivo || !piano) return
    const annullamenti = piano.pasti
      .filter(pasto => ORARIO_PASTI[pasto.nome.toLowerCase()])
      .map(pasto => {
        const orario = ORARIO_PASTI[pasto.nome.toLowerCase()]
        return pianificaPromemoriaGiornaliero(orario.ora, orario.minuto, `È ora di: ${pasto.nome}`, 'Controlla il tuo piano alimentare in Raccolto.')
      })
    return () => annullamenti.forEach(annulla => annulla())
  }, [promemoriaPasti, piano])

  async function attivaPromemoriaPasti(attivo: boolean) {
    if (attivo) {
      const concesso = await richiediPermessoNotifiche()
      if (!concesso) {
        setErrore('Permesso notifiche negato dal browser: attivalo nelle impostazioni del sito per usare i promemoria.')
        return
      }
    }
    const aggiornato = { attivo }
    setPromemoriaPasti(aggiornato)
    store.setPromemoriaPasti(aggiornato)
  }

  async function handleFile(base64: string, mimeType: string) {
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

  function toggleFatto(nomePasto: string) {
    const aggiornati = pastiFatti.includes(nomePasto)
      ? pastiFatti.filter(p => p !== nomePasto)
      : [...pastiFatti, nomePasto]
    setPastiFatti(aggiornati)
    store.setAderenzaGiorno({ data, pastiFatti: aggiornati })
  }

  async function generaRiepilogo() {
    setGenerandoRiepilogo(true)
    setErrore(null)
    try {
      const settimane = store.getSpesa()
      const ultimaSettimana = settimane[settimane.length - 1]
      const testo = await generaRiepilogoDietologa({
        piano,
        aderenzaPercentuale: calcolaAderenzaPercentuale(piano),
        spesaRecente: ultimaSettimana?.items ?? []
      })
      setRiepilogo(testo)
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setGenerandoRiepilogo(false)
    }
  }

  async function copiaRiepilogo() {
    if (!riepilogo) return
    await navigator.clipboard.writeText(riepilogo)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 2000)
  }

  return (
    <section className="page">
      <h2>📋 Piano alimentare</h2>
      <p className="descrizione">
        Carica una foto (o un PDF) del foglio del/della dietologo/a: l'AI lo trasforma in un piano strutturato.
      </p>

      <PhotoUpload label="Carica piano alimentare (foto o PDF)" onImage={handleFile} accettaPdf />
      {caricamento && <p className="stato">Lettura in corso...</p>}
      {errore && <p className="errore">{errore}</p>}

      {piano?.avvisi && piano.avvisi.length > 0 && (
        <div className="avviso-allergie">
          <span className="avviso-icona">⚠️</span>
          <span>{piano.avvisi.join(' · ')}</span>
        </div>
      )}

      {piano && (
        <>
          <div className="checklist-aderenza">
            <h3>Oggi hai fatto:</h3>
            {piano.pasti.map((pasto, i) => (
              <label key={i} className="voce-checklist">
                <input
                  type="checkbox"
                  checked={pastiFatti.includes(pasto.nome)}
                  onChange={() => toggleFatto(pasto.nome)}
                />
                {pasto.nome}
              </label>
            ))}
          </div>

          <div className="promemoria">
            <label className="voce-checklist">
              <input
                type="checkbox"
                checked={promemoriaPasti.attivo}
                onChange={e => attivaPromemoriaPasti(e.target.checked)}
              />
              Ricordami i pasti (colazione, pranzo, cena...)
            </label>
            <p className="nota-promemoria">Funziona solo mentre l'app resta aperta nel browser.</p>
          </div>

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

          <button className="bottone-secondario" onClick={generaRiepilogo} disabled={generandoRiepilogo}>
            {generandoRiepilogo ? 'Generazione...' : 'Genera riepilogo per la dietologa'}
          </button>

          {riepilogo && (
            <div className="riepilogo">
              <p>{riepilogo}</p>
              <button className="bottone-secondario" onClick={copiaRiepilogo}>
                {copiato ? 'Copiato ✓' : 'Copia negli appunti'}
              </button>
            </div>
          )}
        </>
      )}

      {!piano && !caricamento && <p className="stato">Nessun piano caricato ancora.</p>}
    </section>
  )
}
