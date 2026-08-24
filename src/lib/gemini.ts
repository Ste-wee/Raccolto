import type { PianoAlimentare, SpesaItem, Ricetta } from './types'

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
      note: { type: 'STRING' }
    },
    required: ['pasti']
  }

  const prompt =
    'Questa immagine è il piano alimentare scritto da un/una dietologo/a per un/a paziente. ' +
    'Estrai la struttura in JSON: per ogni pasto (colazione, spuntino, pranzo, merenda, cena, ecc.) ' +
    'elenca gli alimenti con la relativa quantità se indicata. Se ci sono note generali (alimenti da ' +
    'evitare, indicazioni particolari) mettile nel campo "note". Rispondi SOLO con il JSON, in italiano, ' +
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
        categoria: { type: 'STRING', enum: ['frutta', 'verdura', 'carne', 'altro'] }
      },
      required: ['nome']
    }
  }

  const prompt =
    'Questo è uno scontrino della spesa. Estrai SOLO i prodotti alimentari (ignora intestazione, ' +
    'totali, sconti, punti fedeltà, IVA). Per ciascun prodotto indica: nome normalizzato e leggibile ' +
    '(es. "pomodori" invece di "POMODOR RAMATO KG"), quantità se leggibile, e categoria tra ' +
    'frutta/verdura/carne/altro. Rispondi SOLO con il JSON.'

  return chiamaGemini(prompt, [{ mimeType, base64 }], schema)
}

export interface InputRicetta {
  pianoAlimentare?: PianoAlimentare | null
  ingredientiDisponibili: string[]
  tempoMinuti: number
  pasto?: string
}

export async function generaRicetta(input: InputRicetta): Promise<Ricetta> {
  const schema = {
    type: 'OBJECT',
    properties: {
      titolo: { type: 'STRING' },
      tempoPreparazioneMinuti: { type: 'NUMBER' },
      ingredienti: { type: 'ARRAY', items: { type: 'STRING' } },
      passi: { type: 'ARRAY', items: { type: 'STRING' } },
      note: { type: 'STRING' }
    },
    required: ['titolo', 'tempoPreparazioneMinuti', 'ingredienti', 'passi']
  }

  const vincoliDieta = input.pianoAlimentare
    ? `Il piano alimentare del/della paziente prevede questi pasti: ${JSON.stringify(input.pianoAlimentare.pasti)}. ` +
      `Note del/della dietologo/a: ${input.pianoAlimentare.note ?? 'nessuna'}. Rispetta questi vincoli.`
    : 'Non è disponibile un piano alimentare specifico: proponi una ricetta bilanciata e sana.'

  const prompt =
    `Proponi UNA ricetta ${input.pasto ? `per ${input.pasto}` : ''} realizzabile in MASSIMO ${input.tempoMinuti} minuti, ` +
    `usando preferibilmente questi ingredienti disponibili: ${input.ingredientiDisponibili.join(', ') || 'nessuno in particolare, proponi tu'}. ` +
    `${vincoliDieta} Rispondi SOLO con il JSON, in italiano.`

  const risultato = await chiamaGemini(prompt, [], schema)
  return { ...risultato, creataIl: new Date().toISOString() }
}
