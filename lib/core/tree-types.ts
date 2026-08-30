export type TreeItemType = "folder" | "topic"

export interface TreeNodeData {
    id: string
    name: string
    type: TreeItemType
    children?: string[]
}

export type TreeDataMap = Record<string, TreeNodeData>

export const ROOT_ID = "root"
