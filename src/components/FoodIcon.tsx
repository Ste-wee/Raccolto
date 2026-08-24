interface Props {
  nome: string
  categoria: 'frutta' | 'verdura' | 'carne'
  dimensione?: number
}

type Forma = 'tondo' | 'allungata' | 'ovale' | 'grappolo' | 'foglia' | 'goccia' | 'carne'

interface DefinizioneIcona {
  forma: Forma
  colore: string
  colore2?: string
}

// Illustrazioni piatte disegnate a mano (SVG), nessuna immagine esterna scaricata.
const ICONE: Record<string, DefinizioneIcona> = {
  pomodoro: { forma: 'tondo', colore: '#e5533d', colore2: '#4a7c2f' },
  zucchina: { forma: 'allungata', colore: '#4a7c2f' },
  melanzana: { forma: 'ovale', colore: '#5b3a5c', colore2: '#4a7c2f' },
  zucca: { forma: 'tondo', colore: '#e8973a', colore2: '#7ea23e' },
  cavolfiore: { forma: 'grappolo', colore: '#efe9d8' },
  broccolo: { forma: 'grappolo', colore: '#4a7c2f' },
  carciofo: { forma: 'goccia', colore: '#6f8f4e' },
  asparago: { forma: 'allungata', colore: '#7ea23e' },
  spinaci: { forma: 'foglia', colore: '#3f6b2b' },
  carota: { forma: 'allungata', colore: '#e8973a', colore2: '#4a7c2f' },
  patata: { forma: 'ovale', colore: '#c98a4b' },
  fragola: { forma: 'goccia', colore: '#e5405a', colore2: '#4a7c2f' },
  ciliegia: { forma: 'grappolo', colore: '#b8283f' },
  pesca: { forma: 'tondo', colore: '#f0a15f' },
  anguria: { forma: 'ovale', colore: '#4a7c2f' },
  melone: { forma: 'tondo', colore: '#d9b34a' },
  uva: { forma: 'grappolo', colore: '#6a4c93' },
  mela: { forma: 'tondo', colore: '#c23b3b', colore2: '#4a7c2f' },
  pera: { forma: 'goccia', colore: '#b7c34a' },
  arancia: { forma: 'tondo', colore: '#e8973a' },
  mandarino: { forma: 'tondo', colore: '#f0902e', colore2: '#4a7c2f' },
  kiwi: { forma: 'tondo', colore: '#7a5230' },
  agnello: { forma: 'carne', colore: '#d98a8a' },
  pollo: { forma: 'carne', colore: '#e8c397' },
  manzo: { forma: 'carne', colore: '#a13d3d' },
  coniglio: { forma: 'carne', colore: '#c9a679' }
}

const COLORE_CATEGORIA: Record<Props['categoria'], string> = {
  frutta: '#d94f4f',
  verdura: '#4a7c2f',
  carne: '#a5672f'
}

export function FoodIcon({ nome, categoria, dimensione = 44 }: Props) {
  const definizione = ICONE[nome.toLowerCase()]
  const colore = definizione?.colore ?? COLORE_CATEGORIA[categoria]

  return (
    <svg
      className="food-icon"
      width={dimensione}
      height={dimensione}
      viewBox="0 0 44 44"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="22" cy="22" r="22" fill="#f4f4f0" />
      <g>{renderaForma(definizione?.forma ?? 'tondo', colore, definizione?.colore2)}</g>
    </svg>
  )
}

function renderaForma(forma: Forma, colore: string, colore2?: string) {
  switch (forma) {
    case 'allungata':
      return (
        <>
          <rect x="16" y="8" width="12" height="28" rx="6" fill={colore} />
          {colore2 && <rect x="19" y="5" width="6" height="7" rx="2" fill={colore2} />}
        </>
      )
    case 'ovale':
      return <ellipse cx="22" cy="23" rx="12" ry="15" fill={colore} />
    case 'grappolo':
      return (
        <>
          <circle cx="16" cy="19" r="6.5" fill={colore} />
          <circle cx="27" cy="19" r="6.5" fill={colore} />
          <circle cx="21.5" cy="29" r="6.5" fill={colore} />
        </>
      )
    case 'foglia':
      return (
        <>
          <ellipse cx="16" cy="25" rx="9" ry="6" fill={colore} transform="rotate(-20 16 25)" />
          <ellipse cx="28" cy="21" rx="9" ry="6" fill={colore} transform="rotate(15 28 21)" />
        </>
      )
    case 'goccia':
      return (
        <>
          <path
            d="M22 7c8 9 12 15 12 21a12 12 0 1 1-24 0c0-6 4-12 12-21z"
            fill={colore}
          />
          {colore2 && <rect x="20" y="4" width="4" height="6" rx="2" fill={colore2} />}
        </>
      )
    case 'carne':
      return (
        <>
          <ellipse cx="19" cy="20" rx="13" ry="10" fill={colore} />
          <rect x="27" y="25" width="11" height="6" rx="3" fill={colore} />
        </>
      )
    case 'tondo':
    default:
      return (
        <>
          <circle cx="22" cy="24" r="13" fill={colore} />
          {colore2 && <rect x="20" y="7" width="4" height="6" rx="2" fill={colore2} />}
        </>
      )
  }
}
