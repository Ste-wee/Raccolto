# Raccolto 🌾

**Raccolto** è una web app (PWA) che ti aiuta a seguire la dieta del/della nutrizionista usando l'AI: legge il tuo piano alimentare da una foto, censisce la spesa settimanale, ti dice cosa è di stagione e ti propone ricette in base al tempo che hai per cucinare.

## Funzionalità principali

- **📋 Import piano alimentare** — fotografi il foglio del/della dietologa, Gemini lo legge ed estrae pasti/grammature/alimenti in formato strutturato.
- **🛒 Spesa settimanale** — registri cosa compri: foto scontrino (estrazione automatica via Gemini) oppure inserimento manuale.
- **🍅 Stagionalità** — database di frutta, verdura e carne con mesi di stagionalità: per ogni prodotto vedi se è di stagione ora e quando lo è.
- **👩‍🍳 Ricette su misura** — generazione ricette (Gemini) basata su: piano alimentare, cosa hai in dispensa/spesa, tempo di preparazione disponibile.

## Stack tecnico

| Layer | Scelta | Perché |
|---|---|---|
| Frontend | React + Vite + TypeScript, PWA | Installabile da browser, no store, iterazione veloce |
| AI | Google Gemini API (free tier) | Multimodale (foto → dati strutturati), stesso ecosistema Google |
| Backend/dati | Firebase (Auth, Firestore, Hosting, Cloud Functions) | Free tier generoso, integra bene con Gemini/Vertex AI, niente server da gestire |
| Dati stagionalità | JSON curato a mano (`src/data/seasonal-produce.json`) | Dato statico: niente allucinazioni AI su mesi di stagionalità |

> Nota: le chiamate a Gemini passano da Cloud Functions (backend), mai dal client — così la API key non è mai esposta nel browser.

## Struttura del progetto

```
raccolto/
├── src/
│   ├── data/               # dataset statici (stagionalità prodotti)
│   ├── features/           # moduli per feature (piano-dieta, spesa, ricette)
│   ├── components/         # componenti UI condivisi
│   └── lib/                # client Firebase, helper AI, ecc.
├── functions/              # Cloud Functions (chiamate a Gemini lato server)
├── docs/
│   └── ARCHITECTURE.md     # dettagli architetturali e decisioni
└── public/                 # asset statici, manifest PWA
```

## Setup locale

```bash
npm install
cp .env.example .env   # compila le tue chiavi (Firebase, Gemini)
npm run dev
```

## Roadmap

- [x] Scaffold PWA base (Vite + React + TS)
- [x] Import piano alimentare via foto/PDF + Gemini, con avvisi allergie
- [x] Modulo spesa (foto scontrino + inserimento manuale), lista generata dal piano, dispensa, reparti, costo stimato
- [x] Dataset stagionalità frutta/verdura/carne, griglia con calendario di stagionalità
- [x] Generazione ricette (singola e menu settimanale) con nutrienti, preferiti, porzioni
- [x] Checklist aderenza giornaliera + riepilogo per la dietologa
- [x] Promemoria locali (spesa settimanale, pasti) — solo ad app aperta
- [x] Sostituzioni equivalenti per singolo alimento del piano
- [x] Pagina Impostazioni unica (dispensa, ingredienti esclusi, promemoria)
- [ ] Storico versioni del piano alimentare
- [ ] Setup Firebase (Auth, Firestore, Hosting, Cloud Functions) — ultimo step, sposta anche la chiamata a Gemini lato server
- [ ] Notifiche push reali (Firebase Cloud Messaging, richiede il backend)
- [ ] Deploy PWA installabile

---

Progetto personale di [@Ste-wee](https://github.com/Ste-wee).
