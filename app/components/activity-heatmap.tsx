"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DailyPoint } from "@/lib/hooks/use-overall-stats"

interface ActivityHeatmapProps {
    dailyPoints: DailyPoint[]
}

const CELL_SIZE = 12 // px, matches Tailwind's size-3
const CELL_GAP = 4 // px, matches Tailwind's gap-1
const MIN_WEEKS = 8
const MAX_WEEKS = 53 // roughly a year

function addDaysISO(iso: string, delta: number): string {
    const d = new Date(`${iso}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + delta)
    return d.toISOString().slice(0, 10)
}

function weekdayOfISO(iso: string): number {
    return new Date(`${iso}T00:00:00.000Z`).getUTCDay()
}

export function ActivityHeatmap({ dailyPoints }: ActivityHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    // Sensible default for first paint; the ResizeObserver below corrects
    // this to whatever actually fits the card right after mount.
    const [weeks, setWeeks] = useState(MIN_WEEKS)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const columnWidth = CELL_SIZE + CELL_GAP

        const measure = () => {
            const fit = Math.floor((el.clientWidth + CELL_GAP) / columnWidth)
            setWeeks(Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, fit)))
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const byDate = useMemo(
        () => new Map(dailyPoints.map((d) => [d.date, d])),
        [dailyPoints],
    )

    const { cells, monthLabels, totalWeeks } = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10)
        const rangeDays = weeks * 7
        const rangeStart = addDaysISO(today, -(rangeDays - 1))
        const gridStart = addDaysISO(rangeStart, -weekdayOfISO(rangeStart))

        const days: string[] = []
        let cursor = gridStart
        while (cursor <= today) {
            days.push(cursor)
            cursor = addDaysISO(cursor, 1)
        }
        while (days.length % 7 !== 0) {
            days.push(cursor)
            cursor = addDaysISO(cursor, 1)
        }

        const cells = days.map((date) => {
            const point = byDate.get(date)
            const inRange = date >= rangeStart && date <= today
            return {
                date,
                total: point?.total ?? 0,
                hits: point?.hits ?? 0,
                accuracy:
                    point && point.total > 0 ? point.hits / point.total : null,
                inRange,
            }
        })

        const totalWeeks = cells.length / 7
        const monthLabels: { week: number; label: string }[] = []
        let lastMonth = ""
        for (let w = 0; w < totalWeeks; w++) {
            const firstDayOfWeek = cells[w * 7].date
            const month = new Date(
                `${firstDayOfWeek}T00:00:00.000Z`,
            ).toLocaleDateString("en-US", { month: "short" })
            if (month !== lastMonth) {
                monthLabels.push({ week: w, label: month })
                lastMonth = month
            }
        }

        return { cells, monthLabels, totalWeeks }
    }, [byDate, weeks])

    return (
        <div ref={containerRef} className="w-full">
            <div
                className="grid gap-1"
                style={{
                    gridTemplateColumns: `repeat(${totalWeeks}, ${CELL_SIZE}px)`,
                    gridTemplateRows: "14px repeat(7, 1fr)",
                    gridAutoFlow: "column",
                }}
            >
                {monthLabels.map(({ week, label }) => (
                    <span
                        key={`${week}-${label}`}
                        className="text-[10px] text-muted-foreground"
                        style={{ gridColumn: week + 1, gridRow: 1 }}
                    >
                        {label}
                    </span>
                ))}
                {cells.map((cell, i) => {
                    const week = Math.floor(i / 7)
                    const weekday = i % 7
                    return (
                        <div
                            key={cell.date}
                            title={
                                cell.total === 0
                                    ? `${cell.date} — no sessions`
                                    : `${cell.date} — ${cell.hits}/${cell.total} (${Math.round(
                                          (cell.accuracy ?? 0) * 100,
                                      )}%)`
                            }
                            className="size-3 rounded-sm bg-muted"
                            style={{
                                gridColumn: week + 1,
                                gridRow: weekday + 2,
                                visibility: cell.inRange ? "visible" : "hidden",
                                backgroundColor:
                                    cell.accuracy === null
                                        ? undefined
                                        : "var(--primary)",
                                opacity:
                                    cell.accuracy === null
                                        ? undefined
                                        : 0.25 + cell.accuracy * 0.75,
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}
