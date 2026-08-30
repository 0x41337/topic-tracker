"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Score } from "../core/types"
import { calculateScore, getToday } from "../core/score"
import { DexiePerformanceRepository } from "../infra/performance-repository"

const repo = new DexiePerformanceRepository()

export function usePerformance(topicId: string | null) {
    const [score, setScore] = useState<Score>({
        hits: 0,
        total: 0,
        value: NaN,
    })
    const today = useMemo(() => getToday(), [])

    const load = useCallback(async () => {
        if (!topicId) {
            setScore({ hits: 0, total: 0, value: NaN })
            return
        }
        const record = await repo.get(topicId, today)
        setScore(
            calculateScore(record?.hits ?? 0, record?.total ?? 0),
        )
    }, [topicId, today])

    useEffect(() => {
        load()
    }, [load])

    const recordHit = useCallback(async () => {
        if (!topicId) return
        await repo.recordHit(topicId, today)
        await load()
    }, [topicId, today, load])

    const recordMiss = useCallback(async () => {
        if (!topicId) return
        await repo.recordMiss(topicId, today)
        await load()
    }, [topicId, today, load])

    const undoLastAction = useCallback(async () => {
        if (!topicId) return
        const undone = await repo.undoLastAction(topicId, today)
        if (undone) await load()
    }, [topicId, today, load])

    return { score, recordHit, recordMiss, undoLastAction }
}
