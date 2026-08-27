import type { Session, TreeNode, TreeState } from "./types"

const DAY_MS = 86_400_000

/**
 * Demo tree used on first run (and via "Load sample data").
 * English names mirror the classic example: a language folder containing a
 * phonology folder, which contains the "Diphthong" topic tracker.
 */
export function createSeedState(): TreeState {
    const now = Date.now()
    const iso = (daysAgo: number): string =>
        new Date(now - daysAgo * DAY_MS).toISOString().slice(0, 10)
    const ts = (daysAgo: number): number => now - daysAgo * DAY_MS

    const nodes: Record<string, TreeNode> = {}
    const add = (
        id: string,
        name: string,
        kind: TreeNode["kind"],
        parentId: string | null,
        daysAgo: number,
    ): void => {
        nodes[id] = {
            id,
            name,
            kind,
            parentId,
            createdAt: ts(daysAgo),
            updatedAt: ts(daysAgo),
        }
    }

    add("folder.portuguese", "Portuguese Language", "folder", null, 30)
    add("folder.phonology", "Phonology", "folder", "folder.portuguese", 28)
    add("folder.morphology", "Morphology", "folder", "folder.portuguese", 25)
    add("folder.syntax", "Syntax", "folder", "folder.portuguese", 20)
    add("topic.diphthong", "Diphthong", "topic", "folder.phonology", 18)
    add("topic.plurals", "Noun Pluralization", "topic", "folder.morphology", 15)
    add("folder.mathematics", "Mathematics", "folder", null, 40)
    add("folder.arithmetic", "Arithmetic", "folder", "folder.mathematics", 35)
    add("topic.percentages", "Percentages", "topic", "folder.arithmetic", 12)
    add("topic.fractions", "Fractions", "topic", "folder.arithmetic", 10)
    add("folder.history", "History", "folder", null, 45)

    const session = (
        id: string,
        daysAgo: number,
        hits: number,
        total: number,
    ): Session => ({
        id,
        date: iso(daysAgo),
        hits,
        total,
        createdAt: ts(daysAgo),
    })

    const sessions: Record<string, Session[]> = {
        "topic.diphthong": [
            session("s-diph-1", 6, 8, 12),
            session("s-diph-2", 3, 14, 18),
            session("s-diph-3", 1, 11, 14),
        ],
        "topic.plurals": [session("s-plur-1", 2, 5, 10)],
        "topic.percentages": [session("s-pct-1", 4, 9, 16)],
    }

    return { version: 1, nodes, sessions }
}
