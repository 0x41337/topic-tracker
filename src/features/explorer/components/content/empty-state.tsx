"use client"

import { FilePlus, FolderPlus, ListTree } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useExplorer } from "../explorer-context"

/** Shown when a folder has no children (or the whole tree is empty). */
export function EmptyState({
    parentId,
    totalNodes,
}: {
    parentId: string | null
    totalNodes: number
}) {
    const ctx = useExplorer()

    if (totalNodes === 0) {
        return (
            <div className="grid flex-1 place-items-center p-8">
                <div className="max-w-sm space-y-4 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full border">
                        <ListTree className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold">
                            No folders or topics yet
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Create a folder to get started.
                        </p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => ctx.beginCreate("folder", parentId)}
                        >
                            <FolderPlus className="size-4" /> New folder
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => ctx.beginCreate("topic", parentId)}
                        >
                            <FilePlus className="size-4" /> New topic
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pointer-events-none grid flex-1 place-items-center p-8">
            <div className="space-y-1 rounded-lg border border-dashed px-8 py-6 text-center">
                <p className="text-sm font-medium">Empty folder</p>
                <p className="text-xs text-muted-foreground">
                    Drag items here or create something new.
                </p>
            </div>
        </div>
    )
}
