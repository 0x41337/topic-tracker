"use client"

import { cn } from "@/lib/utils"
import { formatShortDate } from "@/core"

const TREND_W = 640
const TREND_H = 160

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
