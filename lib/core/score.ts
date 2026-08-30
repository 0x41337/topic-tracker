import type { PerformanceRecord, Score } from "./types"

export function calculateScore(hits: number, total: number): Score {
    return {
        hits,
        total,
        value: total === 0 ? NaN : hits / total,
    }
}

export function getToday(): string {
    return new Date().toISOString().slice(0, 10)
}

export function formatCSV(records: PerformanceRecord[]): string {
    const header = "topic|hits|total|date"
    const rows = records.map(
        (r) => `${r.topic}|${r.hits}|${r.total}|${r.date}`,
    )
    return [header, ...rows].join("\n")
}

export function parseCSV(csv: string): PerformanceRecord[] {
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return []

    return lines.slice(1).map((line) => {
        const [topic, hits, total, date] = line.split("|")
        return {
            topicId: "",
            topic,
            hits: parseInt(hits, 10),
            total: parseInt(total, 10),
            date,
        }
    })
}
