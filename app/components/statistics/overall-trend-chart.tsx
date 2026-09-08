"use client"

import { useMemo, useState } from "react"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChevronDownIcon } from "lucide-react"
import type { DailyPoint } from "@/lib/hooks/use-overall-stats"

interface OverallTrendChartProps {
    dailyPoints: DailyPoint[]
}

const PERIOD_OPTIONS = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 30, label: "30 days" },
    { value: 90, label: "90 days" },
] as const

const chartConfig = {
    accuracy: {
        label: "Accuracy",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function OverallTrendChart({ dailyPoints }: OverallTrendChartProps) {
    const [period, setPeriod] = useState(30)

    const data = useMemo(() => {
        const now = new Date()
        const cutoff = new Date(now)
        cutoff.setDate(cutoff.getDate() - period)

        return dailyPoints
            .filter((d) => new Date(d.date) >= cutoff && d.total > 0)
            .map((d) => ({
                date: d.date,
                accuracy: Math.round((d.accuracy ?? 0) * 100),
                attempts: d.total,
            }))
    }, [dailyPoints, period])

    return (
        <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        Accuracy over time
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Combined across all topics
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

            {data.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    No sessions logged in this period yet.
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                        />
                        <ChartTooltip
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
                                    formatter={(value, name) =>
                                        name === "accuracy"
                                            ? [`${value}% `, "Accuracy"]
                                            : [value, name]
                                    }
                                />
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="var(--color-accuracy)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ChartContainer>
            )}
        </div>
    )
}
