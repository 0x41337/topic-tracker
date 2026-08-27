"use client"

import { useMemo } from "react"

import { childrenOf, dailySeries, topicStats } from "@/core"
import { cn } from "@/lib/utils"
import { DailyBarChart } from "@/components/charts"
import { useExplorer } from "../explorer-context"
import { TreeRow } from "../tree"
import { EmptyState } from "./empty-state"

/** Listing of a folder's direct children plus a subtree activity overview. */
export function FolderView({
    parentId,
    totalNodes,
}: {
    parentId: string | null
    totalNodes: number
}) {
    const ctx = useExplorer()
    const { state, drag, creating } = ctx

    const rows = useMemo(
        () =>
            childrenOf(state.nodes, parentId).map((node) => ({
                node,
                depth: 0,
            })),
        [state.nodes, parentId],
    )

    // Subtree overview: sessions from every topic below this folder.
    const overview = useMemo(() => {
        const topicIds: string[] = []
        const collect = (pid: string | null): void => {
            for (const node of Object.values(state.nodes)) {
                if (node.parentId !== pid) continue
                if (node.kind === "topic") topicIds.push(node.id)
                else collect(node.id)
            }
        }
        collect(parentId)
        const sessions = topicIds.flatMap((id) => state.sessions[id] ?? [])
        return {
            series: dailySeries(sessions),
            stats: topicStats(sessions),
            topicCount: topicIds.length,
        }
    }, [state.nodes, state.sessions, parentId])

    const emptyZoneKey = `content:${parentId ?? "root"}`
    const isOverEmpty = drag.ids.length > 0 && drag.overKey === emptyZoneKey

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                role="list"
                aria-label="Folder contents"
                {...ctx.dropProps(emptyZoneKey, parentId)}
                onContextMenu={(event) => {
                    event.preventDefault()
                    ctx.openMenu(event, ctx.backgroundMenuItems(rows))
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget)
                        ctx.clearSelection()
                }}
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto p-2 outline-none",
                    isOverEmpty &&
                        "bg-accent/40 ring-1 ring-inset ring-foreground/30",
                )}
            >
                {overview.series.length > 0 ? (
                    <div className="mb-2 rounded-lg border p-3">
                        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Overview
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {overview.topicCount}{" "}
                                {overview.topicCount === 1 ? "topic" : "topics"}{" "}
                                · {overview.stats.sessionCount}{" "}
                                {overview.stats.sessionCount === 1
                                    ? "session"
                                    : "sessions"}
                            </p>
                        </div>
                        <DailyBarChart data={overview.series} slim />
                    </div>
                ) : null}
                {rows.map(({ node }) => (
                    <TreeRow
                        key={node.id}
                        node={node}
                        depth={0}
                        variant="list"
                        rows={rows}
                    />
                ))}
                {rows.length === 0 && creating === null ? (
                    <EmptyState parentId={parentId} totalNodes={totalNodes} />
                ) : null}
            </div>
        </div>
    )
}
