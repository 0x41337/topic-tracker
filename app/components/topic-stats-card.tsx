"use client"

import { useState, useMemo } from "react"
import type { PerformanceRecord } from "@/lib/core/types"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

        const filtered = history.filter(
            (r) => new Date(r.date) >= cutoff,
        )

        const sorted = [...filtered].sort(
            (a, b) => a.date.localeCompare(b.date),
        )

        return sorted.map((r) => ({
            date: r.date,
            hits: r.hits,
            misses: r.total - r.hits,
        }))
    }, [history, period])

    if (history.length === 0) {
        return null
    }

    return (
        <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Statistics</h3>
                <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="rounded border bg-background px-2 py-1 text-xs"
                >
                    {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
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
                                (r) =>
                                    r.date <
                                    session.date,
                            )
                            const growth = prevSession
                                ? score -
                                  (prevSession.total === 0
                                      ? 0
                                      : prevSession.hits /
                                        prevSession.total)
                                : null

                            return (
                                <div
                                    key={session.date}
                                    className="rounded border p-2 text-center"
                                >
                                    <p className="text-[10px] text-muted-foreground">
                                        {new Date(
                                            session.date,
                                        ).toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                            },
                                        )}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {(score * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {session.hits}/
                                        {session.total}
                                    </p>
                                    {growth !== null && (
                                        <p
                                            className={`text-[10px] ${
                                                growth > 0
                                                    ? "text-green-600"
                                                    : growth < 0
                                                      ? "text-red-600"
                                                      : "text-muted-foreground"
                                            }`}
                                        >
                                            {growth > 0
                                                ? "+"
                                                : ""}
                                            {(
                                                growth * 100
                                            ).toFixed(0)}
                                            %
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
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Performance Over Time
                    </p>
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
                        >
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
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(label) =>
                                            new Date(
                                                label,
                                            ).toLocaleDateString(
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
                                radius={[2, 2, 0, 0]}
                            />
                            <Bar
                                dataKey="misses"
                                fill="var(--color-misses)"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            )}
        </div>
    )
}
