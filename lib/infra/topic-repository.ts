import { db } from "./db"
import type { TopicRepository } from "../core/repository"
import type { TopicNode } from "../core/types"

export class DexieTopicRepository implements TopicRepository {
    async getAll(): Promise<TopicNode[]> {
        return db.topics.toArray()
    }

    async getById(id: string): Promise<TopicNode | undefined> {
        return db.topics.get(id)
    }

    async create(node: Omit<TopicNode, "id">): Promise<TopicNode> {
        const id = crypto.randomUUID()
        const topic: TopicNode = { ...node, id }
        await db.topics.add(topic)
        return topic
    }

    async update(
        id: string,
        changes: Partial<Pick<TopicNode, "name" | "parentId">>,
    ): Promise<void> {
        await db.topics.update(id, changes)
    }

    async delete(id: string): Promise<void> {
        const children = await db.topics.where("parentId").equals(id).toArray()
        for (const child of children) {
            await this.delete(child.id)
        }
        await db.topics.delete(id)
    }
}
