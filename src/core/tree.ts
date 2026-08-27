import type { Session, TreeNode } from "./types"

/* ---------- IDs ---------- */

export function newId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID()
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/* ---------- Ordering & lookups ---------- */

/** Folders first, then topics; case-insensitive alphabetical with numeric support. */
export function compareNodes(a: TreeNode, b: TreeNode): number {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1
    return a.name.localeCompare(b.name, "en", {
        sensitivity: "base",
        numeric: true,
    })
}

export function childrenOf(
    nodes: Record<string, TreeNode>,
    parentId: string | null,
): TreeNode[] {
    const out: TreeNode[] = []
    for (const node of Object.values(nodes)) {
        if (node.parentId === parentId) out.push(node)
    }
    return out.sort(compareNodes)
}

export function isDescendantOf(
    nodes: Record<string, TreeNode>,
    id: string,
    ancestorId: string,
): boolean {
    let parent = nodes[id]?.parentId ?? null
    while (parent !== null) {
        if (parent === ancestorId) return true
        parent = nodes[parent]?.parentId ?? null
    }
    return false
}

/** All ids in the subtree rooted at `id` (including `id` itself). */
export function subtreeIds(
    nodes: Record<string, TreeNode>,
    id: string,
): string[] {
    const out: string[] = []
    const stack = [id]
    const seen = new Set<string>()
    while (stack.length > 0) {
        const current = stack.pop() as string
        if (seen.has(current)) continue
        seen.add(current)
        out.push(current)
        for (const node of Object.values(nodes)) {
            if (node.parentId === current) stack.push(node.id)
        }
    }
    return out
}

/** Chain of ancestors above `id`, ordered from the closest parent to the root. */
export function ancestorIds(
    nodes: Record<string, TreeNode>,
    id: string,
): string[] {
    const out: string[] = []
    let parent = nodes[id]?.parentId ?? null
    while (parent !== null) {
        out.push(parent)
        parent = nodes[parent]?.parentId ?? null
    }
    return out
}

/** Path from the root level down to `id`, inclusive. */
export function pathOf(
    nodes: Record<string, TreeNode>,
    id: string,
): TreeNode[] {
    const out: TreeNode[] = []
    let current: TreeNode | undefined = nodes[id]
    while (current) {
        out.unshift(current)
        current =
            current.parentId !== null ? nodes[current.parentId] : undefined
    }
    return out
}

/* ---------- Flattening (visible rows) ---------- */

export interface FlatRow {
    node: TreeNode
    depth: number
}

/**
 * Flattens the tree into the ordered list of visible rows.
 *
 * Without a query, visibility follows the `expanded` set. With a query, only
 * nodes whose name matches (or that are ancestors of a match) are shown, with
 * matching branches forced open.
 */
export function flattenVisible(
    nodes: Record<string, TreeNode>,
    expanded: ReadonlySet<string>,
    query: string,
): FlatRow[] {
    const q = query.trim().toLowerCase()
    const rows: FlatRow[] = []

    const subtreeMatches = (id: string): boolean => {
        for (const child of Object.values(nodes)) {
            if (child.parentId !== id) continue
            if (child.name.toLowerCase().includes(q)) return true
            if (child.kind === "folder" && subtreeMatches(child.id)) return true
        }
        return false
    }

    const walk = (parentId: string | null, depth: number): void => {
        for (const node of childrenOf(nodes, parentId)) {
            if (q !== "") {
                const selfMatch = node.name.toLowerCase().includes(q)
                const childMatch =
                    node.kind === "folder" ? subtreeMatches(node.id) : false
                if (!selfMatch && !childMatch) continue
                rows.push({ node, depth })
                if (node.kind === "folder" && childMatch)
                    walk(node.id, depth + 1)
            } else {
                rows.push({ node, depth })
                if (node.kind === "folder" && expanded.has(node.id)) {
                    walk(node.id, depth + 1)
                }
            }
        }
    }

    walk(null, 0)
    return rows
}

/** Ids from the anchor row to the target row (inclusive), in visible order. */
export function rangeBetween(
    rows: FlatRow[],
    anchorId: string,
    targetId: string,
): string[] {
    const ids = rows.map((row) => row.node.id)
    const i = ids.indexOf(anchorId)
    const j = ids.indexOf(targetId)
    if (i === -1 || j === -1) return [targetId]
    const [start, end] = i <= j ? [i, j] : [j, i]
    return ids.slice(start, end + 1)
}

/* ---------- Move validation ---------- */

export interface MovePlan {
    accepted: string[]
    rejected: string[]
}

/**
 * Validates moving `ids` into `targetParentId` (`null` = root).
 * - Descendants of other moving ids are redundant (they travel together) and
 *   are reported as rejected.
 * - Moving a folder into itself or into one of its descendants is invalid.
 * - Moves that would not change the parent are rejected.
 */
export function computeMove(
    nodes: Record<string, TreeNode>,
    ids: string[],
    targetParentId: string | null,
): MovePlan {
    const accepted: string[] = []
    const rejected: string[] = []

    const movers = ids.filter(
        (id) =>
            !ids.some(
                (other) => other !== id && isDescendantOf(nodes, id, other),
            ),
    )

    for (const id of movers) {
        const node = nodes[id]
        if (!node) {
            rejected.push(id)
            continue
        }
        if (id === targetParentId) {
            rejected.push(id)
            continue
        }
        if (node.parentId === targetParentId) {
            rejected.push(id)
            continue
        }
        if (targetParentId !== null) {
            const target = nodes[targetParentId]
            if (!target || target.kind !== "folder") {
                rejected.push(id)
                continue
            }
            if (isDescendantOf(nodes, targetParentId, id)) {
                rejected.push(id)
                continue
            }
        }
        accepted.push(id)
    }

    return { accepted, rejected }
}

/* ---------- Name validation ---------- */

export const MAX_NAME_LENGTH = 80

export function normalizeName(raw: string): string {
    return raw.replace(/\s+/g, " ").trim()
}

export function nameIsValid(
    nodes: Record<string, TreeNode>,
    parentId: string | null,
    name: string,
    ignoreId?: string,
): boolean {
    const trimmed = normalizeName(name)
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return false
    const duplicate = Object.values(nodes).some(
        (node) =>
            node.parentId === parentId &&
            node.id !== ignoreId &&
            node.name.toLowerCase() === trimmed.toLowerCase(),
    )
    return !duplicate
}

/** First available name derived from `base`, e.g. "New folder 2". */
export function nextName(
    nodes: Record<string, TreeNode>,
    parentId: string | null,
    base: string,
): string {
    if (nameIsValid(nodes, parentId, base)) return base
    let index = 2
    while (!nameIsValid(nodes, parentId, `${base} ${index}`)) index += 1
    return `${base} ${index}`
}

/* ---------- Topic statistics ---------- */

export interface TopicStats {
    hits: number
    total: number
    sessionCount: number
    /** Overall hits / total, or null when there is no data yet. */
    score: number | null
    lastDate: string | null
    /** Score delta (last session minus previous session), or null. */
    trend: number | null
}

export function topicStats(sessions: Session[] | undefined): TopicStats {
    if (!sessions || sessions.length === 0) {
        return {
            hits: 0,
            total: 0,
            sessionCount: 0,
            score: null,
            lastDate: null,
            trend: null,
        }
    }
    const sorted = [...sessions].sort(
        (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
    )
    let hits = 0
    let total = 0
    for (const session of sorted) {
        hits += session.hits
        total += session.total
    }
    const score = total > 0 ? hits / total : null
    const last = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const lastScore = last.total > 0 ? last.hits / last.total : null
    const prevScore = prev && prev.total > 0 ? prev.hits / prev.total : null
    const trend =
        score !== null && lastScore !== null && prevScore !== null
            ? lastScore - prevScore
            : null
    return {
        hits,
        total,
        sessionCount: sorted.length,
        score,
        lastDate: last.date,
        trend,
    }
}
