interface Props {
  dimensione?: number
}

/** Marchio di Raccolto: spiga stilizzata dentro un badge arrotondato. */
export function Logo({ dimensione = 32 }: Props) {
  return (
    <svg width={dimensione} height={dimensione} viewBox="0 0 40 40" role="img" aria-label="Raccolto">
      <rect width="40" height="40" rx="11" fill="var(--verde-scuro)" />
      <path d="M20 33V16" stroke="var(--verde-chiaro)" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="20" cy="11.5" rx="3" ry="5" fill="var(--verde-chiaro)" />
      <ellipse cx="14.2" cy="17.5" rx="2.8" ry="4.8" transform="rotate(-34 14.2 17.5)" fill="var(--verde-chiaro)" />
      <ellipse cx="25.8" cy="17.5" rx="2.8" ry="4.8" transform="rotate(34 25.8 17.5)" fill="var(--verde-chiaro)" />
      <ellipse cx="14.6" cy="24.6" rx="2.6" ry="4.4" transform="rotate(-34 14.6 24.6)" fill="var(--verde-medio)" />
      <ellipse cx="25.4" cy="24.6" rx="2.6" ry="4.4" transform="rotate(34 25.4 24.6)" fill="var(--verde-medio)" />
    </svg>
  )
}
