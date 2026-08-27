"use client"

import { useEffect, useRef, useState } from "react"
import { FileText, Folder } from "lucide-react"

import { nameIsValid, normalizeName } from "@/core"
import type { TreeNode } from "@/core"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useExplorer } from "../explorer-context"

const inputClass = (invalid: boolean) =>
    cn(
        "h-6 px-1.5 text-sm",
        invalid && "border-destructive ring-1 ring-destructive",
    )

/** Inline rename field. Commits on blur/Enter, cancels on Escape. */
export function RenameInput({ node }: { node: TreeNode }) {
    const { commitRename, cancelRename } = useExplorer()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const cancelledRef = useRef(false)
    const [value, setValue] = useState(node.name)
    const [invalid, setInvalid] = useState(false)

    useEffect(() => {
        const element = inputRef.current
        if (!element) return
        element.focus()
        element.select()
    }, [])

    const commit = () => {
        if (!commitRename(node.id, value)) {
            setInvalid(true)
            inputRef.current?.focus()
        }
    }

    return (
        <Input
            ref={inputRef}
            value={value}
            onChange={(event) => {
                setValue(event.target.value)
                setInvalid(false)
            }}
            onBlur={() => {
                if (cancelledRef.current) return
                commit()
            }}
            onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === "Enter") {
                    event.preventDefault()
                    commit()
                } else if (event.key === "Escape") {
                    event.preventDefault()
                    cancelledRef.current = true
                    cancelRename()
                }
            }}
            title={invalid ? "This name is already in use." : undefined}
            aria-label="Node name"
            className={inputClass(invalid)}
        />
    )
}

/** Inline creation field for a new folder/topic under `creating.parentId`. */
export function CreateInput({
    parentId,
    kind,
    depth,
}: {
    parentId: string | null
    kind: "folder" | "topic"
    depth: number
}) {
    const { commitCreate, cancelCreate, state } = useExplorer()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const cancelledRef = useRef(false)
    const [value, setValue] = useState("")
    const [invalid, setInvalid] = useState(false)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const commit = () => {
        const name = normalizeName(value)
        if (name.length === 0) {
            cancelCreate()
            return
        }
        if (!nameIsValid(state.nodes, parentId, name)) {
            setInvalid(true)
            inputRef.current?.focus()
            return
        }
        commitCreate(name)
    }

    const Icon = kind === "folder" ? Folder : FileText

    return (
        <div
            className="flex h-7 items-center gap-1 pr-2"
            style={{ paddingLeft: depth * 16 + 4 }}
        >
            <span className="grid size-5 shrink-0 place-items-center">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            </span>
            <Input
                ref={inputRef}
                value={value}
                placeholder={kind === "folder" ? "Folder name" : "Topic name"}
                onChange={(event) => {
                    setValue(event.target.value)
                    setInvalid(false)
                }}
                onBlur={() => {
                    if (cancelledRef.current) return
                    commit()
                }}
                onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === "Enter") {
                        event.preventDefault()
                        commit()
                    } else if (event.key === "Escape") {
                        event.preventDefault()
                        cancelledRef.current = true
                        cancelCreate()
                    }
                }}
                title={invalid ? "This name is already in use." : undefined}
                aria-label="New node name"
                className={inputClass(invalid)}
            />
        </div>
    )
}
