"use client"

import { useState } from "react"

import { store } from "@/core"
import { toast } from "sonner"

export type PendingDataAction =
    { kind: "import"; data: string } | { kind: "sample" } | { kind: "clear" }

/**
 * Import / export / sample / clear lifecycle. Every destructive action goes
 * through a confirmation owned by the caller; this hook validates imports and
 * notifies `onAfterReset` so the workspace can reset its UI state.
 */
export function useDataManagement(onAfterReset: () => void) {
    const [pendingData, setPendingData] = useState<PendingDataAction | null>(
        null,
    )

    const requestImport = (raw: string) => {
        if (!store.canImport(raw)) {
            toast.error("Invalid file")
            return
        }
        setPendingData({ kind: "import", data: raw })
    }

    const requestSample = () => setPendingData({ kind: "sample" })
    const requestClear = () => setPendingData({ kind: "clear" })

    const confirmDataAction = () => {
        if (!pendingData) return
        const action = pendingData
        setPendingData(null)
        if (action.kind === "import") {
            toast.success(
                store.importState(action.data)
                    ? "Data imported"
                    : "Import failed",
            )
        } else if (action.kind === "sample") {
            store.resetToSample()
            toast.success("Sample data loaded")
        } else {
            store.clearAll()
            toast.success("All data cleared")
        }
        onAfterReset()
    }

    const cancelDataAction = () => setPendingData(null)

    return {
        pendingData,
        requestImport,
        requestSample,
        requestClear,
        confirmDataAction,
        cancelDataAction,
    }
}

export type DataManagementApi = ReturnType<typeof useDataManagement>
