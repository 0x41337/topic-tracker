import type { Session } from "./types"

/* ---------- Daily series ---------- */

export interface DailyPoint {
    date: string
    hits: number
    total: number
}

/** Aggregates sessions by calendar day, sorted ascending. */
export function dailySeries(sessions: Session[]): DailyPoint[] {
    const byDate = new Map<string, DailyPoint>()
    for (const session of sessions) {
        const entry = byDate.get(session.date) ?? {
            date: session.date,
            hits: 0,
            total: 0,
        }
        entry.hits += session.hits
        entry.total += session.total
        byDate.set(session.date, entry)
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export interface CumulativePoint {
    date: string
    /** Running hits / total up to (and including) this day. */
    score: number | null
}

/** Running overall score across the daily series. */
export function cumulativeSeries(daily: DailyPoint[]): CumulativePoint[] {
    let hits = 0
    let total = 0
    return daily.map((point) => {
        hits += point.hits
        total += point.total
        return { date: point.date, score: total > 0 ? hits / total : null }
    })
}

/* ---------- Streaks & windows ---------- */

/** Converts an ISO date (YYYY-MM-DD) to a day index (UTC-based, tz-safe). */
function dayNumber(iso: string): number {
    const [year, month, day] = iso.split("-").map(Number)
    return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

export interface StreakInfo {
    /** Consecutive practiced days ending today (or yesterday). */
    current: number
    /** Best run of consecutive practiced days ever. */
    longest: number
    /** Total number of days with at least one session. */
    activeDays: number
}

export function streakInfo(
    dates: string[],
    today: string = todayIso(),
): StreakInfo {
    if (dates.length === 0) return { current: 0, longest: 0, activeDays: 0 }
    const unique = [...new Set(dates)].map(dayNumber).sort((a, b) => a - b)
    const activeDays = unique.length

    let longest = 1
    let run = 1
    for (let i = 1; i < unique.length; i++) {
        run = unique[i] === unique[i - 1] + 1 ? run + 1 : 1
        longest = Math.max(longest, run)
    }

    const todayN = dayNumber(today)
    const last = unique[unique.length - 1]
    let current = 0
    if (last === todayN || last === todayN - 1) {
        current = 1
        for (let i = unique.length - 1; i > 0; i--) {
            if (unique[i] === unique[i - 1] + 1) current += 1
            else break
        }
    }

    return { current, longest: Math.max(longest, current), activeDays }
}

/**
 * Overall score of the calendar window of `days` days ending `offset` days
 * ago (offset 0 = the last 7 days, offset 7 = the 7 days before that).
 * Returns null when no questions were answered in the window.
 */
export function windowScore(
    daily: DailyPoint[],
    days: number,
    offset = 0,
    today: string = todayIso(),
): number | null {
    const todayN = dayNumber(today)
    const start = todayN - offset - days + 1
    const end = todayN - offset
    let hits = 0
    let total = 0
    for (const point of daily) {
        const day = dayNumber(point.date)
        if (day >= start && day <= end) {
            hits += point.hits
            total += point.total
        }
    }
    return total > 0 ? hits / total : null
}

/** Number of practiced days inside a calendar window (same convention as windowScore). */
export function activeDaysInWindow(
    daily: DailyPoint[],
    days: number,
    offset = 0,
    today: string = todayIso(),
): number {
    const todayN = dayNumber(today)
    const start = todayN - offset - days + 1
    const end = todayN - offset
    return daily.filter((point) => {
        const day = dayNumber(point.date)
        return day >= start && day <= end
    }).length
}

/** Days between the first and last practiced day, inclusive. */
export function practiceSpanDays(daily: DailyPoint[]): number {
    if (daily.length === 0) return 0
    const first = dayNumber(daily[0].date)
    const last = dayNumber(daily[daily.length - 1].date)
    return last - first + 1
}
