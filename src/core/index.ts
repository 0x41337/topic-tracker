/**
 * Barrel for the core (domain) layer.
 *
 * This layer holds all product logic with zero UI dependencies:
 * - types: data model
 * - tree: tree structure helpers (validation, flattening, moves)
 * - stats: session statistics (series, streaks, windows)
 * - format: presentation formatting (percentages, dates)
 * - seed: demo tree
 * - store: observable state container with localStorage persistence
 * - store-react: the single React binding seam
 *
 * Everything else in the app imports from here; nothing here imports from
 * the UI layers.
 */

export * from "./types"
export * from "./tree"
export * from "./stats"
export * from "./format"
export * from "./seed"
export { store } from "./store"
export { useTreeState, useStoreReady } from "./store-react"
