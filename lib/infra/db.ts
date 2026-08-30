import Dexie, { type Table } from "dexie"
import type { TopicNode, PerformanceRecord } from "../core/types"

class TopicTrackerDB extends Dexie {
    topics!: Table<TopicNode>
    performances!: Table<PerformanceRecord>

    constructor() {
        super("topic-tracker")
        this.version(1).stores({
            topics: "id, parentId",
            performances: "[topicId+date], topicId, date",
        })
        this.version(2).stores({
            topics: "id, parentId, createdAt",
        }).upgrade((tx) =>
            tx.table("topics").toCollection().modify((topic) => {
                if (!topic.createdAt) {
                    topic.createdAt = new Date().toISOString()
                }
            })
        )
    }
}

export const db = new TopicTrackerDB()
