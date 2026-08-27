"use client"

import { cn } from "@/lib/utils"
import { formatShortDate } from "@/lib/tree-utils"

/*
 * Minimal monochrome SVG charts. No chart library: fixed viewBox, scaled to
 * container width, pure black & white strokes/fills.
 */

const BAR_W = 640
const BAR_H = 160
const TREND_W = 640
const TREND_H = 160

/* ---------- Daily activity: stacked hits/misses bars ---------- */

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

/* ---------- Score trend: cumulative score line ---------- */

export interface TrendPoint {
    date: string
    score: number
}

export function TrendChart({
    data,
    className,
}: {
    data: TrendPoint[]
    className?: string
}) {
    const pad = { top: 10, right: 10, bottom: 22, left: 10 }
    const innerW = TREND_W - pad.left - pad.right
    const innerH = TREND_H - pad.top - pad.bottom
    const baseline = TREND_H - pad.bottom

    const x = (index: number): number =>
        pad.left + (innerW * index) / Math.max(data.length - 1, 1)
    const y = (score: number): number => baseline - score * innerH

    const points = data.map(
        (point, index) => [x(index), y(point.score)] as const,
    )
    const line = points.map(([px, py]) => `${px},${py}`).join(" ")
    const area = `M ${pad.left},${baseline} L ${line.replaceAll(" ", " L ")} L ${points[points.length - 1]?.[0] ?? pad.left},${baseline} Z`

    const labelIndices = [
        ...new Set(
            data.length > 1
                ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
                : [0],
        ),
    ]

    return (
        <svg
            viewBox={`0 0 ${TREND_W} ${TREND_H}`}
            className={cn("w-full", className)}
            role="img"
            aria-label="Score over time"
        >
            <line
                x1={pad.left}
                x2={TREND_W - pad.right}
                y1={baseline}
                y2={baseline}
                className="stroke-border"
                strokeWidth={1}
            />
            <line
                x1={pad.left}
                x2={TREND_W - pad.right}
                y1={y(1)}
                y2={y(1)}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray="2 4"
            />
            {points.length > 1 ? (
                <path d={area} className="fill-foreground/5" stroke="none" />
            ) : null}
            {points.length > 1 ? (
                <polyline
                    points={line}
                    fill="none"
                    className="stroke-foreground"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            ) : null}
            {points.map(([px, py], index) => (
                <circle
                    key={data[index].date}
                    cx={px}
                    cy={py}
                    r={2.5}
                    className="fill-foreground"
                >
                    <title>{`${formatShortDate(data[index].date)} \u2014 ${Math.round(data[index].score * 100)}%`}</title>
                </circle>
            ))}
            {labelIndices.map((index) => (
                <text
                    key={`label-${data[index]?.date ?? index}`}
                    x={Math.min(Math.max(x(index), 24), TREND_W - 24)}
                    y={TREND_H - 6}
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

/* ---------- Horizontal score bar (topic ranking) ---------- */

export function ScoreBar({
    score,
    className,
}: {
    score: number | null
    className?: string
}) {
    const pct = Math.round((score ?? 0) * 100)
    return (
        <div
            className={cn(
                "h-1.5 w-20 overflow-hidden rounded-full bg-foreground/10",
                className,
            )}
        >
            <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
        </div>
    )
}
