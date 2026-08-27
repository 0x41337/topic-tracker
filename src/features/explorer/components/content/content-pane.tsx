"use client"

import { childrenOf, pathOf } from "@/core"
import { DashboardView } from "@/features/dashboard"
import { PracticeView } from "@/features/practice"
import { TopicView } from "@/features/topic"
import { useExplorer } from "../explorer-context"
import { Breadcrumbs } from "./breadcrumbs"
import { FolderView } from "./folder-view"

/**
 * The right-hand surface. This is the composition point where feature
 * modules (topic, dashboard, practice) get hosted: swap any of them here
 * without touching the rest of the explorer.
 */
export function ContentPane() {
    const ctx = useExplorer()
    const { state, openId } = ctx

    // Practice overlay for the selected topic.
    if (ctx.practiceTopicId && state.nodes[ctx.practiceTopicId]) {
        return (
            <PracticeView
                topicId={ctx.practiceTopicId}
                onFinish={ctx.stopPractice}
            />
        )
    }

    // Cross-topic dashboard.
    if (ctx.dashboardOpen) {
        return <DashboardView state={state} onOpenTopic={ctx.openNode} />
    }

    const node = openId !== null ? state.nodes[openId] : undefined

    // Topic tracker page.
    if (node && node.kind === "topic") {
        return (
            <TopicView
                node={node}
                sessions={state.sessions[node.id] ?? []}
                onRename={ctx.beginRename}
                onStartPractice={ctx.startPractice}
            />
        )
    }

    // Folder listing.
    const crumbs = node ? pathOf(state.nodes, node.id) : []
    const currentFolderId = node && node.kind === "folder" ? node.id : null
    const totalNodes = Object.keys(state.nodes).length
    const childCount = childrenOf(state.nodes, currentFolderId).length

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-11 shrink-0 items-center gap-1 border-b px-3">
                <Breadcrumbs crumbs={crumbs} activeId={openId} />
                <span className="shrink-0 text-xs text-muted-foreground">
                    {childCount} {childCount === 1 ? "item" : "items"}
                </span>
            </div>
            <FolderView parentId={currentFolderId} totalNodes={totalNodes} />
        </div>
    )
}
