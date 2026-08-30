"use client"

import { useState } from "react"
import { FilePlus2Icon, FolderPlusIcon, PencilIcon, Trash2Icon, Undo2Icon, XIcon } from "lucide-react"

import { useTreeData } from "@/lib/hooks/use-tree-data"
import { useTreeExplorer, TreeView } from "@/app/components/tree-explorer"
import type { TreeNodeData } from "@/lib/core/tree-types"
import { usePerformance } from "@/lib/hooks/use-performance"
import { SearchBar } from "@/app/components/search-bar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export default function Home() {
    const { data, status, setData } = useTreeData()
    const [focusedItem, setFocusedItem] = useState<TreeNodeData | null>(null)
    const { score, recordHit, recordMiss, undoLastAction } = usePerformance(focusedItem?.type === "topic" ? focusedItem.id : null)

    const {
        tree,
        items,
        search,
        setSearch,
        selectedCount,
        canRename,
        createItem,
        deleteItems,
        startRenameSelected,
        clearSelection,
    } = useTreeExplorer({ data, onDataChange: setData, onFocusedItemChange: setFocusedItem })

    if (status === "loading") {
        return (
            <div className="flex min-h-screen w-full flex-col gap-5 p-4">
                <div className="w-full rounded-md border p-1.5">
                    <div
                        className="flex h-112 w-full items-center justify-center"
                        role="status"
                        aria-label="Loading"
                    >
                        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-5 p-4">
            {focusedItem && (
                <div className="rounded-md border p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {focusedItem.type === "folder" ? "Folder" : "Topic"}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">{focusedItem.name}</h2>

                    {focusedItem.type === "topic" && (
                        <div className="mt-4 space-y-3">
                            <div className="text-sm text-muted-foreground">
                                Today&apos;s performance:
                            </div>

                            {score.total === 0 ? (
                                <p className="text-sm">No data recorded yet.</p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-sm">
                                        Hits: <span className="font-medium">{score.hits}</span> / {score.total}
                                    </p>
                                    <p className="text-sm">
                                        Score:{" "}
                                        <span className="font-medium">
                                            {(score.value * 100).toFixed(1)}%
                                        </span>
                                    </p>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${score.value * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={recordHit}>
                                    Hit
                                </Button>
                                <Button variant="outline" onClick={recordMiss}>
                                    Miss
                                </Button>
                                {score.total > 0 && (
                                    <Button variant="ghost" size="icon-xs" onClick={undoLastAction} title="Undo last action">
                                        <Undo2Icon />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {focusedItem.type === "folder" && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Click to expand or collapse this folder in the tree.
                        </p>
                    )}
                </div>
            )}

            {!focusedItem && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Click an item in the tree to see its details here.
                </div>
            )}

            <div className="w-full rounded-md border p-1.5">
                <div className="flex flex-col gap-2 border-b px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => createItem("folder")}
                                title="New folder"
                            >
                                <FolderPlusIcon />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => createItem("topic")}
                                title="New topic"
                            >
                                <FilePlus2Icon />
                            </Button>
                        </div>
                    </div>

                    {selectedCount > 0 && (
                        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                                {selectedCount} {selectedCount === 1 ? "item selected" : "items selected"}
                            </span>
                            <div className="flex items-center gap-1">
                                {canRename && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={startRenameSelected}
                                        title="Rename (F2)"
                                    >
                                        <PencilIcon />
                                        Rename
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={deleteItems}
                                >
                                    <Trash2Icon />
                                    Delete
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={clearSelection}
                                    title="Clear selection"
                                >
                                    <XIcon />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-2 py-2">
                    <SearchBar value={search} onChange={setSearch} />
                </div>

                <ScrollArea className="h-112 w-full">
                    <div className="px-2 py-2">
                        <TreeView tree={tree} items={items} />
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
