"use client"

import { useCallback, useMemo, useState } from "react"
import {
    createOnDropHandler,
    dragAndDropFeature,
    hotkeysCoreFeature,
    keyboardDragAndDropFeature,
    renamingFeature,
    selectionFeature,
    syncDataLoaderFeature,
    type ItemInstance,
} from "@headless-tree/core"
import { AssistiveTreeDescription, useTree } from "@headless-tree/react"
import {
    FileIcon,
    FilePlus2Icon,
    FolderIcon,
    FolderOpenIcon,
    FolderPlusIcon,
    PencilIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { collectDescendantIds, createNodeId, getUniqueName } from "@/lib/core/tree-data"
import { ROOT_ID, type TreeDataMap, type TreeItemType, type TreeNodeData } from "@/lib/core/tree-types"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SearchBar } from "@/app/components/search-bar"

interface TreeExplorerProps {
    data: TreeDataMap
    onDataChange: (updater: (prev: TreeDataMap) => TreeDataMap) => void
    onFocusedItemChange?: (item: TreeNodeData | null) => void
}

const DEFAULT_NAMES: Record<TreeItemType, string> = {
    folder: "New Folder",
    topic: "New Topic",
}

export function TreeExplorer({ data, onDataChange, onFocusedItemChange }: TreeExplorerProps) {
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

    const deleteSelectionOrFocused = useCallback(() => {
        const selected = tree.getState().selectedItems ?? []
        if (selected.length > 0) {
            deleteItems(selected)
            return
        }
        const focused = tree.getState().focusedItem
        if (focused) deleteItems([focused])
    }, [deleteItems, tree])

    const getEffectiveDeleteTargets = useCallback(
        (itemId: string): string[] => {
            const selected = tree.getState().selectedItems ?? []
            if (selected.includes(itemId) && selected.length > 1) return selected
            return [itemId]
        },
        [tree],
    )

    const items = tree.getItems()
    const selectedCount = tree.getState().selectedItems?.length ?? 0

    return (
        <div className="flex h-full flex-col">
            <Toolbar
                selectedCount={selectedCount}
                onNewFolder={() => createItem("folder")}
                onNewTopic={() => createItem("topic")}
                onClearSelection={() => tree.setSelectedItems([])}
                onDeleteSelected={() => deleteItems(tree.getState().selectedItems ?? [])}
            />

            <div className="px-2 py-2">
                <SearchBar value={search} onChange={setSearch} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2">
                <div {...tree.getContainerProps()} className="tree relative outline-none">
                    <AssistiveTreeDescription tree={tree} />
                    {items.map((item) => (
                        <TreeRow
                            key={item.getId()}
                            item={item}
                            onCreateFolder={(parentId) => createItem("folder", parentId)}
                            onCreateTopic={(parentId) => createItem("topic", parentId)}
                            onDelete={(id) => deleteItems(getEffectiveDeleteTargets(id))}
                            deleteCount={(id) => getEffectiveDeleteTargets(id).length}
                        />
                    ))}
                    <div style={tree.getDragLineStyle()} className="absolute z-10 h-0.5 rounded-full bg-primary" />
                </div>

                <EmptyAreaContextMenu
                    onCreateFolder={() => createItem("folder", ROOT_ID)}
                    onCreateTopic={() => createItem("topic", ROOT_ID)}
                    onClearSelection={() => tree.setSelectedItems([])}
                />
            </div>
        </div>
    )
}

function Toolbar({
    selectedCount,
    onNewFolder,
    onNewTopic,
    onClearSelection,
    onDeleteSelected,
}: {
    selectedCount: number
    onNewFolder: () => void
    onNewTopic: () => void
    onClearSelection: () => void
    onDeleteSelected: () => void
}) {
    return (
        <div className="flex flex-col gap-2 border-b px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onNewFolder}
                        title="New folder"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <FolderPlusIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onNewTopic}
                        title="New topic"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <FilePlus2Icon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {selectedCount > 0 && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-accent px-2 py-1.5">
                    <span className="text-xs font-medium text-accent-foreground">
                        {selectedCount} {selectedCount === 1 ? "item selected" : "items selected"}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onDeleteSelected}
                            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                            <Trash2Icon className="h-3.5 w-3.5" />
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={onClearSelection}
                            className="flex items-center justify-center rounded-md p-1 text-accent-foreground hover:bg-accent/80"
                            title="Clear selection"
                        >
                            <XIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function TreeRow({
    item,
    onCreateFolder,
    onCreateTopic,
    onDelete,
    deleteCount,
}: {
    item: ItemInstance<TreeNodeData>
    onCreateFolder: (parentId: string) => void
    onCreateTopic: (parentId: string) => void
    onDelete: (id: string) => void
    deleteCount: (id: string) => number
}) {
    const isFolder = item.isFolder()
    const level = item.getItemMeta().level
    const id = item.getId()
    const count = deleteCount(id)

    const containerFolderId = isFolder ? id : item.getParent()?.getId() ?? ROOT_ID

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
        <ContextMenu>
            <ContextMenuTrigger>
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
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuItem onSelect={() => onCreateTopic(containerFolderId)}>
                    <FilePlus2Icon className="h-4 w-4 text-muted-foreground" />
                    New Topic
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onCreateFolder(containerFolderId)}>
                    <FolderPlusIcon className="h-4 w-4 text-muted-foreground" />
                    New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => item.startRenaming()}>
                    <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    Rename
                    <ContextMenuShortcut>F2</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem variant="destructive" onSelect={() => onDelete(id)}>
                    <Trash2Icon className="h-4 w-4" />
                    {count > 1 ? `Delete ${count} items` : "Delete"}
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
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

function EmptyAreaContextMenu({
    onCreateFolder,
    onCreateTopic,
    onClearSelection,
}: {
    onCreateFolder: () => void
    onCreateTopic: () => void
    onClearSelection: () => void
}) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div className="min-h-16 w-full flex-1" onClick={onClearSelection} />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuItem onSelect={onCreateTopic}>
                    <FilePlus2Icon className="h-4 w-4 text-muted-foreground" />
                    New Topic
                </ContextMenuItem>
                <ContextMenuItem onSelect={onCreateFolder}>
                    <FolderPlusIcon className="h-4 w-4 text-muted-foreground" />
                    New Folder
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
