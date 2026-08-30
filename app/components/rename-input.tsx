"use client"

import { useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

export function RenameInput({
    defaultValue,
    onSave,
    onCancel,
}: {
    defaultValue: string
    onSave: (name: string) => void
    onCancel: () => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [])

    const commit = () => {
        const value = inputRef.current?.value.trim() ?? ""
        if (value) {
            onSave(value)
        } else {
            onCancel()
        }
    }

    return (
        <Input
            ref={inputRef}
            defaultValue={defaultValue}
            className="h-7 w-48 text-sm"
            onKeyDown={(e) => {
                if (e.key === "Enter") commit()
                if (e.key === "Escape") onCancel()
            }}
            onBlur={commit}
        />
    )
}
