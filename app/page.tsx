"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import {
    FilePlus2Icon,
    FolderPlusIcon,
    MousePointerClickIcon,
    PencilIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react"

import { useTreeData } from "@/lib/hooks/use-tree-data"
import { useTreeExplorer, TreeView } from "@/app/components/topics/tree-explorer"
import type { TreeNodeData } from "@/lib/features/topics/types"
import { usePerformance } from "@/lib/hooks/use-performance"
import { SearchBar } from "@/app/components/search-bar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { TopicMetadataCard } from "@/app/components/topics/topic-metadata-card"
import { TopicStatsCard } from "@/app/components/topics/topic-stats-card"
import { TopicSessionCard } from "@/app/components/topics/topic-session-card"

export default function Home() {
    const { data, status, setData } = useTreeData()
    const [focusedItem, setFocusedItem] = useState<TreeNodeData | null>(null)
    const { score, history, recordHit, recordMiss, undoLastAction } =
        usePerformance(focusedItem?.type === "topic" ? focusedItem.id : null)

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
    } = useTreeExplorer({
        data,
        onDataChange: setData,
        onFocusedItemChange: setFocusedItem,
    })

    if (status === "loading") {
        return (
            <div
                role="status"
                aria-label="Loading"
                className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-5 p-4 lg:flex-row lg:gap-6 lg:p-6"
            >
                <aside className="flex flex-col gap-3 lg:w-[360px] lg:shrink-0">
                    <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
                    <div className="h-112 w-full animate-pulse rounded-lg bg-muted" />
                </aside>
                <main className="flex-1">
                    <div className="h-112 w-full animate-pulse rounded-lg bg-muted" />
                </main>
            </div>
        )
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-5 p-4 lg:flex-row lg:items-start lg:gap-6 lg:p-6">
            <aside className="flex flex-col gap-2 lg:sticky lg:top-6 lg:w-[360px] lg:shrink-0">
                <div className="rounded-lg border bg-card">
                    <div className="flex flex-col gap-2 border-b px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">
                                Explorer
                            </span>
                            <div className="flex items-center gap-0.5">
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
                                    {selectedCount}{" "}
                                    {selectedCount === 1
                                        ? "item selected"
                                        : "items selected"}
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
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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

                    <ScrollArea className="h-112 w-full lg:h-[calc(100vh-13rem)]">
                        <div className="px-2 pb-2">
                            <TreeView tree={tree} items={items} />
                        </div>
                    </ScrollArea>
                </div>
            </aside>

            <main className="min-w-0 flex-1">
                <AnimatePresence mode="wait">
                    {focusedItem ? (
                        <motion.div
                            key={focusedItem.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col gap-5"
                        >
                            <TopicMetadataCard item={focusedItem} />

                            {focusedItem.type === "topic" && (
                                <>
                                    <TopicStatsCard history={history} />

                                    <TopicSessionCard
                                        score={score}
                                        onHit={recordHit}
                                        onMiss={recordMiss}
                                        onUndo={undoLastAction}
                                    />
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex h-full min-h-112 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground"
                        >
                            <MousePointerClickIcon className="h-5 w-5" />
                            <p className="text-sm">
                                Select an item to see details
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
