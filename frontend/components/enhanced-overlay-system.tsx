"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import type { AnalysisResult, PoseLandmark } from "./pt-analysis-app"
import { Card } from "@/components/ui/card"
import { usePTSessionStore } from "@/lib/cedar-state"
import { AlertTriangle, CheckCircle, X, Target, TrendingUp, Activity, Zap, Eye, Timer } from "lucide-react"

interface EnhancedOverlayProps {
  analysisResult: AnalysisResult | null
  videoRef: React.RefObject<HTMLVideoElement>
  formScore: number
  exercisePhase: string
}

interface OverlayElement {
  id: string
  type: "suggestion" | "warning" | "success" | "phase" | "score"
  content: string
  position: { x: number; y: number }
  timestamp: number
  priority: number
  duration: number
}

interface JointHighlight {
  landmark: PoseLandmark
  type: "good" | "warning" | "error"
  message: string
}

export function EnhancedOverlaySystem({ analysisResult, videoRef, formScore, exercisePhase }: EnhancedOverlayProps) {
  const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([])
  const [jointHighlights, setJointHighlights] = useState<JointHighlight[]>([])
  const [showFormGuide, setShowFormGuide] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

  const { preferences, currentFormScore } = usePTSessionStore()

  // Update overlay elements based on analysis
  useEffect(() => {
    if (!analysisResult || !preferences.showOverlay) return

    const now = Date.now()
    const newElements: OverlayElement[] = []

    // Form score overlay
    newElements.push({
      id: `score-${now}`,
      type: "score",
      content: `Form Score: ${formScore}/100`,
      position: { x: 10, y: 10 },
      timestamp: now,
      priority: 1,
      duration: 1000,
    })

    // Exercise phase indicator
    if (exercisePhase && exercisePhase !== "unknown") {
      newElements.push({
        id: `phase-${now}`,
        type: "phase",
        content: `Phase: ${exercisePhase}`,
        position: { x: 10, y: 50 },
        timestamp: now,
        priority: 2,
        duration: 2000,
      })
    }

    // Critical warnings (high priority, center screen)
    analysisResult.warnings.forEach((warning, index) => {
      newElements.push({
        id: `warning-${index}-${now}`,
        type: "warning",
        content: warning,
        position: { x: 50, y: 30 + index * 15 }, // Center-ish, percentage based
        timestamp: now,
        priority: 10,
        duration: 4000,
      })
    })

    // Suggestions (medium priority, side placement)
    analysisResult.suggestions.forEach((suggestion, index) => {
      newElements.push({
        id: `suggestion-${index}-${now}`,
        type: "suggestion",
        content: suggestion,
        position: { x: 70, y: 20 + index * 12 },
        timestamp: now,
        priority: 5,
        duration: 3000,
      })
    })

    // Success feedback for good form
    if (analysisResult.isGoodForm && formScore > 80) {
      newElements.push({
        id: `success-${now}`,
        type: "success",
        content: "Excellent form!",
        position: { x: 50, y: 15 },
        timestamp: now,
        priority: 7,
        duration: 2000,
      })
    }

    // Update overlay elements
    setOverlayElements((prev) => {
      // Remove expired elements
      const filtered = prev.filter((el) => now - el.timestamp < el.duration)
      // Add new elements, avoiding duplicates
      const combined = [...filtered, ...newElements]
      // Sort by priority (higher priority first)
      return combined.sort((a, b) => b.priority - a.priority).slice(0, 8) // Max 8 elements
    })

    // Update joint highlights
    updateJointHighlights(analysisResult)
  }, [analysisResult, formScore, exercisePhase, preferences.showOverlay])

  // Auto-remove expired elements
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setOverlayElements((prev) => prev.filter((el) => now - el.timestamp < el.duration))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const updateJointHighlights = (result: AnalysisResult) => {
    if (!result.landmarks || result.landmarks.length === 0) return

    const highlights: JointHighlight[] = []

    // Example: Highlight key joints based on exercise and form quality
    const keyJoints = [11, 12, 23, 24, 25, 26] // Shoulders, hips, knees

    keyJoints.forEach((jointIndex) => {
      if (result.landmarks[jointIndex]) {
        const landmark = result.landmarks[jointIndex]

        if (result.isGoodForm) {
          highlights.push({
            landmark,
            type: "good",
            message: "Good alignment",
          })
        } else if (result.warnings.length > 0) {
          highlights.push({
            landmark,
            type: "error",
            message: "Check form",
          })
        } else {
          highlights.push({
            landmark,
            type: "warning",
            message: "Minor adjustment needed",
          })
        }
      }
    })

    setJointHighlights(highlights)
  }

  const removeElement = (id: string) => {
    setOverlayElements((prev) => prev.filter((el) => el.id !== id))
  }

  const getElementStyle = (element: OverlayElement) => {
    const baseStyle = {
      position: "absolute" as const,
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      transform: "translate(-50%, -50%)",
      zIndex: 20 + element.priority,
      maxWidth: "300px",
      pointerEvents: "auto" as const,
    }

    return baseStyle
  }

  const getElementVariant = (type: OverlayElement["type"]) => {
    switch (type) {
      case "warning":
        return "destructive"
      case "success":
        return "default"
      case "suggestion":
        return "secondary"
      case "phase":
        return "outline"
      case "score":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getElementIcon = (type: OverlayElement["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "success":
        return <CheckCircle className="w-4 h-4" />
      case "suggestion":
        return <Target className="w-4 h-4" />
      case "phase":
        return <Activity className="w-4 h-4" />
      case "score":
        return <TrendingUp className="w-4 h-4" />
      default:
        return null
    }
  }

  if (!preferences.showOverlay) return null

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      {/* Main overlay elements */}
      {overlayElements.map((element) => (
        <div key={element.id} style={getElementStyle(element)} className="animate-in slide-in-from-top-2 fade-in-0">
          <Card
            className={`p-3 shadow-lg border-2 ${
              element.type === "warning"
                ? "border-destructive bg-destructive/10 backdrop-blur-sm"
                : element.type === "success"
                  ? "border-green-500 bg-green-500/10 backdrop-blur-sm"
                  : "border-primary bg-background/90 backdrop-blur-sm"
            }`}
          >
            <div className="flex items-start gap-2">
              {getElementIcon(element.type)}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    element.type === "warning"
                      ? "text-destructive"
                      : element.type === "success"
                        ? "text-green-600 dark:text-green-400"
                        : "text-foreground"
                  }`}
                >
                  {element.content}
                </p>
              </div>
              <button
                onClick={() => removeElement(element.id)}
                className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </div>
      ))}

      {/* Joint highlights overlay */}
      {jointHighlights.map((highlight, index) => (
        <div
          key={`joint-${index}`}
          className="absolute pointer-events-none"
          style={{
            left: `${highlight.landmark.x * 100}%`,
            top: `${highlight.landmark.y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 25,
          }}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              highlight.type === "good"
                ? "border-green-500 bg-green-500/20"
                : highlight.type === "error"
                  ? "border-red-500 bg-red-500/20"
                  : "border-yellow-500 bg-yellow-500/20"
            } animate-pulse`}
          />

          {/* Joint message tooltip */}
          <div
            className={`absolute top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap ${
              highlight.type === "good"
                ? "bg-green-500 text-white"
                : highlight.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-yellow-500 text-black"
            }`}
          >
            {highlight.message}
          </div>
        </div>
      ))}

      {/* Form guide overlay (when enabled) */}
      {showFormGuide && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Card className="p-4 bg-background/95 backdrop-blur-sm max-w-xs">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Form Guide
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Good form</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Minor adjustment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Needs correction</span>
                </div>
              </div>
              <button
                onClick={() => setShowFormGuide(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide guide
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Performance metrics overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <Card className="p-3 bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-primary" />
              <span>Score: {currentFormScore}/100</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span>Reps: {repCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4 text-green-500" />
              <span>Phase: {exercisePhase}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions overlay */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowFormGuide(!showFormGuide)}
            className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRepCount((prev) => prev + 1)}
            className="p-2 rounded-full bg-green-500 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
