export interface PerformanceRecord {
    topicId: string
    topic: string
    date: string
    hits: number
    total: number
}

export interface ActionRecord {
    id?: number
    topicId: string
    date: string
    type: "hit" | "miss"
    timestamp: number
}

export interface Score {
    hits: number
    total: number
    value: number
}
