"use client"

import { cn } from "@/lib/utils"

export function ScoreBar({
    score,
    className,
}: {
    score: number | null
    className?: string
}) {
    const pct = Math.round((score ?? 0) * 100)
    return (
        <div
            className={cn(
                "h-1.5 w-20 overflow-hidden rounded-full bg-foreground/10",
                className,
            )}
        >
            <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
        </div>
    )
}
