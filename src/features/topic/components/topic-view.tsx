"use client"

import { useMemo } from "react"
import { FileText, Pencil, Play } from "lucide-react"

import {
    cumulativeSeries,
    dailySeries,
    formatDate,
    formatPercent,
    topicStats,
} from "@/core"
import type { Session, TreeNode } from "@/core"
import { DailyBarChart, TrendChart } from "@/components/charts"
import { Stat } from "@/components/stat"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { SessionList } from "./session-list"

export interface TopicViewProps {
    node: TreeNode
    sessions: Session[]
    onRename: (id: string) => void
    onStartPractice: (id: string) => void
}

/**
 * A topic's tracker page: aggregate stats, activity charts and the session
 * history. Purely props-driven so it can be hosted by any screen.
 */
export function TopicView({
    node,
    sessions,
    onRename,
    onStartPractice,
}: TopicViewProps) {
    const stats = topicStats(sessions)

    const trendPoints = useMemo(
        () =>
            cumulativeSeries(dailySeries(sessions)).filter(
                (point): point is { date: string; score: number } =>
                    point.score !== null,
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
                                onClick={() => onRename(node.id)}
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

                {sessions.length > 0 ? (
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

                <SessionList sessions={sessions} />

                <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium">Practice</p>
                        <p className="text-xs text-muted-foreground">
                            Record today&apos;s session with one click per
                            answer.
                        </p>
                    </div>
                    <Button onClick={() => onStartPractice(node.id)}>
                        <Play className="size-4" /> Practice
                    </Button>
                </section>
            </div>
        </div>
    )
}
