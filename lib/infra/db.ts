import Dexie, { type Table } from "dexie"
import type { TopicNode, PerformanceRecord, ActionRecord } from "../core/types"

class TopicTrackerDB extends Dexie {
    topics!: Table<TopicNode>
    performances!: Table<PerformanceRecord>
    actionHistory!: Table<ActionRecord>

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
        this.version(3).stores({
            actionHistory: "++id, topicId, date, type, timestamp",
        })
    }
}

export const db = new TopicTrackerDB()
