"use client"

import { useState } from "react"
import PoseCamera from "@/components/PoseCamera"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, Activity } from "lucide-react"
import Link from "next/link"

export default function PoseTestPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)

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
                <Camera className="w-8 h-8 text-mint-500" />
                Pose Detection Test
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time pose landmark detection using MediaPipe
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/80 border-mint-200 text-mint-700">
              <Activity className="w-4 h-4 mr-2" />
              MediaPipe Vision
            </Badge>
            <Button
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-full bg-white/80 border-gray-200 hover:bg-gray-50"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">How to Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center text-mint-600 font-semibold text-sm">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Allow Camera Access</h3>
                <p className="text-sm text-gray-600">Click "Allow" when prompted for camera permissions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Position Yourself</h3>
                <p className="text-sm text-gray-600">Stand in front of the camera with good lighting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-semibold text-sm">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Check Console</h3>
                <p className="text-sm text-gray-600">Open browser DevTools to see landmark data</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pose Camera Component */}
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}>
          <div className={isFullscreen ? "h-full flex items-center justify-center" : ""}>
            <PoseCamera />
          </div>
        </div>

        {/* Technical Details */}
        <Card className="p-6 mt-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">MediaPipe Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 33 pose landmarks per person</li>
                <li>• Real-time detection at 30+ FPS</li>
                <li>• Works in browser (no server required)</li>
                <li>• Handles multiple poses simultaneously</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Landmark Data</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• X, Y coordinates (0-1 normalized)</li>
                <li>• Z depth (relative to hip center)</li>
                <li>• Visibility score (0-1 confidence)</li>
                <li>• 33 body keypoints per pose</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-mint-50 to-purple-50 border-0 shadow-lg rounded-3xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Next Steps</h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              Once you see pose landmarks being detected, you can:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Send landmark data to your backend API</li>
              <li>• Integrate with CedarOS for form analysis</li>
              <li>• Use Mastra for progress tracking</li>
              <li>• Add real-time feedback overlays</li>
            </ul>
            <div className="mt-4">
              <Link href="/">
                <Button className="bg-gradient-to-r from-mint-400 to-purple-400 text-white rounded-full px-6">
                  Go to Main App
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
