import type { TopicNode } from "../topics/types"
import type { PerformanceRecord, ActionRecord } from "../performance/types"

export type BackupState =
    | { status: "idle" }
    | { status: "working" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }

export interface BackupData {
    version: 2
    topics: TopicNode[]
    performances: PerformanceRecord[]
    actionHistory: ActionRecord[]
}
