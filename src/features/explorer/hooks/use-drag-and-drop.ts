"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { computeMove, store } from "@/core"
import type { TreeNode } from "@/core"

export interface DragRowProps {
    draggable: boolean
    onDragStart: (event: React.DragEvent<HTMLElement>) => void
    onDragEnd: (event: React.DragEvent<HTMLElement>) => void
}

export interface DropZoneProps {
    onDragOver: (event: React.DragEvent<HTMLElement>) => void
    onDragLeave: (event: React.DragEvent<HTMLElement>) => void
    onDrop: (event: React.DragEvent<HTMLElement>) => void
}

export type DropMode = "drop" | "block"

export interface DragAndDropDeps {
    selectOnly: (id: string) => void
    toggleExpand: (id: string, value?: boolean) => void
    replaceSelection: (ids: string[]) => void
}

const AUTO_EXPAND_DELAY_MS = 700

/**
 * Mouse drag & drop: dragging honors the current multi-selection, drop zones
 * validate targets, and hovering a collapsed folder auto-expands it.
 */
export function useDragAndDrop(
    nodes: Record<string, TreeNode>,
    selection: Set<string>,
    deps: DragAndDropDeps,
) {
    const { selectOnly, toggleExpand, replaceSelection } = deps
    const [dragIds, setDragIds] = useState<string[]>([])
    const [overKey, setOverKey] = useState<string | null>(null)
    const autoExpandTimers = useRef(
        new Map<string, ReturnType<typeof setTimeout>>(),
    )

    const clearAutoExpandTimers = () => {
        for (const timer of autoExpandTimers.current.values())
            clearTimeout(timer)
        autoExpandTimers.current.clear()
    }

    const scheduleAutoExpand = (folderId: string) => {
        if (autoExpandTimers.current.has(folderId)) return
        const timer = setTimeout(() => {
            autoExpandTimers.current.delete(folderId)
            toggleExpand(folderId, true)
        }, AUTO_EXPAND_DELAY_MS)
        autoExpandTimers.current.set(folderId, timer)
    }

    const cancelAutoExpand = (folderId: string) => {
        const timer = autoExpandTimers.current.get(folderId)
        if (timer !== undefined) {
            clearTimeout(timer)
            autoExpandTimers.current.delete(folderId)
        }
    }

    const endDrag = () => {
        setDragIds([])
        setOverKey(null)
        clearAutoExpandTimers()
    }

    const canDrop = (targetParentId: string | null): boolean => {
        if (dragIds.length === 0) return false
        return computeMove(nodes, dragIds, targetParentId).accepted.length > 0
    }

    const performDrop = (targetParentId: string | null) => {
        const moved = store.moveNodes(dragIds, targetParentId)
        if (moved > 0) {
            if (targetParentId !== null) toggleExpand(targetParentId, true)
            toast.success("Moved", {
                action: { label: "Undo", onClick: () => store.undoMove() },
            })
            replaceSelection(dragIds.filter((id) => nodes[id]))
        }
        endDrag()
    }

    const dragProps = (node: TreeNode): DragRowProps => ({
        draggable: true,
        onDragStart: (event) => {
            const ids = selection.has(node.id) ? [...selection] : [node.id]
            if (!selection.has(node.id)) selectOnly(node.id)
            setDragIds(ids)
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData("application/x-tracktree", ids.join(","))
            event.dataTransfer.setData(
                "text/plain",
                ids.map((id) => nodes[id]?.name ?? "").join(", "),
            )
        },
        onDragEnd: () => endDrag(),
    })

    const dropProps = (
        key: string,
        targetParentId: string | null,
        mode: DropMode = "drop",
    ): DropZoneProps => ({
        onDragOver: (event) => {
            // Block the browser default (opening dropped files/text) everywhere.
            event.preventDefault()
            if (mode === "block") {
                event.stopPropagation()
                setOverKey(null)
                return
            }
            if (dragIds.length === 0 || !canDrop(targetParentId)) return
            event.stopPropagation()
            event.dataTransfer.dropEffect = "move"
            setOverKey((prev) => (prev === key ? prev : key))
            if (targetParentId !== null) scheduleAutoExpand(targetParentId)
        },
        onDragLeave: (event) => {
            const element = event.currentTarget
            const related = event.relatedTarget as Node | null
            if (related && element.contains(related)) return
            setOverKey((prev) => (prev === key ? null : prev))
            if (targetParentId !== null) cancelAutoExpand(targetParentId)
        },
        onDrop: (event) => {
            event.preventDefault()
            if (dragIds.length === 0) return
            // This zone owns the drop; never let it bubble to ancestor drop zones.
            event.stopPropagation()
            if (mode === "block") return
            if (!canDrop(targetParentId)) return
            performDrop(targetParentId)
        },
    })

    return {
        drag: { ids: dragIds, overKey, canDrop },
        dragProps,
        dropProps,
        endDrag,
    }
}

export type DragAndDropApi = ReturnType<typeof useDragAndDrop>
