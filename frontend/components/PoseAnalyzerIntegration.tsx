"use client"

import { useEffect, useRef, useState } from "react"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { Send, Activity, Wifi, WifiOff } from "lucide-react"

interface PoseAnalyzerIntegrationProps {
  exercise?: string
  sessionId?: string
  userId?: string
  onAnalysisResult?: (result: any) => void
}

export default function PoseAnalyzerIntegration({
  exercise = "squat",
  sessionId,
  userId,
  onAnalysisResult
}: PoseAnalyzerIntegrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [landmarks, setLandmarks] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let landmarker: PoseLandmarker | null = null
    let animationId: number | null = null
    let analysisInterval: NodeJS.Timeout | null = null

    async function initPose() {
      try {
        setError(null)
        setIsDetecting(true)

        // Initialize MediaPipe Vision Tasks
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )

        // Create pose landmarker
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })

        // Start webcam
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 640, 
              height: 480,
              facingMode: 'user'
            } 
          })
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        // Run detection loop
        const detect = async () => {
          if (!landmarker || !videoRef.current || !canvasRef.current) return

          try {
            const results = await landmarker.detectForVideo(videoRef.current, Date.now())

            if (results.landmarks && results.landmarks.length > 0) {
              const poseLandmarks = results.landmarks[0]
              setLandmarks(poseLandmarks)
              
              // Draw pose on canvas
              drawPose(canvasRef.current, poseLandmarks, videoRef.current)
            } else {
              setLandmarks([])
            }
          } catch (err) {
            console.error("Detection error:", err)
          }

          animationId = requestAnimationFrame(detect)
        }

        detect()

        // Set up periodic analysis (every 2 seconds)
        analysisInterval = setInterval(async () => {
          if (landmarks.length > 0 && sessionId && userId && !isAnalyzing) {
            await sendPoseAnalysis()
          }
        }, 2000)

      } catch (err) {
        console.error("Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize pose detection")
        setIsDetecting(false)
      }
    }

    // Send pose analysis to backend
    const sendPoseAnalysis = async () => {
      if (!landmarks.length || !sessionId || !userId || isAnalyzing) return

      try {
        setIsAnalyzing(true)
        setIsConnected(true)

        const response = await apiClient.analyzePose({
          exercise,
          landmarks: landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
            visibility: landmark.visibility || 1.0
          })),
          sessionId,
          userId
        })

        setLastAnalysis(response)
        onAnalysisResult?.(response)
        
        console.log("Pose analysis sent to backend:", response)
      } catch (err) {
        console.error("Analysis error:", err)
        setIsConnected(false)
        setError(err instanceof Error ? err.message : "Failed to send analysis")
      } finally {
        setIsAnalyzing(false)
      }
    }

    // Draw pose landmarks on canvas
    const drawPose = (canvas: HTMLCanvasElement, landmarks: any[], video: HTMLVideoElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw landmarks
      ctx.fillStyle = '#00ff00'
      landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })

      // Draw connections between key points
      const connections = [
        [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
        [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
        [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
      ]

      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          ctx.beginPath()
          ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height)
          ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height)
          ctx.stroke()
        }
      })
    }

    initPose()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (analysisInterval) {
        clearInterval(analysisInterval)
      }
      if (landmarker) {
        landmarker.close()
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [exercise, sessionId, userId, landmarks.length, isAnalyzing])

  const handleManualAnalysis = async () => {
    if (landmarks.length > 0 && sessionId && userId) {
      await sendPoseAnalysis()
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Feed */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <video 
            ref={videoRef} 
            className="w-full max-w-md mx-auto rounded-lg shadow-lg" 
            autoPlay 
            muted
            playsInline
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full max-w-md mx-auto rounded-lg pointer-events-none"
          />
        </div>
      </div>

      {/* Status Panel */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Detection Status */}
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-gray-800">Pose Detection</h3>
            <Badge 
              variant={isDetecting ? "default" : "secondary"}
              className={`px-4 py-2 ${
                isDetecting ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              {isDetecting ? "Active" : "Inactive"}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              {landmarks.length} landmarks detected
            </p>
          </div>

          {/* Backend Connection */}
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-gray-800">Backend Connection</h3>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={`px-4 py-2 ${
                isConnected ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {isConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              {isAnalyzing ? "Analyzing..." : "Ready"}
            </p>
          </div>

          {/* Manual Analysis */}
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-gray-800">Manual Analysis</h3>
            <Button
              onClick={handleManualAnalysis}
              disabled={!landmarks.length || !sessionId || !userId || isAnalyzing}
              className="w-full bg-gradient-to-r from-mint-400 to-purple-400 text-white rounded-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Analysis
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              <span className="font-medium">Error:</span> {error}
            </p>
          </div>
        )}

        {lastAnalysis && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Last Analysis Result:</h4>
            <div className="text-sm text-green-700">
              <p>Source: {lastAnalysis.source || "backend"}</p>
              <p>Session ID: {lastAnalysis.data?.sessionId || "N/A"}</p>
              <p>Timestamp: {lastAnalysis.data?.timestamp || "N/A"}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
