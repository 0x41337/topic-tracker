import { describe, expect, it } from "bun:test"
import { calculateScore, getToday } from "./score"

describe("calculateScore", () => {
    it("returns hits and total as-is", () => {
        const score = calculateScore(3, 5)
        expect(score.hits).toBe(3)
        expect(score.total).toBe(5)
    })

    it("calculates accuracy as hits/total", () => {
        expect(calculateScore(1, 2).value).toBe(0.5)
        expect(calculateScore(3, 3).value).toBe(1)
        expect(calculateScore(0, 4).value).toBe(0)
    })

    it("returns NaN when total is 0", () => {
        const score = calculateScore(0, 0)
        expect(score.value).toBeNaN()
    })
})

describe("getToday", () => {
    it("returns a YYYY-MM-DD string", () => {
        const today = getToday()
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})
