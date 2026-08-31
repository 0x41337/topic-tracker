"use client"

import { useMemo } from "react"
import type { TopicSummary } from "@/lib/hooks/use-overall-stats"

interface TopicBreakdownListProps {
    topics: TopicSummary[]
}

export function TopicBreakdownList({ topics }: TopicBreakdownListProps) {
    const { practiced, notStarted } = useMemo(() => {
        const practiced = topics
            .filter((t) => t.total > 0)
            .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
        const notStarted = topics.filter((t) => t.total === 0)
        return { practiced, notStarted }
    }, [topics])

    if (topics.length === 0) {
        return null
    }

    return (
        <div className="space-y-4 rounded-lg border bg-card p-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    Topics
                </h3>
                <p className="text-xs text-muted-foreground">
                    Weakest first, so you know what to review next
                </p>
            </div>

            {practiced.length > 0 && (
                <ul className="space-y-2">
                    {practiced.map((t) => (
                        <li key={t.topicId} className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                {t.name}
                            </span>
                            <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(t.accuracy ?? 0) * 100}%`,
                                        backgroundColor: "var(--chart-1)",
                                    }}
                                />
                            </div>
                            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                                {Math.round((t.accuracy ?? 0) * 100)}%
                            </span>
                            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                                {t.hits}/{t.total}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {notStarted.length > 0 && (
                <div className="border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Not started yet
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {notStarted.map((t) => (
                            <span
                                key={t.topicId}
                                className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                            >
                                {t.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
