"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import {
    CheckCircle2Icon,
    DownloadIcon,
    FileDownIcon,
    MonitorIcon,
    MoonIcon,
    SunIcon,
    UploadIcon,
    XCircleIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useBackup } from "@/lib/hooks/use-backup"

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: MonitorIcon },
] as const

export default function SettingsPage() {
    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 lg:gap-6 lg:p-6">
            <div>
                <h1 className="text-lg font-semibold text-foreground">
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage how Topic Tracker looks and where your data lives.
                </p>
            </div>

            <AppearanceSection />
            <BackupSection />
        </div>
    )
}

function AppearanceSection() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    return (
        <section className="space-y-3 rounded-lg border bg-card p-4">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    Appearance
                </h2>
                <p className="text-xs text-muted-foreground">
                    Choose how Topic Tracker looks on this device.
                </p>
            </div>

            <div className="inline-flex rounded-md border p-1">
                {THEME_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = mounted && theme === opt.value
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTheme(opt.value)}
                            className={cn(
                                "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {opt.label}
                        </button>
                    )
                })}
            </div>
        </section>
    )
}

function BackupSection() {
    const {
        exportJsonState,
        importJsonState,
        exportCsvState,
        exportJsonBackup,
        importJsonBackup,
        exportCsvBackup,
        resetImportJsonState,
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

        void importJsonBackup(file)
    }

    return (
        <section className="space-y-4 rounded-lg border bg-card p-4">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    Backup
                </h2>
                <p className="text-xs text-muted-foreground">
                    Export a full backup (topics, folders, and sessions) as JSON,
                    or export sessions only as CSV for data analysis.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-foreground">Export full backup</p>
                    <p className="text-xs text-muted-foreground">
                        Download everything as a JSON file.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void exportJsonBackup()}
                    disabled={exportJsonState.status === "working"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                    <DownloadIcon className="h-4 w-4" />
                    {exportJsonState.status === "working"
                        ? "Exporting…"
                        : "Export JSON"}
                </button>
            </div>
            {exportJsonState.status === "success" && (
                <StatusLine tone="success">{exportJsonState.message}</StatusLine>
            )}
            {exportJsonState.status === "error" && (
                <StatusLine tone="error">{exportJsonState.message}</StatusLine>
            )}

            <div className="border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-foreground">Import backup</p>
                        <p className="text-xs text-muted-foreground">
                            Restore from a previously exported JSON file.
                            Replaces all current data.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importJsonState.status === "working"}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                        <UploadIcon className="h-4 w-4" />
                        {importJsonState.status === "working"
                            ? "Importing…"
                            : "Import JSON"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
                {importJsonState.status === "success" && (
                    <StatusLine tone="success" onDismiss={resetImportJsonState}>
                        {importJsonState.message}
                    </StatusLine>
                )}
                {importJsonState.status === "error" && (
                    <StatusLine tone="error" onDismiss={resetImportJsonState}>
                        {importJsonState.message}
                    </StatusLine>
                )}
            </div>

            <div className="border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-foreground">Export sessions CSV</p>
                        <p className="text-xs text-muted-foreground">
                            Download performance data only as CSV.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void exportCsvBackup()}
                        disabled={exportCsvState.status === "working"}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                        <FileDownIcon className="h-4 w-4" />
                        {exportCsvState.status === "working"
                            ? "Exporting…"
                            : "Export CSV"}
                    </button>
                </div>
                {exportCsvState.status === "success" && (
                    <StatusLine tone="success">{exportCsvState.message}</StatusLine>
                )}
                {exportCsvState.status === "error" && (
                    <StatusLine tone="error">{exportCsvState.message}</StatusLine>
                )}
            </div>
        </section>
    )
}

function StatusLine({
    tone,
    children,
    onDismiss,
}: {
    tone: "success" | "error"
    children: React.ReactNode
    onDismiss?: () => void
}) {
    const Icon = tone === "success" ? CheckCircle2Icon : XCircleIcon
    return (
        <div
            className={cn(
                "mt-2 flex items-center gap-1.5 text-xs",
                tone === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
            )}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{children}</span>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Dismiss
                </button>
            )}
        </div>
    )
}
