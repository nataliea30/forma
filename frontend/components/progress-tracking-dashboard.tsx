"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { authService, type User, type ProgressEntry } from "@/lib/auth"
import { usePTSessionStore } from "@/lib/cedar-state"
import { BarChart3, TrendingUp, Target, Award, Clock, Activity, CheckCircle, AlertTriangle } from "lucide-react"

export function ProgressTrackingDashboard() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("7d")
  const [progressData, setProgressData] = useState<ProgressEntry[]>([])
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  const { sessionHistory, currentFormScore, totalSessions } = usePTSessionStore()

  const isProvider = user?.role === "healthcare_provider"
  const isPatient = user?.role === "patient"

  const safeConnectedUsers = connectedUsers || []
  const safeSessionHistory = sessionHistory || []
  const safeProgressData = progressData || []

  useEffect(() => {
    if (user) {
      loadProgressData()
      loadConnectedUsers()
    }
  }, [user, selectedPatient, timeRange])

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

  const loadProgressData = () => {
    if (!user) return

    let data: ProgressEntry[] = []

    if (isProvider) {
      if (selectedPatient !== "all") {
        data = authService.getProgressByPatient(selectedPatient)
      } else {
        data = authService.getProgressByProvider(user.id)
      }
    } else {
      data = authService.getProgressByPatient(user.id)
    }

    const now = new Date()
    const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const filteredData = (data || []).filter((entry) => new Date(entry.date) >= cutoffDate)
    setProgressData(filteredData)
  }

  const loadConnectedUsers = () => {
    if (!user) return

    if (isProvider) {
      const patients = authService.getPatientsByProvider(user.id)
      setConnectedUsers(patients || [])
    } else {
      const providers = authService.getProvidersByPatient(user.id)
      setConnectedUsers(providers || [])
    }
  }

  const saveCurrentSession = async () => {
    if (!user) return

    if (safeSessionHistory.length === 0) return
    const sessionData = safeSessionHistory[safeSessionHistory.length - 1]
    if (!sessionData) return

    const progressEntry = {
      patientId: isPatient ? user.id : selectedPatient || "",
      providerId: isProvider ? user.id : safeConnectedUsers[0]?.id || "",
      exerciseType: sessionData.exercise,
      date: new Date().toISOString(),
      duration: sessionData.duration,
      formScore: currentFormScore,
      notes: `Session completed with ${sessionData.reps} reps`,
      landmarks: [],
      improvements: sessionData.formScore > 80 ? ["Good form maintained", "Consistent movement"] : [],
      concerns: sessionData.formScore < 60 ? ["Form needs improvement", "Consider slower pace"] : [],
    }

    await authService.saveProgress(progressEntry)
    loadProgressData()
  }

  const getAverageScore = () => {
    if (safeProgressData.length === 0) return 0
    return Math.round(safeProgressData.reduce((sum, entry) => sum + entry.formScore, 0) / safeProgressData.length)
  }

  const getTrendDirection = () => {
    if (safeProgressData.length < 2) return "stable"
    const recent = safeProgressData.slice(-5)
    const older = safeProgressData.slice(-10, -5)

    if (recent.length === 0 || older.length === 0) return "stable"

    const recentAvg = recent.reduce((sum, entry) => sum + entry.formScore, 0) / recent.length
    const olderAvg = older.reduce((sum, entry) => sum + entry.formScore, 0) / older.length

    if (recentAvg > olderAvg + 5) return "improving"
    if (recentAvg < olderAvg - 5) return "declining"
    return "stable"
  }

  const getExerciseBreakdown = () => {
    const breakdown: Record<string, { count: number; avgScore: number }> = {}

    safeProgressData.forEach((entry) => {
      if (!breakdown[entry.exerciseType]) {
        breakdown[entry.exerciseType] = { count: 0, avgScore: 0 }
      }
      breakdown[entry.exerciseType].count++
      breakdown[entry.exerciseType].avgScore += entry.formScore
    })

    Object.keys(breakdown).forEach((exercise) => {
      breakdown[exercise].avgScore = Math.round(breakdown[exercise].avgScore / breakdown[exercise].count)
    })

    return breakdown
  }

  const getRecentAchievements = () => {
    const achievements = []
    const avgScore = getAverageScore()

    if (avgScore >= 90) achievements.push({ title: "Excellent Form", description: "Maintaining 90%+ average score" })
    if (avgScore >= 80) achievements.push({ title: "Good Progress", description: "Consistent improvement shown" })
    if (safeProgressData.length >= 10) achievements.push({ title: "Dedicated", description: "Completed 10+ sessions" })
    if (getTrendDirection() === "improving")
      achievements.push({ title: "Improving", description: "Form scores trending upward" })

    return achievements
  }

  return (
    <div className="space-y-6">
      <Card
        id="main-dashboard-card"
        data-fade-in
        className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl transition-all duration-1000 ${
          visibleSections.has("main-dashboard-card") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <CardHeader className="bg-gradient-to-r from-mint-50 to-purple-50 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BarChart3 className="w-5 h-5 text-mint-500" />
                Progress Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600">
                Track your therapy progress and performance metrics
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isProvider && safeConnectedUsers.length > 0 && (
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="w-48 rounded-2xl border-gray-200">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all" className="rounded-xl">
                      All Patients
                    </SelectItem>
                    {safeConnectedUsers.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id} className="rounded-xl">
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 rounded-2xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="7d" className="rounded-xl">
                    7 days
                  </SelectItem>
                  <SelectItem value="30d" className="rounded-xl">
                    30 days
                  </SelectItem>
                  <SelectItem value="90d" className="rounded-xl">
                    90 days
                  </SelectItem>
                  <SelectItem value="365d" className="rounded-xl">
                    1 year
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-xl">
                Sessions
              </TabsTrigger>
              <TabsTrigger value="exercises" className="rounded-xl">
                Exercises
              </TabsTrigger>
              <TabsTrigger value="achievements" className="rounded-xl">
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div
                id="overview-stats"
                data-fade-in
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 ${
                  visibleSections.has("overview-stats") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <Card className="p-4 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-mint-100 rounded-xl">
                      <Target className="w-5 h-5 text-mint-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{getAverageScore()}%</p>
                      <p className="text-sm text-gray-600">Average Score</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{safeProgressData.length}</p>
                      <p className="text-sm text-gray-600">Sessions</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-xl">
                      <Clock className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {Math.round(safeProgressData.reduce((sum, entry) => sum + entry.duration, 0) / 60)}
                      </p>
                      <p className="text-sm text-gray-600">Total Minutes</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        getTrendDirection() === "improving"
                          ? "bg-green-100"
                          : getTrendDirection() === "declining"
                            ? "bg-red-100"
                            : "bg-gray-100"
                      }`}
                    >
                      <TrendingUp
                        className={`w-5 h-5 ${
                          getTrendDirection() === "improving"
                            ? "text-green-600"
                            : getTrendDirection() === "declining"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800 capitalize">{getTrendDirection()}</p>
                      <p className="text-sm text-gray-600">Trend</p>
                    </div>
                  </div>
                </Card>
              </div>

              {safeSessionHistory.length > 0 && (
                <Card
                  id="current-session"
                  data-fade-in
                  className={`p-4 border-2 border-mint-200 rounded-2xl bg-mint-50/50 transition-all duration-1000 ${
                    visibleSections.has("current-session") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">Current Session</h3>
                      <p className="text-sm text-gray-600">Save your progress to track improvements</p>
                    </div>
                    <Button
                      onClick={saveCurrentSession}
                      className="bg-gradient-to-r from-mint-400 to-purple-400 hover:from-mint-500 hover:to-purple-500 text-white rounded-2xl"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Progress
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4 mt-6">
              <div
                id="sessions-list"
                data-fade-in
                className={`space-y-3 transition-all duration-1000 ${
                  visibleSections.has("sessions-list") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {safeProgressData
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((entry) => (
                    <Card key={entry.id} className="p-4 border border-gray-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{entry.exerciseType}</h4>
                            <Badge
                              className={`rounded-full ${
                                entry.formScore >= 80
                                  ? "bg-green-100 text-green-700"
                                  : entry.formScore >= 60
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {entry.formScore}%
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{Math.round(entry.duration / 60)} minutes</p>
                          {entry.notes && <p className="text-sm text-gray-600 italic">{entry.notes}</p>}
                        </div>
                        <div className="text-right">
                          {(entry.improvements || []).length > 0 && (
                            <div className="mb-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                              <span className="text-xs text-green-600">
                                {(entry.improvements || []).length} improvements
                              </span>
                            </div>
                          )}
                          {(entry.concerns || []).length > 0 && (
                            <div>
                              <AlertTriangle className="w-4 h-4 text-yellow-500 inline mr-1" />
                              <span className="text-xs text-yellow-600">{(entry.concerns || []).length} concerns</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                {safeProgressData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No session data available for the selected time range.</p>
                    <p className="text-sm">Complete some exercises to see your progress here.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4 mt-6">
              <div
                id="exercises-grid"
                data-fade-in
                className={`grid gap-4 transition-all duration-1000 ${
                  visibleSections.has("exercises-grid") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {Object.entries(getExerciseBreakdown()).map(([exercise, data]) => (
                  <Card key={exercise} className="p-4 border border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800 capitalize">{exercise}</h4>
                        <p className="text-sm text-gray-600">{data.count} sessions completed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-mint-600">{data.avgScore}%</div>
                        <div className="text-xs text-gray-500">Average Score</div>
                      </div>
                    </div>
                  </Card>
                ))}

                {Object.keys(getExerciseBreakdown()).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No exercise data available.</p>
                    <p className="text-sm">Start exercising to see your performance breakdown.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-6">
              <div
                id="achievements-grid"
                data-fade-in
                className={`grid gap-4 transition-all duration-1000 ${
                  visibleSections.has("achievements-grid") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {getRecentAchievements().map((achievement, index) => (
                  <Card key={index} className="p-4 border border-gray-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-xl">
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {getRecentAchievements().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No achievements yet.</p>
                    <p className="text-sm">Keep exercising to unlock achievements!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
