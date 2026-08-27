"use client"

import { cn } from "@/lib/utils"
import { formatShortDate } from "@/core"

const BAR_W = 640
const BAR_H = 160

export interface DailyBarDatum {
    date: string
    hits: number
    total: number
}

export function DailyBarChart({
    data,
    className,
    slim = false,
}: {
    data: DailyBarDatum[]
    className?: string
    /** Compact strip for inline overviews. */
    slim?: boolean
}) {
    const H = slim ? 104 : BAR_H
    const pad = { top: 10, right: 8, bottom: 22, left: 8 }
    const innerW = BAR_W - pad.left - pad.right
    const innerH = H - pad.top - pad.bottom
    const maxTotal = Math.max(...data.map((point) => point.total), 1)
    const slot = innerW / Math.max(data.length, 1)
    const barWidth = Math.min(28, Math.max(4, slot * 0.6))
    const baseline = H - pad.bottom

    const labelIndices = [
        ...new Set(
            data.length > 1
                ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
                : [0],
        ),
    ]

    return (
        <svg
            viewBox={`0 0 ${BAR_W} ${H}`}
            className={cn("w-full", className)}
            role="img"
            aria-label="Daily activity"
        >
            <line
                x1={pad.left}
                x2={BAR_W - pad.right}
                y1={baseline}
                y2={baseline}
                className="stroke-border"
                strokeWidth={1}
            />
            {data.map((point, index) => {
                const x = pad.left + slot * index + (slot - barWidth) / 2
                const hTotal = (point.total / maxTotal) * innerH
                const hHits =
                    point.total > 0 ? (point.hits / maxTotal) * innerH : 0
                const misses = point.total - point.hits
                return (
                    <g key={point.date}>
                        {misses > 0 ? (
                            <rect
                                x={x}
                                y={baseline - hTotal}
                                width={barWidth}
                                height={hTotal - hHits}
                                rx={1}
                                className="fill-background stroke-muted-foreground/60"
                                strokeWidth={1}
                            />
                        ) : null}
                        {point.hits > 0 ? (
                            <rect
                                x={x}
                                y={baseline - hHits}
                                width={barWidth}
                                height={hHits}
                                rx={1}
                                className="fill-foreground"
                            />
                        ) : null}
                        <title>{`${formatShortDate(point.date)} \u2014 ${point.hits}/${point.total}`}</title>
                    </g>
                )
            })}
            {labelIndices.map((index) => (
                <text
                    key={`label-${data[index]?.date ?? index}`}
                    x={Math.min(
                        Math.max(pad.left + slot * index + slot / 2, 24),
                        BAR_W - 24,
                    )}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-muted-foreground"
                >
                    {data[index] ? formatShortDate(data[index].date) : ""}
                </text>
            ))}
        </svg>
    )
}
