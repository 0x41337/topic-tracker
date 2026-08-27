/**
 * Pure formatting helpers (percentages, dates). Kept separate from the tree
 * logic so presentation concerns stay swappable.
 */

export function formatPercent(score: number | null): string {
    if (score === null) return "\u2014"
    const pct = score * 100
    const rounded = Math.round(pct * 10) / 10
    return Number.isInteger(rounded)
        ? `${rounded.toFixed(0)}%`
        : `${rounded.toFixed(1)}%`
}

export function formatTrend(trend: number | null): string | null {
    if (trend === null) return null
    const pts = Math.round(trend * 1000) / 10
    const sign = pts >= 0 ? "+" : ""
    return `${sign}${Number.isInteger(pts) ? pts.toFixed(0) : pts.toFixed(1)}%`
}

export function formatDate(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return isoDate
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export function formatShortDate(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return isoDate
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function formatTimestamp(ms: number): string {
    const date = new Date(ms)
    const sameYear = date.getFullYear() === new Date().getFullYear()
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    })
}
