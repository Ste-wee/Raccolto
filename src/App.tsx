import { useState } from 'react'
import { StagionalitaPage } from './features/stagionalita/StagionalitaPage'
import { PianoDietaPage } from './features/piano-dieta/PianoDietaPage'
import { SpesaPage } from './features/spesa/SpesaPage'
import { RicettePage } from './features/ricette/RicettePage'
import './App.css'

const TAB = [
  { id: 'stagionalita', icona: '🍅', label: 'Stagione' },
  { id: 'piano', icona: '📋', label: 'Piano' },
  { id: 'spesa', icona: '🛒', label: 'Spesa' },
  { id: 'ricette', icona: '👩‍🍳', label: 'Ricette' }
] as const

type TabId = (typeof TAB)[number]['id']

function App() {
  const [tabAttiva, setTabAttiva] = useState<TabId>('stagionalita')

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Raccolto</h1>
      </header>

      <main className="contenuto">
        {tabAttiva === 'stagionalita' && <StagionalitaPage />}
        {tabAttiva === 'piano' && <PianoDietaPage />}
        {tabAttiva === 'spesa' && <SpesaPage />}
        {tabAttiva === 'ricette' && <RicettePage />}
      </main>

      <nav className="bottom-nav">
        {TAB.map(tab => (
          <button
            key={tab.id}
            className={tab.id === tabAttiva ? 'nav-item attiva' : 'nav-item'}
            onClick={() => setTabAttiva(tab.id)}
          >
            <span className="nav-icona">{tab.icona}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
