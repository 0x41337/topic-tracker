"use client"

import { useSyncExternalStore } from "react"

import { store } from "./store"
import type { TreeState } from "./types"

/**
 * React bindings for the core store. This is the single seam between the
 * domain layer and React; replace it to drive the store from another layer.
 */

export function useTreeState(): TreeState {
    return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}

/**
 * `true` on the client after hydration, `false` on the server. Implemented
 * with `useSyncExternalStore` so no effect-driven setState is needed.
 */
const noopSubscribe = () => () => {}
export function useStoreReady(): boolean {
    return useSyncExternalStore(
        noopSubscribe,
        () => true,
        () => false,
    )
}
