import { describe, expect, test } from "bun:test"

import type { Session } from "./types"
import {
    activeDaysInWindow,
    cumulativeSeries,
    dailySeries,
    practiceSpanDays,
    streakInfo,
    windowScore,
} from "./stats"

function session(
    id: string,
    date: string,
    hits: number,
    total: number,
): Session {
    return { id, date, hits, total, createdAt: 0 }
}

describe("dailySeries", () => {
    test("aggregates multiple sessions of the same day", () => {
        const daily = dailySeries([
            session("1", "2026-08-01", 5, 10),
            session("2", "2026-08-01", 4, 6),
            session("3", "2026-08-03", 7, 8),
        ])
        expect(daily).toEqual([
            { date: "2026-08-01", hits: 9, total: 16 },
            { date: "2026-08-03", hits: 7, total: 8 },
        ])
    })

    test("sorts dates ascending even when input is shuffled", () => {
        const daily = dailySeries([
            session("1", "2026-08-05", 1, 2),
            session("2", "2026-08-02", 3, 4),
        ])
        expect(daily.map((point) => point.date)).toEqual([
            "2026-08-02",
            "2026-08-05",
        ])
    })

    test("empty input yields empty series", () => {
        expect(dailySeries([])).toEqual([])
    })
})

describe("cumulativeSeries", () => {
    test("accumulates hits and totals into a running score", () => {
        const points = cumulativeSeries([
            { date: "2026-08-01", hits: 6, total: 10 },
            { date: "2026-08-02", hits: 9, total: 10 },
        ])
        expect(points[0].score).toBeCloseTo(0.6)
        expect(points[1].score).toBeCloseTo(0.75)
    })
})

describe("streakInfo", () => {
    const today = "2026-08-10"

    test("counts a live streak ending today", () => {
        const info = streakInfo(
            ["2026-08-08", "2026-08-09", "2026-08-10"],
            today,
        )
        expect(info.current).toBe(3)
        expect(info.longest).toBe(3)
        expect(info.activeDays).toBe(3)
    })

    test("a streak ending yesterday is still alive", () => {
        const info = streakInfo(["2026-08-08", "2026-08-09"], today)
        expect(info.current).toBe(2)
    })

    test("a broken streak resets current but keeps longest", () => {
        const info = streakInfo(
            ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-06"],
            today,
        )
        expect(info.current).toBe(0)
        expect(info.longest).toBe(3)
        expect(info.activeDays).toBe(4)
    })

    test("duplicates on the same day count once", () => {
        const info = streakInfo(
            ["2026-08-09", "2026-08-09", "2026-08-10"],
            today,
        )
        expect(info.current).toBe(2)
        expect(info.activeDays).toBe(2)
    })

    test("empty history yields zeros", () => {
        expect(streakInfo([], today)).toEqual({
            current: 0,
            longest: 0,
            activeDays: 0,
        })
    })
})

describe("windowScore", () => {
    const daily = dailySeries([
        session("1", "2026-08-01", 10, 20),
        session("2", "2026-08-08", 7, 10),
        session("3", "2026-08-09", 3, 10),
    ])
    const today = "2026-08-10"

    test("scores the last 7 days", () => {
        expect(windowScore(daily, 7, 0, today)).toBeCloseTo(0.5)
    })

    test("scores the previous window", () => {
        expect(windowScore(daily, 7, 7, today)).toBeCloseTo(0.5)
    })

    test("returns null for a window without data", () => {
        expect(windowScore(daily, 7, 100, today)).toBeNull()
    })
})

describe("activeDaysInWindow", () => {
    const daily = dailySeries([
        session("1", "2026-08-01", 1, 2),
        session("2", "2026-08-08", 1, 2),
        session("3", "2026-08-09", 1, 2),
    ])
    const today = "2026-08-10"

    test("counts practiced days in the last 7 days", () => {
        expect(activeDaysInWindow(daily, 7, 0, today)).toBe(2)
    })

    test("counts practiced days in the previous window", () => {
        expect(activeDaysInWindow(daily, 7, 7, today)).toBe(1)
    })
})

describe("practiceSpanDays", () => {
    test("spans first to last practiced day", () => {
        const daily = dailySeries([
            session("1", "2026-08-01", 1, 2),
            session("2", "2026-08-05", 1, 2),
        ])
        expect(practiceSpanDays(daily)).toBe(5)
    })

    test("empty series spans zero days", () => {
        expect(practiceSpanDays([])).toBe(0)
    })
})
