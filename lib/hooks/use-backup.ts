"use client"

import { useCallback, useState } from "react"
import { DexiePerformanceRepository } from "../infra/performance-repository"

const performanceRepo = new DexiePerformanceRepository()

export type BackupState =
    | { status: "idle" }
    | { status: "working" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }

export function useBackup() {
    const [exportState, setExportState] = useState<BackupState>({
        status: "idle",
    })
    const [importState, setImportState] = useState<BackupState>({
        status: "idle",
    })

    const exportBackup = useCallback(async () => {
        setExportState({ status: "working" })
        try {
            const csv = await performanceRepo.exportCSV()
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            const today = new Date().toISOString().slice(0, 10)
            link.href = url
            link.download = `topictracker-backup-${today}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            setExportState({ status: "success", message: "Backup exported." })
        } catch (err) {
            console.error("[useBackup] export failed:", err)
            setExportState({
                status: "error",
                message: "Couldn't export your backup. Please try again.",
            })
        }
    }, [])

    const importBackup = useCallback(async (file: File) => {
        setImportState({ status: "working" })
        try {
            const text = await file.text()
            await performanceRepo.importCSV(text)
            setImportState({
                status: "success",
                message: `Imported sessions from "${file.name}".`,
            })
        } catch (err) {
            console.error("[useBackup] import failed:", err)
            setImportState({
                status: "error",
                message:
                    "Couldn't import that file. Make sure it's a valid backup CSV.",
            })
        }
    }, [])

    const resetExportState = useCallback(
        () => setExportState({ status: "idle" }),
        [],
    )
    const resetImportState = useCallback(
        () => setImportState({ status: "idle" }),
        [],
    )

    return {
        exportState,
        importState,
        exportBackup,
        importBackup,
        resetExportState,
        resetImportState,
    }
}
