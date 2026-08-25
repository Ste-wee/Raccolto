interface Props {
  dimensione?: number
}

const comuni = (dimensione: number) => ({
  width: dimensione,
  height: dimensione,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
})

export function IconaPiano({ dimensione = 23 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z" />
      <path d="M8 6H6.5A1.5 1.5 0 0 0 5 7.5v11A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 17.5 6H16" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  )
}

export function IconaStagione({ dimensione = 23 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3.5 2.2-6.5 5.5-7.5C18 10.5 15.8 14 12 14z" />
      <path d="M12 14c0-3-1.8-5.6-4.6-6.5C6.9 11 8.7 14 12 14z" />
    </svg>
  )
}

export function IconaSpesa({ dimensione = 23 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M4 8h16l-1.4 10.2a1.5 1.5 0 0 1-1.5 1.3H6.9a1.5 1.5 0 0 1-1.5-1.3L4 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}

export function IconaRicette({ dimensione = 23 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M7 3v8M11 3v8M9 11v10" />
      <path d="M16.5 3C15 5 15 8 16.5 10v11" />
      <path d="M7 3a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function IconaImpostazioni({ dimensione = 19 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 7.5l1.7 1M17.4 15.5l1.7 1M4.9 16.5l1.7-1M17.4 8.5l1.7-1" />
    </svg>
  )
}

export function IconaIndietro({ dimensione = 20 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}
