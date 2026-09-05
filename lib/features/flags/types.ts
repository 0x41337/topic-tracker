export type FeatureFlag =
    | "topics"
    | "performance"
    | "statistics"
    | "backup"

export type FeatureFlags = Record<FeatureFlag, boolean>
