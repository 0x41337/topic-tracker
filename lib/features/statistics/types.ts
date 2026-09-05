export type OverallStatus = "loading" | "empty" | "content"

export interface DailyPoint {
    date: string
    hits: number
    total: number
    accuracy: number | null
}

export interface TopicSummary {
    topicId: string
    name: string
    hits: number
    total: number
    accuracy: number | null
    lastActive: string | null
}

export interface OverallSummary {
    hits: number
    total: number
    accuracy: number | null
    topicsTracked: number
    topicsWithActivity: number
}
