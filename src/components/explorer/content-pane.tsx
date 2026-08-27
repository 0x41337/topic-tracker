"use client"

import { useMemo } from "react"
import { ChevronRight, FilePlus, FolderPlus, ListTree } from "lucide-react"

import { cn } from "@/lib/utils"
import { childrenOf, pathOf, topicStats } from "@/lib/tree-utils"
import { dailySeries } from "@/lib/stats-utils"
import { DailyBarChart } from "./charts"
import type { TreeNode } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useExplorer } from "./context"
import { ExplorerRow } from "./tree"
import { TopicView } from "./topic-view"
import { DashboardView } from "./dashboard"
import { PracticeView } from "./practice-view"

/* ---------- Breadcrumbs ---------- */

function Crumb({ node, active }: { node: TreeNode | null; active: boolean }) {
    const ctx = useExplorer()
    const key = node ? `crumb:${node.id}` : "crumb:root"
    const target = node ? node.id : null
    const isOver = ctx.drag.overKey === key && ctx.drag.canDrop(target)

    return (
        <button
            type="button"
            {...ctx.dropProps(key, target, "drop")}
            onClick={() => (node ? ctx.openNode(node.id) : ctx.navigateRoot())}
            title={node ? node.name : "Home"}
            className={cn(
                "max-w-44 cursor-pointer truncate rounded px-1.5 py-0.5 text-sm transition-colors",
                active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isOver && "bg-accent ring-1 ring-inset ring-foreground",
            )}
        >
            {node ? node.name : "Home"}
        </button>
    )
}

/* ---------- Folder view ---------- */

function EmptyState({
    parentId,
    totalNodes,
}: {
    parentId: string | null
    totalNodes: number
}) {
    const ctx = useExplorer()

    if (totalNodes === 0) {
        return (
            <div className="grid flex-1 place-items-center p-8">
                <div className="max-w-sm space-y-4 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full border">
                        <ListTree className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold">
                            No folders or topics yet
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Create a folder to get started.
                        </p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => ctx.beginCreate("folder", parentId)}
                        >
                            <FolderPlus className="size-4" /> New folder
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => ctx.beginCreate("topic", parentId)}
                        >
                            <FilePlus className="size-4" /> New topic
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pointer-events-none grid flex-1 place-items-center p-8">
            <div className="space-y-1 rounded-lg border border-dashed px-8 py-6 text-center">
                <p className="text-sm font-medium">Empty folder</p>
                <p className="text-xs text-muted-foreground">
                    Drag items here or create something new.
                </p>
            </div>
        </div>
    )
}

function FolderView({
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
            for (const node of Object.values(ctx.state.nodes)) {
                if (node.parentId !== pid) continue
                if (node.kind === "topic") topicIds.push(node.id)
                else collect(node.id)
            }
        }
        collect(parentId)
        const sessions = topicIds.flatMap((id) => ctx.state.sessions[id] ?? [])
        return {
            series: dailySeries(sessions),
            stats: topicStats(sessions),
            topicCount: topicIds.length,
        }
    }, [ctx.state.nodes, ctx.state.sessions, parentId])

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
                    <ExplorerRow
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

/* ---------- Pane shell ---------- */

export function ContentPane() {
    const ctx = useExplorer()
    const { state, openId } = ctx

    if (ctx.practiceTopicId && ctx.state.nodes[ctx.practiceTopicId]) {
        return <PracticeView topicId={ctx.practiceTopicId} />
    }

    if (ctx.dashboardOpen) {
        return <DashboardView />
    }

    const node = openId !== null ? state.nodes[openId] : undefined
    const crumbs = node ? pathOf(state.nodes, node.id) : []
    const currentFolderId = node && node.kind === "folder" ? node.id : null
    const totalNodes = Object.keys(state.nodes).length
    const childCount = childrenOf(state.nodes, currentFolderId).length

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-11 shrink-0 items-center gap-1 border-b px-3">
                <nav
                    aria-label="Breadcrumb"
                    className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden"
                >
                    <Crumb node={null} active={openId === null} />
                    {crumbs.map((crumb) => (
                        <span
                            key={crumb.id}
                            className="flex min-w-0 items-center gap-0.5"
                        >
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                            <Crumb node={crumb} active={crumb.id === openId} />
                        </span>
                    ))}
                </nav>
                {!node || node.kind === "folder" ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {childCount} {childCount === 1 ? "item" : "items"}
                    </span>
                ) : null}
            </div>

            {node && node.kind === "topic" ? (
                <TopicView node={node} />
            ) : (
                <FolderView
                    parentId={currentFolderId}
                    totalNodes={totalNodes}
                />
            )}
        </div>
    )
}
