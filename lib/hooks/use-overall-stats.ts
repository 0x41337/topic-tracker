"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TopicNode } from "../features/topics/types"
import type { PerformanceRecord } from "../features/performance/types"
import type { TopicSummary, DailyPoint, OverallSummary, OverallStatus } from "../features/statistics/types"
import { DexieTopicRepository } from "../features/topics/dexie-repository"
import { DexiePerformanceRepository } from "../features/performance/dexie-repository"

export type { OverallStatus, DailyPoint, TopicSummary, OverallSummary }

const topicRepo = new DexieTopicRepository()
const performanceRepo = new DexiePerformanceRepository()

export function useOverallStats() {
    const [status, setStatus] = useState<OverallStatus>("loading")
    const [topics, setTopics] = useState<TopicNode[]>([])
    const [records, setRecords] = useState<PerformanceRecord[]>([])
    const mountedRef = useRef(true)
    const loadRef = useRef(0)

    const reload = useCallback(async () => {
        const thisLoad = ++loadRef.current
        if (!mountedRef.current) return
        setStatus("loading")

        const allNodes = await topicRepo.getAll()
        const topicNodes = allNodes.filter((n) => !n.isFolder)
        if (!mountedRef.current || thisLoad !== loadRef.current) return

        // One history read per topic, in parallel. Works well up to
        // a few hundred topics; if the list grows much larger,
        // consider exposing a getAllHistory() in PerformanceRepository
        // for a single query.
        const histories = await Promise.all(
            topicNodes.map((t) => performanceRepo.getHistory(t.id)),
        )
        if (!mountedRef.current || thisLoad !== loadRef.current) return

        setTopics(topicNodes)
        setRecords(histories.flat())
        setStatus(topicNodes.length === 0 ? "empty" : "content")
    }, [])

    useEffect(() => {
        mountedRef.current = true
        void reload()
        return () => {
            mountedRef.current = false
        }
    }, [reload])

    const topicSummaries = useMemo<TopicSummary[]>(() => {
        const byTopic = new Map<string, PerformanceRecord[]>()
        for (const r of records) {
            const list = byTopic.get(r.topicId)
            if (list) {
                list.push(r)
            } else {
                byTopic.set(r.topicId, [r])
            }
        }

        return topics.map((t) => {
            const list = byTopic.get(t.id) ?? []
            const hits = list.reduce((sum, r) => sum + r.hits, 0)
            const total = list.reduce((sum, r) => sum + r.total, 0)
            const lastActive = list.reduce<string | null>(
                (latest, r) => (!latest || r.date > latest ? r.date : latest),
                null,
            )
            return {
                topicId: t.id,
                name: t.name,
                hits,
                total,
                accuracy: total === 0 ? null : hits / total,
                lastActive,
            }
        })
    }, [topics, records])

    const dailyPoints = useMemo<DailyPoint[]>(() => {
        const byDate = new Map<string, { hits: number; total: number }>()
        for (const r of records) {
            const entry = byDate.get(r.date)
            if (entry) {
                entry.hits += r.hits
                entry.total += r.total
            } else {
                byDate.set(r.date, { hits: r.hits, total: r.total })
            }
        }
        return [...byDate.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, { hits, total }]) => ({
                date,
                hits,
                total,
                accuracy: total === 0 ? null : hits / total,
            }))
    }, [records])

    const overall = useMemo<OverallSummary>(() => {
        const hits = records.reduce((sum, r) => sum + r.hits, 0)
        const total = records.reduce((sum, r) => sum + r.total, 0)
        return {
            hits,
            total,
            accuracy: total === 0 ? null : hits / total,
            topicsTracked: topics.length,
            topicsWithActivity: topicSummaries.filter((t) => t.total > 0)
                .length,
        }
    }, [records, topics, topicSummaries])

    const streak = useMemo(() => {
        const activeDates = new Set(
            dailyPoints.filter((d) => d.total > 0).map((d) => d.date),
        )
        if (activeDates.size === 0) return 0

        const today = new Date().toISOString().slice(0, 10)
        let cursor = today
        if (!activeDates.has(cursor)) {
            // Today without a session should not, by itself, break a streak
            // that was built up until yesterday.
            const d = new Date(`${cursor}T00:00:00.000Z`)
            d.setUTCDate(d.getUTCDate() - 1)
            cursor = d.toISOString().slice(0, 10)
        }

        let count = 0
        while (activeDates.has(cursor)) {
            count += 1
            const d = new Date(`${cursor}T00:00:00.000Z`)
            d.setUTCDate(d.getUTCDate() - 1)
            cursor = d.toISOString().slice(0, 10)
        }
        return count
    }, [dailyPoints])

    return {
        status,
        overall,
        streak,
        dailyPoints,
        topicSummaries,
        reload,
    }
}
