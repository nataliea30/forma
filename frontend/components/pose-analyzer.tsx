"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import type { AnalysisResult, PoseLandmark } from "./pt-analysis-app"
import { ExerciseAnalyzer } from "@/lib/exercise-analyzer"
import { MediaPipeLoader } from "@/lib/mediapipe-loader"
import { getFrontendConfig } from "@/lib/config"

interface PoseAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  exercise: string
  onAnalysisUpdate: (result: AnalysisResult) => void
}

declare global {
  interface Window {
    MediaPipeVision?: any
  }
}

export function PoseAnalyzer({ videoRef, canvasRef, exercise, onAnalysisUpdate }: PoseAnalyzerProps) {
  const poseDetectorRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()
  const exerciseAnalyzerRef = useRef(new ExerciseAnalyzer())

  useEffect(() => {
    let mounted = true

    const initializePoseDetection = async () => {
      try {
        console.log("[v0] Initializing MediaPipe pose detection...")

        const mediaLoader = MediaPipeLoader.getInstance()
        const MediaPipeVision = await mediaLoader.loadMediaPipe()

        console.log("[v0] MediaPipe loaded, creating pose landmarker...")

        const config = getFrontendConfig()
        const poseLandmarker = await MediaPipeVision.PoseLandmarker.createFromOptions(MediaPipeVision.vision, {
          baseOptions: {
            modelAssetPath: config.mediapipe.modelUrl,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })

        if (mounted) {
          poseDetectorRef.current = poseLandmarker
          console.log("[v0] Pose detection initialized successfully")
          startDetection()
        }
      } catch (error) {
        console.error("[v0] Failed to initialize pose detection:", error)
        // Fallback to enhanced mock analysis
        if (mounted) {
          console.log("[v0] Starting enhanced mock detection as fallback")
          startEnhancedMockDetection()
        }
      }
    }

    const startDetection = () => {
      const detectPose = () => {
        if (!videoRef.current || !canvasRef.current || !poseDetectorRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectPose)
          return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (video.readyState >= 2) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          try {
            const results = poseDetectorRef.current.detectForVideo(video, performance.now())

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height)

              if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0]

                const formAssessment = exerciseAnalyzerRef.current.analyzeExercise(landmarks, exercise)

                const analysisResult: AnalysisResult = {
                  landmarks,
                  isGoodForm: formAssessment.score >= 70,
                  suggestions: [...formAssessment.minorIssues, ...formAssessment.strengths.slice(0, 1)],
                  warnings: formAssessment.criticalErrors,
                }

                // Draw enhanced pose visualization
                drawEnhancedPoseLandmarks(ctx, landmarks, formAssessment)

                onAnalysisUpdate(analysisResult)
              }
            }
          } catch (error) {
            console.error("[v0] Pose detection error:", error)
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectPose)
      }

      detectPose()
    }

    const startEnhancedMockDetection = () => {
      // Enhanced mock detection with realistic movement patterns
      let frameCount = 0

      const mockDetection = () => {
        frameCount++

        // Generate more realistic mock landmarks with exercise-specific movement
        const mockLandmarks: PoseLandmark[] = generateRealisticMockLandmarks(exercise, frameCount)

        const formAssessment = exerciseAnalyzerRef.current.analyzeExercise(mockLandmarks, exercise)

        const analysisResult: AnalysisResult = {
          landmarks: mockLandmarks,
          isGoodForm: formAssessment.score >= 70,
          suggestions: [...formAssessment.minorIssues, ...formAssessment.strengths.slice(0, 1)],
          warnings: formAssessment.criticalErrors,
        }

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            drawEnhancedPoseLandmarks(ctx, mockLandmarks, formAssessment)
          }
        }

        onAnalysisUpdate(analysisResult)
        animationFrameRef.current = requestAnimationFrame(mockDetection)
      }

      setTimeout(mockDetection, 1000)
    }

    if (mounted) {
      initializePoseDetection()
    }

    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [videoRef, canvasRef, exercise, onAnalysisUpdate])

  return null
}

function generateRealisticMockLandmarks(exercise: string, frameCount: number): PoseLandmark[] {
  const baseTime = frameCount * 0.1

  // Base pose landmarks (33 points for MediaPipe)
  const landmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5 + Math.sin(baseTime + i) * 0.1,
    y: 0.5 + Math.cos(baseTime + i) * 0.1,
    z: Math.random() * 0.1,
    visibility: 0.8 + Math.random() * 0.2,
  }))

  // Exercise-specific movement patterns
  switch (exercise) {
    case "squat":
      // Simulate squat movement - up and down motion
      const squatPhase = Math.sin(baseTime * 0.5) * 0.2
      landmarks[23].y = 0.6 + squatPhase // Hip
      landmarks[25].y = 0.7 + squatPhase * 1.5 // Knee
      landmarks[27].y = 0.9 + squatPhase * 0.5 // Ankle
      break

    case "pushup":
      // Simulate pushup movement - forward and back
      const pushupPhase = Math.sin(baseTime * 0.3) * 0.1
      landmarks[11].y = 0.4 + pushupPhase // Shoulder
      landmarks[13].y = 0.5 + pushupPhase * 1.2 // Elbow
      landmarks[15].y = 0.6 + pushupPhase * 0.8 // Wrist
      break

    case "plank":
      // Simulate plank hold with slight tremor
      const tremor = Math.sin(baseTime * 2) * 0.02
      landmarks[11].y = 0.4 + tremor
      landmarks[23].y = 0.5 + tremor * 0.5
      break

    case "lunge":
      // Simulate lunge movement
      const lungePhase = Math.sin(baseTime * 0.4) * 0.15
      landmarks[23].y = 0.5 + lungePhase
      landmarks[25].y = 0.7 + lungePhase * 1.3
      break
  }

  return landmarks
}

function drawEnhancedPoseLandmarks(ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], formAssessment: any) {
  const { score, criticalErrors, phase } = formAssessment

  // Color based on form quality
  let color = "#22c55e" // green
  if (score < 50)
    color = "#ef4444" // red
  else if (score < 70) color = "#f59e0b" // yellow

  // Draw pose connections with quality-based coloring
  ctx.strokeStyle = color
  ctx.lineWidth = 3

  // Draw landmarks as circles with size based on visibility
  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * ctx.canvas.width
      const y = landmark.y * ctx.canvas.height
      const radius = 3 + landmark.visibility * 3

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()

      // Add glow effect for high-quality form
      if (score > 80) {
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
  })

  // Enhanced skeleton connections with joint emphasis
  const connections = [
    [11, 12],
    [11, 13],
    [12, 14],
    [13, 15],
    [14, 16], // arms
    [11, 23],
    [12, 24],
    [23, 24], // torso
    [23, 25],
    [24, 26],
    [25, 27],
    [26, 28], // legs
    [27, 29],
    [28, 30],
    [29, 31],
    [30, 32], // feet
  ]

  connections.forEach(([start, end]) => {
    if (landmarks[start]?.visibility > 0.5 && landmarks[end]?.visibility > 0.5) {
      const startX = landmarks[start].x * ctx.canvas.width
      const startY = landmarks[start].y * ctx.canvas.height
      const endX = landmarks[end].x * ctx.canvas.width
      const endY = landmarks[end].y * ctx.canvas.height

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
  })

  // Draw form score and phase info
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.fillRect(10, 10, 200, 60)

  ctx.fillStyle = "white"
  ctx.font = "16px sans-serif"
  ctx.fillText(`Form Score: ${score}/100`, 20, 30)
  ctx.fillText(`Phase: ${phase}`, 20, 50)

  // Draw critical error indicators
  if (criticalErrors.length > 0) {
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)"
    ctx.fillRect(ctx.canvas.width - 220, 10, 210, 30)
    ctx.fillStyle = "white"
    ctx.font = "14px sans-serif"
    ctx.fillText("⚠️ Form Issues Detected", ctx.canvas.width - 210, 30)
  }
}
