"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
    FileText,
    FolderOpen,
    FolderPlus,
    FilePlus,
    ListChecks,
    ListTree,
    Pencil,
    Trash2,
    UnfoldVertical,
    FoldVertical,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { store, useStoreReady, useTreeState } from "@/lib/tree-store"
import {
    ancestorIds,
    computeMove,
    nameIsValid,
    normalizeName,
    rangeBetween,
    subtreeIds,
} from "@/lib/tree-utils"
import type { FlatRow } from "@/lib/tree-utils"
import type { NodeKind, TreeNode } from "@/lib/types"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ExplorerContext } from "./context"
import type {
    CreatingState,
    DragRowProps,
    DropMode,
    DropZoneProps,
    MenuItem,
    MenuState,
    PendingDataAction,
} from "./context"
import { Toolbar } from "./toolbar"
import { TreePane } from "./tree"
import { ContentPane } from "./content-pane"
import { ContextMenuSurface } from "./context-menu"
import { DataDialog, DeleteDialog } from "./dialogs"

const EXPANDED_KEY = "tracktree.expanded.v1"
const AUTO_EXPAND_DELAY_MS = 700

const CLOSED_MENU: MenuState = { open: false, x: 0, y: 0, items: [] }

export function Explorer() {
    const ready = useStoreReady()
    const state = useTreeState()

    /* ----- UI state ----- */
    const [query, setQuery] = useState("")
    // Expansion state is loaded lazily from localStorage (root folders default
    // to open on first run). The skeleton renders until `ready`, so this never
    // affects the hydration output.
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set<string>()
        try {
            const raw = window.localStorage.getItem(EXPANDED_KEY)
            if (raw) {
                const parsed: unknown = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    return new Set(
                        parsed.filter(
                            (id): id is string => typeof id === "string",
                        ),
                    )
                }
            }
            return new Set(
                Object.values(store.getState().nodes)
                    .filter(
                        (node) =>
                            node.kind === "folder" && node.parentId === null,
                    )
                    .map((node) => node.id),
            )
        } catch {
            return new Set<string>()
        }
    })
    const [selection, setSelection] = useState<Set<string>>(new Set())
    const [anchorId, setAnchorId] = useState<string | null>(null)
    const [focusId, setFocusId] = useState<string | null>(null)
    const [openId, setOpenId] = useState<string | null>(null)
    const [dashboardOpen, setDashboardOpen] = useState(false)
    const [practiceTopicId, setPracticeTopicId] = useState<string | null>(null)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renamingSurface, setRenamingSurface] = useState<"tree" | "list">(
        "tree",
    )
    const [creating, setCreating] = useState<CreatingState | null>(null)
    const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)
    const [pendingData, setPendingData] = useState<PendingDataAction | null>(
        null,
    )
    const [mobilePane, setMobilePane] = useState<"tree" | "content">("tree")
    const [dragIds, setDragIds] = useState<string[]>([])
    const [overKey, setOverKey] = useState<string | null>(null)
    const [menu, setMenu] = useState<MenuState>(CLOSED_MENU)

    /* ----- Refs ----- */
    const autoExpandTimers = useRef(
        new Map<string, ReturnType<typeof setTimeout>>(),
    )

    /* ----- Expansion persistence ----- */
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

    /* ==================== Actions ==================== */

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
        const ancestors = ancestorIds(state.nodes, id)
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
                Object.values(state.nodes)
                    .filter((node) => node.kind === "folder")
                    .map((node) => node.id),
            ),
        )
    }

    const collapseAll = () => setExpanded(new Set())

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
        const ids = base ? rangeBetween(rows, base, targetId) : [targetId]
        setSelection(new Set(ids))
    }

    const selectAllVisible = (rows: FlatRow[]) => {
        if (rows.length === 0) return
        setSelection(new Set(rows.map((row) => row.node.id)))
        setAnchorId(rows[0].node.id)
        setFocusId(rows[rows.length - 1].node.id)
    }

    const openNode = (id: string) => {
        const node = state.nodes[id]
        if (!node) return
        expandTo(id)
        setOpenId(id)
        setDashboardOpen(false)
        setPracticeTopicId(null)
        selectOnly(id)
        setMobilePane("content")
    }

    const navigateRoot = () => {
        setOpenId(null)
        setDashboardOpen(false)
        setPracticeTopicId(null)
        clearSelection()
        setMobilePane("content")
    }

    const toggleDashboard = () => {
        setDashboardOpen((prev) => !prev)
        setPracticeTopicId(null)
        setMobilePane("content")
    }

    const startPractice = (id: string) => {
        const node = state.nodes[id]
        if (!node || node.kind !== "topic") return
        expandTo(id)
        setOpenId(id)
        setDashboardOpen(false)
        setPracticeTopicId(id)
        selectOnly(id)
        setMobilePane("content")
    }

    const stopPractice = () => setPracticeTopicId(null)

    /* ----- Rename ----- */

    const beginRename = (id: string, surface: "tree" | "list" = "tree") => {
        if (!state.nodes[id]) return
        setQuery("")
        expandTo(id)
        setRenamingId(id)
        setRenamingSurface(surface)
        setMobilePane(surface === "tree" ? "tree" : "content")
    }

    const commitRename = (id: string, rawName: string): boolean => {
        const node = state.nodes[id]
        if (!node) {
            setRenamingId(null)
            return true
        }
        const name = normalizeName(rawName)
        if (name.length === 0) return false
        if (name === node.name) {
            setRenamingId(null)
            return true
        }
        if (!nameIsValid(state.nodes, node.parentId, name, id)) return false
        store.renameNode(id, name)
        setRenamingId(null)
        return true
    }

    const cancelRename = () => setRenamingId(null)

    /* ----- Create ----- */

    const defaultCreateParent = (): string | null => {
        if (openId !== null) {
            const node = state.nodes[openId]
            if (node?.kind === "folder") return node.id
            if (node) return node.parentId
        }
        return null
    }

    const beginCreate = (kind: NodeKind, parentId?: string | null) => {
        const target = parentId !== undefined ? parentId : defaultCreateParent()
        if (target !== null) {
            expandTo(target)
            toggleExpand(target, true)
        }
        setRenamingId(null)
        setCreating({ parentId: target, kind })
        setQuery("")
        clearSelection()
        setMobilePane("tree")
    }

    const commitCreate = (rawName: string) => {
        if (!creating) return
        const name = normalizeName(rawName)
        if (name.length === 0) {
            setCreating(null)
            return
        }
        const id = store.createNode(creating.parentId, creating.kind, name)
        setCreating(null)
        if (creating.parentId !== null) toggleExpand(creating.parentId, true)
        selectOnly(id)
    }

    const cancelCreate = () => setCreating(null)

    /* ----- Delete ----- */

    const requestDelete = (ids: string[]) => {
        const valid = ids.filter((id) => state.nodes[id])
        if (valid.length === 0) return
        setRenamingId(null)
        setCreating(null)
        setPendingDelete(valid)
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const ids = pendingDelete
        const removed = new Set<string>()
        for (const id of ids) {
            for (const related of subtreeIds(state.nodes, id))
                removed.add(related)
        }
        let survivor: string | null = state.nodes[ids[0]]?.parentId ?? null
        while (survivor !== null && removed.has(survivor)) {
            survivor = state.nodes[survivor]?.parentId ?? null
        }
        const count = store.deleteNodes(ids)
        setPendingDelete(null)
        if (count === 0) return

        toast.success("Deleted", {
            action: { label: "Undo", onClick: () => store.undoDelete() },
        })

        if (survivor !== null) {
            selectOnly(survivor)
            if (openId !== null && removed.has(openId)) setOpenId(survivor)
        } else {
            clearSelection()
            if (openId !== null && removed.has(openId)) setOpenId(null)
        }
    }

    const cancelDelete = () => setPendingDelete(null)

    /* ----- Data management ----- */

    const requestImport = (raw: string) => {
        if (!store.canImport(raw)) {
            toast.error("Invalid file")
            return
        }
        setPendingData({ kind: "import", data: raw })
    }

    const requestSample = () => setPendingData({ kind: "sample" })
    const requestClear = () => setPendingData({ kind: "clear" })

    const confirmDataAction = () => {
        if (!pendingData) return
        const action = pendingData
        setPendingData(null)
        if (action.kind === "import") {
            toast.success(
                store.importState(action.data)
                    ? "Data imported"
                    : "Import failed",
            )
        } else if (action.kind === "sample") {
            store.resetToSample()
            toast.success("Sample data loaded")
        } else {
            store.clearAll()
            toast.success("All data cleared")
        }
        setOpenId(null)
        clearSelection()
        setRenamingId(null)
        setCreating(null)
        setQuery("")
        setDashboardOpen(false)
        setExpanded(
            new Set(
                Object.values(store.getState().nodes)
                    .filter(
                        (node) =>
                            node.kind === "folder" && node.parentId === null,
                    )
                    .map((node) => node.id),
            ),
        )
    }

    const cancelDataAction = () => setPendingData(null)

    /* ==================== Drag & drop ==================== */

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
        return (
            computeMove(state.nodes, dragIds, targetParentId).accepted.length >
            0
        )
    }

    const performDrop = (targetParentId: string | null) => {
        const moved = store.moveNodes(dragIds, targetParentId)
        if (moved > 0) {
            if (targetParentId !== null) toggleExpand(targetParentId, true)
            toast.success("Moved", {
                action: { label: "Undo", onClick: () => store.undoMove() },
            })
            const movedIds = dragIds.filter((id) => state.nodes[id])
            setSelection(new Set(movedIds))
            setAnchorId(movedIds[0] ?? null)
            setFocusId(movedIds[0] ?? null)
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
                ids.map((id) => state.nodes[id]?.name ?? "").join(", "),
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

    /* ==================== Keyboard & click ==================== */

    const handleRowClick = (
        event: React.MouseEvent<HTMLElement>,
        node: TreeNode,
        rows: FlatRow[],
    ) => {
        if (event.shiftKey) {
            selectRange(node.id, rows)
        } else if (event.ctrlKey || event.metaKey) {
            selectToggle(node.id)
        } else {
            selectOnly(node.id)
            openNode(node.id)
        }
    }

    /* ==================== Context menus ==================== */

    const openMenu = (
        event: React.MouseEvent<HTMLElement>,
        items: MenuItem[],
    ) => {
        event.preventDefault()
        setMenu({ open: true, x: event.clientX, y: event.clientY, items })
    }

    const closeMenu = () => setMenu(CLOSED_MENU)

    const rowMenuItems = (
        node: TreeNode,
        surface: "tree" | "list",
    ): MenuItem[] => {
        const items: MenuItem[] = [
            {
                label: "Open",
                icon: node.kind === "folder" ? FolderOpen : FileText,
                onSelect: () => openNode(node.id),
            },
        ]
        if (node.kind === "folder") {
            items.push(
                "separator",
                {
                    label: "New folder",
                    icon: FolderPlus,
                    onSelect: () => beginCreate("folder", node.id),
                },
                {
                    label: "New topic",
                    icon: FilePlus,
                    onSelect: () => beginCreate("topic", node.id),
                },
            )
        }
        items.push(
            "separator",
            {
                label: "Rename",
                icon: Pencil,
                onSelect: () => beginRename(node.id, surface),
            },
            "separator",
            {
                label: "Delete",
                icon: Trash2,
                danger: true,
                onSelect: () =>
                    requestDelete(
                        selection.has(node.id) ? [...selection] : [node.id],
                    ),
            },
        )
        return items
    }

    const backgroundMenuItems = (rows: FlatRow[]): MenuItem[] => [
        {
            label: "New folder",
            icon: FolderPlus,
            onSelect: () => beginCreate("folder"),
        },
        {
            label: "New topic",
            icon: FilePlus,
            onSelect: () => beginCreate("topic"),
        },
        "separator",
        {
            label: "Select all",
            icon: ListChecks,
            onSelect: () => selectAllVisible(rows),
        },
        { label: "Expand all", icon: UnfoldVertical, onSelect: expandAll },
        { label: "Collapse all", icon: FoldVertical, onSelect: collapseAll },
    ]

    /* ==================== Render ==================== */

    const value = useMemo(
        () => ({
            state,
            query,
            setQuery,
            expanded,
            toggleExpand,
            expandTo,
            expandAll,
            collapseAll,
            selection,
            anchorId,
            focusId,
            selectOnly,
            selectToggle,
            selectRange,
            selectAllVisible,
            clearSelection,
            openId,
            dashboardOpen,
            toggleDashboard,
            practiceTopicId,
            startPractice,
            stopPractice,
            openNode,
            navigateRoot,
            renamingId,
            renamingSurface,
            beginRename,
            commitRename,
            cancelRename,
            creating,
            beginCreate,
            commitCreate,
            cancelCreate,
            pendingDelete,
            requestDelete,
            confirmDelete,
            cancelDelete,
            pendingData,
            requestImport,
            requestSample,
            requestClear,
            confirmDataAction,
            cancelDataAction,
            drag: { ids: dragIds, overKey, canDrop },
            dragProps,
            dropProps,
            handleRowClick,
            menu,
            openMenu,
            closeMenu,
            rowMenuItems,
            backgroundMenuItems,
            mobilePane,
            setMobilePane,
        }),
        // The context value is intentionally rebuilt on every render so closures
        // always see fresh state. Re-render cost is negligible at this scale.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            state,
            query,
            expanded,
            selection,
            anchorId,
            focusId,
            openId,
            dashboardOpen,
            practiceTopicId,
            renamingId,
            renamingSurface,
            creating,
            pendingDelete,
            pendingData,
            mobilePane,
            dragIds,
            overKey,
            menu,
        ],
    )

    if (!ready) {
        return (
            <div className="grid h-dvh place-items-center bg-background text-foreground">
                <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
                    <ListTree className="size-4" />
                    <span className="text-sm">{"Loading\u2026"}</span>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider delayDuration={300}>
            <ExplorerContext.Provider value={value}>
                <div className="flex h-dvh flex-col bg-background text-foreground">
                    <Toolbar />
                    <div className="flex min-h-0 flex-1">
                        <aside
                            className={cn(
                                "w-full shrink-0 flex-col border-r md:flex md:w-80 md:min-w-72",
                                mobilePane === "tree" ? "flex" : "hidden",
                            )}
                        >
                            <TreePane />
                        </aside>
                        <main
                            className={cn(
                                "min-w-0 flex-1 flex-col md:flex",
                                mobilePane === "content" ? "flex" : "hidden",
                            )}
                        >
                            <ContentPane />
                        </main>
                    </div>
                </div>
                <ContextMenuSurface />
                <DeleteDialog />
                <DataDialog />
            </ExplorerContext.Provider>
        </TooltipProvider>
    )
}
