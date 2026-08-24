// NOTA: queste notifiche funzionano solo finché la scheda dell'app resta aperta
// nel browser (usano setTimeout, non un vero push in background). Un promemoria
// affidabile anche ad app chiusa richiede un service worker + push server, che
// arriverà con l'integrazione Firebase (Cloud Messaging).

export async function richiediPermessoNotifiche(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const risultato = await Notification.requestPermission()
  return risultato === 'granted'
}

export function permessoConcesso(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function mostraNotifica(titolo: string, corpo?: string) {
  if (!permessoConcesso()) return
  new Notification(titolo, { body: corpo })
}

/** Pianifica una notifica alla prossima occorrenza di un giorno della settimana (0=domenica) e orario. */
export function pianificaPromemoriaSettimanale(
  giornoSettimana: number,
  ora: number,
  minuto: number,
  titolo: string,
  corpo?: string
): () => void {
  const adesso = new Date()
  const prossima = new Date(adesso)
  prossima.setHours(ora, minuto, 0, 0)
  let giorniDaAggiungere = (giornoSettimana - adesso.getDay() + 7) % 7
  if (giorniDaAggiungere === 0 && prossima <= adesso) giorniDaAggiungere = 7
  prossima.setDate(prossima.getDate() + giorniDaAggiungere)

  const timerId = setTimeout(() => mostraNotifica(titolo, corpo), prossima.getTime() - adesso.getTime())
  return () => clearTimeout(timerId)
}

/** Pianifica una notifica alla prossima occorrenza giornaliera di un orario. */
export function pianificaPromemoriaGiornaliero(ora: number, minuto: number, titolo: string, corpo?: string): () => void {
  const adesso = new Date()
  const prossima = new Date(adesso)
  prossima.setHours(ora, minuto, 0, 0)
  if (prossima <= adesso) prossima.setDate(prossima.getDate() + 1)

  const timerId = setTimeout(() => mostraNotifica(titolo, corpo), prossima.getTime() - adesso.getTime())
  return () => clearTimeout(timerId)
}

export const ORARIO_PASTI: Record<string, { ora: number; minuto: number }> = {
  colazione: { ora: 8, minuto: 0 },
  spuntino: { ora: 16, minuto: 0 },
  pranzo: { ora: 13, minuto: 0 },
  merenda: { ora: 17, minuto: 0 },
  cena: { ora: 20, minuto: 0 }
}
