import { db } from "@/lib/infra/db"
import type { BackupData } from "./types"
import type { BackupRepository } from "./repository"

export class DexieBackupRepository implements BackupRepository {
    async exportAll(): Promise<BackupData> {
        const topics = await db.topics.toArray()
        const performances = await db.performances.toArray()
        const actionHistory = await db.actionHistory.toArray()
        return { version: 2, topics, performances, actionHistory }
    }

    async importAll(data: BackupData): Promise<void> {
        await db.transaction(
            "rw",
            [db.topics, db.performances, db.actionHistory],
            async () => {
                await db.topics.clear()
                await db.performances.clear()
                await db.actionHistory.clear()
                if (data.topics.length > 0) {
                    await db.topics.bulkAdd(data.topics)
                }
                if (data.performances.length > 0) {
                    await db.performances.bulkAdd(data.performances)
                }
                if (data.actionHistory.length > 0) {
                    await db.actionHistory.bulkAdd(data.actionHistory)
                }
            },
        )
    }
}
