"use client"

import { useState } from "react"

export interface MenuItemEntry {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onSelect: () => void
    danger?: boolean
}

export type MenuItem = MenuItemEntry | "separator"

export interface MenuState {
    open: boolean
    x: number
    y: number
    items: MenuItem[]
}

export const CLOSED_MENU: MenuState = { open: false, x: 0, y: 0, items: [] }

/** Right-click menu state (position + items), shared by all surfaces. */
export function useContextMenu() {
    const [menu, setMenu] = useState<MenuState>(CLOSED_MENU)

    const openMenu = (event: React.MouseEvent, items: MenuItem[]) => {
        event.preventDefault()
        setMenu({ open: true, x: event.clientX, y: event.clientY, items })
    }

    const closeMenu = () => setMenu(CLOSED_MENU)

    return { menu, openMenu, closeMenu }
}

export type ContextMenuApi = ReturnType<typeof useContextMenu>
