"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { TopicNode } from "../core/types"
import type { TreeDataMap } from "../core/tree-types"
import { ROOT_ID } from "../core/tree-types"
import { DexieTopicRepository } from "../infra/topic-repository"

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
        }
    }

    return map
}

export type TreeStatus = "loading" | "empty" | "content"

export function useTreeData() {
    const [data, setData] = useState<TreeDataMap>({})
    const [status, setStatus] = useState<TreeStatus>("loading")
    const mountedRef = useRef(true)

    const reload = useCallback(async () => {
        if (!mountedRef.current) return
        setStatus("loading")
        const nodes = await repo.getAll()
        if (!mountedRef.current) return
        const map = nodesToTreeDataMap(nodes)
        map[ROOT_ID] = {
            id: ROOT_ID,
            name: "Topics",
            type: "folder",
            children: nodes
                .filter((n) => n.parentId === null)
                .map((n) => n.id),
        }
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

    const syncToDexie = useCallback(
        async (newData: TreeDataMap) => {
            const nodes = Object.values(newData).filter((n) => n.id !== ROOT_ID)
            const existing = await repo.getAll()
            const existingMap = new Map(existing.map((n) => [n.id, n]))

            for (const node of nodes) {
                const ex = existingMap.get(node.id)
                if (!ex) {
                    await repo.create({
                        name: node.name,
                        parentId:
                            Object.values(newData).find(
                                (n) => n.type === "folder" && n.children?.includes(node.id),
                            )?.id ?? null,
                        isFolder: node.type === "folder",
                    })
                } else {
                    const newParentId =
                        Object.values(newData).find(
                            (n) => n.type === "folder" && n.children?.includes(node.id),
                        )?.id ?? null
                    if (ex.name !== node.name || ex.parentId !== newParentId) {
                        await repo.update(node.id, { name: node.name, parentId: newParentId })
                    }
                }
            }

            for (const node of existing) {
                if (!newData[node.id]) {
                    await repo.delete(node.id)
                }
            }
        },
        [],
    )

    const setDataAndSync = useCallback(
        (updater: (prev: TreeDataMap) => TreeDataMap) => {
            setData((prev) => {
                const next = updater(prev)
                void syncToDexie(next)
                return next
            })
        },
        [syncToDexie],
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
