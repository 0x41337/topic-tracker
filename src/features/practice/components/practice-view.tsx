"use client"

import { useState } from "react"
import { Check, Undo2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
    formatPercent,
    formatShortDate,
    store,
    topicStats,
    useTreeState,
} from "@/core"
import { TopicBadge } from "@/features/topic"
import { Button } from "@/components/ui/button"

export interface PracticeViewProps {
    topicId: string
    /** Called when the user finishes (or the screen asks to close). */
    onFinish: () => void
}

/**
 * Gamified session recording: one click per answer. Answers are persisted to
 * today's session immediately; the score between the buttons updates live.
 * Talks straight to the core store, so it can be hosted from anywhere.
 */
export function PracticeView({ topicId, onFinish }: PracticeViewProps) {
    const state = useTreeState()
    const node = state.nodes[topicId]
    const today = new Date().toISOString().slice(0, 10)
    const session = (state.sessions[topicId] ?? []).find(
        (s) => s.date === today,
    )
    const hits = session?.hits ?? 0
    const total = session?.total ?? 0
    const overall = topicStats(state.sessions[topicId])

    // Pop animation via class toggle: the score DOM nodes stay mounted and are
    // updated in place, so no stale elements can ever accumulate.
    const [bump, setBump] = useState(false)
    const recordAnswer = (hit: boolean) => {
        store.recordAnswer(topicId, hit)
        setBump(false)
        requestAnimationFrame(() => setBump(true))
    }

    if (!node) return null

    const finish = () => {
        if (total > 0) {
            toast.success("Session saved")
        }
        onFinish()
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <TopicBadge name={node.name} />
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {formatShortDate(today)}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={finish}
                >
                    Finish
                </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-10 p-6">
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
                    <button
                        type="button"
                        aria-label="Miss answer"
                        onClick={() => recordAnswer(false)}
                        className="flex size-32 shrink-0 flex-col items-center justify-center gap-2 rounded-full border-2 text-muted-foreground transition-all hover:border-foreground hover:text-foreground active:scale-95 sm:size-40"
                    >
                        <X className="size-10" strokeWidth={2.5} />
                        <span className="text-sm font-medium">Miss</span>
                    </button>

                    <div className="order-first text-center sm:order-none">
                        <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            This session
                        </div>
                        <div
                            className={cn(
                                "mt-2 text-6xl font-semibold tabular-nums tracking-tight",
                                bump && "animate-in zoom-in-75 duration-150",
                            )}
                            onAnimationEnd={() => setBump(false)}
                            data-testid="practice-score"
                        >
                            <span data-testid="practice-hits">{hits}</span>
                            <span className="text-muted-foreground"> / </span>
                            <span data-testid="practice-total">{total}</span>
                        </div>
                        <div className="mt-2 text-sm tabular-nums text-muted-foreground">
                            {formatPercent(total > 0 ? hits / total : null)}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Hit answer"
                        onClick={() => recordAnswer(true)}
                        className="flex size-32 shrink-0 flex-col items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 sm:size-40"
                    >
                        <Check className="size-10" strokeWidth={2.5} />
                        <span className="text-sm font-medium">Hit</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                            total === 0 || !store.hasAnswerHistory(topicId)
                        }
                        onClick={() => store.undoAnswer()}
                    >
                        <Undo2 className="size-4" /> Undo last
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Topic: {formatPercent(overall.score)} ·{" "}
                        {overall.sessionCount}{" "}
                        {overall.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                </div>
            </div>
        </div>
    )
}
