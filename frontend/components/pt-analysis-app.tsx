"use client"

import { useState, useRef } from "react"
import { VideoCapture } from "./video-capture"
import { PoseAnalyzer } from "./pose-analyzer"
import { SuggestionOverlay } from "./suggestion-overlay"
import { ControlPanel } from "./control-panel"
import { AISuggestionsPanel } from "./ai-suggestions-panel"
import { CedarDashboard } from "./cedar-dashboard"
import { CedarAgentInterface } from "./cedar-agent-interface"
import { PatientManagement } from "./patient-management"
import { ProgressTrackingDashboard } from "./progress-tracking-dashboard"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePTSessionStore } from "@/lib/cedar-state"
import { useAuth } from "@/contexts/auth-context"
import { Users, Heart, LogOut, User, TrendingUp } from "lucide-react"

export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface AnalysisResult {
  landmarks: PoseLandmark[]
  isGoodForm: boolean
  suggestions: string[]
  warnings: string[]
}

export function PTAnalysisApp() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [showPatientManagement, setShowPatientManagement] = useState(false)
  const [showProgressDashboard, setShowProgressDashboard] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { user, signOut } = useAuth()

  const {
    isActive,
    currentExercise,
    duration,
    startSession,
    endSession,
    setCurrentExercise,
    updateFormScore,
    incrementReps,
    currentFormScore,
  } = usePTSessionStore()

  const exercises = [
    { id: "squat", name: "Squat", description: "Lower body strength exercise" },
    { id: "pushup", name: "Push-up", description: "Upper body strength exercise" },
    { id: "plank", name: "Plank", description: "Core stability exercise" },
    { id: "lunge", name: "Lunge", description: "Single leg strength exercise" },
  ]

  const handleStartRecording = () => {
    startSession(currentExercise)
  }

  const handleStopRecording = () => {
    endSession()
    setAnalysisResult(null)
  }

  const handleEmergencyStop = () => {
    endSession()
    setAnalysisResult(null)
    console.log("[v0] Emergency stop activated by user")
  }

  const handleExerciseChange = (exercise: string) => {
    setCurrentExercise(exercise)
  }

  const handleAnalysisUpdate = (result: AnalysisResult) => {
    setAnalysisResult(result)

    if (result) {
      const formScore = result.isGoodForm ? 85 : 45
      const issues = [...result.suggestions, ...result.warnings]
      updateFormScore(formScore, "analysis", issues)

      if (result.isGoodForm && Math.random() > 0.8) {
        incrementReps()
      }
    }
  }

  const formIssues = analysisResult ? [...analysisResult.suggestions, ...analysisResult.warnings] : []

  const isTherapist = user?.role === "healthcare_provider"
  const isPatient = user?.role === "patient"

  const handleSignOut = async () => {
    try {
      // Clear any local component state before signing out
      setShowPatientManagement(false)
      setShowProgressDashboard(false)
      setAnalysisResult(null)

      // End any active session
      if (isActive) {
        endSession()
      }

      // Sign out user - this will automatically redirect to landing page
      await signOut()

      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-purple-50 via-pink-50 to-mint-100">
      <div className="relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-mint-200/30 rounded-full animate-float" />
        <div
          className="absolute top-20 right-20 w-16 h-16 bg-purple-200/30 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-10 left-1/3 w-12 h-12 bg-pink-200/30 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">{"Forma"}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={isTherapist ? "outline" : "secondary"}
                  className={`px-4 py-2 rounded-full ${
                    isTherapist
                      ? "bg-white/80 border-mint-200 text-mint-700 hover:bg-mint-50" // Changed to outline style with white background and mint border
                      : "bg-pink-100 text-pink-700"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  {isTherapist ? "Healthcare Provider" : "Patient"}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Welcome, {user?.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {isTherapist && user?.specialization && <p className="text-xs text-gray-500">{user.specialization}</p>}
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="rounded-full px-4 bg-white/80 border-gray-200 hover:bg-gray-50 btn-modern transition-all duration-300 ease-in-out transform hover:scale-105 hover:border-red-300 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {isTherapist && (
            <div className="flex gap-3 mt-6">
              <Button
                variant={showPatientManagement ? "default" : "outline"}
                onClick={() => {
                  setShowPatientManagement(!showPatientManagement)
                  setShowProgressDashboard(false)
                }}
                className={`rounded-full px-6 btn-modern transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  showPatientManagement
                    ? "bg-gradient-to-r from-mint-400 to-purple-400 text-white shadow-lg"
                    : "bg-white/80 border-gray-200 hover:bg-gray-50 hover:border-mint-300"
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Patient Management
              </Button>
            </div>
          )}

          {isPatient && (
            <div className="flex gap-3 mt-6">
              <Button
                variant={showProgressDashboard ? "default" : "outline"}
                onClick={() => setShowProgressDashboard(!showProgressDashboard)}
                className={`rounded-full px-6 btn-modern transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  showProgressDashboard
                    ? "bg-gradient-to-r from-mint-400 to-purple-400 text-white shadow-lg"
                    : "bg-white/80 border-gray-200 hover:bg-gray-50 hover:border-pink-300"
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                My Progress
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Patient Management Panel (Healthcare Providers only) */}
        {isTherapist && showPatientManagement && (
          <PatientManagement
            isVisible={showPatientManagement}
            onBack={() => setShowPatientManagement(false)} // Added onBack handler to close patient management
          />
        )}

        {/* Progress Dashboard (Both roles) */}
        {showProgressDashboard && <ProgressTrackingDashboard />}

        {/* Main Dashboard */}
        {!showPatientManagement && !showProgressDashboard && (
          <>
            <CedarDashboard />

            {/* Control Panel */}
            <ControlPanel
              exercises={exercises}
              selectedExercise={currentExercise}
              onExerciseChange={handleExerciseChange}
              isRecording={isActive}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <Card className="p-6 card-hover bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
                  <div className="relative overflow-hidden rounded-2xl">
                    <VideoCapture
                      ref={videoRef}
                      isRecording={isActive}
                      onVideoReady={() => console.log("Video ready")}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl"
                      style={{ zIndex: 10 }}
                    />
                    {isActive && <SuggestionOverlay analysisResult={analysisResult} videoRef={videoRef} />}
                  </div>
                </Card>

                {/* Cedar Agent Interface */}
                <div className="max-h-96 min-h-0">
                  <CedarAgentInterface />
                </div>
              </div>

              <div className="space-y-6">
                <Tabs defaultValue="ai-coach" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/80 p-1 rounded-2xl shadow-sm">
                    <TabsTrigger value="ai-coach" className="rounded-xl">
                      AI Coach
                    </TabsTrigger>
                    <TabsTrigger value="exercise-info" className="rounded-xl">
                      Exercise Info
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai-coach" className="space-y-6 mt-6">
                    <div className="max-h-96 min-h-0 overflow-hidden">
                      <AISuggestionsPanel
                        exercise={currentExercise}
                        formIssues={formIssues}
                        landmarks={analysisResult?.landmarks || []}
                        isActive={isActive}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="exercise-info" className="space-y-6 mt-6">
                    <Card className="p-6 card-hover bg-white/80 border-0 rounded-3xl shadow-sm">
                      <h3 className="font-semibold mb-4 text-lg text-gray-800">Form Status</h3>
                      <div className="space-y-3">
                        {analysisResult ? (
                          <div
                            className={`p-4 rounded-2xl text-sm font-medium ${
                              analysisResult.isGoodForm
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {analysisResult.isGoodForm ? "Excellent Form ✨" : "Form Needs Attention ⚠️"}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl text-sm bg-gray-50 text-gray-600 border border-gray-200">
                            {isActive ? "Analyzing your movement..." : "Start recording to begin analysis"}
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="p-6 card-hover bg-gradient-to-r from-mint-50 to-purple-50 border-0 rounded-3xl">
                      <h3 className="font-semibold mb-4 text-lg flex items-center gap-2 text-gray-800">
                        <Heart className="w-5 h-5 text-pink-500" />
                        Current Exercise
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-mint-400 to-purple-400 rounded-full" />
                          <p className="font-medium text-gray-800">
                            {exercises.find((e) => e.id === currentExercise)?.name || "No exercise selected"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 pl-6">
                          {exercises.find((e) => e.id === currentExercise)?.description ||
                            "Please select an exercise from the control panel above"}
                        </p>
                        {isActive && currentExercise && (
                          <div className="flex items-center gap-2 pl-6 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-600 font-medium">Active Session</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {isPatient && (
                      <Card className="p-6 card-hover bg-gradient-to-r from-pink-50 to-purple-50 border-0 rounded-3xl">
                        <h3 className="font-semibold mb-4 text-lg flex items-center gap-2 text-gray-800">
                          <Heart className="w-5 h-5 text-pink-500" />
                          Patient Guidance
                        </h3>
                        <div className="text-sm space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-700">Start slowly and focus on proper form over speed</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-700">Stop immediately if you feel any pain or discomfort</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-700">Follow your prescribed repetition count and rest periods</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-700">Contact your therapist with any questions or concerns</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Pose Analyzer */}
            {isActive && (
              <PoseAnalyzer
                videoRef={videoRef}
                canvasRef={canvasRef}
                exercise={currentExercise}
                onAnalysisUpdate={handleAnalysisUpdate}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
