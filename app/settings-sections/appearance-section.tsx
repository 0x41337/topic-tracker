"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: MonitorIcon },
] as const

export function AppearanceSection() {
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
