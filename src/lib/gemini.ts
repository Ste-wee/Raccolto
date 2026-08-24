import type { PianoAlimentare, SpesaItem, Ricetta, VoceMenuSettimanale } from './types'

// NOTA: per ora la chiamata a Gemini parte dal client, comodo per sviluppare
// in locale senza backend. Prima di pubblicare l'app va spostata dietro una
// Cloud Function (vedi docs/ARCHITECTURE.md) così la API key non finisce mai
// nel bundle JS pubblico.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODELLO = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO}:generateContent`

interface ParteImmagine {
  mimeType: string
  base64: string
}

async function chiamaGemini(prompt: string, immagini: ParteImmagine[] = [], schema?: object): Promise<any> {
  if (!API_KEY) {
    throw new Error(
      "Manca VITE_GEMINI_API_KEY nel file .env (copia .env.example in .env e inserisci una chiave gratuita da https://aistudio.google.com/app/apikey)"
    )
  }

  const parts: Record<string, unknown>[] = [{ text: prompt }]
  for (const img of immagini) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  }

  const body: Record<string, unknown> = { contents: [{ parts }] }
  if (schema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema: schema }
  }

  const risposta = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!risposta.ok) {
    const testoErrore = await risposta.text()
    throw new Error(`Errore Gemini (${risposta.status}): ${testoErrore}`)
  }

  const dati = await risposta.json()
  const testo = dati.candidates?.[0]?.content?.parts?.[0]?.text
  if (!testo) throw new Error('Risposta di Gemini vuota o inattesa')
  return schema ? JSON.parse(testo) : testo
}

export async function estraiPianoAlimentare(base64: string, mimeType: string): Promise<PianoAlimentare> {
  const schema = {
    type: 'OBJECT',
    properties: {
      pasti: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            nome: { type: 'STRING' },
            alimenti: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  nome: { type: 'STRING' },
                  quantita: { type: 'STRING' }
                },
                required: ['nome']
              }
            }
          },
          required: ['nome', 'alimenti']
        }
      },
      avvisi: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Allergie, intolleranze o alimenti da evitare, scritti esplicitamente nel foglio'
      },
      note: { type: 'STRING' }
    },
    required: ['pasti']
  }

  const prompt =
    'Questa immagine (o documento) è il piano alimentare scritto da un/una dietologo/a per un/a paziente. ' +
    'Estrai la struttura in JSON: per ogni pasto (colazione, spuntino, pranzo, merenda, cena, ecc.) ' +
    'elenca gli alimenti con la relativa quantità se indicata. Se ci sono allergie, intolleranze o alimenti ' +
    'da evitare scritti esplicitamente, mettili nell\'array "avvisi" (uno per riga, es. "evitare glutine"). ' +
    'Altre note generali meno critiche vanno nel campo "note". Rispondi SOLO con il JSON, in italiano, ' +
    'mantenendo i nomi degli alimenti come scritti nel foglio.'

  const risultato = await chiamaGemini(prompt, [{ mimeType, base64 }], schema)
  return { ...risultato, creatoIl: new Date().toISOString() }
}

export async function estraiScontrino(base64: string, mimeType: string): Promise<SpesaItem[]> {
  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        nome: { type: 'STRING' },
        quantita: { type: 'STRING' },
        categoria: { type: 'STRING', enum: ['frutta', 'verdura', 'carne', 'altro'] },
        prezzo: { type: 'NUMBER', description: 'prezzo in euro della voce, se leggibile sullo scontrino' }
      },
      required: ['nome']
    }
  }

  const prompt =
    'Questo è uno scontrino della spesa. Estrai SOLO i prodotti alimentari (ignora intestazione, ' +
    'totali, sconti, punti fedeltà, IVA). Per ciascun prodotto indica: nome normalizzato e leggibile ' +
    '(es. "pomodori" invece di "POMODOR RAMATO KG"), quantità se leggibile, categoria tra ' +
    'frutta/verdura/carne/altro, e prezzo in euro se presente sullo scontrino. Rispondi SOLO con il JSON.'

  return chiamaGemini(prompt, [{ mimeType, base64 }], schema)
}

export interface InputRicetta {
  pianoAlimentare?: PianoAlimentare | null
  ingredientiDisponibili: string[]
  ingredientiEsclusi?: string[]
  tempoMinuti: number
  pasto?: string
  porzioni?: number
}

const SCHEMA_RICETTA = {
  type: 'OBJECT',
  properties: {
    titolo: { type: 'STRING' },
    tempoPreparazioneMinuti: { type: 'NUMBER' },
    porzioni: { type: 'NUMBER' },
    ingredienti: { type: 'ARRAY', items: { type: 'STRING' } },
    passi: { type: 'ARRAY', items: { type: 'STRING' } },
    calorie: { type: 'NUMBER', description: 'calorie totali stimate a porzione' },
    proteineGrammi: { type: 'NUMBER' },
    carboidratiGrammi: { type: 'NUMBER' },
    grassiGrammi: { type: 'NUMBER' },
    note: { type: 'STRING' }
  },
  required: ['titolo', 'tempoPreparazioneMinuti', 'ingredienti', 'passi']
}

function descriviVincoliDieta(piano?: PianoAlimentare | null, esclusi?: string[]): string {
  const vincoloPiano = piano
    ? `Il piano alimentare del/della paziente prevede questi pasti: ${JSON.stringify(piano.pasti)}. ` +
      `Avvisi/allergie da rispettare SEMPRE: ${piano.avvisi?.join(', ') || 'nessuno'}. ` +
      `Altre note del/della dietologo/a: ${piano.note ?? 'nessuna'}.`
    : 'Non è disponibile un piano alimentare specifico: proponi qualcosa di bilanciato e sano.'
  const vincoloEsclusi = esclusi?.length ? ` NON usare mai questi ingredienti, il/la paziente non li gradisce: ${esclusi.join(', ')}.` : ''
  return vincoloPiano + vincoloEsclusi
}

export async function generaRicetta(input: InputRicetta): Promise<Ricetta> {
  const prompt =
    `Proponi UNA ricetta ${input.pasto ? `per ${input.pasto}` : ''} realizzabile in MASSIMO ${input.tempoMinuti} minuti, ` +
    `per ${input.porzioni ?? 1} persona/e, usando preferibilmente questi ingredienti disponibili: ` +
    `${input.ingredientiDisponibili.join(', ') || 'nessuno in particolare, proponi tu'}. ` +
    `${descriviVincoliDieta(input.pianoAlimentare, input.ingredientiEsclusi)} ` +
    'Includi anche una stima approssimativa di calorie e macronutrienti a porzione. Rispondi SOLO con il JSON, in italiano.'

  const risultato = await chiamaGemini(prompt, [], SCHEMA_RICETTA)
  return { ...risultato, creataIl: new Date().toISOString() }
}

export interface InputMenuSettimanale extends InputRicetta {
  giorni?: string[]
}

export async function generaMenuSettimanale(input: InputMenuSettimanale): Promise<VoceMenuSettimanale[]> {
  const giorni = input.giorni ?? ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        giorno: { type: 'STRING' },
        pasto: { type: 'STRING' },
        ricetta: SCHEMA_RICETTA
      },
      required: ['giorno', 'pasto', 'ricetta']
    }
  }

  const prompt =
    `Proponi un menu per ${input.pasto ?? 'cena'} per ciascuno di questi 7 giorni: ${giorni.join(', ')}. ` +
    `Ogni ricetta deve richiedere al massimo ${input.tempoMinuti} minuti di preparazione, per ${input.porzioni ?? 1} persona/e. ` +
    `Varia le ricette durante la settimana, non ripetere lo stesso piatto. Usa preferibilmente questi ingredienti ` +
    `disponibili quando ha senso: ${input.ingredientiDisponibili.join(', ') || 'nessuno in particolare'}. ` +
    `${descriviVincoliDieta(input.pianoAlimentare, input.ingredientiEsclusi)} ` +
    'Includi una stima di calorie e macronutrienti per ogni ricetta. Rispondi SOLO con il JSON (array di 7 elementi), in italiano.'

  const risultato = await chiamaGemini(prompt, [], schema)
  const creataIl = new Date().toISOString()
  return (risultato as any[]).map(voce => ({ ...voce, ricetta: { ...voce.ricetta, creataIl } }))
}

export async function generaListaSpesa(piano: PianoAlimentare, dispensa: string[]): Promise<SpesaItem[]> {
  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        nome: { type: 'STRING' },
        quantita: { type: 'STRING', description: 'quantità totale da comprare per l\'intera settimana' },
        categoria: { type: 'STRING', enum: ['frutta', 'verdura', 'carne', 'altro'] }
      },
      required: ['nome']
    }
  }

  const prompt =
    `Questo è il piano alimentare settimanale di un/a paziente: ${JSON.stringify(piano.pasti)}. ` +
    'Calcola la lista della spesa necessaria per UNA settimana intera, sommando le quantità di ogni ' +
    'alimento su tutti i pasti in cui compare (es. se il pollo compare 5 volte a 150g, il totale è 750g). ' +
    `NON includere questi alimenti che il/la paziente ha già sempre in dispensa: ${dispensa.join(', ') || 'nessuno'}. ` +
    'Per ciascuna voce indica nome, quantità totale stimata e categoria (frutta/verdura/carne/altro). ' +
    'Rispondi SOLO con il JSON.'

  return chiamaGemini(prompt, [], schema)
}

export async function suggerisciSostituto(
  alimento: string,
  piano?: PianoAlimentare | null
): Promise<{ sostituto: string; motivo: string }> {
  const schema = {
    type: 'OBJECT',
    properties: {
      sostituto: { type: 'STRING' },
      motivo: { type: 'STRING' }
    },
    required: ['sostituto', 'motivo']
  }

  const vincoli = piano?.avvisi?.length ? `Rispetta sempre questi avvisi/allergie: ${piano.avvisi.join(', ')}.` : ''

  const prompt =
    `Suggerisci UN alimento sostitutivo equivalente dal punto di vista nutrizionale per "${alimento}", ` +
    `adatto a un piano alimentare seguito da un/a dietologo/a. ${vincoli} ` +
    'Spiega brevemente perché è un buon sostituto (una frase). Rispondi SOLO con il JSON, in italiano.'

  return chiamaGemini(prompt, [], schema)
}

export async function generaRiepilogoDietologa(input: {
  piano: PianoAlimentare | null
  aderenzaPercentuale: number
  spesaRecente: SpesaItem[]
}): Promise<string> {
  const prompt =
    'Scrivi un breve riepilogo in italiano (massimo 150 parole, tono colloquiale e diretto) da mostrare ' +
    'a un/una dietologo/a al prossimo controllo di un/a paziente. Includi: percentuale di aderenza al ' +
    `piano nell'ultimo periodo (${Math.round(input.aderenzaPercentuale * 100)}%), alimenti principali ` +
    `acquistati di recente (${input.spesaRecente.map(i => i.nome).join(', ') || 'nessuno registrato'}), ` +
    'ed eventuali difficoltà evidenti nel seguire il piano in base a queste informazioni. Nessun titolo, solo il testo del riepilogo.'

  return chiamaGemini(prompt)
}
