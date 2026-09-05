"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { TopicNode, TreeDataMap, TreeNodeData, TreeStatus } from "../features/topics/types"
import { ROOT_ID } from "../features/topics/types"
import { DexieTopicRepository } from "../features/topics/dexie-repository"

export type { TreeStatus }

const repo = new DexieTopicRepository()

function nodesToTreeDataMap(nodes: TopicNode[]): TreeDataMap {
    const map: TreeDataMap = {}

    for (const node of nodes) {
        map[node.id] = {
            id: node.id,
            name: node.name,
            type: node.isFolder ? "folder" : "topic",
            children: node.isFolder
                ? nodes.filter((n) => n.parentId === node.id).map((n) => n.id)
                : undefined,
            createdAt: node.createdAt,
        }
    }

    return map
}

function buildRootNode(childrenIds: string[]): TreeNodeData {
    return {
        id: ROOT_ID,
        name: "Topics",
        type: "folder",
        children: childrenIds,
    }
}

function treeDataMapToNodes(data: TreeDataMap): TopicNode[] {
    const nodes: TopicNode[] = []

    for (const [id, node] of Object.entries(data)) {
        if (id === ROOT_ID) continue

        const parentId =
            Object.values(data).find(
                (n) => n.type === "folder" && n.children?.includes(id),
            )?.id ?? null

        nodes.push({
            id: node.id,
            name: node.name,
            parentId: parentId === ROOT_ID ? null : parentId,
            isFolder: node.type === "folder",
            createdAt: node.createdAt ?? new Date().toISOString(),
        })
    }

    return nodes
}

export function useTreeData() {
    const [data, setData] = useState<TreeDataMap>({})
    const [status, setStatus] = useState<TreeStatus>("loading")
    const mountedRef = useRef(true)

    const loadRef = useRef(0)

    const reload = useCallback(async () => {
        const thisLoad = ++loadRef.current
        if (!mountedRef.current) return
        setStatus("loading")
        const nodes = await repo.getAll()
        if (!mountedRef.current || thisLoad !== loadRef.current) return
        const map = nodesToTreeDataMap(nodes)
        map[ROOT_ID] = buildRootNode(
            nodes.filter((n) => n.parentId === null).map((n) => n.id),
        )
        setData(map)
        setStatus(nodes.length === 0 ? "empty" : "content")
    }, [])

    useEffect(() => {
        mountedRef.current = true
        void reload()
        return () => {
            mountedRef.current = false
        }
    }, [reload])

    const syncQueueRef = useRef<Promise<void>>(Promise.resolve())

    const enqueueSync = useCallback(
        (newData: TreeDataMap) => {
            syncQueueRef.current = syncQueueRef.current.then(async () => {
                try {
                    const nodes = treeDataMapToNodes(newData)
                    const nodeIds = new Set(nodes.map((n) => n.id))
                    const existing = await repo.getAll()

                    const toDelete: string[] = []
                    for (const ex of existing) {
                        if (!nodeIds.has(ex.id)) {
                            toDelete.push(ex.id)
                        }
                    }

                    if (toDelete.length > 0) {
                        await repo.deleteMany(toDelete)
                    }

                    if (nodes.length > 0) {
                        await repo.putAll(nodes)
                    }
                } catch (err) {
                    console.error("[useTreeData] sync failed:", err)
                }
            })
        },
        [],
    )

    const setDataAndSync = useCallback(
        (updater: (prev: TreeDataMap) => TreeDataMap) => {
            setData((prev) => {
                const next = updater(prev)
                enqueueSync(next)
                return next
            })
        },
        [enqueueSync],
    )

    return useMemo(
        () => ({
            data,
            status,
            setData: setDataAndSync,
            reload,
        }),
        [data, status, setDataAndSync, reload],
    )
}
