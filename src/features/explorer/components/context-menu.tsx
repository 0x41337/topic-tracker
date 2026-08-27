"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import {
    useExplorer,
    type MenuItem,
    type MenuItemEntry,
} from "./explorer-context"

function isEntry(item: MenuItem): item is MenuItemEntry {
    return item !== "separator"
}

/**
 * Lightweight fixed-position context menu (portal) driven by the explorer
 * context. Supports row menus and background menus with the same surface.
 */
export function ContextMenuSurface() {
    const { menu, closeMenu } = useExplorer()
    const ref = useRef<HTMLDivElement | null>(null)

    // Measure and clamp synchronously before the browser paints: the menu is
    // mounted hidden at the raw point, then placed at its final spot in the
    // same frame. No stale-position flash, no re-render.
    useLayoutEffect(() => {
        if (!menu.open) return
        const element = ref.current
        if (!element) return
        const rect = element.getBoundingClientRect()
        const x = Math.max(
            8,
            Math.min(menu.x, window.innerWidth - rect.width - 8),
        )
        const y = Math.max(
            8,
            Math.min(menu.y, window.innerHeight - rect.height - 8),
        )
        element.style.left = `${x}px`
        element.style.top = `${y}px`
        element.style.visibility = "visible"
    }, [menu.open, menu.x, menu.y])

    useEffect(() => {
        if (!menu.open) return
        const onPointerDown = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) closeMenu()
        }
        window.addEventListener("mousedown", onPointerDown)
        return () => {
            window.removeEventListener("mousedown", onPointerDown)
        }
    }, [menu.open, closeMenu])

    if (!menu.open) return null

    return createPortal(
        <div
            ref={ref}
            role="menu"
            className={cn(
                "fixed z-50 min-w-44 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                "animate-in fade-in duration-75",
            )}
            style={{ left: menu.x, top: menu.y, visibility: "hidden" }}
        >
            {menu.items.map((item, index) => {
                if (!isEntry(item)) {
                    return (
                        <div
                            key={`sep-${index}`}
                            role="separator"
                            className="-mx-1 my-1 h-px bg-border"
                        />
                    )
                }
                const Icon = item.icon
                return (
                    <button
                        key={`${item.label}-${index}`}
                        type="button"
                        role="menuitem"
                        className={cn(
                            "flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors",
                            item.danger
                                ? "text-destructive hover:bg-destructive/10"
                                : "hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={() => {
                            closeMenu()
                            item.onSelect()
                        }}
                    >
                        {Icon ? (
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                        ) : null}
                        <span className="truncate">{item.label}</span>
                    </button>
                )
            })}
        </div>,
        document.body,
    )
}
