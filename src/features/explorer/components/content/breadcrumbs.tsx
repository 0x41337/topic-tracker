"use client"

import { ChevronRight } from "lucide-react"

import type { TreeNode } from "@/core"
import { cn } from "@/lib/utils"
import { useExplorer } from "../explorer-context"

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

/** Home > ... > node trail; doubles as drop targets for moves. */
export function Breadcrumbs({
    crumbs,
    activeId,
}: {
    crumbs: TreeNode[]
    activeId: string | null
}) {
    return (
        <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden"
        >
            <Crumb node={null} active={activeId === null} />
            {crumbs.map((crumb) => (
                <span
                    key={crumb.id}
                    className="flex min-w-0 items-center gap-0.5"
                >
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <Crumb node={crumb} active={crumb.id === activeId} />
                </span>
            ))}
        </nav>
    )
}
