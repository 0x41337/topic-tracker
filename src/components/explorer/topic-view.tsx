"use client"

import { useMemo } from "react"
import { FileText, Pencil, Play, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    formatDate,
    formatPercent,
    formatTrend,
    topicStats,
} from "@/lib/tree-utils"
import { cumulativeSeries, dailySeries } from "@/lib/stats-utils"
import { DailyBarChart, TrendChart } from "./charts"
import type { Session, TreeNode } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useExplorer } from "./context"

/* ---------- Stats ---------- */

function Stat({
    label,
    value,
    trend,
}: {
    label: string
    value: string
    trend?: number | null
}) {
    return (
        <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                    {value}
                </span>
                {trend !== undefined && trend !== null ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className={cn(
                                    "flex items-center gap-0.5 text-xs font-medium tabular-nums text-muted-foreground",
                                )}
                            >
                                {trend >= 0 ? (
                                    <TrendingUp className="size-3.5" />
                                ) : (
                                    <TrendingDown className="size-3.5" />
                                )}
                                {formatTrend(trend)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            Change from last session
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </div>
    )
}

/* ---------- Session list ---------- */

function SessionRow({ session }: { session: Session }) {
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

/* ---------- Topic view ---------- */

export function TopicView({ node }: { node: TreeNode }) {
    const ctx = useExplorer()

    const sessions = useMemo(
        () => ctx.state.sessions[node.id] ?? [],
        [ctx.state.sessions, node.id],
    )
    const stats = topicStats(sessions)

    const trendPoints = useMemo(
        () =>
            cumulativeSeries(dailySeries(sessions)).filter(
                (point): point is { date: string; score: number } =>
                    point.score !== null,
            ),
        [sessions],
    )

    const sorted = useMemo(
        () =>
            [...sessions].sort(
                (a, b) =>
                    b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
            ),
        [sessions],
    )

    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-10 p-6">
                <header className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <FileText className="size-5 shrink-0 text-muted-foreground" />
                        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
                            {node.name}
                        </h1>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                aria-label="Rename topic"
                                onClick={() => ctx.beginRename(node.id)}
                            >
                                <Pencil className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rename</TooltipContent>
                    </Tooltip>
                </header>

                <section className="flex flex-wrap gap-x-12 gap-y-6">
                    <Stat
                        label="Score"
                        value={formatPercent(stats.score)}
                        trend={stats.trend}
                    />
                    <Stat
                        label="Hits / Total"
                        value={`${stats.hits} / ${stats.total}`}
                    />
                    <Stat label="Sessions" value={String(stats.sessionCount)} />
                    <Stat
                        label="Last session"
                        value={
                            stats.lastDate
                                ? formatDate(stats.lastDate)
                                : "\u2014"
                        }
                    />
                </section>

                {sorted.length > 0 ? (
                    <section>
                        <h2 className="mb-3 text-sm font-medium">Activity</h2>
                        <DailyBarChart data={dailySeries(sessions)} />
                    </section>
                ) : null}

                {trendPoints.length > 1 ? (
                    <section>
                        <h2 className="mb-3 text-sm font-medium">
                            Score trend
                        </h2>
                        <TrendChart data={trendPoints} />
                    </section>
                ) : null}

                <section>
                    <h2 className="mb-2 text-sm font-medium">Sessions</h2>
                    {sorted.length > 0 ? (
                        <div className="rounded-lg border">
                            <ul className="divide-y p-1">
                                {sorted.map((session) => (
                                    <SessionRow
                                        key={session.id}
                                        session={session}
                                    />
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                            No sessions recorded yet.
                        </p>
                    )}
                </section>

                <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium">Practice</p>
                        <p className="text-xs text-muted-foreground">
                            Record today&apos;s session with one click per
                            answer.
                        </p>
                    </div>
                    <Button onClick={() => ctx.startPractice(node.id)}>
                        <Play className="size-4" /> Practice
                    </Button>
                </section>
            </div>
        </div>
    )
}
