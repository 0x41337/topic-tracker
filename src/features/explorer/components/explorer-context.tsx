"use client"

import { createContext, useContext } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"

import type { FlatRow, NodeKind, TreeNode, TreeState } from "@/core"

import type {
    CreatingState,
    DragRowProps,
    DropMode,
    DropZoneProps,
    MenuItem,
    MenuState,
    PendingDataAction,
} from "../hooks"

export type {
    CreatingState,
    DragRowProps,
    DropMode,
    DropZoneProps,
    MenuItem,
    MenuItemEntry,
    MenuState,
    PendingDataAction,
} from "../hooks"

/**
 * The workspace contract: everything the explorer's surfaces (tree, content,
 * dialogs, menus) need to render and act. Features outside the explorer
 * should NOT depend on this — they receive plain props from the composer.
 */
export interface ExplorerContextValue {
    /* Data */
    state: TreeState

    /* Search */
    query: string
    setQuery: (query: string) => void

    /* Expansion */
    expanded: Set<string>
    toggleExpand: (id: string, value?: boolean) => void
    expandAll: () => void
    collapseAll: () => void

    /* Selection */
    selection: Set<string>
    focusId: string | null
    selectOnly: (id: string) => void
    selectAllVisible: (rows: FlatRow[]) => void
    clearSelection: () => void

    /* Navigation & overlays */
    openId: string | null
    dashboardOpen: boolean
    toggleDashboard: () => void
    openNode: (id: string) => void
    navigateRoot: () => void
    practiceTopicId: string | null
    startPractice: (id: string) => void
    stopPractice: () => void

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
