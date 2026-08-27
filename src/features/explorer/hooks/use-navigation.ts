"use client"

import { useState } from "react"

import type { TreeNode } from "@/core"

type MobilePane = "tree" | "content"

export interface NavigationDeps {
    expandTo: (id: string) => void
    selectOnly: (id: string) => void
    clearSelection: () => void
}

/**
 * What is currently on screen: the open node (folder/topic), whether the
 * dashboard is active, and the practice overlay. Also owns the responsive
 * pane handoff hints.
 */
export function useNavigation(
    nodes: Record<string, TreeNode>,
    deps: NavigationDeps,
) {
    const { expandTo, selectOnly, clearSelection } = deps
    const [openId, setOpenId] = useState<string | null>(null)
    const [dashboardOpen, setDashboardOpen] = useState(false)
    const [practiceTopicId, setPracticeTopicId] = useState<string | null>(null)
    const [mobilePane, setMobilePane] = useState<MobilePane>("tree")

    const openNode = (id: string) => {
        const node = nodes[id]
        if (!node) return
        expandTo(id)
        setOpenId(id)
        setDashboardOpen(false)
        setPracticeTopicId(null)
        selectOnly(id)
        setMobilePane("content")
    }

    const navigateRoot = () => {
        setOpenId(null)
        setDashboardOpen(false)
        setPracticeTopicId(null)
        clearSelection()
        setMobilePane("content")
    }

    const toggleDashboard = () => {
        setDashboardOpen((prev) => !prev)
        setPracticeTopicId(null)
        setMobilePane("content")
    }

    const startPractice = (id: string) => {
        const node = nodes[id]
        if (!node || node.kind !== "topic") return
        expandTo(id)
        setOpenId(id)
        setDashboardOpen(false)
        setPracticeTopicId(id)
        selectOnly(id)
        setMobilePane("content")
    }

    const stopPractice = () => setPracticeTopicId(null)

    return {
        openId,
        setOpenId,
        dashboardOpen,
        toggleDashboard,
        practiceTopicId,
        startPractice,
        stopPractice,
        openNode,
        navigateRoot,
        mobilePane,
        setMobilePane,
    }
}

export type NavigationApi = ReturnType<typeof useNavigation>
