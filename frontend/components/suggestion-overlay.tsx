"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { AnalysisResult } from "./pt-analysis-app"
import { EnhancedOverlaySystem } from "./enhanced-overlay-system"
import { usePTSessionStore } from "@/lib/cedar-state"

interface SuggestionOverlayProps {
  analysisResult: AnalysisResult | null
  videoRef: React.RefObject<HTMLVideoElement>
}

export function SuggestionOverlay({ analysisResult, videoRef }: SuggestionOverlayProps) {
  const [exercisePhase, setExercisePhase] = useState("starting")
  const { currentFormScore } = usePTSessionStore()

  useEffect(() => {
    if (!analysisResult) return

    // Simple phase detection based on form quality and suggestions
    if (analysisResult.suggestions.some((s) => s.includes("lower") || s.includes("down"))) {
      setExercisePhase("descending")
    } else if (analysisResult.suggestions.some((s) => s.includes("up") || s.includes("rise"))) {
      setExercisePhase("ascending")
    } else if (analysisResult.isGoodForm) {
      setExercisePhase("good-form")
    } else {
      setExercisePhase("adjusting")
    }
  }, [analysisResult])

  return (
    <EnhancedOverlaySystem
      analysisResult={analysisResult}
      videoRef={videoRef}
      formScore={currentFormScore}
      exercisePhase={exercisePhase}
    />
  )
}
