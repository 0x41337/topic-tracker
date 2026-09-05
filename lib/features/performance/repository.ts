import type { PerformanceRecord, ActionRecord } from "./types"

export interface PerformanceRepository {
    get(
        topicId: string,
        date: string,
    ): Promise<PerformanceRecord | undefined>
    recordHit(topicId: string, date: string): Promise<void>
    recordMiss(topicId: string, date: string): Promise<void>
    undoLastAction(topicId: string, date: string): Promise<boolean>
    getHistory(topicId: string): Promise<PerformanceRecord[]>
    getLastAction(
        topicId: string,
        date: string,
    ): Promise<ActionRecord | undefined>
}
