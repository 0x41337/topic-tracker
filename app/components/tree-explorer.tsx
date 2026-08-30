"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
    createOnDropHandler,
    dragAndDropFeature,
    hotkeysCoreFeature,
    keyboardDragAndDropFeature,
    renamingFeature,
    selectionFeature,
    syncDataLoaderFeature,
    type ItemInstance,
    type TreeInstance,
} from "@headless-tree/core"
import { AssistiveTreeDescription, useTree } from "@headless-tree/react"
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { collectDescendantIds, createNodeId, getUniqueName } from "@/lib/core/tree-data"
import { ROOT_ID, type TreeDataMap, type TreeItemType, type TreeNodeData } from "@/lib/core/tree-types"

const DEFAULT_NAMES: Record<TreeItemType, string> = {
    folder: "New Folder",
    topic: "New Topic",
}

export interface UseTreeExplorerOptions {
    data: TreeDataMap
    onDataChange: (updater: (prev: TreeDataMap) => TreeDataMap) => void
    onFocusedItemChange?: (item: TreeNodeData | null) => void
}

export function useTreeExplorer({ data, onDataChange, onFocusedItemChange }: UseTreeExplorerOptions) {
    const [search, setSearch] = useState("")

    const filteredIds = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return null

        const result = new Set<string>()
        for (const [id, node] of Object.entries(data)) {
            if (id === ROOT_ID) continue
            if (node.name.toLowerCase().includes(query)) {
                result.add(id)
                let parentId = Object.values(data).find(
                    (n) => n.type === "folder" && n.children?.includes(id),
                )?.id
                while (parentId && parentId !== ROOT_ID) {
                    if (result.has(parentId)) break
                    result.add(parentId)
                    parentId = Object.values(data).find(
                        (n) => n.type === "folder" && n.children?.includes(parentId!),
                    )?.id
                }
            }
        }
        return result
    }, [data, search])

    const commitRename = useCallback(
        (id: string, rawValue: string) => {
            onDataChange((prev) => {
                const node = prev[id]
                if (!node) return prev
                const parent = Object.values(prev).find((n) => n.type === "folder" && n.children?.includes(id))
                const siblingNames = (parent?.children ?? []).filter((cid) => cid !== id).map((cid) => prev[cid]?.name ?? "")
                const trimmed = rawValue.trim()
                const base = trimmed.length > 0 ? trimmed : DEFAULT_NAMES[node.type]
                const name = getUniqueName(base, siblingNames, node.name)
                if (name === node.name) return prev
                return { ...prev, [id]: { ...node, name } }
            })
        },
        [onDataChange],
    )

    const tree = useTree<TreeNodeData>({
        rootItemId: ROOT_ID,
        canReorder: !search.trim(),
        indent: 18,
        getItemName: (item) => item.getItemData()?.name ?? "",
        isItemFolder: (item) => item.getItemData()?.type === "folder",
        canRename: (item) => item.getId() !== ROOT_ID,
        dataLoader: {
            getItem: (itemId) => data[itemId],
            getChildren: (itemId) => {
                const children = data[itemId]?.children ?? []
                if (!filteredIds) return children
                return children.filter((cid) => filteredIds.has(cid))
            },
        },
        onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
            onDataChange((prev) => ({
                ...prev,
                [parentItem.getId()]: { ...prev[parentItem.getId()], children: newChildrenIds },
            }))
        }),
        onRename: (item, value) => {
            commitRename(item.getId(), value)
        },
        onPrimaryAction: (item) => {
            onFocusedItemChange?.(item.getItemData() ?? null)
        },
        hotkeys: {
            customDeleteSelectionDel: {
                hotkey: "Delete",
                handler: () => deleteSelectionOrFocused(),
            },
            customDeleteSelectionBackspace: {
                hotkey: "Backspace",
                handler: () => deleteSelectionOrFocused(),
            },
        },
        features: [
            syncDataLoaderFeature,
            selectionFeature,
            hotkeysCoreFeature,
            dragAndDropFeature,
            keyboardDragAndDropFeature,
            renamingFeature,
        ],
    })

    const deleteItems = useCallback(
        (ids: string[]) => {
            const targetIds = ids.filter((id) => id !== ROOT_ID)
            if (targetIds.length === 0) return

            onDataChange((prev) => {
                const toDelete = new Set<string>()
                targetIds.forEach((id) => {
                    toDelete.add(id)
                    collectDescendantIds(id, prev, toDelete)
                })

                const next: TreeDataMap = {}
                for (const [id, node] of Object.entries(prev)) {
                    if (toDelete.has(id)) continue
                    next[id] = node.type === "folder" ? { ...node, children: (node.children ?? []).filter((c) => !toDelete.has(c)) } : node
                }
                return next
            })

            tree.setSelectedItems([])
            tree.scheduleRebuildTree()
        },
        [onDataChange, tree],
    )

    const resolveCreationParent = useCallback(
        (explicitParentId?: string): string => {
            if (explicitParentId) return explicitParentId

            const selected = tree.getState().selectedItems ?? []
            if (selected.length === 1) {
                const node = data[selected[0]]
                if (node?.type === "folder") return node.id
                const parent = tree.getItemInstance(selected[0])?.getParent()
                return parent?.getId() ?? ROOT_ID
            }
            return ROOT_ID
        },
        [data, tree],
    )

    const createItem = useCallback(
        (type: TreeItemType, explicitParentId?: string) => {
            if (search.trim()) return

            const parentId = resolveCreationParent(explicitParentId)
            const id = createNodeId(type)
            const base = DEFAULT_NAMES[type]

            onDataChange((prev) => {
                const parent = prev[parentId] ?? prev[ROOT_ID]
                const targetId = parent ? parentId : ROOT_ID
                const siblingNames = (prev[targetId]?.children ?? []).map((cid) => prev[cid]?.name ?? "")
                const name = getUniqueName(base, siblingNames)
                const newNode: TreeNodeData = type === "folder" ? { id, name, type, children: [] } : { id, name, type }

                return {
                    ...prev,
                    [id]: newNode,
                    [targetId]: { ...prev[targetId], children: [...(prev[targetId]?.children ?? []), id] },
                }
            })

            tree.scheduleRebuildTree()

            requestAnimationFrame(() => {
                if (parentId !== ROOT_ID) {
                    tree.getItemInstance(parentId)?.expand()
                }
                tree.rebuildTree()
                const instance = tree.getItemInstance(id)
                instance?.setFocused()
                tree.setSelectedItems([id])
                instance?.startRenaming()
            })
        },
        [onDataChange, resolveCreationParent, tree, search],
    )

    const deleteSelectionOrFocused = useCallback(() => {
        const selected = tree.getState().selectedItems ?? []
        if (selected.length > 0) {
            deleteItems(selected)
            return
        }
        const focused = tree.getState().focusedItem
        if (focused) deleteItems([focused])
    }, [deleteItems, tree])

    const startRenameSelected = useCallback(() => {
        const selected = tree.getState().selectedItems ?? []
        if (selected.length === 1) {
            tree.getItemInstance(selected[0])?.startRenaming()
        }
    }, [tree])

    const items = tree.getItems()
    const selectedItems = tree.getState().selectedItems ?? []
    const selectedCount = selectedItems.length
    const canRename = selectedCount === 1 && selectedItems[0] !== ROOT_ID

    return {
        tree,
        items,
        search,
        setSearch,
        selectedItems,
        selectedCount,
        canRename,
        createItem,
        deleteItems: () => deleteItems(selectedItems),
        startRenameSelected,
        clearSelection: () => tree.setSelectedItems([]),
    }
}

export function TreeView({ tree, items }: { tree: TreeInstance<TreeNodeData>; items: ReturnType<typeof tree.getItems> }) {
    const containerRef = useRef<HTMLDivElement>(null)

    const handleContainerClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === containerRef.current) {
                tree.setSelectedItems([])
            }
        },
        [tree],
    )

    return (
        <div
            ref={containerRef}
            {...tree.getContainerProps()}
            className="tree relative min-h-32 outline-none"
            onClick={handleContainerClick}
        >
            <AssistiveTreeDescription tree={tree} />
            {items.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    No topics or folders yet. Use the buttons above to create one.
                </div>
            ) : (
                items.map((item) => (
                    <TreeRow key={item.getId()} item={item} />
                ))
            )}
            <div style={tree.getDragLineStyle()} className="absolute z-10 h-0.5 rounded-full bg-primary" />
        </div>
    )
}

function TreeRow({ item }: { item: ItemInstance<TreeNodeData> }) {
    const isFolder = item.isFolder()
    const level = item.getItemMeta().level

    if (item.isRenaming()) {
        const inputProps = item.getRenameInputProps()
        return (
            <div
                className="flex items-center gap-1.5 rounded-md bg-background py-1 pr-2 ring-1 ring-ring"
                style={{ paddingLeft: `${level * 18 + 8}px` }}
            >
                <RowIcon isFolder={isFolder} isExpanded={item.isExpanded()} />
                <input
                    {...inputProps}
                    placeholder={isFolder ? "New Folder" : "New Topic"}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => {
                        item.getTree().completeRenaming()
                    }}
                    className="min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-0.5 text-sm text-foreground outline-none"
                />
            </div>
        )
    }

    return (
        <button
            {...item.getProps()}
            style={{ paddingLeft: `${level * 18 + 8}px` }}
            className={cn(
                "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm outline-none transition-colors",
                item.isSelected() ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
                item.isFocused() && "ring-1 ring-inset ring-ring",
                item.isDragTarget() && "bg-accent outline outline-2 outline-ring",
            )}
        >
            <RowIcon isFolder={isFolder} isExpanded={item.isExpanded()} />
            <span className="truncate">{item.getItemName()}</span>
        </button>
    )
}

function RowIcon({ isFolder, isExpanded }: { isFolder: boolean; isExpanded: boolean }) {
    if (!isFolder) {
        return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
    return isExpanded ? (
        <FolderOpenIcon className="h-4 w-4 shrink-0 text-primary" />
    ) : (
        <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
    )
}
