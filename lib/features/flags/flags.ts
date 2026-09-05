import { defaultFlags } from "./config"
import type { FeatureFlags, FeatureFlag } from "./types"

const STORAGE_KEY = "topic-tracker-flags"

function loadFlags(): FeatureFlags {
    if (typeof window === "undefined") return { ...defaultFlags }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return { ...defaultFlags }
        const parsed = JSON.parse(stored) as Partial<FeatureFlags>
        return { ...defaultFlags, ...parsed }
    } catch {
        return { ...defaultFlags }
    }
}

function persistFlags(flags: FeatureFlags): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    } catch {
        // localStorage unavailable — silently ignore
    }
}

let flags: FeatureFlags = loadFlags()

export function getFlags(): Readonly<FeatureFlags> {
    return flags
}

export function isEnabled(flag: FeatureFlag): boolean {
    return flags[flag]
}

export function setFlags(next: Partial<FeatureFlags>): void {
    flags = { ...flags, ...next }
    persistFlags(flags)
}

export function resetFlags(): void {
    flags = { ...defaultFlags }
    persistFlags(flags)
}
