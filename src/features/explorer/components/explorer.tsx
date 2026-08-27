"use client"

import { useMemo, useState } from "react"
import { ListTree } from "lucide-react"

import { useStoreReady, useTreeState } from "@/core"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

import {
    useContextMenu,
    useDataManagement,
    useDragAndDrop,
    useExpansion,
    useNavigation,
    useNodeDeletion,
    useNodeEditor,
    useSelection,
} from "../hooks"
import { ExplorerContext } from "./explorer-context"
import { ContextMenuSurface } from "./context-menu"
import { DataDialog, DeleteDialog } from "./dialogs"
import {
    buildBackgroundMenuItems,
    buildRowMenuItems,
    type MenuActions,
} from "./menu-builders"
import { ContentPane } from "./content/content-pane"
import { TreePane } from "./tree/tree-pane"
import { Toolbar } from "./toolbar"

/**
 * Workspace composer: wires the single-responsibility hooks together, exposes
 * them through the explorer context, and lays out the shell (toolbar + tree +
 * content + overlays). Little logic lives here by design — see ./hooks.
 */
export function Explorer() {
    const ready = useStoreReady()
    const state = useTreeState()

    const queryState = useState("")
    const query = queryState[0]
    const setQuery = queryState[1]

    const expansion = useExpansion(ready, state.nodes)
    const selection = useSelection()
    const navigation = useNavigation(state.nodes, {
        expandTo: expansion.expandTo,
        selectOnly: selection.selectOnly,
        clearSelection: selection.clearSelection,
    })
    const editor = useNodeEditor(state.nodes, navigation.openId, {
        expandTo: expansion.expandTo,
        toggleExpand: expansion.toggleExpand,
        clearSelection: selection.clearSelection,
        selectOnly: selection.selectOnly,
        setQuery,
        setMobilePane: navigation.setMobilePane,
    })
    const deletion = useNodeDeletion(state.nodes, {
        selectOnly: selection.selectOnly,
        clearSelection: selection.clearSelection,
        stopEditing: editor.stopEditing,
        openId: navigation.openId,
        setOpenId: navigation.setOpenId,
    })
    const dataManagement = useDataManagement(() => {
        navigation.navigateRoot()
        editor.stopEditing()
        setQuery("")
        expansion.resetExpansion()
    })
    const dragAndDrop = useDragAndDrop(state.nodes, selection.selection, {
        selectOnly: selection.selectOnly,
        toggleExpand: expansion.toggleExpand,
        replaceSelection: selection.replaceSelection,
    })
    const contextMenu = useContextMenu()

    const handleRowClick = (
        event: React.MouseEvent<HTMLElement>,
        node: (typeof state.nodes)[string],
        rows: Parameters<typeof selection.selectRange>[1],
    ) => {
        if (event.shiftKey) {
            selection.selectRange(node.id, rows)
        } else if (event.ctrlKey || event.metaKey) {
            selection.selectToggle(node.id)
        } else {
            selection.selectOnly(node.id)
            navigation.openNode(node.id)
        }
    }

    const menuActions: MenuActions = useMemo(
        () => ({
            openNode: navigation.openNode,
            beginCreate: editor.beginCreate,
            beginRename: editor.beginRename,
            requestDelete: deletion.requestDelete,
            selectAllVisible: selection.selectAllVisible,
            expandAll: expansion.expandAll,
            collapseAll: expansion.collapseAll,
        }),
        [
            navigation.openNode,
            editor.beginCreate,
            editor.beginRename,
            deletion.requestDelete,
            selection.selectAllVisible,
            expansion.expandAll,
            expansion.collapseAll,
        ],
    )

    const value = useMemo(
        () => ({
            state,
            query,
            setQuery,
            expanded: expansion.expanded,
            toggleExpand: expansion.toggleExpand,
            expandAll: expansion.expandAll,
            collapseAll: expansion.collapseAll,
            selection: selection.selection,
            focusId: selection.focusId,
            selectOnly: selection.selectOnly,
            selectAllVisible: selection.selectAllVisible,
            clearSelection: selection.clearSelection,
            openId: navigation.openId,
            dashboardOpen: navigation.dashboardOpen,
            toggleDashboard: navigation.toggleDashboard,
            openNode: navigation.openNode,
            navigateRoot: navigation.navigateRoot,
            practiceTopicId: navigation.practiceTopicId,
            startPractice: navigation.startPractice,
            stopPractice: navigation.stopPractice,
            renamingId: editor.renamingId,
            renamingSurface: editor.renamingSurface,
            beginRename: editor.beginRename,
            commitRename: editor.commitRename,
            cancelRename: editor.cancelRename,
            creating: editor.creating,
            beginCreate: editor.beginCreate,
            commitCreate: editor.commitCreate,
            cancelCreate: editor.cancelCreate,
            pendingDelete: deletion.pendingDelete,
            requestDelete: deletion.requestDelete,
            confirmDelete: deletion.confirmDelete,
            cancelDelete: deletion.cancelDelete,
            pendingData: dataManagement.pendingData,
            requestImport: dataManagement.requestImport,
            requestSample: dataManagement.requestSample,
            requestClear: dataManagement.requestClear,
            confirmDataAction: dataManagement.confirmDataAction,
            cancelDataAction: dataManagement.cancelDataAction,
            drag: dragAndDrop.drag,
            dragProps: dragAndDrop.dragProps,
            dropProps: dragAndDrop.dropProps,
            handleRowClick,
            menu: contextMenu.menu,
            openMenu: contextMenu.openMenu,
            closeMenu: contextMenu.closeMenu,
            rowMenuItems: (
                node: (typeof state.nodes)[string],
                surface: "tree" | "list",
            ) =>
                buildRowMenuItems({
                    node,
                    surface,
                    deleteIds: selection.selection.has(node.id)
                        ? [...selection.selection]
                        : [node.id],
                    actions: menuActions,
                }),
            backgroundMenuItems: (
                rows: Parameters<typeof selection.selectAllVisible>[0],
            ) => buildBackgroundMenuItems({ rows, actions: menuActions }),
            mobilePane: navigation.mobilePane,
            setMobilePane: navigation.setMobilePane,
        }),
        // The context value is intentionally rebuilt on every render so closures
        // always see fresh state. Re-render cost is negligible at this scale.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            state,
            query,
            expansion.expanded,
            selection.selection,
            selection.focusId,
            navigation.openId,
            navigation.dashboardOpen,
            navigation.practiceTopicId,
            editor.renamingId,
            editor.renamingSurface,
            editor.creating,
            deletion.pendingDelete,
            dataManagement.pendingData,
            navigation.mobilePane,
            dragAndDrop.drag,
            contextMenu.menu,
        ],
    )

    if (!ready) {
        return (
            <div className="grid h-dvh place-items-center bg-background text-foreground">
                <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
                    <ListTree className="size-4" />
                    <span className="text-sm">{"Loading\u2026"}</span>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider delayDuration={300}>
            <ExplorerContext.Provider value={value}>
                <div className="flex h-dvh flex-col bg-background text-foreground">
                    <Toolbar />
                    <div className="flex min-h-0 flex-1">
                        <aside
                            className={cn(
                                "w-full shrink-0 flex-col border-r md:flex md:w-80 md:min-w-72",
                                navigation.mobilePane === "tree"
                                    ? "flex"
                                    : "hidden",
                            )}
                        >
                            <TreePane />
                        </aside>
                        <main
                            className={cn(
                                "min-w-0 flex-1 flex-col md:flex",
                                navigation.mobilePane === "content"
                                    ? "flex"
                                    : "hidden",
                            )}
                        >
                            <ContentPane />
                        </main>
                    </div>
                </div>
                <ContextMenuSurface />
                <DeleteDialog />
                <DataDialog />
            </ExplorerContext.Provider>
        </TooltipProvider>
    )
}
