import { useEffect, useState } from 'react'
import { StagionalitaPage } from './features/stagionalita/StagionalitaPage'
import { PianoDietaPage } from './features/piano-dieta/PianoDietaPage'
import { SpesaPage } from './features/spesa/SpesaPage'
import { RicettePage } from './features/ricette/RicettePage'
import { ImpostazioniPage } from './features/impostazioni/ImpostazioniPage'
import { Logo } from './components/Logo'
import {
  IconaPiano,
  IconaStagione,
  IconaSpesa,
  IconaRicette,
  IconaImpostazioni,
  IconaIndietro
} from './components/Icone'
import { store } from './lib/storage'
import { ORARIO_PASTI, pianificaPromemoriaGiornaliero, pianificaPromemoriaSettimanale } from './lib/notifiche'
import './App.css'

const TAB = [
  { id: 'piano', Icona: IconaPiano, label: 'Piano' },
  { id: 'stagionalita', Icona: IconaStagione, label: 'Stagione' },
  { id: 'spesa', Icona: IconaSpesa, label: 'Spesa' },
  { id: 'ricette', Icona: IconaRicette, label: 'Ricette' }
] as const

type TabId = (typeof TAB)[number]['id']

function App() {
  const [tabAttiva, setTabAttiva] = useState<TabId>('stagionalita')
  const [vistaImpostazioni, setVistaImpostazioni] = useState(false)
  const [promemoriaSpesa, setPromemoriaSpesa] = useState(store.getPromemoriaSpesa())
  const [promemoriaPasti, setPromemoriaPasti] = useState(store.getPromemoriaPasti())

  // Pianificati qui (livello app, sempre montato) e non dentro le singole pagine:
  // altrimenti cambiando tab il componente si smonta e il promemoria viene annullato.
  useEffect(() => {
    if (!promemoriaSpesa.attivo) return
    return pianificaPromemoriaSettimanale(
      promemoriaSpesa.giornoSettimana,
      promemoriaSpesa.ora,
      promemoriaSpesa.minuto,
      'Giorno della spesa 🛒',
      'Ricordati di controllare la lista in Raccolto.'
    )
  }, [promemoriaSpesa])

  useEffect(() => {
    if (!promemoriaPasti.attivo) return
    const piano = store.getPiano()
    if (!piano) return
    const annullamenti = piano.pasti
      .filter(pasto => ORARIO_PASTI[pasto.nome.toLowerCase()])
      .map(pasto => {
        const orario = ORARIO_PASTI[pasto.nome.toLowerCase()]
        return pianificaPromemoriaGiornaliero(
          orario.ora,
          orario.minuto,
          `È ora di: ${pasto.nome}`,
          'Controlla il tuo piano alimentare in Raccolto.'
        )
      })
    return () => annullamenti.forEach(annulla => annulla())
  }, [promemoriaPasti])

  function vaiAlTab(id: TabId) {
    setTabAttiva(id)
    setVistaImpostazioni(false)
  }

  return (
    <div className="app">
      <header className="header">
        {vistaImpostazioni ? (
          <div className="header-riga">
            <button className="icona-header" onClick={() => setVistaImpostazioni(false)} aria-label="Indietro">
              <IconaIndietro />
            </button>
            <h1>Impostazioni</h1>
          </div>
        ) : (
          <div className="header-riga">
            <div className="marchio">
              <Logo dimensione={32} />
              <h1>Raccolto</h1>
            </div>
            <button className="icona-header" onClick={() => setVistaImpostazioni(true)} aria-label="Impostazioni">
              <IconaImpostazioni />
            </button>
          </div>
        )}
      </header>

      <main className="contenuto">
        {vistaImpostazioni ? (
          <ImpostazioniPage
            promemoriaSpesa={promemoriaSpesa}
            onCambiaPromemoriaSpesa={setPromemoriaSpesa}
            promemoriaPasti={promemoriaPasti}
            onCambiaPromemoriaPasti={setPromemoriaPasti}
          />
        ) : (
          <>
            {tabAttiva === 'stagionalita' && <StagionalitaPage />}
            {tabAttiva === 'piano' && <PianoDietaPage />}
            {tabAttiva === 'spesa' && <SpesaPage />}
            {tabAttiva === 'ricette' && <RicettePage />}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {TAB.map(tab => (
          <button
            key={tab.id}
            className={!vistaImpostazioni && tab.id === tabAttiva ? 'nav-item attiva' : 'nav-item'}
            onClick={() => vaiAlTab(tab.id)}
          >
            <tab.Icona />
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
