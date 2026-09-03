import type { Score } from "./types"

export function calculateScore(hits: number, total: number): Score {
    return {
        hits,
        total,
        value: total === 0 ? NaN : hits / total,
    }
}

export function getToday(): string {
    return new Date().toLocaleDateString("en-CA")
}
