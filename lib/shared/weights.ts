export type WeightedItem = { id: string; weightPct: number }

export function sumWeights(items: WeightedItem[]): number {
  return Math.round(items.reduce((a, i) => a + (Number(i.weightPct) || 0), 0) * 10) / 10
}

export function isBalanced(items: WeightedItem[], tolerance = 0.5): boolean {
  return Math.abs(sumWeights(items) - 100) <= tolerance
}

export function normalizeWeights<T extends WeightedItem>(items: T[]): T[] {
  if (!items.length) return items
  const total = items.reduce((a, i) => a + Math.max(0, Number(i.weightPct) || 0), 0)
  if (total <= 0) {
    const even = Math.round((100 / items.length) * 10) / 10
    return items.map((i, idx) => ({
      ...i,
      weightPct: idx === items.length - 1 ? Math.round((100 - even * (items.length - 1)) * 10) / 10 : even,
    }))
  }
  const scaled = items.map((i) => ({
    ...i,
    weightPct: Math.round(((Math.max(0, Number(i.weightPct) || 0) / total) * 100) * 10) / 10,
  }))
  const drift = Math.round((100 - sumWeights(scaled)) * 10) / 10
  if (scaled.length && drift !== 0) {
    scaled[scaled.length - 1] = {
      ...scaled[scaled.length - 1],
      weightPct: Math.round((scaled[scaled.length - 1].weightPct + drift) * 10) / 10,
    }
  }
  return scaled
}

export function weightedAverage(items: { weightPct: number; score: number }[]): number {
  const total = items.reduce((a, i) => a + Math.max(0, i.weightPct), 0)
  if (total <= 0) return 0
  const raw = items.reduce((a, i) => a + (Math.max(0, i.weightPct) / total) * i.score, 0)
  return Math.round(raw * 10) / 10
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
