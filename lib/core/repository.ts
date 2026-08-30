import type { TopicNode, PerformanceRecord } from "./types"

export interface TopicRepository {
    getAll(): Promise<TopicNode[]>
    getById(id: string): Promise<TopicNode | undefined>
    create(node: Omit<TopicNode, "id">): Promise<TopicNode>
    update(
        id: string,
        changes: Partial<Pick<TopicNode, "name" | "parentId">>,
    ): Promise<void>
    delete(id: string): Promise<void>
}

export interface PerformanceRepository {
    get(topicId: string, date: string): Promise<PerformanceRecord | undefined>
    recordHit(topicId: string, date: string): Promise<void>
    recordMiss(topicId: string, date: string): Promise<void>
    getHistory(topicId: string): Promise<PerformanceRecord[]>
    exportCSV(): Promise<string>
    importCSV(csv: string): Promise<void>
}
