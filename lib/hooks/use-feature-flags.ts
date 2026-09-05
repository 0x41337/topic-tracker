"use client"

import { useCallback, useState } from "react"
import { getFlags, isEnabled, setFlags } from "../features/flags/flags"
import type { FeatureFlag, FeatureFlags } from "../features/flags/types"

export function useFeatureFlags() {
    const [flags, setLocalFlags] = useState<FeatureFlags>(getFlags)

    const toggle = useCallback((flag: FeatureFlag) => {
        setFlags({ [flag]: !isEnabled(flag) })
        setLocalFlags(getFlags())
    }, [])

    const set = useCallback((next: Partial<FeatureFlags>) => {
        setFlags(next)
        setLocalFlags(getFlags())
    }, [])

    return { flags, isEnabled, toggle, set }
}
