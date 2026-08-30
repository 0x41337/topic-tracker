import type { TopicNode, PerformanceRecord } from "./types"

export interface TopicRepository {
    getAll(): Promise<TopicNode[]>
    getById(id: string): Promise<TopicNode | undefined>
    create(node: TopicNode): Promise<void>
    update(
        id: string,
        changes: Partial<Pick<TopicNode, "name" | "parentId">>,
    ): Promise<void>
    delete(id: string): Promise<void>
    deleteMany(ids: string[]): Promise<void>
    putAll(nodes: TopicNode[]): Promise<void>
    clear(): Promise<void>
}

export interface PerformanceRepository {
    get(topicId: string, date: string): Promise<PerformanceRecord | undefined>
    recordHit(topicId: string, date: string): Promise<void>
    recordMiss(topicId: string, date: string): Promise<void>
    undoLastAction(topicId: string, date: string): Promise<boolean>
    getHistory(topicId: string): Promise<PerformanceRecord[]>
    exportCSV(): Promise<string>
    importCSV(csv: string): Promise<void>
}
