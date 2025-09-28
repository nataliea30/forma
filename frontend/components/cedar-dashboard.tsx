"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePTSessionStore } from "@/lib/cedar-state"
import { Activity, Target, TrendingUp, Clock, Award, Brain } from "lucide-react"

export function CedarDashboard() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  const {
    isActive,
    duration,
    currentExercise,
    totalReps,
    currentFormScore,
    averageFormScore,
    formHistory,
    coachingHistory,
    updateDuration,
  } = usePTSessionStore()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    const sections = document.querySelectorAll("[data-fade-in]")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getFormScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getFormScoreBg = (score: number) => {
    if (score >= 80) return "bg-gradient-to-br from-green-100 to-green-200"
    if (score >= 60) return "bg-gradient-to-br from-yellow-100 to-yellow-200"
    return "bg-gradient-to-br from-red-100 to-red-200"
  }

  const recentFormTrend = formHistory.slice(-10)
  const improvementTrend =
    recentFormTrend.length > 1 ? recentFormTrend[recentFormTrend.length - 1].score - recentFormTrend[0].score : 0

  const aiCoachingCount = coachingHistory.filter(
    (entry) => Date.now() - entry.timestamp < 300000, // Last 5 minutes
  ).length

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-mint-50/30 via-purple-50/30 to-pink-50/30 rounded-3xl">
      <div
        id="stats-grid"
        data-fade-in
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 ${
          visibleSections.has("stats-grid") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Session Status */}
        <Card className="p-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl shadow-sm ${isActive ? "bg-gradient-to-br from-green-100 to-green-200" : "bg-gray-100"}`}
            >
              <Activity className={`w-5 h-5 ${isActive ? "text-green-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Session Status</p>
              <p className="text-xs text-gray-600">{isActive ? `Active - ${formatDuration(duration)}` : "Inactive"}</p>
            </div>
          </div>
        </Card>

        {/* Current Exercise */}
        <Card className="p-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl shadow-sm bg-gradient-to-br from-blue-100 to-blue-200">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Current Exercise</p>
              <p className="text-xs text-gray-600 capitalize">
                {currentExercise} ({totalReps} reps)
              </p>
            </div>
          </div>
        </Card>

        {/* Form Score */}
        <Card className="p-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl shadow-sm ${getFormScoreBg(currentFormScore).replace("dark:bg-", "to-")}`}>
              <Award className={`w-5 h-5 ${getFormScoreColor(currentFormScore).replace("dark:text-", "")}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Form Score</p>
              <p className={`text-xs font-medium ${getFormScoreColor(currentFormScore).replace("dark:text-", "")}`}>
                {currentFormScore}/100 (Avg: {averageFormScore})
              </p>
            </div>
          </div>
        </Card>

        {/* AI Coaching */}
        <Card className="p-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl shadow-sm bg-gradient-to-br from-purple-100 to-purple-200">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Coaching</p>
              <p className="text-xs text-gray-600">{aiCoachingCount} suggestions (5min)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div
        id="detailed-analytics"
        data-fade-in
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-1000 ${
          visibleSections.has("detailed-analytics") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Form Progress */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-mint-500" />
                Form Progress
              </h3>
              <Badge
                variant={improvementTrend > 0 ? "default" : improvementTrend < 0 ? "destructive" : "secondary"}
                className="rounded-full px-3 py-1"
              >
                {improvementTrend > 0 ? "+" : ""}
                {improvementTrend.toFixed(1)}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Current Form Score</span>
                <span className={`font-bold ${getFormScoreColor(currentFormScore).replace("dark:text-", "")}`}>
                  {currentFormScore}%
                </span>
              </div>
              <Progress value={currentFormScore} className="h-3 bg-gray-100 rounded-full" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Session Average</span>
                <span className={`font-bold ${getFormScoreColor(averageFormScore).replace("dark:text-", "")}`}>
                  {averageFormScore}%
                </span>
              </div>
              <Progress value={averageFormScore} className="h-3 bg-gray-100 rounded-full" />
            </div>

            {recentFormTrend.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                Recent trend: {recentFormTrend.length} measurements over last sequence
              </div>
            )}
          </div>
        </Card>

        {/* Session Summary */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Session Summary
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-mint-50 p-3 rounded-xl">
                <p className="text-gray-600 font-medium">Duration</p>
                <p className="font-bold text-mint-600 text-lg">{formatDuration(duration)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <p className="text-gray-600 font-medium">Total Reps</p>
                <p className="font-bold text-purple-600 text-lg">{totalReps}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-xl">
                <p className="text-gray-600 font-medium">Form Checks</p>
                <p className="font-bold text-pink-600 text-lg">{formHistory.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <p className="text-gray-600 font-medium">AI Suggestions</p>
                <p className="font-bold text-blue-600 text-lg">{coachingHistory.length}</p>
              </div>
            </div>

            {formHistory.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Recent Form Issues:</p>
                <div className="flex flex-wrap gap-2">
                  {formHistory
                    .slice(-3)
                    .flatMap((entry) => entry.issues)
                    .filter((issue, index, arr) => arr.indexOf(issue) === index)
                    .slice(0, 3)
                    .map((issue, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs rounded-full bg-yellow-50 border-yellow-200 text-yellow-700"
                      >
                        {issue}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
