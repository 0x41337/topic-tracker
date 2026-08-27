"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
    BarChart3,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Pencil,
    Search,
    Trash2,
    X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    flattenVisible,
    formatPercent,
    nameIsValid,
    normalizeName,
    topicStats,
} from "@/lib/tree-utils"
import type { FlatRow } from "@/lib/tree-utils"
import type { TreeNode } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { useExplorer } from "./context"
import type { CreatingState, DropMode } from "./context"

/* ---------- Inline rename ---------- */

function RenameInput({ node }: { node: TreeNode }) {
    const { commitRename, cancelRename } = useExplorer()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const cancelledRef = useRef(false)
    const [value, setValue] = useState(node.name)
    const [invalid, setInvalid] = useState(false)

    useEffect(() => {
        const element = inputRef.current
        if (!element) return
        element.focus()
        element.select()
    }, [])

    const commit = () => {
        if (!commitRename(node.id, value)) {
            setInvalid(true)
            inputRef.current?.focus()
        }
    }

    return (
        <Input
            ref={inputRef}
            value={value}
            onChange={(event) => {
                setValue(event.target.value)
                setInvalid(false)
            }}
            onBlur={() => {
                if (cancelledRef.current) return
                commit()
            }}
            onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === "Enter") {
                    event.preventDefault()
                    commit()
                } else if (event.key === "Escape") {
                    event.preventDefault()
                    cancelledRef.current = true
                    cancelRename()
                }
            }}
            title={invalid ? "This name is already in use." : undefined}
            aria-label="Node name"
            className={cn(
                "h-6 px-1.5 text-sm",
                invalid && "border-destructive ring-1 ring-destructive",
            )}
        />
    )
}

/* ---------- Inline creation ---------- */

function CreateInput({
    creating,
    depth,
}: {
    creating: CreatingState
    depth: number
}) {
    const { commitCreate, cancelCreate, state } = useExplorer()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const cancelledRef = useRef(false)
    const [value, setValue] = useState("")
    const [invalid, setInvalid] = useState(false)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const commit = () => {
        const name = normalizeName(value)
        if (name.length === 0) {
            cancelCreate()
            return
        }
        if (!nameIsValid(state.nodes, creating.parentId, name)) {
            setInvalid(true)
            inputRef.current?.focus()
            return
        }
        commitCreate(name)
    }

    const Icon = creating.kind === "folder" ? Folder : FileText

    return (
        <div
            className="flex h-7 items-center gap-1 pr-2"
            style={{ paddingLeft: depth * 16 + 4 }}
        >
            <span className="grid size-5 shrink-0 place-items-center">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            </span>
            <Input
                ref={inputRef}
                value={value}
                placeholder={
                    creating.kind === "folder" ? "Folder name" : "Topic name"
                }
                onChange={(event) => {
                    setValue(event.target.value)
                    setInvalid(false)
                }}
                onBlur={() => {
                    if (cancelledRef.current) return
                    commit()
                }}
                onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === "Enter") {
                        event.preventDefault()
                        commit()
                    } else if (event.key === "Escape") {
                        event.preventDefault()
                        cancelledRef.current = true
                        cancelCreate()
                    }
                }}
                title={invalid ? "This name is already in use." : undefined}
                aria-label="New node name"
                className={cn(
                    "h-6 px-1.5 text-sm",
                    invalid && "border-destructive ring-1 ring-destructive",
                )}
            />
        </div>
    )
}

/* ---------- Row (shared by the tree and the folder list) ---------- */

interface ExplorerRowProps {
    node: TreeNode
    depth: number
    variant: "tree" | "list"
    rows: FlatRow[]
}

export function ExplorerRow({ node, depth, variant, rows }: ExplorerRowProps) {
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
    const dropMode: DropMode = isFolder && !dragging ? "drop" : "block"
    const isOver =
        drag.overKey === dropKey && dropMode === "drop" && drag.canDrop(node.id)

    const stats = isFolder ? null : topicStats(state.sessions[node.id])

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
            {...ctx.dropProps(dropKey, isFolder ? node.id : null, dropMode)}
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
                if (!selection.has(node.id)) ctx.selectOnly(node.id)
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
                        ctx.requestDelete(
                            selection.has(node.id) ? [...selection] : [node.id],
                        )
                    }}
                >
                    <Trash2 className="size-3" />
                </button>
            </span>
        </div>
    )
}

/* ---------- Tree pane ---------- */

type RenderItem =
    { type: "row"; row: FlatRow } | { type: "create"; depth: number }

/** Inserts the inline creation input right after the target parent's block. */
function withCreateRow(
    rows: FlatRow[],
    creating: CreatingState | null,
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
                            creating={creating}
                            depth={item.depth}
                        />
                    ) : item.type === "row" ? (
                        <ExplorerRow
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
