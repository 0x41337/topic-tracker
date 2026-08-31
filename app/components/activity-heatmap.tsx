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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, parseISO } from "date-fns"

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
        <TooltipProvider delay={0}>
            <CalendarHeatmap
                data={data}
                className="w-full"
                blockMargin={3}
                blockRadius={2}
                colors={{ scale: "var(--primary)", empty: "var(--muted)" }}
            >
                <CalendarHeatmapBody>
                    {({ activity, dayIndex, weekIndex }) => (
                        <Tooltip>
                            <TooltipTrigger>
                                <CalendarHeatmapBlock
                                    activity={activity}
                                    dayIndex={dayIndex}
                                    weekIndex={weekIndex}
                                />
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                sideOffset={6}
                            >
                                <p className="font-medium">
                                    {format(parseISO(activity.date), "PPP")}
                                </p>
                                <p className="text-muted-foreground">
                                    {activity.value} attempt{activity.value !== 1 ? "s" : ""}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </CalendarHeatmapBody>
                <CalendarHeatmapFooter>
                    <CalendarHeatmapStat label="{{value}} total attempts in {{year}}" />
                    <CalendarHeatmapLegend labels={{ less: "Less", more: "More" }} />
                </CalendarHeatmapFooter>
            </CalendarHeatmap>
        </TooltipProvider>
    )
}
