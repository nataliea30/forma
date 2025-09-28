"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Lightbulb, AlertTriangle, Heart, RefreshCw } from "lucide-react"
import { PTMastraAgent, type MastraResponse } from "@/lib/mastra-agent"

interface AISuggestionsPanelProps {
  exercise: string
  formIssues: string[]
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  isActive: boolean
}

export function AISuggestionsPanel({ exercise, formIssues, landmarks, isActive }: AISuggestionsPanelProps) {
  const [aiResponse, setAiResponse] = useState<MastraResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0)

  const mastraAgent = PTMastraAgent.getInstance()

  useEffect(() => {
    if (!isActive) return

    const now = Date.now()
    // Throttle AI analysis to every 3 seconds to avoid rate limits
    if (now - lastAnalysisTime < 3000) return

    const analyzeWithAI = async () => {
      setIsLoading(true)
      try {
        const response = await mastraAgent.analyzePoseWithAI({
          exercise,
          landmarks,
          formIssues,
          currentPhase: "analysis",
        })
        setAiResponse(response)
        setLastAnalysisTime(now)
      } catch (error) {
        console.error("AI analysis failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    analyzeWithAI()
  }, [exercise, formIssues, landmarks, isActive, lastAnalysisTime, mastraAgent])

  const refreshAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await mastraAgent.analyzePoseWithAI({
        exercise,
        landmarks,
        formIssues,
        currentPhase: "manual-refresh",
      })
      setAiResponse(response)
      setLastAnalysisTime(Date.now())
    } catch (error) {
      console.error("Manual refresh failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const coachingCues = mastraAgent.getCoachingCues(exercise)

  return (
    <div className="space-y-4">
      <Card className="p-4 max-h-80 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">AI Coach</h3>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <Button variant="outline" size="sm" onClick={refreshAnalysis} disabled={isLoading}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {aiResponse ? (
            <div className="space-y-3">
              {aiResponse.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Suggestions</span>
                  </div>
                  <div className="space-y-1">
                    {aiResponse.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-2 border-blue-500"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiResponse.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Safety Warnings</span>
                  </div>
                  <div className="space-y-1">
                    {aiResponse.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded border-l-2 border-red-500"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiResponse.encouragement && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Encouragement</span>
                  </div>
                  <div className="text-sm p-2 bg-green-50 dark:bg-green-950 rounded border-l-2 border-green-500">
                    {aiResponse.encouragement}
                  </div>
                </div>
              )}

              {aiResponse.technicalExplanation && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Why This Matters</span>
                  </div>
                  <div className="text-xs p-2 bg-purple-50 dark:bg-purple-950 rounded border-l-2 border-purple-500 text-muted-foreground">
                    {aiResponse.technicalExplanation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {isActive
                ? isLoading
                  ? "AI is analyzing your form..."
                  : "Start exercising to get AI feedback"
                : "Start recording to activate AI coach"}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
