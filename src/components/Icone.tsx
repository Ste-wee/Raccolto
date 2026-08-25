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

export function IconaAvanti({ dimensione = 17 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconaVerdura({ dimensione = 21 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M5 20c-.7-.7 3.6-9 7.8-12.2l2.4 2.4C12 14.4 5.7 20.7 5 20z" />
      <path d="M13.5 9c-.2-2.2.9-3.9 3.2-4.4" />
      <path d="M15.6 11c2.2.1 3.9-1.1 4.3-3.4" />
    </svg>
  )
}

export function IconaFrutta({ dimensione = 21 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M12 8.5c-3.9 0-6.3 2.7-6.3 6.1 0 3 2.4 5.4 6.3 5.4s6.3-2.4 6.3-5.4c0-3.4-2.4-6.1-6.3-6.1z" />
      <path d="M12 8.5V5" />
      <path d="M12.5 5.2c1.9-.4 2.8-1.5 3-3.2" />
    </svg>
  )
}

export function IconaCarne({ dimensione = 21 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <path d="M9 6.5c2.6-2 6.6-1.8 8.4.6 1.8 2.5.8 6-2 7.4-1.9 1-2.9 2.2-3.6 3.6-.8 1.6-3 1.9-4.2.6-1.2-1.3-.7-3 .1-4.3.8-1.3.6-2.6-.3-3.9-1-1.5-.6-3 1.6-4z" />
      <circle cx="14" cy="9.5" r="1.9" />
    </svg>
  )
}

export function IconaPesce({ dimensione = 21 }: Props) {
  return (
    <svg {...comuni(dimensione)}>
      <ellipse cx="13.5" cy="12" rx="7.5" ry="5" />
      <path d="M6 12L2 8.5v7L6 12z" />
      <circle cx="17" cy="10.5" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  )
}
