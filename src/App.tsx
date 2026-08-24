import { useMemo } from 'react'
import { prodottiDiStagione } from './lib/seasonality'
import './App.css'

function App() {
  const meseCorrente = new Date().getMonth() + 1
  const diStagione = useMemo(() => prodottiDiStagione(undefined, meseCorrente), [meseCorrente])

  return (
    <main className="app">
      <h1>🌾 Raccolto</h1>
      <p className="subtitle">Dieta, spesa e ricette guidate dall'AI, in base alla stagionalità.</p>

      <section>
        <h2>Di stagione questo mese</h2>
        <ul className="grid">
          {diStagione.map(p => (
            <li key={p.nome} className={`card ${p.categoria}`}>
              <span className="nome">{p.nome}</span>
              <span className="categoria">{p.categoria}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="roadmap">
        <h2>In arrivo</h2>
        <ul>
          <li>📋 Import piano alimentare da foto (Gemini)</li>
          <li>🛒 Censimento spesa settimanale</li>
          <li>👩‍🍳 Ricette generate in base al tempo di preparazione</li>
        </ul>
      </section>
    </main>
  )
}

export default App
