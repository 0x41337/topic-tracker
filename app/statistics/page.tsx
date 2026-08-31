"use client"

import type { ReactNode } from "react"
import {
    ActivityIcon,
    CheckCircle2Icon,
    FlameIcon,
    ListChecksIcon,
} from "lucide-react"

import { useOverallStats } from "@/lib/hooks/use-overall-stats"
import { ActivityHeatmap } from "@/app/components/activity-heatmap"
import { OverallTrendChart } from "@/app/components/overall-trend-chart"
import { TopicBreakdownList } from "@/app/components/topic-breakdown-list"

export default function StatisticsPage() {
    const { status, overall, streak, dailyPoints, topicSummaries } =
        useOverallStats()

    if (status === "loading") {
        return (
            <div
                role="status"
                aria-label="Loading"
                className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-4 lg:gap-6 lg:p-6"
            >
                <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-lg bg-muted"
                        />
                    ))}
                </div>
                <div className="h-40 animate-pulse rounded-lg bg-muted" />
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
        )
    }

    if (status === "empty") {
        return (
            <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-2 p-4 py-24 text-center lg:p-6">
                <ListChecksIcon className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    No data yet. Log some sessions first.
                </p>
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-4 lg:gap-6 lg:p-6">
            <div>
                <h1 className="text-lg font-semibold text-foreground">
                    Statistics
                </h1>
                <p className="text-sm text-muted-foreground">
                    A quick look at how your studying is going overall.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryTile
                    icon={<CheckCircle2Icon className="h-4 w-4" />}
                    label="Overall accuracy"
                    value={
                        overall.accuracy === null
                            ? "—"
                            : `${Math.round(overall.accuracy * 100)}%`
                    }
                />
                <SummaryTile
                    icon={<FlameIcon className="h-4 w-4" />}
                    label="Current streak"
                    value={`${streak} ${streak === 1 ? "day" : "days"}`}
                />
                <SummaryTile
                    icon={<ListChecksIcon className="h-4 w-4" />}
                    label="Topics practiced"
                    value={`${overall.topicsWithActivity}/${overall.topicsTracked}`}
                />
                <SummaryTile
                    icon={<ActivityIcon className="h-4 w-4" />}
                    label="Attempts logged"
                    value={`${overall.total}`}
                />
            </div>

            <div className="space-y-3 rounded-lg border bg-card p-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        Activity
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Each square is a day
                    </p>
                </div>
                <ActivityHeatmap dailyPoints={dailyPoints} />
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Lower accuracy</span>
                    <div className="flex items-center gap-1">
                        {[0.25, 0.5, 0.75, 1].map((o) => (
                            <span
                                key={o}
                                className="size-3 rounded-sm"
                                style={{
                                    backgroundColor: "var(--primary)",
                                    opacity: o,
                                }}
                            />
                        ))}
                    </div>
                    <span>Higher accuracy</span>
                </div>
            </div>

            <OverallTrendChart dailyPoints={dailyPoints} />

            <TopicBreakdownList topics={topicSummaries} />
        </div>
    )
}

function SummaryTile({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: string
}) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
                {value}
            </p>
        </div>
    )
}
