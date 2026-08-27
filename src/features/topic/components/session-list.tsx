"use client"

import { FileText } from "lucide-react"

import { formatDate, formatPercent } from "@/core"
import type { Session } from "@/core"

/** One recorded session inside the topic's history list. */
export function SessionRow({ session }: { session: Session }) {
    const score = session.total > 0 ? session.hits / session.total : null
    return (
        <li className="grid grid-cols-[1fr_auto_3.5rem] items-center gap-4 px-1 py-2.5 text-sm">
            <span className="truncate text-muted-foreground">
                {formatDate(session.date)}
            </span>
            <span className="tabular-nums text-muted-foreground">
                {session.hits} / {session.total} hits
            </span>
            <span className="text-right font-medium tabular-nums">
                {formatPercent(score)}
            </span>
        </li>
    )
}

/** Chronological list of a topic's daily sessions. */
export function SessionList({ sessions }: { sessions: Session[] }) {
    const sorted = [...sessions].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    )

    return (
        <section>
            <h2 className="mb-2 text-sm font-medium">Sessions</h2>
            {sorted.length > 0 ? (
                <div className="rounded-lg border">
                    <ul className="divide-y p-1">
                        {sorted.map((session) => (
                            <SessionRow key={session.id} session={session} />
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No sessions recorded yet.
                </p>
            )}
        </section>
    )
}

/** Compact topic header used by the practice screen. */
export function TopicBadge({ name }: { name: string }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate text-sm font-medium">{name}</span>
        </div>
    )
}
