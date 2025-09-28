"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderPatientConnection } from "./provider-patient-connection"
import { useAuth } from "@/contexts/auth-context"
import { authService, type User, type ProgressEntry } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"
import { UserIcon, FileText, Clock, Search, Download, ArrowLeft } from "lucide-react"

interface PatientManagementProps {
  isVisible: boolean
  onBack?: () => void // Added onBack prop for back button functionality
}

export function PatientManagement({ isVisible, onBack }: PatientManagementProps) {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<User[]>([])
  const [patientProgress, setPatientProgress] = useState<ProgressEntry[]>([])

  useEffect(() => {
    if (user && user.role === "healthcare_provider") {
      loadPatients()
    }
  }, [user])

  useEffect(() => {
    if (selectedPatient) {
      loadPatientProgress(selectedPatient.id)
    }
  }, [selectedPatient])

  const loadPatients = async () => {
    if (!user) return
    try {
      const res = await apiClient.getProviderConnections(user.id)
      setPatients((res.data?.connections as User[]) ?? [])
    } catch {
      setPatients([])
    }
  }

  const loadPatientProgress = (patientId: string) => {
    const progress = authService.getProgressByPatient(patientId)
    setPatientProgress(progress)
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.medicalHistory &&
        patient.medicalHistory.some((condition) => condition.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  const getProgressScore = (patientId: string) => {
    const progress = authService.getProgressByPatient(patientId)
    if (progress.length === 0) return 0
    const avgScore = progress.reduce((sum, entry) => sum + entry.formScore, 0) / progress.length
    return Math.round(avgScore)
  }

  const getRiskLevel = (patientId: string) => {
    const progressScore = getProgressScore(patientId)
    if (progressScore >= 80) return "low"
    if (progressScore >= 60) return "medium"
    return "high"
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  if (!isVisible) return null

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
            )}
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <UserIcon className="w-6 h-6 text-mint-500" />
              Patient Management
            </h2>
          </div>
        </div>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="connections" className="rounded-xl">
              Connections
            </TabsTrigger>
            <TabsTrigger value="patients" className="rounded-xl">
              My Patients
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl">
              Recent Sessions
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4 mt-6">
            <ProviderPatientConnection />
          </TabsContent>

          <TabsContent value="patients" className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredPatients.map((patient) => {
                const progressScore = getProgressScore(patient.id)
                const riskLevel = getRiskLevel(patient.id)
                const lastSession =
                  patientProgress.length > 0
                    ? new Date(Math.max(...patientProgress.map((p) => new Date(p.date).getTime()))).toLocaleDateString()
                    : "No sessions yet"

                return (
                  <Card
                    key={patient.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 rounded-2xl hover:border-mint-300"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                          <Badge className={`${getRiskColor(riskLevel)} rounded-full border`}>{riskLevel} risk</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {patient.medicalHistory && patient.medicalHistory.length > 0
                            ? patient.medicalHistory.join(", ")
                            : "No medical history recorded"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Age:{" "}
                            {patient.dateOfBirth
                              ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
                              : "N/A"}
                          </span>
                          <span>Last session: {lastSession}</span>
                          <span>Progress: {progressScore}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-mint-600">{progressScore}%</div>
                        <div className="text-xs text-gray-500">Progress Score</div>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No patients found.</p>
                  <p className="text-sm">Connect with patients using the Connections tab.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-6">
            <Card className="p-4 border border-gray-200 rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <Clock className="w-4 h-4 text-mint-500" />
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {patients.map((patient) => {
                  const progress = authService.getProgressByPatient(patient.id)
                  const recentSession = progress.length > 0 ? progress[progress.length - 1] : null

                  return (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">{patient.name}</p>
                        <p className="text-sm text-gray-600">
                          {recentSession
                            ? `${recentSession.exerciseType} • ${new Date(recentSession.date).toLocaleDateString()}`
                            : "No sessions yet"}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {recentSession ? `${recentSession.formScore}% avg` : "N/A"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 mt-6">
            <Card className="p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-800">
                  <FileText className="w-4 h-4 text-mint-500" />
                  Clinical Reports
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl border-gray-200 hover:bg-gray-50 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="font-medium text-gray-800">Weekly Progress Report</p>
                  <p className="text-sm text-gray-600">Comprehensive analysis of all patient sessions this week</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="font-medium text-gray-800">Risk Assessment Summary</p>
                  <p className="text-sm text-gray-600">Patients requiring additional attention or modified protocols</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="font-medium text-gray-800">Progress Trends</p>
                  <p className="text-sm text-gray-600">Monthly trends and improvement patterns across all patients</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedPatient && (
          <Card className="p-4 border-2 border-mint-200 rounded-2xl bg-mint-50/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Patient Details: {selectedPatient.name}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatient(null)}
                className="rounded-2xl border-gray-200 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600">{selectedPatient.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Age</p>
                <p className="text-sm text-gray-600">
                  {selectedPatient.dateOfBirth
                    ? new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()
                    : "Not provided"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2 text-gray-700">Medical History</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                    selectedPatient.medicalHistory.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="bg-pink-100 text-pink-700 rounded-full">
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No medical history recorded</p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2 text-gray-700">Recent Progress</p>
                <div className="space-y-2">
                  {patientProgress.slice(-3).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{entry.exerciseType}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
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
                  ))}
                  {patientProgress.length === 0 && <p className="text-sm text-gray-500">No progress data available</p>}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  )
}
