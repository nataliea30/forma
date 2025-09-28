"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { apiClient, type PoseAnalysisData, type MastraResponse } from "@/lib/api-client"

interface AISuggestionsPanelCleanProps {
  exercise: string
  formIssues: string[]
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  isActive: boolean
}

export function AISuggestionsPanelClean({
  exercise,
  formIssues,
  landmarks,
  isActive,
}: AISuggestionsPanelCleanProps) {
  const [suggestions, setSuggestions] = useState<MastraResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-analyze when form issues change during active session
  useEffect(() => {
    if (isActive && formIssues.length > 0 && landmarks.length > 0) {
      analyzeForm()
    }
  }, [formIssues, landmarks, isActive])

  const analyzeForm = async () => {
    if (!exercise || landmarks.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const analysisData: PoseAnalysisData = {
        exercise,
        landmarks,
        formIssues,
        currentPhase: "active", // You could determine this from pose analysis
      }

      const result = await apiClient.analyzePose(analysisData)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSuggestions(result.data)
      }
    } catch (err) {
      setError("Failed to analyze form")
      console.error("Analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleManualAnalysis = () => {
    analyzeForm()
  }

  return (
    <Card className="p-6 card-hover bg-white/80 border-0 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Coach
        </h3>
        <Button
          onClick={handleManualAnalysis}
          disabled={loading || !isActive}
          size="sm"
          variant="outline"
          className="rounded-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-gray-600">Analyzing your form...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {suggestions && !loading && (
        <div className="space-y-4">
          {/* Warnings */}
          {suggestions.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Safety Warnings
              </h4>
              <div className="space-y-2">
                {suggestions.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-red-50 border border-red-200"
                  >
                    <p className="text-sm text-red-700">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Suggestions
              </h4>
              <div className="space-y-2">
                {suggestions.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200"
                  >
                    <p className="text-sm text-blue-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encouragement */}
          {suggestions.encouragement && (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Great Job!</span>
              </div>
              <p className="text-sm text-green-700">{suggestions.encouragement}</p>
            </div>
          )}

          {/* Technical Explanation */}
          {suggestions.technicalExplanation && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Why This Matters</span>
              </div>
              <p className="text-sm text-gray-600">{suggestions.technicalExplanation}</p>
            </div>
          )}
        </div>
      )}

      {!suggestions && !loading && !error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h4 className="font-medium text-gray-800 mb-2">Ready to Analyze</h4>
          <p className="text-sm text-gray-600">
            {isActive
              ? "Start exercising to get AI-powered form feedback"
              : "Begin a session to receive personalized coaching"}
          </p>
        </div>
      )}
    </Card>
  )
}
