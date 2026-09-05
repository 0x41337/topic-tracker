"use client"

import { isEnabled } from "@/lib/features/flags/flags"
import { AppearanceSection } from "../settings-sections/appearance-section"
import { BackupSection } from "../settings-sections/backup-section"
import { SourceCodeSection } from "../settings-sections/source-code-section"

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
            {isEnabled("backup") && <BackupSection />}
            <SourceCodeSection />
        </div>
    )
}
