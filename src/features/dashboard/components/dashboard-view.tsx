"use client"

import { useMemo } from "react"
import { BarChart3 } from "lucide-react"

import {
    cumulativeSeries,
    dailySeries,
    formatDate,
    formatPercent,
    practiceSpanDays,
    topicStats,
} from "@/core"
import type { Session, TreeState } from "@/core"
import { DailyBarChart, ScoreBar, TrendChart } from "@/components/charts"

export interface DashboardViewProps {
    state: TreeState
    onOpenTopic: (id: string) => void
}

interface TopicRow {
    id: string
    name: string
    hits: number
    total: number
    score: number | null
    lastDate: string | null
}

/**
 * Aggregate performance dashboard across every topic in the tree.
 * Reads the whole state passed in and renders; the only interaction it
 * emits is "open this topic".
 */
export function DashboardView({ state, onOpenTopic }: DashboardViewProps) {
    const { allSessions, topicRows, daily, cumulative } = useMemo(() => {
        const sessions: Array<Session & { topicId: string }> = []
        const rows: TopicRow[] = []
        for (const node of Object.values(state.nodes)) {
            if (node.kind !== "topic") continue
            const topicSessions = state.sessions[node.id] ?? []
            for (const session of topicSessions)
                sessions.push({ ...session, topicId: node.id })
            const stats = topicStats(topicSessions)
            rows.push({
                id: node.id,
                name: node.name,
                hits: stats.hits,
                total: stats.total,
                score: stats.score,
                lastDate: stats.lastDate,
            })
        }
        const dailyPoints = dailySeries(sessions)
        rows.sort(
            (a, b) =>
                (b.score ?? -1) - (a.score ?? -1) ||
                b.total - a.total ||
                a.name.localeCompare(b.name),
        )
        return {
            allSessions: sessions,
            topicRows: rows,
            daily: dailyPoints,
            cumulative: cumulativeSeries(dailyPoints),
        }
    }, [state])

    const overall = topicStats(allSessions)
    const trendPoints = cumulative.filter(
        (point): point is { date: string; score: number } =>
            point.score !== null,
    )
    const span = practiceSpanDays(daily)

    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <div
                className="mx-auto max-w-4xl space-y-10 p-6"
                data-testid="dashboard"
            >
                <header className="space-y-1">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="size-5 shrink-0 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Dashboard
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">All topics</p>
                </header>

                <section>
                    <h2 className="mb-3 text-sm font-medium">Daily activity</h2>
                    {daily.length > 0 ? (
                        <>
                            <p className="mb-2 text-xs text-muted-foreground">
                                {overall.sessionCount} sessions, {overall.hits}/
                                {overall.total} hits
                                {span > 1 ? ` over ${span} days` : ""}
                            </p>
                            <DailyBarChart data={daily} />
                        </>
                    ) : (
                        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                            No sessions recorded yet.
                        </p>
                    )}
                </section>

                {trendPoints.length > 1 ? (
                    <section>
                        <h2 className="mb-3 text-sm font-medium">
                            Score trend
                        </h2>
                        <TrendChart data={trendPoints} />
                    </section>
                ) : null}

                <section>
                    <h2 className="mb-3 text-sm font-medium">Topics</h2>
                    {topicRows.length > 0 ? (
                        <div className="rounded-lg border">
                            <ul className="divide-y p-1">
                                {topicRows.map((row) => (
                                    <li
                                        key={row.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_6rem]"
                                    >
                                        <button
                                            type="button"
                                            className="cursor-pointer truncate text-left text-sm hover:underline"
                                            onClick={() => onOpenTopic(row.id)}
                                        >
                                            {row.name}
                                        </button>
                                        <ScoreBar
                                            score={row.score}
                                            className="hidden sm:block"
                                        />
                                        <span className="text-right text-xs tabular-nums text-muted-foreground">
                                            {row.hits} / {row.total}
                                        </span>
                                        <span className="hidden text-right text-xs tabular-nums text-muted-foreground sm:block">
                                            {row.lastDate
                                                ? formatDate(row.lastDate)
                                                : "Never"}
                                        </span>
                                        <span className="col-span-2 text-xs tabular-nums text-muted-foreground sm:hidden">
                                            {formatPercent(row.score)}
                                            {row.lastDate
                                                ? ` \u00B7 ${formatDate(row.lastDate)}`
                                                : ""}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                            No topics yet.
                        </p>
                    )}
                </section>
            </div>
        </div>
    )
}
