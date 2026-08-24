# Architettura

## Flusso dati

```
┌─────────────┐      foto piano/scontrino      ┌────────────────────┐
│   Client    │ ───────────────────────────────▶│  Cloud Function     │
│  (PWA React)│                                  │  (chiama Gemini)    │
│             │◀─────────────────────────────────│  estrae JSON        │
└─────────────┘      dati strutturati            └────────────────────┘
       │                                                    │
       │ salva/legge                                        │
       ▼                                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore (per utente)                    │
│  - piano_alimentare                                           │
│  - spesa_settimanale                                           │
│  - ricette_generate                                            │
└─────────────────────────────────────────────────────────────┘
       ▲
       │ join lato client
       │
┌─────────────────────┐
│ seasonal-produce.json│  (dato statico, versionato nel repo)
└─────────────────────┘
```

## Perché la API key di Gemini non è mai nel client

Qualunque chiamata a Gemini passa da una Cloud Function autenticata (l'utente deve essere loggato via Firebase Auth). La key vive solo come variabile d'ambiente della function. Questo evita che chiunque ispezioni il bundle JS e rubi la key.

## Moduli (`src/features/`)

- **piano-dieta/** — upload foto → Cloud Function `parseDietPlan` → salva in Firestore (`piano_alimentare/{uid}`)
- **spesa/** — upload foto scontrino → Cloud Function `parseReceipt` → merge con inserimento manuale → salva in Firestore (`spesa_settimanale/{uid}/{settimana}`)
- **stagionalita/** — legge `seasonal-produce.json`, confronta con mese corrente, mostra badge "di stagione" / "non di stagione (torna a [mese])"
- **ricette/** — input: piano dieta + spesa disponibile + tempo max preparazione → Cloud Function `generateRecipe` → mostra ricetta strutturata (ingredienti, passi, tempo stimato)

## Formato dati (esempi)

### `seasonal-produce.json`
```json
{
  "pomodoro": { "categoria": "verdura", "mesi_stagione": [6,7,8,9] },
  "zucca": { "categoria": "verdura", "mesi_stagione": [9,10,11,12] }
}
```

### Piano alimentare estratto da Gemini (esempio)
```json
{
  "pasti": [
    { "nome": "colazione", "alimenti": [{ "nome": "yogurt greco", "quantita": "150g" }] }
  ],
  "note": "evitare zuccheri raffinati"
}
```

## Decisioni aperte (da validare più avanti)

- Firebase vs Supabase per il backend — scelto Firebase per l'integrazione più diretta con l'ecosistema Google/Gemini, ma è reversibile nelle fasi iniziali.
- Se in futuro serve maggiore qualità nella generazione ricette, valutare un modello diverso solo per quello step (Gemini resta per OCR/estrazione, dove è già ottimo).
