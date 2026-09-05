"use client"

import { useCallback, useState } from "react"
import { DexieBackupRepository } from "../features/backup/dexie-repository"
import type { BackupState, BackupData } from "../features/backup/types"

export type { BackupState }

const repo = new DexieBackupRepository()

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
            const data = await repo.exportAll()
            const json = JSON.stringify(data, null, 2)
            const blob = new Blob([json], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            const today = new Date().toISOString().slice(0, 10)
            link.href = url
            link.download = `topictracker-backup-${today}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            setExportState({ status: "success", message: "Backup exported." })
        } catch (err) {
            console.error("[useBackup] export failed:", err)
            setExportState({
                status: "error",
                message: "Couldn't export backup. Please try again.",
            })
        }
    }, [])

    const importBackup = useCallback(async (file: File) => {
        setImportState({ status: "working" })
        try {
            const text = await file.text()
            const data = JSON.parse(text) as BackupData

            if (
                !data.version ||
                !Array.isArray(data.topics) ||
                !Array.isArray(data.performances)
            ) {
                throw new Error("Invalid backup format")
            }

            data.actionHistory = Array.isArray(data.actionHistory)
                ? data.actionHistory
                : []

            await repo.importAll(data)

            setImportState({
                status: "success",
                message: `Imported ${data.topics.length} topics and ${data.performances.length} sessions from "${file.name}".`,
            })
        } catch (err) {
            console.error("[useBackup] import failed:", err)
            setImportState({
                status: "error",
                message: "Couldn't import that file. Make sure it's a valid Topic Tracker backup.",
            })
        }
    }, [])

    const resetImportState = useCallback(
        () => setImportState({ status: "idle" }),
        [],
    )

    return {
        exportState,
        importState,
        exportBackup,
        importBackup,
        resetImportState,
    }
}
