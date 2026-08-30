export interface TopicNode {
    id: string
    name: string
    parentId: string | null
    isFolder: boolean
    createdAt: string
}

export interface PerformanceRecord {
    topicId: string
    topic: string
    date: string
    hits: number
    total: number
}

export interface Score {
    hits: number
    total: number
    value: number
}
