/**
 * Core data model for Topic tracker.
 *
 * The tree is stored flat (a map of nodes with parent references), which keeps
 * moves, renames and deletes cheap and makes serialization trivial.
 */

export type NodeKind = "folder" | "topic"

export interface TreeNode {
    id: string
    name: string
    kind: NodeKind
    /** `null` means the node lives at the root level. */
    parentId: string | null
    createdAt: number
    updatedAt: number
}

/**
 * A single daily practice session recorded on a topic.
 * Performance/score = hits / total.
 */
export interface Session {
    id: string
    /** ISO date (YYYY-MM-DD). */
    date: string
    /** Correct answers. */
    hits: number
    /** Total answers (total >= hits). */
    total: number
    createdAt: number
}

export interface TreeState {
    version: 1
    nodes: Record<string, TreeNode>
    /** Sessions grouped by topic id. */
    sessions: Record<string, Session[]>
}

export function createState(): TreeState {
    return { version: 1, nodes: {}, sessions: {} }
}
