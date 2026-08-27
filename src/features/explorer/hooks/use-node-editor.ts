"use client"

import { useState } from "react"

import { nameIsValid, normalizeName, store } from "@/core"
import type { NodeKind, TreeNode } from "@/core"

export interface CreatingState {
    parentId: string | null
    kind: NodeKind
}

export interface NodeEditorDeps {
    expandTo: (id: string) => void
    toggleExpand: (id: string, value?: boolean) => void
    clearSelection: () => void
    selectOnly: (id: string) => void
    setQuery: (query: string) => void
    setMobilePane: (pane: "tree" | "content") => void
}

/**
 * Inline rename and inline creation. Owns the transient UI state for both and
 * validates names against siblings before committing to the store.
 */
export function useNodeEditor(
    nodes: Record<string, TreeNode>,
    openId: string | null,
    deps: NodeEditorDeps,
) {
    const {
        expandTo,
        toggleExpand,
        clearSelection,
        selectOnly,
        setQuery,
        setMobilePane,
    } = deps
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renamingSurface, setRenamingSurface] = useState<"tree" | "list">(
        "tree",
    )
    const [creating, setCreating] = useState<CreatingState | null>(null)

    /* ----- Rename ----- */

    const beginRename = (id: string, surface: "tree" | "list" = "tree") => {
        if (!nodes[id]) return
        setQuery("")
        expandTo(id)
        setRenamingId(id)
        setRenamingSurface(surface)
        setMobilePane(surface === "tree" ? "tree" : "content")
    }

    const commitRename = (id: string, rawName: string): boolean => {
        const node = nodes[id]
        if (!node) {
            setRenamingId(null)
            return true
        }
        const name = normalizeName(rawName)
        if (name.length === 0) return false
        if (name === node.name) {
            setRenamingId(null)
            return true
        }
        if (!nameIsValid(nodes, node.parentId, name, id)) return false
        store.renameNode(id, name)
        setRenamingId(null)
        return true
    }

    const cancelRename = () => setRenamingId(null)

    /* ----- Create ----- */

    const defaultCreateParent = (): string | null => {
        if (openId !== null) {
            const node = nodes[openId]
            if (node?.kind === "folder") return node.id
            if (node) return node.parentId
        }
        return null
    }

    const beginCreate = (kind: NodeKind, parentId?: string | null) => {
        const target = parentId !== undefined ? parentId : defaultCreateParent()
        if (target !== null) {
            expandTo(target)
            toggleExpand(target, true)
        }
        setRenamingId(null)
        setCreating({ parentId: target, kind })
        setQuery("")
        clearSelection()
        setMobilePane("tree")
    }

    const commitCreate = (rawName: string) => {
        if (!creating) return
        const name = normalizeName(rawName)
        if (name.length === 0) {
            setCreating(null)
            return
        }
        const id = store.createNode(creating.parentId, creating.kind, name)
        setCreating(null)
        if (creating.parentId !== null) toggleExpand(creating.parentId, true)
        selectOnly(id)
    }

    const cancelCreate = () => setCreating(null)

    const stopEditing = () => {
        setRenamingId(null)
        setCreating(null)
    }

    return {
        renamingId,
        renamingSurface,
        beginRename,
        commitRename,
        cancelRename,
        creating,
        beginCreate,
        commitCreate,
        cancelCreate,
        stopEditing,
    }
}

export type NodeEditorApi = ReturnType<typeof useNodeEditor>
