"use client"

import { useEffect, useRef, useState } from "react"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"

export default function PoseCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [landmarks, setLandmarks] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let landmarker: PoseLandmarker | null = null
    let animationId: number | null = null

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
              
              // Log landmarks for debugging
              console.log("Pose landmarks detected:", poseLandmarks.length, "points")
              
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
      } catch (err) {
        console.error("Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize pose detection")
        setIsDetecting(false)
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
        
        // Draw landmark index
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(index.toString(), x + 5, y - 5)
        ctx.fillStyle = '#00ff00'
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
      if (landmarker) {
        landmarker.close()
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
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
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Pose Detection Status</h3>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              isDetecting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isDetecting ? 'Detecting' : 'Not Detecting'}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Landmarks:</span> 
            <span className="ml-2 font-mono">{landmarks.length} points</span>
          </p>
          {error && (
            <p className="text-sm text-red-600">
              <span className="font-medium">Error:</span> {error}
            </p>
          )}
        </div>
        
        {landmarks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Sample Landmarks (first 5):</h4>
            <div className="bg-gray-200 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
              {landmarks.slice(0, 5).map((landmark, index) => (
                <div key={index}>
                  {index}: x={landmark.x.toFixed(3)}, y={landmark.y.toFixed(3)}, z={landmark.z.toFixed(3)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
