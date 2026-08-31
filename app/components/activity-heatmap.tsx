"use client"

import { useMemo } from "react"
import type { DailyPoint } from "@/lib/hooks/use-overall-stats"
import {
    CalendarHeatmap,
    CalendarHeatmapBlock,
    CalendarHeatmapBody,
    CalendarHeatmapFooter,
    CalendarHeatmapLegend,
    CalendarHeatmapStat,
} from "@/components/heatmap/calendar-heatmap"

interface ActivityHeatmapProps {
    dailyPoints: DailyPoint[]
}

export function ActivityHeatmap({ dailyPoints }: ActivityHeatmapProps) {
    const data = useMemo(
        () =>
            dailyPoints.map((d) => ({
                date: d.date,
                value: d.total,
            })),
        [dailyPoints],
    )

    if (data.length === 0) {
        return null
    }

    return (
        <CalendarHeatmap
            data={data}
            className="w-full"
            blockMargin={3}
            blockRadius={2}
            colors={{ scale: "var(--primary)", empty: "var(--muted)" }}
        >
            <CalendarHeatmapBody>
                {({ activity, dayIndex, weekIndex }) => (
                    <CalendarHeatmapBlock
                        activity={activity}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                    />
                )}
            </CalendarHeatmapBody>
            <CalendarHeatmapFooter>
                <CalendarHeatmapStat label="{{value}} total attempts in {{year}}" />
                <CalendarHeatmapLegend labels={{ less: "Less", more: "More" }} />
            </CalendarHeatmapFooter>
        </CalendarHeatmap>
    )
}
