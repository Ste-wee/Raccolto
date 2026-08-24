import { useState } from 'react'
import { store } from '../../lib/storage'
import { richiediPermessoNotifiche } from '../../lib/notifiche'
import type { PromemoriaPasti, PromemoriaSpesa } from '../../lib/types'

const GIORNI_SETTIMANA = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

interface Props {
  promemoriaSpesa: PromemoriaSpesa
  onCambiaPromemoriaSpesa: (p: PromemoriaSpesa) => void
  promemoriaPasti: PromemoriaPasti
  onCambiaPromemoriaPasti: (p: PromemoriaPasti) => void
}

export function ImpostazioniPage({
  promemoriaSpesa,
  onCambiaPromemoriaSpesa,
  promemoriaPasti,
  onCambiaPromemoriaPasti
}: Props) {
  const [dispensa, setDispensa] = useState<string[]>(store.getDispensa())
  const [nuovoArticoloDispensa, setNuovoArticoloDispensa] = useState('')
  const [esclusi, setEsclusi] = useState<string[]>(store.getIngredientiEsclusi())
  const [nuovoEscluso, setNuovoEscluso] = useState('')
  const [errore, setErrore] = useState<string | null>(null)

  function aggiungiADispensa() {
    const valore = nuovoArticoloDispensa.trim()
    if (!valore || dispensa.includes(valore)) return
    const aggiornata = [...dispensa, valore]
    setDispensa(aggiornata)
    store.setDispensa(aggiornata)
    setNuovoArticoloDispensa('')
  }

  function rimuoviDaDispensa(articolo: string) {
    const aggiornata = dispensa.filter(a => a !== articolo)
    setDispensa(aggiornata)
    store.setDispensa(aggiornata)
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

  async function toggleAttivo(
    attivo: boolean,
    onCambia: (v: any) => void,
    valoreAggiornato: any,
    setter: (v: any) => void
  ) {
    if (attivo) {
      const concesso = await richiediPermessoNotifiche()
      if (!concesso) {
        setErrore('Permesso notifiche negato dal browser: attivalo nelle impostazioni del sito per usare i promemoria.')
        return
      }
    }
    onCambia(valoreAggiornato)
    setter(valoreAggiornato)
  }

  return (
    <section className="page">
      <h2>Preferenze</h2>

      {errore && <p className="errore">{errore}</p>}

      <div className="sezione-impostazioni">
        <h3>Dispensa</h3>
        <p className="descrizione">Articoli sempre disponibili, esclusi automaticamente dalla lista della spesa generata dal piano.</p>
        <div className="form-riga">
          <input
            placeholder="es. sale, olio, pasta"
            value={nuovoArticoloDispensa}
            onChange={e => setNuovoArticoloDispensa(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aggiungiADispensa()}
          />
          <button onClick={aggiungiADispensa}>Aggiungi</button>
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

      <div className="sezione-impostazioni">
        <h3>Ingredienti da evitare</h3>
        <p className="descrizione">Non verranno mai usati nelle ricette generate.</p>
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

      <div className="sezione-impostazioni">
        <h3>Promemoria</h3>

        <label className="voce-checklist">
          <input
            type="checkbox"
            checked={promemoriaSpesa.attivo}
            onChange={e =>
              toggleAttivo(
                e.target.checked,
                onCambiaPromemoriaSpesa,
                { ...promemoriaSpesa, attivo: e.target.checked },
                v => store.setPromemoriaSpesa(v)
              )
            }
          />
          Ricordami di fare la spesa
        </label>

        {promemoriaSpesa.attivo && (
          <div className="form-riga">
            <label>
              Giorno
              <select
                value={promemoriaSpesa.giornoSettimana}
                onChange={e => {
                  const aggiornato = { ...promemoriaSpesa, giornoSettimana: Number(e.target.value) }
                  onCambiaPromemoriaSpesa(aggiornato)
                  store.setPromemoriaSpesa(aggiornato)
                }}
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
                value={`${String(promemoriaSpesa.ora).padStart(2, '0')}:${String(promemoriaSpesa.minuto).padStart(2, '0')}`}
                onChange={e => {
                  const [ora, minuto] = e.target.value.split(':').map(Number)
                  const aggiornato = { ...promemoriaSpesa, ora, minuto }
                  onCambiaPromemoriaSpesa(aggiornato)
                  store.setPromemoriaSpesa(aggiornato)
                }}
              />
            </label>
          </div>
        )}

        <label className="voce-checklist">
          <input
            type="checkbox"
            checked={promemoriaPasti.attivo}
            onChange={e =>
              toggleAttivo(e.target.checked, onCambiaPromemoriaPasti, { attivo: e.target.checked }, v =>
                store.setPromemoriaPasti(v)
              )
            }
          />
          Ricordami i pasti (colazione, pranzo, cena...)
        </label>

        <p className="nota-promemoria">Funzionano solo finché l'app resta aperta nel browser.</p>
      </div>
    </section>
  )
}
