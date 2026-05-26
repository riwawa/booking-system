export const toCents = (n: number) => Math.round(n * 100)
export const fromCents = (n: number) => n / 100
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    fromCents(cents),
  )
}
