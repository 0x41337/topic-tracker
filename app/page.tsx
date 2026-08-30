"use client"

import { useState } from "react"

import { TreeExplorer } from "@/app/components/tree-explorer"
import { useTreeData } from "@/lib/hooks/use-tree-data"
import type { TreeNodeData } from "@/lib/core/tree-types"
import { usePerformance } from "@/lib/hooks/use-performance"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Home() {
    const { data, status, setData } = useTreeData()
    const [focusedItem, setFocusedItem] = useState<TreeNodeData | null>(null)
    const { score, recordHit, recordMiss } = usePerformance(focusedItem?.type === "topic" ? focusedItem.id : null)

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
                <ScrollArea className="h-112 w-full">
                    {status === "empty" ? (
                        <div className="flex h-112 w-full items-center justify-center text-sm text-muted-foreground">
                            No topics or folders yet. Use the buttons above to create one.
                        </div>
                    ) : (
                        <TreeExplorer
                            data={data}
                            onDataChange={setData}
                            onFocusedItemChange={setFocusedItem}
                        />
                    )}
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
