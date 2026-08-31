"use client"

import { useCallback, useState } from "react"
import { db } from "../infra/db"
import type { TopicNode, PerformanceRecord } from "../core/types"

export type BackupState =
    | { status: "idle" }
    | { status: "working" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }

interface BackupData {
    version: 1
    topics: TopicNode[]
    performances: PerformanceRecord[]
}

export function useBackup() {
    const [exportJsonState, setExportJsonState] = useState<BackupState>({
        status: "idle",
    })
    const [importJsonState, setImportJsonState] = useState<BackupState>({
        status: "idle",
    })
    const [exportCsvState, setExportCsvState] = useState<BackupState>({
        status: "idle",
    })

    const exportJsonBackup = useCallback(async () => {
        setExportJsonState({ status: "working" })
        try {
            const topics = await db.topics.toArray()
            const performances = await db.performances.toArray()
            const data: BackupData = {
                version: 1,
                topics,
                performances,
            }
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
            setExportJsonState({ status: "success", message: "Backup exported." })
        } catch (err) {
            console.error("[useBackup] JSON export failed:", err)
            setExportJsonState({
                status: "error",
                message: "Couldn't export backup. Please try again.",
            })
        }
    }, [])

    const importJsonBackup = useCallback(async (file: File) => {
        setImportJsonState({ status: "working" })
        try {
            const text = await file.text()
            const data = JSON.parse(text) as BackupData

            if (!data.version || !Array.isArray(data.topics) || !Array.isArray(data.performances)) {
                throw new Error("Invalid backup format")
            }

            await db.transaction("rw", [db.topics, db.performances], async () => {
                await db.topics.clear()
                await db.performances.clear()
                if (data.topics.length > 0) {
                    await db.topics.bulkAdd(data.topics)
                }
                if (data.performances.length > 0) {
                    await db.performances.bulkAdd(data.performances)
                }
            })

            setImportJsonState({
                status: "success",
                message: `Imported ${data.topics.length} topics and ${data.performances.length} sessions from "${file.name}".`,
            })
        } catch (err) {
            console.error("[useBackup] JSON import failed:", err)
            setImportJsonState({
                status: "error",
                message: "Couldn't import that file. Make sure it's a valid Topic Tracker backup.",
            })
        }
    }, [])

    const exportCsvBackup = useCallback(async () => {
        setExportCsvState({ status: "working" })
        try {
            const [records, topics] = await Promise.all([
                db.performances.toArray(),
                db.topics.toArray(),
            ])
            const topicMap = new Map(topics.map((t) => [t.id, t.name]))

            const aggregated = new Map<string, { topic: string; hits: number; total: number; date: string }>()
            for (const r of records) {
                const name = topicMap.get(r.topicId)
                if (!name || r.total === 0) continue
                const key = `${name}|${r.date}`
                const existing = aggregated.get(key)
                if (existing) {
                    existing.hits += r.hits
                    existing.total += r.total
                } else {
                    aggregated.set(key, { topic: name, hits: r.hits, total: r.total, date: r.date })
                }
            }

            const header = "topic|hits|total|date"
            const rows = [...aggregated.values()]
                .sort((a, b) => a.date.localeCompare(b.date) || a.topic.localeCompare(b.topic))
                .map((r) => `${r.topic}|${r.hits}|${r.total}|${r.date}`)
            const csv = [header, ...rows].join("\n")
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            const today = new Date().toISOString().slice(0, 10)
            link.href = url
            link.download = `topictracker-sessions-${today}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            setExportCsvState({ status: "success", message: "CSV exported." })
        } catch (err) {
            console.error("[useBackup] CSV export failed:", err)
            setExportCsvState({
                status: "error",
                message: "Couldn't export CSV. Please try again.",
            })
        }
    }, [])

    const resetImportJsonState = useCallback(
        () => setImportJsonState({ status: "idle" }),
        [],
    )

    return {
        exportJsonState,
        importJsonState,
        exportCsvState,
        exportJsonBackup,
        importJsonBackup,
        exportCsvBackup,
        resetImportJsonState,
    }
}
