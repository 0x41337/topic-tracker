"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatTrend } from "@/core"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

/** Labeled numeric stat with an optional trend indicator. */
export function Stat({
    label,
    value,
    trend,
    hint,
}: {
    label: string
    value: string
    trend?: number | null
    hint?: string
}) {
    return (
        <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                    {value}
                </span>
                {trend !== undefined && trend !== null ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className={cn(
                                    "flex items-center gap-0.5 text-xs font-medium tabular-nums text-muted-foreground",
                                )}
                                title={hint}
                            >
                                {trend >= 0 ? (
                                    <TrendingUp className="size-3.5" />
                                ) : (
                                    <TrendingDown className="size-3.5" />
                                )}
                                {formatTrend(trend)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {hint ?? "Change from last"}
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </div>
    )
}
