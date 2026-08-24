interface Props {
  diStagione: boolean
  dimensione?: number
}

/** Icona calendario disegnata via SVG: verde se il prodotto è di stagione, rosso altrimenti. */
export function CalendarioBadge({ diStagione, dimensione = 18 }: Props) {
  const colore = diStagione ? '#2f7a3d' : '#b3261e'

  return (
    <svg
      width={dimensione}
      height={dimensione}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <title>{diStagione ? 'Di stagione' : 'Fuori stagione'}</title>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke={colore} strokeWidth="2" />
      <path d="M3 10h18" stroke={colore} strokeWidth="2" />
      <path d="M8 3v4M16 3v4" stroke={colore} strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="15" r="1.3" fill={colore} />
      <circle cx="12" cy="15" r="1.3" fill={colore} />
      <circle cx="16" cy="15" r="1.3" fill={colore} />
    </svg>
  )
}
