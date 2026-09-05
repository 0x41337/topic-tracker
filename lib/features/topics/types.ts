export interface TopicNode {
    id: string
    name: string
    parentId: string | null
    isFolder: boolean
    createdAt: string
}

export type TreeItemType = "folder" | "topic"

export interface TreeNodeData {
    id: string
    name: string
    type: TreeItemType
    children?: string[]
    createdAt?: string
}

export type TreeDataMap = Record<string, TreeNodeData>

export const ROOT_ID = "root"

export type TreeStatus = "loading" | "empty" | "content"
