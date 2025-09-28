"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield, Phone, StopCircle, Heart, Activity, CheckCircle } from "lucide-react"

interface SafetyProtocolsProps {
  isPatientMode: boolean
  currentFormScore: number
  exerciseDuration: number
  onEmergencyStop: () => void
}

interface SafetyAlert {
  id: string
  type: "warning" | "danger" | "info"
  message: string
  timestamp: number
  acknowledged: boolean
}

export function SafetyProtocols({
  isPatientMode,
  currentFormScore,
  exerciseDuration,
  onEmergencyStop,
}: SafetyProtocolsProps) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [emergencyMode, setEmergencyMode] = useState(false)

  // Safety monitoring logic
  useEffect(() => {
    const checkSafetyConditions = () => {
      const newAlerts: SafetyAlert[] = []

      // Form score safety check
      if (currentFormScore > 0 && currentFormScore < 40) {
        newAlerts.push({
          id: `form_${Date.now()}`,
          type: "danger",
          message: "Poor form detected! Stop exercise immediately to prevent injury.",
          timestamp: Date.now(),
          acknowledged: false,
        })
      } else if (currentFormScore > 0 && currentFormScore < 60) {
        newAlerts.push({
          id: `form_warn_${Date.now()}`,
          type: "warning",
          message: "Form needs improvement. Focus on proper technique.",
          timestamp: Date.now(),
          acknowledged: false,
        })
      }

      // Duration safety check (especially for patients)
      if (isPatientMode && exerciseDuration > 1800000) {
        // 30 minutes
        newAlerts.push({
          id: `duration_${Date.now()}`,
          type: "warning",
          message: "Consider taking a break. You've been exercising for over 30 minutes.",
          timestamp: Date.now(),
          acknowledged: false,
        })
      }

      // Add new alerts that aren't duplicates
      setAlerts((prev) => {
        const existingTypes = prev.map((alert) => alert.message)
        const uniqueNewAlerts = newAlerts.filter((alert) => !existingTypes.includes(alert.message))
        return [...prev, ...uniqueNewAlerts].slice(-10) // Keep last 10 alerts
      })
    }

    const interval = setInterval(checkSafetyConditions, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [currentFormScore, exerciseDuration, isPatientMode])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const handleEmergencyStop = () => {
    setEmergencyMode(true)
    onEmergencyStop()

    // Auto-reset emergency mode after 10 seconds
    setTimeout(() => setEmergencyMode(false), 10000)
  }

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)
  const dangerAlerts = activeAlerts.filter((alert) => alert.type === "danger")

  return (
    <div className="space-y-4">
      {/* Emergency Stop Button - Always Visible */}
      <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StopCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Emergency Stop</p>
              <p className="text-sm text-red-600 dark:text-red-300">Stop immediately if you feel pain or discomfort</p>
            </div>
          </div>
          <Button variant="destructive" size="lg" onClick={handleEmergencyStop} className="bg-red-600 hover:bg-red-700">
            <StopCircle className="w-4 h-4 mr-2" />
            STOP
          </Button>
        </div>
      </Card>

      {/* Emergency Mode Active */}
      {emergencyMode && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Emergency stop activated.</strong> Exercise session has been terminated. If you're experiencing pain
            or injury, please consult a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Safety Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            Safety Alerts
          </h3>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <Alert
                key={alert.id}
                className={
                  alert.type === "danger"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : alert.type === "warning"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-950"
                }
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    alert.type === "danger"
                      ? "text-red-600"
                      : alert.type === "warning"
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                />
                <AlertDescription className="flex items-center justify-between">
                  <span
                    className={
                      alert.type === "danger"
                        ? "text-red-800 dark:text-red-200"
                        : alert.type === "warning"
                          ? "text-yellow-800 dark:text-yellow-200"
                          : "text-blue-800 dark:text-blue-200"
                    }
                  >
                    {alert.message}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    OK
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {/* Patient-Specific Safety Guidelines */}
      {isPatientMode && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-600" />
            Safety Guidelines for Home Use
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Ensure you have adequate space and a non-slip surface</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Keep water nearby and stay hydrated</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Stop immediately if you experience pain, dizziness, or shortness of breath</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Follow your prescribed exercise plan and don't exceed recommended repetitions</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <p className="font-medium text-blue-800 dark:text-blue-200">Emergency Contacts</p>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>Emergency Services: 911</p>
              <p>Your Physical Therapist: [Contact Info]</p>
              <p>Healthcare Provider: [Contact Info]</p>
            </div>
          </div>
        </Card>
      )}

      {/* Safety Statistics */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          Safety Status
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Form Score</p>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  currentFormScore >= 80
                    ? "bg-green-100 text-green-800"
                    : currentFormScore >= 60
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {currentFormScore}/100
              </Badge>
              {currentFormScore >= 80 && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Session Duration</p>
            <p className="font-medium">
              {Math.floor(exerciseDuration / 60000)}:{((exerciseDuration % 60000) / 1000).toFixed(0).padStart(2, "0")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Safety Alerts</p>
            <p className="font-medium">{dangerAlerts.length} active</p>
          </div>
          <div>
            <p className="text-muted-foreground">Risk Level</p>
            <Badge
              className={
                dangerAlerts.length > 0
                  ? "bg-red-100 text-red-800"
                  : activeAlerts.length > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
              }
            >
              {dangerAlerts.length > 0 ? "High" : activeAlerts.length > 0 ? "Medium" : "Low"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
