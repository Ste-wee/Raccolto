export function oggiISO(): string {
  return new Date().toISOString().slice(0, 10)
}
