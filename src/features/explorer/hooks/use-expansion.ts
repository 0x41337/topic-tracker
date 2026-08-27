"use client"

import { useEffect, useState } from "react"

import { ancestorIds } from "@/core"
import type { TreeNode } from "@/core"

const EXPANDED_KEY = "tracktree.expanded.v1"

function initialExpanded(nodes: Record<string, TreeNode>): Set<string> {
    if (typeof window === "undefined") return new Set()
    try {
        const raw = window.localStorage.getItem(EXPANDED_KEY)
        if (raw) {
            const parsed: unknown = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                return new Set(
                    parsed.filter((id): id is string => typeof id === "string"),
                )
            }
        }
    } catch {
        // Fall through to the default below.
    }
    return new Set(
        Object.values(nodes)
            .filter((node) => node.kind === "folder" && node.parentId === null)
            .map((node) => node.id),
    )
}

/**
 * Which folders are open in the tree, persisted to localStorage. Roots default
 * to open on first run.
 */
export function useExpansion(ready: boolean, nodes: Record<string, TreeNode>) {
    const [expanded, setExpanded] = useState<Set<string>>(() =>
        initialExpanded(nodes),
    )

    useEffect(() => {
        if (!ready) return
        try {
            window.localStorage.setItem(
                EXPANDED_KEY,
                JSON.stringify([...expanded]),
            )
        } catch {
            // Non-fatal.
        }
    }, [expanded, ready])

    const toggleExpand = (id: string, value?: boolean) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            const open = value ?? !next.has(id)
            if (open) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const expandTo = (id: string) => {
        const ancestors = ancestorIds(nodes, id)
        if (ancestors.length === 0) return
        setExpanded((prev) => {
            const next = new Set(prev)
            for (const ancestor of ancestors) next.add(ancestor)
            return next
        })
    }

    const expandAll = () => {
        setExpanded(
            new Set(
                Object.values(nodes)
                    .filter((node) => node.kind === "folder")
                    .map((node) => node.id),
            ),
        )
    }

    const collapseAll = () => setExpanded(new Set())

    /** Root folders open, everything else closed (used after data resets). */
    const resetExpansion = () => {
        setExpanded(
            new Set(
                Object.values(nodes)
                    .filter(
                        (node) =>
                            node.kind === "folder" && node.parentId === null,
                    )
                    .map((node) => node.id),
            ),
        )
    }

    return {
        expanded,
        toggleExpand,
        expandTo,
        expandAll,
        collapseAll,
        resetExpansion,
    }
}

export type ExpansionApi = ReturnType<typeof useExpansion>
