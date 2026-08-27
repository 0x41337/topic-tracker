"use client"

import {
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Pencil,
    Trash2,
} from "lucide-react"

import { formatPercent, topicStats } from "@/core"
import type { FlatRow, TreeNode } from "@/core"
import { cn } from "@/lib/utils"
import { useExplorer } from "../explorer-context"
import { RenameInput } from "./node-name-inputs"

export interface TreeRowProps {
    node: TreeNode
    depth: number
    /** "tree" = indented sidebar row, "list" = flat row in the folder view. */
    variant: "tree" | "list"
    rows: FlatRow[]
}

/** A single node row, shared by the tree pane and the folder listing. */
export function TreeRow({ node, depth, variant, rows }: TreeRowProps) {
    const ctx = useExplorer()
    const {
        state,
        selection,
        focusId,
        renamingId,
        renamingSurface,
        expanded,
        drag,
    } = ctx

    const selected = selection.has(node.id)
    const focused = focusId === node.id
    const isFolder = node.kind === "folder"
    const isRenaming = renamingId === node.id && renamingSurface === variant
    const isOpen = isFolder && expanded.has(node.id)
    const dragging = drag.ids.includes(node.id)

    const dropKey = `folder:${node.id}`
    const isOver =
        drag.overKey === dropKey && !dragging && drag.canDrop(node.id)

    const stats = isFolder ? null : topicStats(state.sessions[node.id])
    const deleteIds = selected ? [...selection] : [node.id]

    if (isRenaming) {
        return (
            <div
                className={cn(
                    "flex items-center gap-1 pr-2",
                    variant === "tree" ? "h-7" : "h-9 gap-2 pl-2",
                )}
                style={
                    variant === "tree"
                        ? { paddingLeft: depth * 16 + 4 }
                        : undefined
                }
            >
                {variant === "tree" ? (
                    <span className="size-5 shrink-0" />
                ) : null}
                {variant === "list" ? (
                    isFolder ? (
                        <Folder className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                    )
                ) : null}
                <RenameInput node={node} />
            </div>
        )
    }

    return (
        <div
            {...ctx.dragProps(node)}
            {...ctx.dropProps(
                dropKey,
                isFolder ? node.id : null,
                isFolder && !dragging ? "drop" : "block",
            )}
            data-row={node.id}
            role="treeitem"
            aria-selected={selected}
            aria-expanded={isFolder ? isOpen : undefined}
            title={node.name}
            className={cn(
                "group relative flex cursor-default select-none items-center gap-1 rounded-md pr-2 text-sm",
                variant === "tree" ? "h-7" : "h-9 gap-2 pl-2",
                selected ? "bg-accent" : "hover:bg-accent/50",
                focused && "ring-1 ring-inset ring-foreground/40",
                isOver && "bg-accent ring-1 ring-inset ring-foreground",
                dragging && "opacity-40",
            )}
            style={
                variant === "tree" ? { paddingLeft: depth * 16 + 4 } : undefined
            }
            onClick={(event) => ctx.handleRowClick(event, node, rows)}
            onDoubleClick={() => {
                if (isFolder) ctx.toggleExpand(node.id)
            }}
            onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!selected) ctx.selectOnly(node.id)
                ctx.openMenu(event, ctx.rowMenuItems(node, variant))
            }}
        >
            {variant === "tree" ? (
                isFolder ? (
                    <button
                        type="button"
                        aria-label={isOpen ? "Collapse" : "Expand"}
                        className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                        onClick={(event) => {
                            event.stopPropagation()
                            ctx.toggleExpand(node.id)
                        }}
                    >
                        <ChevronRight
                            className={cn(
                                "size-3.5 transition-transform",
                                isOpen && "rotate-90",
                            )}
                        />
                    </button>
                ) : (
                    <span className="size-5 shrink-0" />
                )
            ) : null}

            {isFolder ? (
                variant === "tree" && isOpen ? (
                    <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                    <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                )
            ) : (
                <FileText
                    className={cn(
                        "shrink-0 text-muted-foreground",
                        variant === "tree" ? "size-3.5" : "size-4",
                    )}
                />
            )}

            <span className="min-w-0 flex-1 truncate">{node.name}</span>

            {variant === "list" &&
            !isFolder &&
            stats &&
            stats.sessionCount > 0 ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground transition-opacity group-hover:opacity-0">
                    {formatPercent(stats.score)}
                </span>
            ) : null}

            {/* Mouse-first row actions, revealed on hover. */}
            <span className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 opacity-0 invisible transition-opacity group-hover:opacity-100 group-hover:visible">
                <button
                    type="button"
                    aria-label={`Rename ${node.name}`}
                    title="Rename"
                    className="grid size-5 place-items-center rounded-sm bg-background/80 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    onClick={(event) => {
                        event.stopPropagation()
                        ctx.beginRename(node.id, variant)
                    }}
                >
                    <Pencil className="size-3" />
                </button>
                <button
                    type="button"
                    aria-label={`Delete ${node.name}`}
                    title="Delete"
                    className="grid size-5 place-items-center rounded-sm bg-background/80 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    onClick={(event) => {
                        event.stopPropagation()
                        ctx.requestDelete(deleteIds)
                    }}
                >
                    <Trash2 className="size-3" />
                </button>
            </span>
        </div>
    )
}
