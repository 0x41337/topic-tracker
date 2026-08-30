"use client"

import { useState, useEffect, useRef } from "react"
import type { Score } from "@/lib/core/types"

interface TopicSessionCardProps {
    score: Score
    onHit: () => void
    onMiss: () => void
    onUndo: () => void
}

export function TopicSessionCard({
    score,
    onHit,
    onMiss,
    onUndo,
}: TopicSessionCardProps) {
    const [hitAnimation, setHitAnimation] = useState(false)
    const [missAnimation, setMissAnimation] = useState(false)
    const [scoreAnimation, setScoreAnimation] = useState(false)
    const prevScoreRef = useRef(score.value)

    useEffect(() => {
        if (prevScoreRef.current !== score.value && !isNaN(score.value)) {
            setScoreAnimation(true)
            const timer = setTimeout(() => setScoreAnimation(false), 150)
            prevScoreRef.current = score.value
            return () => clearTimeout(timer)
        }
    }, [score.value])

    const handleHit = () => {
        setHitAnimation(true)
        setTimeout(() => setHitAnimation(false), 100)
        onHit()
    }

    const handleMiss = () => {
        setMissAnimation(true)
        setTimeout(() => setMissAnimation(false), 100)
        onMiss()
    }

    const scoreDisplay = isNaN(score.value) ? "0" : (score.value * 100).toFixed(0)

    return (
        <div className="rounded-md border p-6">
            <div className="flex items-center justify-center gap-8">
                <button
                    onClick={handleHit}
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold transition-all duration-100 hover:bg-primary/90 active:scale-95 ${
                        hitAnimation ? "scale-110" : ""
                    }`}
                >
                    HIT
                </button>

                <div className="flex flex-col items-center">
                    <div
                        className={`text-4xl font-bold tabular-nums transition-all duration-150 ${
                            scoreAnimation ? "scale-125 text-primary" : ""
                        }`}
                    >
                        {scoreDisplay}
                        <span className="text-lg">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {score.hits}/{score.total}
                    </p>
                </div>

                <button
                    onClick={handleMiss}
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground text-2xl font-bold transition-all duration-100 hover:bg-muted/80 active:scale-95 ${
                        missAnimation ? "scale-110" : ""
                    }`}
                >
                    MISS
                </button>
            </div>

            {score.total > 0 && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={onUndo}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Undo last action
                    </button>
                </div>
            )}
        </div>
    )
}
