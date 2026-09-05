import { db } from "@/lib/infra/db"
import type { TopicRepository } from "./repository"
import type { TopicNode } from "./types"

export class DexieTopicRepository implements TopicRepository {
    async getAll(): Promise<TopicNode[]> {
        return db.topics.toArray()
    }

    async getById(id: string): Promise<TopicNode | undefined> {
        return db.topics.get(id)
    }

    async create(node: TopicNode): Promise<void> {
        await db.topics.add(node)
    }

    async update(
        id: string,
        changes: Partial<Pick<TopicNode, "name" | "parentId">>,
    ): Promise<void> {
        await db.topics.update(id, changes)
    }

    async delete(id: string): Promise<void> {
        await db.topics.delete(id)
    }

    async deleteMany(ids: string[]): Promise<void> {
        await db.topics.bulkDelete(ids)
    }

    async putAll(nodes: TopicNode[]): Promise<void> {
        await db.topics.bulkPut(nodes)
    }

    async clear(): Promise<void> {
        await db.topics.clear()
    }
}
