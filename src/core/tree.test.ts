import { describe, expect, test } from "bun:test"

import type { TreeNode } from "./types"
import {
    childrenOf,
    computeMove,
    flattenVisible,
    isDescendantOf,
    nameIsValid,
    nextName,
    normalizeName,
    rangeBetween,
    subtreeIds,
    topicStats,
} from "./tree"
import { formatPercent, formatTrend } from "./format"

function folder(id: string, parentId: string | null, name = id): TreeNode {
    return { id, name, kind: "folder", parentId, createdAt: 0, updatedAt: 0 }
}

function topic(id: string, parentId: string | null, name = id): TreeNode {
    return { id, name, kind: "topic", parentId, createdAt: 0, updatedAt: 0 }
}

/** root: [a(f): [a1(t), sub(f): [sub1(t)]], other(f), beta(t), gamma(t)] */
function fixture(): Record<string, TreeNode> {
    const nodes: Record<string, TreeNode> = {}
    for (const node of [
        folder("a", null),
        topic("a1", "a"),
        folder("sub", "a"),
        topic("sub1", "sub"),
        folder("other", null),
        topic("beta", null),
        topic("gamma", null),
    ]) {
        nodes[node.id] = node
    }
    return nodes
}

describe("tree structure", () => {
    test("childrenOf sorts folders first and names alphabetically", () => {
        const nodes = fixture()
        const ids = childrenOf(nodes, "a").map((node) => node.id)
        expect(ids).toEqual(["sub", "a1"])
    })

    test("isDescendantOf detects nested and direct relationships", () => {
        const nodes = fixture()
        expect(isDescendantOf(nodes, "sub1", "sub")).toBe(true)
        expect(isDescendantOf(nodes, "sub1", "a")).toBe(true)
        expect(isDescendantOf(nodes, "a1", "a")).toBe(true)
        expect(isDescendantOf(nodes, "a", "a1")).toBe(false)
        expect(isDescendantOf(nodes, "beta", "a")).toBe(false)
    })

    test("subtreeIds includes the node and every descendant", () => {
        const nodes = fixture()
        expect(subtreeIds(nodes, "a").sort()).toEqual(
            ["a", "a1", "sub", "sub1"].sort(),
        )
        expect(subtreeIds(nodes, "beta")).toEqual(["beta"])
    })
})

describe("computeMove", () => {
    const nodes = fixture()

    test("accepts a normal move", () => {
        const plan = computeMove(nodes, ["beta"], "a")
        expect(plan.accepted).toEqual(["beta"])
        expect(plan.rejected).toEqual([])
    })

    test("rejects moves into the node itself or its descendants", () => {
        expect(computeMove(nodes, ["a"], "a").accepted).toEqual([])
        expect(computeMove(nodes, ["a"], "sub").accepted).toEqual([])
    })

    test("rejects moves that keep the same parent", () => {
        expect(computeMove(nodes, ["a1"], "a").accepted).toEqual([])
    })

    test("deduplicates a parent+child selection (child travels with parent)", () => {
        const plan = computeMove(nodes, ["a", "a1"], "other")
        expect(plan.accepted).toEqual(["a"])
        // "a1" is neither accepted nor rejected: it simply travels with its parent.
        expect(plan.rejected).toEqual([])
    })

    test("rejects moving into a non-folder target", () => {
        expect(computeMove(nodes, ["beta"], "a1").accepted).toEqual([])
    })
})

describe("flattenVisible", () => {
    const nodes = fixture()

    test("respects the expanded set", () => {
        const rows = flattenVisible(nodes, new Set(["a"]), "")
        expect(rows.map((row) => row.node.id)).toEqual([
            "a",
            "sub",
            "a1",
            "other",
            "beta",
            "gamma",
        ])
    })

    test("collapses unexpanded folders", () => {
        const rows = flattenVisible(nodes, new Set(), "")
        expect(rows.map((row) => row.node.id)).toEqual([
            "a",
            "other",
            "beta",
            "gamma",
        ])
    })

    test("query keeps matches and their ancestors, forcing branches open", () => {
        const rows = flattenVisible(nodes, new Set(), "sub1")
        expect(rows.map((row) => row.node.id)).toEqual(["a", "sub", "sub1"])
        expect(rows.map((row) => row.depth)).toEqual([0, 1, 2])
    })

    test("query matches are case-insensitive", () => {
        const rows = flattenVisible(nodes, new Set(), "Beta")
        expect(rows.map((row) => row.node.id)).toEqual(["beta"])
    })
})

describe("rangeBetween", () => {
    const nodes = fixture()
    const rows = flattenVisible(nodes, new Set(["a"]), "")

    test("returns the inclusive range in visible order", () => {
        expect(rangeBetween(rows, "gamma", "sub")).toEqual([
            "sub",
            "a1",
            "other",
            "beta",
            "gamma",
        ])
    })

    test("falls back to the target when the anchor is missing", () => {
        expect(rangeBetween(rows, "missing", "beta")).toEqual(["beta"])
    })
})

describe("names", () => {
    const nodes = fixture()

    test("normalizeName collapses whitespace and trims", () => {
        expect(normalizeName("  Ditongo   nasal ")).toBe("Ditongo nasal")
    })

    test("nameIsValid blocks empty names and sibling duplicates", () => {
        expect(nameIsValid(nodes, "a", "  ")).toBe(false)
        expect(nameIsValid(nodes, "a", "A1")).toBe(false)
        expect(nameIsValid(nodes, "a", "A1", "a1")).toBe(true)
        expect(nameIsValid(nodes, "sub", "A1")).toBe(true)
    })

    test("nextName produces unique suffixes", () => {
        expect(nextName(nodes, "a", "A1")).toBe("A1 2")
        expect(nextName(nodes, "sub", "A1")).toBe("A1")
    })
})

describe("topicStats", () => {
    test("aggregates sessions and computes score and trend", () => {
        const stats = topicStats([
            { id: "1", date: "2026-08-01", hits: 8, total: 12, createdAt: 0 },
            { id: "2", date: "2026-08-03", hits: 14, total: 18, createdAt: 0 },
            { id: "3", date: "2026-08-05", hits: 11, total: 14, createdAt: 0 },
        ])
        expect(stats.hits).toBe(33)
        expect(stats.total).toBe(44)
        expect(stats.sessionCount).toBe(3)
        expect(stats.score).toBeCloseTo(0.75)
        expect(stats.lastDate).toBe("2026-08-05")
        expect(stats.trend).not.toBeNull()
        expect(stats.trend ?? 0).toBeGreaterThan(0)
    })

    test("returns nulls for topics without sessions", () => {
        const stats = topicStats(undefined)
        expect(stats.sessionCount).toBe(0)
        expect(stats.score).toBeNull()
        expect(stats.trend).toBeNull()
    })
})

describe("formatting", () => {
    test("formatPercent renders whole and fractional values", () => {
        expect(formatPercent(0.75)).toBe("75%")
        expect(formatPercent(1 / 3)).toBe("33.3%")
        expect(formatPercent(null)).toBe("\u2014")
    })

    test("formatTrend renders a signed percentage point delta", () => {
        expect(formatTrend(0.008)).toBe("+0.8%")
        expect(formatTrend(-0.05)).toBe("-5%")
        expect(formatTrend(null)).toBeNull()
    })
})
