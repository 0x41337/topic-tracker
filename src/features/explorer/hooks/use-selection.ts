"use client"

import { useState } from "react"

import type { FlatRow } from "@/core"

/**
 * Multi-selection state for tree/list surfaces: a set of ids plus an anchor
 * (shift-range origin) and a focus id (last acted row).
 */
export function useSelection() {
    const [selection, setSelection] = useState<Set<string>>(new Set())
    const [anchorId, setAnchorId] = useState<string | null>(null)
    const [focusId, setFocusId] = useState<string | null>(null)

    const clearSelection = () => {
        setSelection(new Set())
        setAnchorId(null)
        setFocusId(null)
    }

    const selectOnly = (id: string) => {
        setSelection(new Set([id]))
        setAnchorId(id)
        setFocusId(id)
    }

    const selectToggle = (id: string) => {
        setSelection((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
        setAnchorId(id)
        setFocusId(id)
    }

    const selectRange = (targetId: string, rows: FlatRow[]) => {
        const base = anchorId ?? focusId
        setFocusId(targetId)
        const ids = base
            ? ((): string[] => {
                  const idsInOrder = rows.map((row) => row.node.id)
                  const i = idsInOrder.indexOf(base)
                  const j = idsInOrder.indexOf(targetId)
                  if (i === -1 || j === -1) return [targetId]
                  const [start, end] = i <= j ? [i, j] : [j, i]
                  return idsInOrder.slice(start, end + 1)
              })()
            : [targetId]
        setSelection(new Set(ids))
    }

    const selectAllVisible = (rows: FlatRow[]) => {
        if (rows.length === 0) return
        setSelection(new Set(rows.map((row) => row.node.id)))
        setAnchorId(rows[0].node.id)
        setFocusId(rows[rows.length - 1].node.id)
    }

    const replaceSelection = (ids: string[]) => {
        setSelection(new Set(ids))
        setAnchorId(ids[0] ?? null)
        setFocusId(ids[0] ?? null)
    }

    return {
        selection,
        anchorId,
        focusId,
        selectOnly,
        selectToggle,
        selectRange,
        selectAllVisible,
        replaceSelection,
        clearSelection,
    }
}

export type SelectionApi = ReturnType<typeof useSelection>
