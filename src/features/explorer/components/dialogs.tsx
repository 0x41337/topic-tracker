"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { subtreeIds } from "@/core"
import { useExplorer } from "./explorer-context"
import type { PendingDataAction } from "./explorer-context"

const DATA_DIALOG_COPY: Record<
    PendingDataAction["kind"],
    { title: string; description: string; confirm: string }
> = {
    import: {
        title: "Replace all data?",
        description:
            "Your current data will be replaced by the contents of this file.",
        confirm: "Import",
    },
    sample: {
        title: "Load sample data?",
        description: "This will replace your current data with the demo tree.",
        confirm: "Load sample",
    },
    clear: {
        title: "Clear all data?",
        description:
            "All folders, topics, and sessions will be permanently deleted.",
        confirm: "Clear all",
    },
}

export function DeleteDialog() {
    const ctx = useExplorer()
    const { pendingDelete, state } = ctx
    const open = pendingDelete !== null

    let title = "Delete item?"
    let description =
        "The selected item and all of its contents will be removed."
    if (pendingDelete && pendingDelete.length > 0) {
        const affected = pendingDelete.flatMap((id) =>
            subtreeIds(state.nodes, id),
        )
        const names = pendingDelete
            .map((id) => state.nodes[id]?.name)
            .filter((name): name is string => Boolean(name))
        const preview = names
            .slice(0, 3)
            .map((name) => `\u201C${name}\u201D`)
            .join(", ")
        const suffix = names.length > 3 ? ` and ${names.length - 3} more` : ""
        title =
            pendingDelete.length === 1 && affected.length === 1
                ? `Delete ${preview}?`
                : `Delete ${affected.length} item${affected.length === 1 ? "" : "s"}?`
        description = `${preview}${suffix} — all nested items and sessions will be deleted.`
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next) ctx.cancelDelete()
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={ctx.confirmDelete}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function DataDialog() {
    const ctx = useExplorer()
    const { pendingData } = ctx
    const copy = pendingData ? DATA_DIALOG_COPY[pendingData.kind] : null

    return (
        <AlertDialog
            open={pendingData !== null}
            onOpenChange={(next) => {
                if (!next) ctx.cancelDataAction()
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {copy?.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={ctx.confirmDataAction}>
                        {copy?.confirm}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
