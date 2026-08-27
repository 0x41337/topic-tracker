import {
    FilePlus,
    FileText,
    FolderOpen,
    FolderPlus,
    ListChecks,
    Pencil,
    Trash2,
    UnfoldVertical,
    FoldVertical,
} from "lucide-react"

import type { FlatRow, TreeNode } from "@/core"
import type { MenuItem } from "../hooks"

export interface MenuActions {
    openNode: (id: string) => void
    beginCreate: (kind: "folder" | "topic", parentId?: string | null) => void
    beginRename: (id: string, surface: "tree" | "list") => void
    requestDelete: (ids: string[]) => void
    selectAllVisible: (rows: FlatRow[]) => void
    expandAll: () => void
    collapseAll: () => void
}

/** Right-click menu for a tree/list row. */
export function buildRowMenuItems(options: {
    node: TreeNode
    surface: "tree" | "list"
    /** Ids that will be affected (the whole selection when the row is in it). */
    deleteIds: string[]
    actions: MenuActions
}): MenuItem[] {
    const { node, surface, deleteIds, actions } = options
    const items: MenuItem[] = [
        {
            label: "Open",
            icon: node.kind === "folder" ? FolderOpen : FileText,
            onSelect: () => actions.openNode(node.id),
        },
    ]
    if (node.kind === "folder") {
        items.push(
            "separator",
            {
                label: "New folder",
                icon: FolderPlus,
                onSelect: () => actions.beginCreate("folder", node.id),
            },
            {
                label: "New topic",
                icon: FilePlus,
                onSelect: () => actions.beginCreate("topic", node.id),
            },
        )
    }
    items.push(
        "separator",
        {
            label: "Rename",
            icon: Pencil,
            onSelect: () => actions.beginRename(node.id, surface),
        },
        "separator",
        {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onSelect: () => actions.requestDelete(deleteIds),
        },
    )
    return items
}

/** Right-click menu for the empty area of a surface. */
export function buildBackgroundMenuItems(options: {
    rows: FlatRow[]
    actions: MenuActions
}): MenuItem[] {
    const { rows, actions } = options
    return [
        {
            label: "New folder",
            icon: FolderPlus,
            onSelect: () => actions.beginCreate("folder"),
        },
        {
            label: "New topic",
            icon: FilePlus,
            onSelect: () => actions.beginCreate("topic"),
        },
        "separator",
        {
            label: "Select all",
            icon: ListChecks,
            onSelect: () => actions.selectAllVisible(rows),
        },
        {
            label: "Expand all",
            icon: UnfoldVertical,
            onSelect: actions.expandAll,
        },
        {
            label: "Collapse all",
            icon: FoldVertical,
            onSelect: actions.collapseAll,
        },
    ]
}
