import type { TreeDataMap, TreeItemType } from "./tree-types"

let idCounter = 0

export function createNodeId(type: TreeItemType): string {
    idCounter += 1
    return `${type}-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`
}

export function getUniqueName(base: string, existingNames: string[], ignoreName?: string): string {
    const taken = new Set(existingNames.filter((name) => name !== ignoreName))

    if (!taken.has(base)) {
        return base
    }

    let attempt = 2
    while (taken.has(`${base} (${attempt})`)) {
        attempt += 1
    }
    return `${base} (${attempt})`
}

export function collectDescendantIds(id: string, data: TreeDataMap, acc: Set<string> = new Set()): Set<string> {
    const node = data[id]
    if (node?.type === "folder" && node.children) {
        for (const childId of node.children) {
            acc.add(childId)
            collectDescendantIds(childId, data, acc)
        }
    }
    return acc
}
