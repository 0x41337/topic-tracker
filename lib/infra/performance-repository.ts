import { db } from "./db"
import type { PerformanceRepository } from "../core/repository"
import type { PerformanceRecord } from "../core/types"
import { formatCSV, parseCSV } from "../core/score"

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
    }

    async undoLastAction(topicId: string, date: string): Promise<boolean> {
        const existing = await db.performances.get({ topicId, date })
        if (!existing || existing.total === 0) return false

        const wasHit = existing.hits === existing.total
        await db.performances.update([topicId, date], {
            hits: wasHit ? existing.hits - 1 : existing.hits,
            total: existing.total - 1,
        })
        return true
    }

    async getHistory(topicId: string): Promise<PerformanceRecord[]> {
        return db.performances.where("topicId").equals(topicId).toArray()
    }

    async exportCSV(): Promise<string> {
        const records = await db.performances.toArray()
        return formatCSV(records)
    }

    async importCSV(csv: string): Promise<void> {
        const records = parseCSV(csv)
        const existingTopics = await db.topics.toArray()
        const nameToId = new Map(existingTopics.map((t) => [t.name, t.id]))

        const topicNames = new Set(records.map((r) => r.topic))
        for (const name of topicNames) {
            if (nameToId.has(name)) continue
            const id = crypto.randomUUID()
            await db.topics.add({
                id,
                name,
                parentId: null,
                isFolder: false,
                createdAt: new Date().toISOString(),
            })
            nameToId.set(name, id)
        }

        await db.performances.bulkPut(
            records.map((r) => ({
                ...r,
                topicId: nameToId.get(r.topic) ?? r.topicId,
            })),
        )
    }
}
