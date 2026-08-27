"use client"

import { useState } from "react"

import { store, subtreeIds } from "@/core"
import { toast } from "sonner"

export interface NodeDeletionDeps {
    selectOnly: (id: string) => void
    clearSelection: () => void
    stopEditing: () => void
    openId: string | null
    setOpenId: (id: string | null) => void
}

/**
 * Delete flow with confirmation + undo. Computes the nearest surviving
 * ancestor so the selection and open view land somewhere sensible.
 */
export function useNodeDeletion(
    nodes: Record<string, { parentId: string | null }>,
    deps: NodeDeletionDeps,
) {
    const { selectOnly, clearSelection, stopEditing, openId, setOpenId } = deps
    const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)

    const requestDelete = (ids: string[]) => {
        const valid = ids.filter((id) => nodes[id])
        if (valid.length === 0) return
        stopEditing()
        setPendingDelete(valid)
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const ids = pendingDelete
        const removed = new Set<string>()
        for (const id of ids) {
            for (const related of subtreeIds(nodes as never, id))
                removed.add(related)
        }
        let survivor: string | null = nodes[ids[0]]?.parentId ?? null
        while (survivor !== null && removed.has(survivor)) {
            survivor = nodes[survivor]?.parentId ?? null
        }
        store.deleteNodes(ids)
        setPendingDelete(null)

        toast.success("Deleted", {
            action: { label: "Undo", onClick: () => store.undoDelete() },
        })

        if (survivor !== null) {
            selectOnly(survivor)
            if (openId !== null && removed.has(openId)) setOpenId(survivor)
        } else {
            clearSelection()
            if (openId !== null && removed.has(openId)) setOpenId(null)
        }
    }

    const cancelDelete = () => setPendingDelete(null)

    return { pendingDelete, requestDelete, confirmDelete, cancelDelete }
}

export type NodeDeletionApi = ReturnType<typeof useNodeDeletion>
