import { describe, expect, it } from "bun:test"
import { createNodeId, getUniqueName, collectDescendantIds } from "./tree-utils"
import type { TreeDataMap } from "./types"

describe("createNodeId", () => {
    it("returns a string starting with the given type", () => {
        expect(createNodeId("folder")).toStartWith("folder-")
        expect(createNodeId("topic")).toStartWith("topic-")
    })

    it("generates unique ids", () => {
        const ids = new Set(Array.from({ length: 100 }, () => createNodeId("topic")))
        expect(ids.size).toBe(100)
    })
})

describe("getUniqueName", () => {
    it("returns the base name if not taken", () => {
        expect(getUniqueName("Math", [])).toBe("Math")
        expect(getUniqueName("Math", ["Science"])).toBe("Math")
    })

    it("appends (2) when base is taken", () => {
        expect(getUniqueName("Math", ["Math"])).toBe("Math (2)")
    })

    it("increments the counter for multiple conflicts", () => {
        expect(getUniqueName("Math", ["Math", "Math (2)"])).toBe("Math (3)")
    })

    it("skips the ignored name when checking conflicts", () => {
        expect(getUniqueName("Math", ["Math"], "Math")).toBe("Math")
    })
})

describe("collectDescendantIds", () => {
    const tree: TreeDataMap = {
        root: { id: "root", name: "root", type: "folder", children: ["f1", "t1"] },
        f1: { id: "f1", name: "Folder", type: "folder", children: ["t2", "t3"] },
        t1: { id: "t1", name: "Topic 1", type: "topic" },
        t2: { id: "t2", name: "Topic 2", type: "topic" },
        t3: { id: "t3", name: "Topic 3", type: "topic" },
    }

    it("returns empty set for a topic node", () => {
        const result = collectDescendantIds("t1", tree)
        expect(result.size).toBe(0)
    })

    it("collects all descendants of a folder", () => {
        const result = collectDescendantIds("root", tree)
        expect(result).toEqual(new Set(["f1", "t1", "t2", "t3"]))
    })

    it("collects nested descendants", () => {
        const result = collectDescendantIds("f1", tree)
        expect(result).toEqual(new Set(["t2", "t3"]))
    })

    it("returns empty set for unknown id", () => {
        const result = collectDescendantIds("unknown", tree)
        expect(result.size).toBe(0)
    })
})
