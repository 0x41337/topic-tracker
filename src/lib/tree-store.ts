"use client"

import { useSyncExternalStore } from "react"

import { createSeedState } from "./seed"
import {
    createState,
    type NodeKind,
    type Session,
    type TreeNode,
    type TreeState,
} from "./types"
import {
    computeMove,
    newId,
    nextName,
    normalizeName,
    subtreeIds,
} from "./tree-utils"

const STORAGE_KEY = "tracktree.state.v1"

/* ---------- Persistence plumbing ---------- */

let state: TreeState = createSeedState()
let loaded = false
const listeners = new Set<() => void>()

function emit(): void {
    for (const listener of listeners) listener()
}

function persist(): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Storage may be unavailable (private mode / quota). Keep working in memory.
    }
}

function isValidState(value: unknown): value is TreeState {
    if (!value || typeof value !== "object") return false
    const candidate = value as TreeState
    if (candidate.version !== 1) return false
    if (!candidate.nodes || typeof candidate.nodes !== "object") return false
    if (!candidate.sessions || typeof candidate.sessions !== "object")
        return false
    for (const node of Object.values(candidate.nodes)) {
        if (
            !node ||
            typeof node.id !== "string" ||
            typeof node.name !== "string"
        )
            return false
        if (node.kind !== "folder" && node.kind !== "topic") return false
    }
    return true
}

/** Drops dangling parent references so imported data is always consistent. */
function sanitizeState(parsed: TreeState): TreeState {
    for (const node of Object.values(parsed.nodes)) {
        if (node.parentId !== null && !parsed.nodes[node.parentId]) {
            node.parentId = null
        }
    }
    return parsed
}

function ensureLoaded(): void {
    if (loaded || typeof window === "undefined") return
    loaded = true
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed: unknown = JSON.parse(raw)
            if (isValidState(parsed)) {
                state = sanitizeState(parsed)
                return
            }
        }
    } catch {
        // Corrupted data falls back to the seed tree.
    }
    state = createSeedState()
}

/** Applies a mutation on an immutable copy, persists and notifies subscribers. */
function commit(mutator: (draft: TreeState) => void): void {
    const next: TreeState = {
        version: 1,
        nodes: { ...state.nodes },
        sessions: { ...state.sessions },
    }
    mutator(next)
    state = next
    persist()
    emit()
}

/* ---------- Undo buffers (session-only, not persisted) ---------- */

let lastDeleted: {
    nodes: TreeNode[]
    sessions: Record<string, Session[]>
} | null = null
let lastMove: Array<{ id: string; from: string | null }> | null = null
let answerStack: Array<{ topicId: string; sessionId: string; hit: boolean }> =
    []

function clearUndoBuffers(): void {
    lastDeleted = null
    lastMove = null
    answerStack = []
}

/* ---------- Store ---------- */

export const store = {
    subscribe(listener: () => void): () => void {
        listeners.add(listener)
        return () => listeners.delete(listener)
    },

    getState(): TreeState {
        // Lazily hydrates from localStorage on the first client read.
        ensureLoaded()
        return state
    },

    /** Creates a node and returns its id. Caller must validate the name. */
    createNode(parentId: string | null, kind: NodeKind, name?: string): string {
        const finalName =
            normalizeName(name ?? "") ||
            nextName(
                state.nodes,
                parentId,
                kind === "folder" ? "New folder" : "New topic",
            )
        const now = Date.now()
        const node: TreeNode = {
            id: newId(),
            name: finalName,
            kind,
            parentId,
            createdAt: now,
            updatedAt: now,
        }
        commit((draft) => {
            draft.nodes[node.id] = node
        })
        return node.id
    },

    renameNode(id: string, rawName: string): boolean {
        const node = state.nodes[id]
        if (!node) return false
        const name = normalizeName(rawName)
        if (name.length === 0 || name === node.name) return false
        commit((draft) => {
            draft.nodes[id] = { ...node, name, updatedAt: Date.now() }
        })
        return true
    },

    deleteNodes(ids: string[]): number {
        const idsToRemove = new Set<string>()
        for (const id of ids) {
            if (!state.nodes[id]) continue
            for (const related of subtreeIds(state.nodes, id))
                idsToRemove.add(related)
        }
        if (idsToRemove.size === 0) return 0

        const removedNodes: TreeNode[] = []
        const removedSessions: Record<string, Session[]> = {}
        commit((draft) => {
            for (const id of idsToRemove) {
                const node = draft.nodes[id]
                if (!node) continue
                removedNodes.push(node)
                delete draft.nodes[id]
                if (node.kind === "topic" && draft.sessions[id]) {
                    removedSessions[id] = draft.sessions[id]
                    delete draft.sessions[id]
                }
            }
        })
        lastDeleted = { nodes: removedNodes, sessions: removedSessions }
        return removedNodes.length
    },

    undoDelete(): boolean {
        if (!lastDeleted || lastDeleted.nodes.length === 0) return false
        const { nodes: removedNodes, sessions: removedSessions } = lastDeleted
        lastDeleted = null
        commit((draft) => {
            // Reinsert level by level so parents are restored before children.
            const pending = [...removedNodes]
            let guard = 0
            while (pending.length > 0 && guard < 100) {
                guard += 1
                let progressed = false
                for (let i = pending.length - 1; i >= 0; i--) {
                    const node = pending[i]
                    const parentReady =
                        node.parentId === null ||
                        draft.nodes[node.parentId] !== undefined
                    if (!parentReady) continue
                    draft.nodes[node.id] = { ...node }
                    if (removedSessions[node.id])
                        draft.sessions[node.id] = removedSessions[node.id]
                    pending.splice(i, 1)
                    progressed = true
                }
                if (!progressed) break
            }
            for (const node of pending) {
                draft.nodes[node.id] = { ...node, parentId: null }
            }
        })
        return true
    },

    /** Moves ids into `targetParentId` (`null` = root). Returns how many moved. */
    moveNodes(ids: string[], targetParentId: string | null): number {
        const { accepted } = computeMove(state.nodes, ids, targetParentId)
        if (accepted.length === 0) return 0
        lastMove = accepted.map((id) => ({
            id,
            from: state.nodes[id]?.parentId ?? null,
        }))
        const now = Date.now()
        commit((draft) => {
            for (const id of accepted) {
                const node = draft.nodes[id]
                if (node)
                    draft.nodes[id] = {
                        ...node,
                        parentId: targetParentId,
                        updatedAt: now,
                    }
            }
        })
        return accepted.length
    },

    undoMove(): boolean {
        if (!lastMove || lastMove.length === 0) return false
        const moves = lastMove
        lastMove = null
        commit((draft) => {
            for (const move of moves) {
                const node = draft.nodes[move.id]
                if (!node) continue
                const parent =
                    move.from !== null && draft.nodes[move.from]
                        ? move.from
                        : null
                draft.nodes[move.id] = { ...node, parentId: parent }
            }
        })
        return true
    },

    /**
     * Records a session on a topic. Already wired for phase 2 (the gamified
     * hit/miss registration screen will call this).
     */
    addSession(
        topicId: string,
        input: { date: string; hits: number; total: number },
    ): Session | null {
        const topic = state.nodes[topicId]
        if (!topic || topic.kind !== "topic") return null
        const hits = Math.max(0, Math.floor(input.hits))
        const total = Math.max(hits, Math.floor(input.total))
        if (total <= 0) return null
        const session: Session = {
            id: newId(),
            date: input.date,
            hits,
            total,
            createdAt: Date.now(),
        }
        commit((draft) => {
            draft.sessions[topicId] = [
                ...(draft.sessions[topicId] ?? []),
                session,
            ]
        })
        return session
    },

    /**
     * Records one answer on today's session: +1 total, +1 hits when hit.
     * Creates the session for today on the first answer.
     */
    recordAnswer(topicId: string, hit: boolean): Session | null {
        const topic = state.nodes[topicId]
        if (!topic || topic.kind !== "topic") return null
        const date = new Date().toISOString().slice(0, 10)
        const existing = (state.sessions[topicId] ?? []).find(
            (s) => s.date === date,
        )

        if (existing) {
            commit((draft) => {
                const session = draft.sessions[topicId]?.find(
                    (s) => s.id === existing.id,
                )
                if (!session) return
                session.total += 1
                if (hit) session.hits += 1
            })
            answerStack.push({ topicId, sessionId: existing.id, hit })
            return (
                state.sessions[topicId]?.find((s) => s.id === existing.id) ??
                null
            )
        }

        const session: Session = {
            id: newId(),
            date,
            hits: hit ? 1 : 0,
            total: 1,
            createdAt: Date.now(),
        }
        commit((draft) => {
            draft.sessions[topicId] = [
                ...(draft.sessions[topicId] ?? []),
                session,
            ]
        })
        answerStack.push({ topicId, sessionId: session.id, hit })
        return session
    },

    /** True when this topic still has answers that can be undone. */
    hasAnswerHistory(topicId: string): boolean {
        return answerStack.some((entry) => entry.topicId === topicId)
    },

    /** Reverts the most recent recorded answer (removes today's session if it empties). */
    undoAnswer(): boolean {
        const last = answerStack[answerStack.length - 1]
        if (!last) return false
        const pending = (state.sessions[last.topicId] ?? []).find(
            (s) => s.id === last.sessionId,
        )
        // Guard: never regress an already-empty/missing session.
        if (!pending || pending.total <= 0) {
            answerStack = answerStack.filter((entry) =>
                entry.topicId !== last.topicId ? true : entry !== last,
            )
            return false
        }
        answerStack.pop()
        commit((draft) => {
            const sessions = draft.sessions[last.topicId]
            const session = sessions?.find((s) => s.id === last.sessionId)
            if (!session) return
            session.total = Math.max(0, session.total - 1)
            if (last.hit) session.hits = Math.max(0, session.hits - 1)
            if (session.total === 0) {
                const remaining = (draft.sessions[last.topicId] ?? []).filter(
                    (s) => s.id !== session.id,
                )
                if (remaining.length > 0)
                    draft.sessions[last.topicId] = remaining
                else delete draft.sessions[last.topicId]
            }
        })
        return true
    },

    exportState(): string {
        return JSON.stringify(state, null, 2)
    },

    canImport(raw: string): boolean {
        try {
            return isValidState(JSON.parse(raw))
        } catch {
            return false
        }
    },

    importState(raw: string): boolean {
        let parsed: unknown
        try {
            parsed = JSON.parse(raw)
        } catch {
            return false
        }
        if (!isValidState(parsed)) return false
        state = sanitizeState(parsed as TreeState)
        clearUndoBuffers()
        persist()
        emit()
        return true
    },

    resetToSample(): void {
        state = createSeedState()
        clearUndoBuffers()
        persist()
        emit()
    },

    clearAll(): void {
        state = createState()
        clearUndoBuffers()
        persist()
        emit()
    },
}

/* ---------- React bindings ---------- */

export function useTreeState(): TreeState {
    return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}

/**
 * `true` on the client after hydration, `false` on the server. Implemented
 * with `useSyncExternalStore` so no effect-driven setState is needed.
 */
const noopSubscribe = () => () => {}
export function useStoreReady(): boolean {
    return useSyncExternalStore(
        noopSubscribe,
        () => true,
        () => false,
    )
}
