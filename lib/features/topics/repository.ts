import type { TopicNode } from "./types"

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
