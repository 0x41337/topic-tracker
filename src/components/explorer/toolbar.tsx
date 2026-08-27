"use client"

import { useRef } from "react"
import {
    Check,
    Download,
    ExternalLink,
    ListTree,
    Monitor,
    Moon,
    Settings,
    Sprout,
    Sun,
    SunMoon,
    Trash2,
    UnfoldVertical,
    FoldVertical,
    Upload,
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"

import { store } from "@/lib/tree-store"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useExplorer } from "./context"

function downloadExport(): void {
    const blob = new Blob([store.exportState()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `topic-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Export downloaded")
}

export function Toolbar() {
    const ctx = useExplorer()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { theme, setTheme } = useTheme()

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <span className="text-sm font-medium tracking-tight">
                Topic tracker
            </span>

            {/* Mobile pane switcher */}
            <div className="flex items-center rounded-md border p-0.5 md:hidden">
                <button
                    type="button"
                    onClick={() => ctx.setMobilePane("tree")}
                    className={`rounded-sm px-2 py-1 text-xs font-medium ${
                        ctx.mobilePane === "tree"
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground"
                    }`}
                >
                    Tree
                </button>
                <button
                    type="button"
                    onClick={() => ctx.setMobilePane("content")}
                    className={`rounded-sm px-2 py-1 text-xs font-medium ${
                        ctx.mobilePane === "content"
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground"
                    }`}
                >
                    Content
                </button>
            </div>

            <div className="ml-auto flex items-center gap-1">
                <a
                    href="https://github.com/0x41337/topic-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-muted-foreground"
                    >
                        <ExternalLink className="size-3.5" />
                        Source code
                    </Button>
                </a>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Settings"
                        >
                            <Settings className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <SunMoon className="size-4" /> Theme
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    onSelect={() => setTheme("light")}
                                >
                                    <Sun className="size-4" /> Light
                                    {theme === "light" ? (
                                        <Check className="ml-auto size-4" />
                                    ) : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setTheme("dark")}
                                >
                                    <Moon className="size-4" /> Dark
                                    {theme === "dark" ? (
                                        <Check className="ml-auto size-4" />
                                    ) : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setTheme("system")}
                                >
                                    <Monitor className="size-4" /> System
                                    {theme === "system" ? (
                                        <Check className="ml-auto size-4" />
                                    ) : null}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={ctx.expandAll}>
                            <UnfoldVertical className="size-4" /> Expand all
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={ctx.collapseAll}>
                            <FoldVertical className="size-4" /> Collapse all
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={downloadExport}>
                            <Download className="size-4" /> Export data
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => fileInputRef.current?.click()}
                        >
                            <Upload className="size-4" /> Import data
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={ctx.requestSample}>
                            <Sprout className="size-4" /> Load sample data
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={ctx.requestClear}
                        >
                            <Trash2 className="size-4" /> Clear all data
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={async (event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""
                        if (!file) return
                        const text = await file.text()
                        ctx.requestImport(text)
                    }}
                />
            </div>
        </header>
    )
}
