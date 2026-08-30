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
            const timer = setTimeout(() => setScoreAnimation(false), 300)
            prevScoreRef.current = score.value
            return () => clearTimeout(timer)
        }
    }, [score.value])

    const handleHit = () => {
        setHitAnimation(true)
        setTimeout(() => setHitAnimation(false), 200)
        onHit()
    }

    const handleMiss = () => {
        setMissAnimation(true)
        setTimeout(() => setMissAnimation(false), 200)
        onMiss()
    }

    const scoreDisplay = isNaN(score.value) ? "0" : (score.value * 100).toFixed(0)

    return (
        <div className="rounded-md border p-6">
            <div className="flex items-center justify-center gap-8">
                <button
                    onClick={handleHit}
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white text-2xl font-bold transition-all hover:bg-green-600 active:scale-95 ${
                        hitAnimation ? "scale-110 bg-green-400" : ""
                    }`}
                >
                    HIT
                </button>

                <div className="flex flex-col items-center">
                    <div
                        className={`text-4xl font-bold tabular-nums transition-transform ${
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
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white text-2xl font-bold transition-all hover:bg-red-600 active:scale-95 ${
                        missAnimation ? "scale-110 bg-red-400" : ""
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
