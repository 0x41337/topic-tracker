import { db } from "@/lib/infra/db"
import type { PerformanceRepository } from "./repository"
import type { PerformanceRecord, ActionRecord } from "./types"

export class DexiePerformanceRepository implements PerformanceRepository {
    async get(
        topicId: string,
        date: string,
    ): Promise<PerformanceRecord | undefined> {
        return db.performances.get({ topicId, date })
    }

    async recordHit(topicId: string, date: string): Promise<void> {
        const topic = await db.topics.get(topicId)
        const topicName = topic?.name ?? "unknown"
        const existing = await db.performances.get({ topicId, date })
        if (existing) {
            await db.performances.update([topicId, date], {
                hits: existing.hits + 1,
                total: existing.total + 1,
            })
        } else {
            await db.performances.add({
                topicId,
                topic: topicName,
                date,
                hits: 1,
                total: 1,
            })
        }
        await db.actionHistory.add({
            topicId,
            date,
            type: "hit",
            timestamp: Date.now(),
        })
    }

    async recordMiss(topicId: string, date: string): Promise<void> {
        const topic = await db.topics.get(topicId)
        const topicName = topic?.name ?? "unknown"
        const existing = await db.performances.get({ topicId, date })
        if (existing) {
            await db.performances.update([topicId, date], {
                total: existing.total + 1,
            })
        } else {
            await db.performances.add({
                topicId,
                topic: topicName,
                date,
                hits: 0,
                total: 1,
            })
        }
        await db.actionHistory.add({
            topicId,
            date,
            type: "miss",
            timestamp: Date.now(),
        })
    }

    async undoLastAction(topicId: string, date: string): Promise<boolean> {
        const lastAction = await this.getLastAction(topicId, date)
        if (!lastAction) return false

        const existing = await db.performances.get({ topicId, date })
        if (!existing || existing.total === 0) return false

        const wasHit = lastAction.type === "hit"
        await db.performances.update([topicId, date], {
            hits: wasHit ? existing.hits - 1 : existing.hits,
            total: existing.total - 1,
        })
        await db.actionHistory.delete(lastAction.id!)
        return true
    }

    async getHistory(topicId: string): Promise<PerformanceRecord[]> {
        return db.performances.where("topicId").equals(topicId).toArray()
    }

    async getLastAction(
        topicId: string,
        date: string,
    ): Promise<ActionRecord | undefined> {
        return db.actionHistory
            .where("topicId")
            .equals(topicId)
            .and((a) => a.date === date)
            .last()
    }
}
