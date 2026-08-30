"use client"

import { SearchIcon, XIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

type SearchBarProps = {
    value: string
    onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative w-full">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search topics and folders..."
                className="h-9 w-full pl-9 pr-9"
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                >
                    <XIcon className="size-4" />
                </button>
            )}
        </div>
    )
}
