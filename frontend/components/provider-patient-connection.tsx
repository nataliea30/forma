"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { type User } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"
import { Search, UserPlus, Users, Clock, CheckCircle } from "lucide-react"

export function ProviderPatientConnection() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [myConnections, setMyConnections] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const isProvider = user?.role === "healthcare_provider"
  const isPatient = user?.role === "patient"

  useEffect(() => {
    void loadConnections()
  }, [user])

  const loadConnections = async () => {
    if (!user) return

    try {
      if (isProvider) {
        const res = await apiClient.getProviderConnections(user.id)
        setMyConnections(res.data?.connections as User[] ?? [])
      } else if (isPatient) {
        const res = await apiClient.getPatientConnections(user.id)
        setMyConnections(res.data?.connections as User[] ?? [])
      }
    } catch (e) {
      setMyConnections([])
    }
  }

  const handleSearch = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (isProvider) {
        // Providers search for patients by name/email/medical history (server-backed)
        const res = await apiClient.searchUsers("patient", searchQuery)
        setSearchResults((res.data?.users as User[]) ?? [])
      } else if (isPatient) {
        // Patients search for providers by name or specialization (server-backed)
        const res = await apiClient.searchUsers("healthcare_provider", searchQuery)
        setSearchResults((res.data?.users as User[]) ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (targetUserId: string) => {
    if (!user) return

    try {
      if (isProvider) {
        const res = await apiClient.connectPatientToProvider(targetUserId, user.id)
        if (res.error) {
          alert(res.error)
          return
        }
      } else {
        const res = await apiClient.connectPatientToProvider(user.id, targetUserId)
        if (res.error) {
          alert(res.error)
          return
        }
      }

      alert("Connected successfully!")
      setSearchResults([])
      setSearchQuery("")
      void loadConnections()
    } catch (error) {
      alert("Failed to create connection")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-mint-50 to-purple-50 rounded-t-3xl">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-mint-500" />
            {isProvider ? "Patient Connections" : "Healthcare Provider Connections"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isProvider
              ? "Connect with patients to track their progress and provide guidance"
              : "Connect with healthcare providers for personalized therapy guidance"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-2xl">
              <TabsTrigger value="search" className="rounded-xl">
                <Search className="w-4 h-4 mr-2" />
                Find {isProvider ? "Patients" : "Providers"}
              </TabsTrigger>
              <TabsTrigger value="connections" className="rounded-xl">
                <Users className="w-4 h-4 mr-2" />
                My Connections ({myConnections.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                      Search by {isProvider ? "patient name" : "provider name or specialization"}
                    </Label>
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isProvider ? "Enter patient name..." : "Enter provider name or specialization..."}
                      className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-mint-400 to-purple-400 hover:from-mint-500 hover:to-purple-500 text-white rounded-2xl px-6 mt-6"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-800">Search Results</h3>
                    {searchResults.map((result) => (
                      <Card key={result.id} className="p-4 border border-gray-200 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-800">{result.name}</h4>
                              <Badge
                                variant="secondary"
                                className={`${
                                  result.role === "healthcare_provider"
                                    ? "bg-mint-100 text-mint-700"
                                    : "bg-pink-100 text-pink-700"
                                } rounded-full`}
                              >
                                {result.role === "healthcare_provider" ? "Provider" : "Patient"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{result.email}</p>
                            {result.specialization && (
                              <p className="text-sm text-gray-500">Specialization: {result.specialization}</p>
                            )}
                            {result.dateOfBirth && (
                              <p className="text-sm text-gray-500">
                                Age: {new Date().getFullYear() - new Date(result.dateOfBirth).getFullYear()}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleConnect(result.id)}
                            className="bg-gradient-to-r from-mint-400 to-purple-400 hover:from-mint-500 hover:to-purple-500 text-white rounded-2xl"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No {isProvider ? "patients" : "providers"} found matching your search.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4 mt-6">
              {myConnections.length > 0 ? (
                <div className="space-y-3">
                  {myConnections.map((connection) => (
                    <Card key={connection.id} className="p-4 border border-gray-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{connection.name}</h4>
                            <Badge className="bg-green-100 text-green-700 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{connection.email}</p>
                          {connection.specialization && (
                            <p className="text-sm text-gray-500">Specialization: {connection.specialization}</p>
                          )}
                          {connection.medicalHistory && connection.medicalHistory.length > 0 && (
                            <p className="text-sm text-gray-500">Conditions: {connection.medicalHistory.join(", ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-gray-200 hover:bg-gray-50 bg-transparent"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            View Progress
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No connections yet.</p>
                  <p className="text-sm">
                    Use the search tab to find and connect with {isProvider ? "patients" : "healthcare providers"}.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
