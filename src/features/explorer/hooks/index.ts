/**
 * Single-responsibility hooks that compose the explorer's behavior.
 * Each hook owns one concern and declares its dependencies explicitly, so
 * behaviors can be recombined (or replaced) without touching the components.
 */

export { useExpansion, type ExpansionApi } from "./use-expansion"
export { useSelection, type SelectionApi } from "./use-selection"
export { useNavigation, type NavigationApi } from "./use-navigation"
export {
    useNodeEditor,
    type NodeEditorApi,
    type CreatingState,
    type NodeEditorDeps,
} from "./use-node-editor"
export { useNodeDeletion, type NodeDeletionApi } from "./use-node-deletion"
export {
    useDataManagement,
    type DataManagementApi,
    type PendingDataAction,
} from "./use-data-management"
export {
    useDragAndDrop,
    type DragAndDropApi,
    type DragRowProps,
    type DropZoneProps,
    type DropMode,
} from "./use-drag-and-drop"
export {
    useContextMenu,
    type ContextMenuApi,
    type MenuItem,
    type MenuItemEntry,
    type MenuState,
    CLOSED_MENU,
} from "./use-context-menu"
