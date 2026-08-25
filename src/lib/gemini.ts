import type { PianoAlimentare, SpesaItem, Ricetta, VoceMenuSettimanale, Fonte } from './types'

// NOTA: per ora la chiamata a Gemini parte dal client, comodo per sviluppare
// in locale senza backend. Prima di pubblicare l'app va spostata dietro una
// Cloud Function (vedi docs/ARCHITECTURE.md) così la API key non finisce mai
// nel bundle JS pubblico.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODELLO = 'gemini-3.6-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO}:generateContent`

interface ParteImmagine {
  mimeType: string
  base64: string
}

interface ErroreGemini extends Error {
  stato?: number
}

/** Sollevato quando la ricerca web non è utilizzabile: l'app ripiega sulle proposte AI. */
export class RicercaWebNonDisponibile extends Error {
  constructor(messaggio: string) {
    super(messaggio)
    this.name = 'RicercaWebNonDisponibile'
  }
}

async function inviaRichiesta(body: Record<string, unknown>): Promise<any> {
  if (!API_KEY) {
    throw new Error(
      "Manca VITE_GEMINI_API_KEY nel file .env (copia .env.example in .env e inserisci una chiave gratuita da https://aistudio.google.com/app/apikey)"
    )
  }

  const risposta = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!risposta.ok) {
    const testoErrore = await risposta.text()
    const errore = new Error(`Errore Gemini (${risposta.status}): ${testoErrore}`) as ErroreGemini
    errore.stato = risposta.status
    throw errore
  }

  return risposta.json()
}

function testoDellaRisposta(dati: any): string {
  const parti = dati.candidates?.[0]?.content?.parts ?? []
  const testo = parti
    .map((p: any) => p.text)
    .filter(Boolean)
    .join('')
  if (!testo) throw new Error('Risposta di Gemini vuota o inattesa')
  return testo
}

async function chiamaGemini(prompt: string, immagini: ParteImmagine[] = [], schema?: object): Promise<any> {
  const parts: Record<string, unknown>[] = [{ text: prompt }]
  for (const img of immagini) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  }

  const body: Record<string, unknown> = { contents: [{ parts }] }
  if (schema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema: schema }
  }

  const dati = await inviaRichiesta(body)
  const testo = testoDellaRisposta(dati)
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
        categoria: { type: 'STRING', enum: ['frutta', 'verdura', 'carne', 'pesce', 'altro'] }
      },
      required: ['nome']
    }
  }

  const prompt =
    'Questo è uno scontrino della spesa. Estrai SOLO i prodotti alimentari (ignora intestazione, ' +
    'totali, prezzi, sconti, punti fedeltà, IVA). Per ciascun prodotto indica: nome normalizzato e leggibile ' +
    '(es. "pomodori" invece di "POMODOR RAMATO KG"), quantità se leggibile, e categoria tra ' +
    'frutta/verdura/carne/pesce/altro. Rispondi SOLO con il JSON.'

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

/**
 * 3 ricette inventate dal modello. Nessuna fonte: sono create sul momento,
 * quindi vengono marcate come 'ai' e mostrate come tali nell'interfaccia.
 */
export async function generaProposteAI(input: InputRicetta, quante = 3, daEvitare: string[] = []): Promise<Ricetta[]> {
  const schema = { type: 'ARRAY', items: SCHEMA_RICETTA }
  const esclusioni = daEvitare.length
    ? ` Non riproporre queste ricette, già suggerite: ${daEvitare.join('; ')}.`
    : ''

  const prompt =
    `Proponi ${quante} ricette DIVERSE tra loro ${input.pasto ? `per ${input.pasto}` : ''}, ciascuna realizzabile in ` +
    `MASSIMO ${input.tempoMinuti} minuti, per ${input.porzioni ?? 1} persona/e, usando preferibilmente questi ` +
    `ingredienti disponibili: ${input.ingredientiDisponibili.join(', ') || 'nessuno in particolare, proponi tu'}. ` +
    `${descriviVincoliDieta(input.pianoAlimentare, input.ingredientiEsclusi)}${esclusioni} ` +
    'I passi di preparazione devono essere DETTAGLIATI e PRECISI: almeno 5 passi per ricetta, ognuno con ' +
    'temperature, tempi e quantità esatte dove sensato (es. "cuocere in forno statico a 180°C per 25 minuti"). ' +
    `Includi una stima di calorie e macronutrienti a porzione. Rispondi SOLO con il JSON (array di ${quante} elementi), in italiano.`

  const risultato = await chiamaGemini(prompt, [], schema)
  const creataIl = new Date().toISOString()
  return (risultato as Ricetta[]).map(r => ({ ...r, origine: 'ai' as const, creataIl }))
}

/** Estrae dai metadati di grounding solo le fonti web realmente restituite da Google Search. */
function fontiDalGrounding(dati: any): Fonte[] {
  const chunks = dati.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const fonti: Fonte[] = []
  for (const chunk of chunks) {
    const url = chunk?.web?.uri
    if (!url) continue
    const titolo = chunk.web.title || url
    if (!fonti.some(f => f.url === url)) fonti.push({ titolo, url })
  }
  return fonti
}

/** Il modello con la ricerca attiva non può usare responseSchema: il JSON arriva nel testo. */
function estraiJsonDalTesto(testo: string): any {
  const pulito = testo.replace(/```json/gi, '').replace(/```/g, '').trim()
  const inizio = pulito.indexOf('[')
  const fine = pulito.lastIndexOf(']')
  if (inizio === -1 || fine === -1) {
    throw new Error('Gemini non ha restituito un JSON leggibile per le ricette dal web')
  }
  return JSON.parse(pulito.slice(inizio, fine + 1))
}

/** Associa a una ricetta le fonti il cui titolo o dominio combacia con il sito dichiarato dal modello. */
function abbinaFonti(sitoDichiarato: string | undefined, fontiReali: Fonte[]): Fonte[] {
  if (!sitoDichiarato) return fontiReali
  const cercato = sitoDichiarato.toLowerCase().replace(/^www\./, '')
  const corrispondenti = fontiReali.filter(f => {
    const titolo = f.titolo.toLowerCase()
    return titolo.includes(cercato) || cercato.includes(titolo.replace(/^www\./, ''))
  })
  // Se non c'è corrispondenza non inventiamo nulla: mostriamo tutte le fonti consultate.
  return corrispondenti.length > 0 ? corrispondenti : fontiReali
}

/**
 * 3 ricette cercate davvero online con Google Search. Le fonti mostrate sono
 * quelle che l'API dichiara di aver consultato: non chiediamo al modello di
 * "citare un link", perché in quel caso inventerebbe URL plausibili ma falsi.
 */
export async function cercaProposteWeb(input: InputRicetta): Promise<Ricetta[]> {
  const prompt =
    `Cerca online 3 ricette italiane reali e collaudate ${input.pasto ? `per ${input.pasto}` : ''}, ciascuna ` +
    `realizzabile in massimo ${input.tempoMinuti} minuti, per ${input.porzioni ?? 1} persona/e, che usino ` +
    `preferibilmente questi ingredienti: ${input.ingredientiDisponibili.join(', ') || 'ingredienti di stagione'}. ` +
    `${descriviVincoliDieta(input.pianoAlimentare, input.ingredientiEsclusi)} ` +
    'Per ogni ricetta trovata riporta fedelmente il procedimento della fonte, con almeno 5 passi dettagliati ' +
    '(temperature, tempi e quantità esatte). Indica in "sito" il nome del sito da cui proviene la ricetta.\n\n' +
    'Rispondi SOLO con un array JSON di 3 oggetti con questi campi: titolo (string), sito (string), ' +
    'tempoPreparazioneMinuti (number), porzioni (number), ingredienti (array di string), passi (array di string), ' +
    'calorie (number), proteineGrammi (number), carboidratiGrammi (number), grassiGrammi (number), note (string). ' +
    'Tutto in italiano, nessun testo fuori dal JSON.'

  let dati: any
  try {
    dati = await inviaRichiesta({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }]
    })
  } catch (e) {
    // La ricerca con Google Search non è coperta dal piano gratuito di Gemini:
    // la quota risulta esaurita anche quando le normali chiamate funzionano.
    if ((e as ErroreGemini).stato === 429) {
      throw new RicercaWebNonDisponibile(
        'La ricerca online con fonti verificabili non è inclusa nel piano gratuito di Gemini (quota Google Search esaurita). Servirebbe attivare la fatturazione su Google AI Studio.'
      )
    }
    throw e
  }

  const fontiReali = fontiDalGrounding(dati)
  const grezze = estraiJsonDalTesto(testoDellaRisposta(dati))
  const creataIl = new Date().toISOString()

  return (grezze as any[]).map(r => ({
    titolo: r.titolo,
    tempoPreparazioneMinuti: r.tempoPreparazioneMinuti,
    porzioni: r.porzioni,
    ingredienti: r.ingredienti ?? [],
    passi: r.passi ?? [],
    calorie: r.calorie,
    proteineGrammi: r.proteineGrammi,
    carboidratiGrammi: r.carboidratiGrammi,
    grassiGrammi: r.grassiGrammi,
    note: r.note,
    origine: 'web' as const,
    fonti: abbinaFonti(r.sito, fontiReali),
    creataIl
  }))
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
        categoria: { type: 'STRING', enum: ['frutta', 'verdura', 'carne', 'pesce', 'altro'] }
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
