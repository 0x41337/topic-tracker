"use client"

import { useMemo, useState } from "react"
import type { PerformanceRecord } from "@/lib/features/performance/types"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChevronDownIcon,
    MinusIcon,
    TrendingDownIcon,
    TrendingUpIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface TopicStatsCardProps {
    history: PerformanceRecord[]
}

const PERIOD_OPTIONS = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 30, label: "30 days" },
    { value: 90, label: "90 days" },
] as const

const chartConfig = {
    hits: {
        label: "Hits",
        color: "var(--chart-1)",
    },
    misses: {
        label: "Misses",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function TopicStatsCard({ history }: TopicStatsCardProps) {
    const [period, setPeriod] = useState(7)

    const recentSessions = useMemo(() => {
        return history.slice(0, 5)
    }, [history])

    const chartData = useMemo(() => {
        const now = new Date()
        const cutoff = new Date(now)
        cutoff.setDate(cutoff.getDate() - period)

        const filtered = history.filter((r) => new Date(r.date) >= cutoff)

        const sorted = [...filtered].sort((a, b) =>
            a.date.localeCompare(b.date),
        )

        return sorted.map((r) => ({
            date: r.date,
            hits: r.hits,
            misses: r.total - r.hits,
        }))
    }, [history, period])

    const periodSummary = useMemo(() => {
        const totals = chartData.reduce(
            (acc, d) => ({
                hits: acc.hits + d.hits,
                attempts: acc.attempts + d.hits + d.misses,
            }),
            { hits: 0, attempts: 0 },
        )
        return {
            attempts: totals.attempts,
            accuracy:
                totals.attempts === 0 ? null : totals.hits / totals.attempts,
        }
    }, [chartData])

    if (history.length === 0) {
        return null
    }

    return (
        <div className="space-y-5 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        Statistics
                    </h3>
                    <p className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold tabular-nums text-foreground">
                            {periodSummary.accuracy === null
                                ? "—"
                                : `${(periodSummary.accuracy * 100).toFixed(0)}%`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            accuracy · last {period} days
                            {periodSummary.attempts > 0 &&
                                ` (${periodSummary.attempts} attempts)`}
                        </span>
                    </p>
                </div>

                <div className="relative shrink-0">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="appearance-none rounded-md border bg-background py-1 pl-2 pr-6 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>
            </div>

            {recentSessions.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Last 5 Sessions
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {recentSessions.map((session) => {
                            const score =
                                session.total === 0
                                    ? 0
                                    : session.hits / session.total
                            const prevSession = history.find(
                                (r) => r.date < session.date,
                            )
                            const growth = prevSession
                                ? score -
                                  (prevSession.total === 0
                                      ? 0
                                      : prevSession.hits / prevSession.total)
                                : null

                            return (
                                <div
                                    key={session.date}
                                    className="rounded-lg border p-2 text-center"
                                >
                                    <p className="text-[10px] text-muted-foreground">
                                        {new Date(
                                            session.date,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                    <p className="text-lg font-semibold tabular-nums text-foreground">
                                        {(score * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {session.hits}/{session.total}
                                    </p>
                                    {growth !== null && (
                                        <p
                                            className={cn(
                                                "mt-0.5 flex items-center justify-center gap-0.5 text-[10px]",
                                                growth > 0 &&
                                                    "text-emerald-600 dark:text-emerald-400",
                                                growth < 0 &&
                                                    "text-red-600 dark:text-red-400",
                                                growth === 0 &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            {growth > 0 && (
                                                <TrendingUpIcon className="h-2.5 w-2.5" />
                                            )}
                                            {growth < 0 && (
                                                <TrendingDownIcon className="h-2.5 w-2.5" />
                                            )}
                                            {growth === 0 && (
                                                <MinusIcon className="h-2.5 w-2.5" />
                                            )}
                                            {growth !== 0 &&
                                                `${growth > 0 ? "+" : ""}${(growth * 100).toFixed(0)}%`}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {chartData.length > 0 && (
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                            Performance Over Time
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor: "var(--chart-1)",
                                    }}
                                />
                                Hits
                            </span>
                            <span className="flex items-center gap-1">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor: "var(--chart-2)",
                                    }}
                                />
                                Misses
                            </span>
                        </div>
                    </div>
                    <ChartContainer
                        config={chartConfig}
                        className="h-48 w-full"
                    >
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: -20,
                                bottom: 0,
                            }}
                            barGap={2}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "short",
                                            day: "numeric",
                                        },
                                    )
                                }
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                width={28}
                            />
                            <ChartTooltip
                                cursor={{ fill: "var(--muted)" }}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(label) =>
                                            new Date(label).toLocaleDateString(
                                                "en-US",
                                                {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )
                                        }
                                    />
                                }
                            />
                            <Bar
                                dataKey="hits"
                                fill="var(--color-hits)"
                                radius={[3, 3, 0, 0]}
                            />
                            <Bar
                                dataKey="misses"
                                fill="var(--color-misses)"
                                radius={[3, 3, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            )}
        </div>
    )
}
