"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import PoseAnalyzerIntegration from "@/components/PoseAnalyzerIntegration"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Square, Activity, Database } from "lucide-react"
import Link from "next/link"

export default function PoseIntegrationTestPage() {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start a pose session
  const startSession = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.startPoseSession({
        userId: user.id,
        exerciseType: "squat"
      })

      if (response.success) {
        setSessionId(response.data.session.id)
        setIsSessionActive(true)
        console.log("Session started:", response.data.session.id)
      }
    } catch (err) {
      console.error("Failed to start session:", err)
      setError(err instanceof Error ? err.message : "Failed to start session")
    } finally {
      setLoading(false)
    }
  }

  // End the pose session
  const endSession = async () => {
    if (!sessionId || !user) return

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.endPoseSession({
        sessionId,
        userId: user.id
      })

      if (response.success) {
        setIsSessionActive(false)
        setSessionId(null)
        console.log("Session ended:", response.data)
      }
    } catch (err) {
      console.error("Failed to end session:", err)
      setError(err instanceof Error ? err.message : "Failed to end session")
    } finally {
      setLoading(false)
    }
  }

  // Handle analysis results
  const handleAnalysisResult = (result: any) => {
    setAnalysisResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toISOString()
    }])
  }

  // Clear results
  const clearResults = () => {
    setAnalysisResults([])
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to test pose analysis integration.</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-mint-400 to-purple-400 text-white rounded-full px-6">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Activity className="w-8 h-8 text-mint-500" />
                Pose Integration Test
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time pose detection with backend integration
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/80 border-mint-200 text-mint-700">
              <Database className="w-4 h-4 mr-2" />
              Backend Connected
            </Badge>
            <Badge variant="outline" className="bg-white/80 border-purple-200 text-purple-700">
              User: {user.name}
            </Badge>
          </div>
        </div>

        {/* Session Controls */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">Session Management</h2>
              <p className="text-gray-600">
                {isSessionActive 
                  ? `Active session: ${sessionId}` 
                  : "No active session"
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {!isSessionActive ? (
                <Button
                  onClick={startSession}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-400 to-mint-400 text-white rounded-full px-6"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              ) : (
                <Button
                  onClick={endSession}
                  disabled={loading}
                  variant="outline"
                  className="rounded-full px-6 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}
        </Card>

        {/* Pose Analyzer */}
        {isSessionActive && sessionId && (
          <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Real-Time Pose Analysis</h2>
            <PoseAnalyzerIntegration
              exercise="squat"
              sessionId={sessionId}
              userId={user.id}
              onAnalysisResult={handleAnalysisResult}
            />
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResults.length > 0 && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Analysis Results ({analysisResults.length})
              </h2>
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Clear Results
              </Button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analysisResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      Analysis #{index + 1}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Source:</span> {result.source || "backend"}</p>
                    <p><span className="font-medium">Session ID:</span> {result.data?.sessionId || "N/A"}</p>
                    <p><span className="font-medium">Status:</span> {result.success ? "Success" : "Failed"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        {!isSessionActive && (
          <Card className="p-6 bg-gradient-to-r from-mint-50 to-purple-50 border-0 shadow-lg rounded-3xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">How to Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center text-mint-600 font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Start Session</h3>
                  <p className="text-sm text-gray-600">Click "Start Session" to begin pose tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Allow Camera</h3>
                  <p className="text-sm text-gray-600">Grant camera permissions for pose detection</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Watch Results</h3>
                  <p className="text-sm text-gray-600">See real-time analysis sent to backend</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
