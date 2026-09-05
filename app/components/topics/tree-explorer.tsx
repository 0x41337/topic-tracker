"use client"

import { useCallback, useRef } from "react"
import type { ItemInstance, TreeInstance } from "@headless-tree/core"
import { AssistiveTreeDescription } from "@headless-tree/react"
import {
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    FolderOpenIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { TreeNodeData } from "@/lib/features/topics/types"

export { useTreeExplorer } from "./use-tree-explorer"
export type { UseTreeExplorerOptions } from "./use-tree-explorer"

export function TreeView({
    tree,
    items,
}: {
    tree: TreeInstance<TreeNodeData>
    items: ReturnType<typeof tree.getItems>
}) {
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
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <FolderIcon className="h-6 w-6 text-muted-foreground/40" />
                    <span>No items yet.</span>
                </div>
            ) : (
                items.map((item) => <TreeRow key={item.getId()} item={item} />)
            )}
            <div
                style={tree.getDragLineStyle()}
                className="absolute z-10 h-[3px] -translate-y-1/2 rounded-full bg-primary shadow-sm"
            />
        </div>
    )
}

function TreeRow({ item }: { item: ItemInstance<TreeNodeData> }) {
    const isFolder = item.isFolder()
    const level = item.getItemMeta().level
    const isExpanded = item.isExpanded()

    if (item.isRenaming()) {
        const inputProps = item.getRenameInputProps()
        return (
            <div
                className="relative flex items-center gap-1.5 py-1 pr-2"
                style={{ paddingLeft: `${level * 18 + 8}px` }}
            >
                <TreeGuides level={level} />
                <span className="w-3.5 shrink-0" />
                <RowIcon isFolder={isFolder} isExpanded={isExpanded} />
                <input
                    {...inputProps}
                    placeholder={isFolder ? "New Folder" : "New Topic"}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => {
                        item.getTree().completeRenaming()
                    }}
                    className="min-w-0 flex-1 rounded-md border border-ring bg-background px-1.5 py-0.5 text-sm text-foreground shadow-sm outline-none ring-2 ring-ring/20"
                />
            </div>
        )
    }

    return (
        <button
            {...item.getProps()}
            style={{ paddingLeft: `${level * 18 + 8}px` }}
            className={cn(
                "relative flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm outline-none transition-colors",
                item.isSelected()
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50",
                item.isFocused() && "ring-1 ring-inset ring-ring",
                item.isDragTarget() &&
                    "bg-accent outline outline-2 outline-ring",
            )}
        >
            <TreeGuides level={level} />
            {isFolder ? (
                <ChevronRightIcon
                    className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
                        isExpanded && "rotate-90",
                    )}
                />
            ) : (
                <span className="w-3.5 shrink-0" />
            )}
            <RowIcon isFolder={isFolder} isExpanded={isExpanded} />
            <span className="truncate">{item.getItemName()}</span>
        </button>
    )
}

function TreeGuides({ level }: { level: number }) {
    if (level === 0) return null
    return (
        <>
            {Array.from({ length: level }).map((_, i) => (
                <span
                    key={i}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-border"
                    style={{ left: `${i * 18 + 16}px` }}
                />
            ))}
        </>
    )
}

function RowIcon({
    isFolder,
    isExpanded,
}: {
    isFolder: boolean
    isExpanded: boolean
}) {
    if (!isFolder) {
        return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
    return isExpanded ? (
        <FolderOpenIcon className="h-4 w-4 shrink-0 text-primary" />
    ) : (
        <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
    )
}
