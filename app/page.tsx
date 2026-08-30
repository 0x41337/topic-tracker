"use client"

import { useState } from "react"
import {
    FilePlus2Icon,
    FolderPlusIcon,
    PencilIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react"

import { useTreeData } from "@/lib/hooks/use-tree-data"
import { useTreeExplorer, TreeView } from "@/app/components/tree-explorer"
import type { TreeNodeData } from "@/lib/core/tree-types"
import { usePerformance } from "@/lib/hooks/use-performance"
import { SearchBar } from "@/app/components/search-bar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Home() {
    const { data, status, setData } = useTreeData()
    const [focusedItem, setFocusedItem] = useState<TreeNodeData | null>(null)
    const { score, recordHit, recordMiss } = usePerformance(focusedItem?.type === "topic" ? focusedItem.id : null)

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
            <div className="w-full rounded-md border p-1.5">
                <div className="flex flex-col gap-2 border-b px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => createItem("folder")}
                                title="New folder"
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <FolderPlusIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => createItem("topic")}
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
                                {canRename && (
                                    <button
                                        type="button"
                                        onClick={startRenameSelected}
                                        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/80"
                                        title="Rename (F2)"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                        Rename
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={deleteItems}
                                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2Icon className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="flex items-center justify-center rounded-md p-1 text-accent-foreground hover:bg-accent/80"
                                    title="Clear selection"
                                >
                                    <XIcon className="h-3.5 w-3.5" />
                                </button>
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
                    <div className="min-h-16 w-full flex-1" onClick={clearSelection} />
                </ScrollArea>
            </div>

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
                                <button
                                    type="button"
                                    onClick={recordHit}
                                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Hit
                                </button>
                                <button
                                    type="button"
                                    onClick={recordMiss}
                                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
                                >
                                    Miss
                                </button>
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
        </div>
    )
}
