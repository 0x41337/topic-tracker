"use client"

import { useRef } from "react"
import { DownloadIcon, UploadIcon } from "lucide-react"

import { useBackup } from "@/lib/hooks/use-backup"
import { StatusLine } from "./status-line"

export function BackupSection() {
    const {
        exportState,
        importState,
        exportBackup,
        importBackup,
        resetImportState,
    } = useBackup()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        const proceed = window.confirm(
            `Import backup from "${file.name}"? This will replace all current data.`,
        )
        if (!proceed) return

        void importBackup(file)
    }

    return (
        <section className="space-y-4 rounded-lg border bg-card p-4">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    Backup
                </h2>
                <p className="text-xs text-muted-foreground">
                    Export a full backup (topics, folders, and sessions) as JSON,
                    or restore from a previous backup.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-foreground">Export backup</p>
                    <p className="text-xs text-muted-foreground">
                        Download everything as a JSON file.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void exportBackup()}
                    disabled={exportState.status === "working"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                    <DownloadIcon className="h-4 w-4" />
                    {exportState.status === "working"
                        ? "Exporting\u2026"
                        : "Export backup"}
                </button>
            </div>
            {exportState.status === "success" && (
                <StatusLine tone="success">{exportState.message}</StatusLine>
            )}
            {exportState.status === "error" && (
                <StatusLine tone="error">{exportState.message}</StatusLine>
            )}

            <div className="border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-foreground">Import backup</p>
                        <p className="text-xs text-muted-foreground">
                            Restore from a previously exported JSON file. Replaces
                            all current data.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importState.status === "working"}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                        <UploadIcon className="h-4 w-4" />
                        {importState.status === "working"
                            ? "Importing\u2026"
                            : "Import backup"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
                {importState.status === "success" && (
                    <StatusLine tone="success" onDismiss={resetImportState}>
                        {importState.message}
                    </StatusLine>
                )}
                {importState.status === "error" && (
                    <StatusLine tone="error" onDismiss={resetImportState}>
                        {importState.message}
                    </StatusLine>
                )}
            </div>
        </section>
    )
}
