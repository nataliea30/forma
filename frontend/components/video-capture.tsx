"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { ExerciseAnalyzer } from "@/lib/exercise-analyzer"
import { MediaPipeLoader } from "@/lib/mediapipe-loader"
import { getFrontendConfig } from "@/lib/config"

interface VideoCaptureProps {
  exercise: string
  isRecording: boolean
  onAnalysisUpdate: (result: any) => void
}

export const VideoCapture = forwardRef<HTMLVideoElement, VideoCaptureProps>(
  ({ exercise, isRecording, onAnalysisUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const detectorRef = useRef<any>(null)
    const animationRef = useRef<number>()
    const analyzerRef = useRef(new ExerciseAnalyzer())

    useImperativeHandle(ref, () => videoRef.current!, [])

    useEffect(() => {
      const startCameraAndDetection = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: false,
          })

          if (videoRef.current) {
            videoRef.current.srcObject = stream
            streamRef.current = stream
            videoRef.current.onloadedmetadata = async () => {
              // Init pose detection
              const mediaLoader = MediaPipeLoader.getInstance()
              const MediaPipeVision = await mediaLoader.loadMediaPipe()
              const config = getFrontendConfig()
              detectorRef.current = await MediaPipeVision.PoseLandmarker.createFromOptions(
                MediaPipeVision.vision,
                {
                  baseOptions: { modelAssetPath: config.mediapipe.modelUrl, delegate: "GPU" },
                  runningMode: "VIDEO",
                  numPoses: 1,
                }
              )
              detect()
            }
          }
        } catch (err) {
          console.error("Error initializing video/pose detection", err)
        }
      }

      const detect = () => {
        if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
          animationRef.current = requestAnimationFrame(detect)
          return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (video.readyState >= 2) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }
          try {
            const results = detectorRef.current.detectForVideo(video, performance.now())
            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0]
              const assessment = analyzerRef.current.analyzeExercise(landmarks, exercise)
              const analysisResult = {
                landmarks,
                isGoodForm: assessment.score >= 70,
                suggestions: [...assessment.minorIssues, ...assessment.strengths.slice(0, 1)],
                warnings: assessment.criticalErrors,
              }
              ctx?.clearRect(0, 0, canvas.width, canvas.height)
              onAnalysisUpdate(analysisResult)
            }
          } catch (e) {
            console.error("Pose detection error", e)
          }
        }
        animationRef.current = requestAnimationFrame(detect)
      }

      if (isRecording) {
        startCameraAndDetection()
      } else {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      }

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }, [isRecording, exercise, onAnalysisUpdate])

    return (
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">
              Camera will start when recording begins
            </p>
          </div>
        )}
      </div>
    )
  }
)

VideoCapture.displayName = "VideoCapture"
