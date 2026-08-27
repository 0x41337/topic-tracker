"use client"

import { useMemo } from "react"
import { BarChart3, Search, X } from "lucide-react"

import { flattenVisible } from "@/core"
import type { FlatRow } from "@/core"
import { cn } from "@/lib/utils"
import { useExplorer } from "../explorer-context"
import { CreateInput } from "./node-name-inputs"
import { TreeRow } from "./tree-row"

type RenderItem =
    { type: "row"; row: FlatRow } | { type: "create"; depth: number }

/** Inserts the inline creation input right after the target parent's block. */
function withCreateRow(
    rows: FlatRow[],
    creating: { parentId: string | null } | null,
): RenderItem[] {
    const items: RenderItem[] = rows.map((row) => ({ type: "row", row }))
    if (!creating) return items

    const parentIndex = rows.findIndex(
        (row) => row.node.id === creating.parentId,
    )
    let insertIndex: number
    let depth: number
    if (creating.parentId === null || parentIndex === -1) {
        insertIndex = items.length
        depth = 0
    } else {
        const parentDepth = rows[parentIndex].depth
        depth = parentDepth + 1
        insertIndex = parentIndex + 1
        while (
            insertIndex < rows.length &&
            rows[insertIndex].depth > parentDepth
        ) {
            insertIndex += 1
        }
    }
    items.splice(insertIndex, 0, { type: "create", depth })
    return items
}

/** Sidebar: search, dashboard shortcut, and the tree itself. */
export function TreePane() {
    const ctx = useExplorer()
    const { state, expanded, query, creating, drag } = ctx

    const rows = useMemo(
        () => flattenVisible(state.nodes, expanded, query),
        [state.nodes, expanded, query],
    )
    const items = useMemo(() => withCreateRow(rows, creating), [rows, creating])
    const isRootOver = drag.ids.length > 0 && drag.overKey === "tree-root"

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="p-2 pb-1">
                <label className="relative block">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(event) => ctx.setQuery(event.target.value)}
                        placeholder="Search"
                        aria-label="Search folders and topics"
                        className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40"
                    />
                    {query ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                            onClick={() => ctx.setQuery("")}
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : null}
                </label>
            </div>
            <div className="px-2 pb-1">
                <button
                    type="button"
                    aria-pressed={ctx.dashboardOpen}
                    onClick={() => ctx.toggleDashboard()}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        ctx.dashboardOpen
                            ? "bg-accent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                >
                    <BarChart3 className="size-3.5 shrink-0" />
                    <span className="truncate">Dashboard</span>
                </button>
            </div>
            <div
                role="tree"
                aria-label="Folders and topics"
                {...ctx.dropProps("tree-root", null)}
                onContextMenu={(event) => {
                    event.preventDefault()
                    ctx.openMenu(event, ctx.backgroundMenuItems(rows))
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget)
                        ctx.clearSelection()
                }}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto p-2 pt-1 outline-none",
                    isRootOver &&
                        "bg-accent/40 ring-1 ring-inset ring-foreground/30",
                )}
            >
                {items.map((item) =>
                    item.type === "create" && creating ? (
                        <CreateInput
                            key="create-input"
                            parentId={creating.parentId}
                            kind={creating.kind}
                            depth={item.depth}
                        />
                    ) : item.type === "row" ? (
                        <TreeRow
                            key={item.row.node.id}
                            node={item.row.node}
                            depth={item.row.depth}
                            variant="tree"
                            rows={rows}
                        />
                    ) : null,
                )}
                {rows.length === 0 && creating === null ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        {query ? "No matches found." : "Nothing here yet."}
                    </p>
                ) : null}
            </div>
        </div>
    )
}
