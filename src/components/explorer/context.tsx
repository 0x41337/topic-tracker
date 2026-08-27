"use client"

import { createContext, useContext } from "react"
import type {
    DragEvent as ReactDragEvent,
    MouseEvent as ReactMouseEvent,
} from "react"
import type { LucideIcon } from "lucide-react"

import type { FlatRow } from "@/lib/tree-utils"
import type { NodeKind, TreeNode, TreeState } from "@/lib/types"

/* ---------- Shared UI types ---------- */

export type MenuItem = MenuItemEntry | "separator"

export interface MenuItemEntry {
    label: string
    icon?: LucideIcon
    onSelect: () => void
    danger?: boolean
}

export interface MenuState {
    open: boolean
    x: number
    y: number
    items: MenuItem[]
}

export interface CreatingState {
    parentId: string | null
    kind: NodeKind
}

export type PendingDataAction =
    { kind: "import"; data: string } | { kind: "sample" } | { kind: "clear" }

export interface DragRowProps {
    draggable: boolean
    onDragStart: (event: ReactDragEvent<HTMLElement>) => void
    onDragEnd: (event: ReactDragEvent<HTMLElement>) => void
}

export interface DropZoneProps {
    onDragOver: (event: ReactDragEvent<HTMLElement>) => void
    onDragLeave: (event: ReactDragEvent<HTMLElement>) => void
    onDrop: (event: ReactDragEvent<HTMLElement>) => void
}

export type DropMode = "drop" | "block"

/* ---------- Context contract ---------- */

export interface ExplorerContextValue {
    /* Data */
    state: TreeState

    /* Search */
    query: string
    setQuery: (query: string) => void

    /* Expansion */
    expanded: Set<string>
    toggleExpand: (id: string, value?: boolean) => void
    expandTo: (id: string) => void
    expandAll: () => void
    collapseAll: () => void

    /* Selection */
    selection: Set<string>
    anchorId: string | null
    focusId: string | null
    selectOnly: (id: string) => void
    selectToggle: (id: string) => void
    selectRange: (targetId: string, rows: FlatRow[]) => void
    selectAllVisible: (rows: FlatRow[]) => void
    clearSelection: () => void

    /* Practice (gamified session recording) */
    practiceTopicId: string | null
    startPractice: (id: string) => void
    stopPractice: () => void

    /* Navigation */
    openId: string | null
    dashboardOpen: boolean
    toggleDashboard: () => void
    openNode: (id: string) => void
    navigateRoot: () => void

    /* Rename */
    renamingId: string | null
    renamingSurface: "tree" | "list"
    beginRename: (id: string, surface?: "tree" | "list") => void
    commitRename: (id: string, rawName: string) => boolean
    cancelRename: () => void

    /* Create */
    creating: CreatingState | null
    beginCreate: (kind: NodeKind, parentId?: string | null) => void
    commitCreate: (rawName: string) => void
    cancelCreate: () => void

    /* Delete */
    pendingDelete: string[] | null
    requestDelete: (ids: string[]) => void
    confirmDelete: () => void
    cancelDelete: () => void

    /* Data management */
    pendingData: PendingDataAction | null
    requestImport: (raw: string) => void
    requestSample: () => void
    requestClear: () => void
    confirmDataAction: () => void
    cancelDataAction: () => void

    /* Drag & drop */
    drag: {
        ids: string[]
        overKey: string | null
        canDrop: (targetParentId: string | null) => boolean
    }
    dragProps: (node: TreeNode) => DragRowProps
    dropProps: (
        key: string,
        targetParentId: string | null,
        mode?: DropMode,
    ) => DropZoneProps

    /* Click handling shared by tree and list surfaces */
    handleRowClick: (
        event: ReactMouseEvent<HTMLElement>,
        node: TreeNode,
        rows: FlatRow[],
    ) => void

    /* Context menu */
    menu: MenuState
    openMenu: (event: ReactMouseEvent<HTMLElement>, items: MenuItem[]) => void
    closeMenu: () => void
    rowMenuItems: (node: TreeNode, surface: "tree" | "list") => MenuItem[]
    backgroundMenuItems: (rows: FlatRow[]) => MenuItem[]

    /* Responsive layout */
    mobilePane: "tree" | "content"
    setMobilePane: (pane: "tree" | "content") => void
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null)

export function useExplorer(): ExplorerContextValue {
    const value = useContext(ExplorerContext)
    if (!value) throw new Error("useExplorer must be used inside <Explorer>.")
    return value
}

export { ExplorerContext }
