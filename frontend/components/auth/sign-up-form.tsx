"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, UserPlus, Stethoscope, Heart, ArrowLeft } from "lucide-react"

interface SignUpFormProps {
  onToggleMode: () => void
  defaultRole?: "healthcare_provider" | "patient" | null
  onBack?: () => void
}

export function SignUpForm({ onToggleMode, defaultRole, onBack }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as "healthcare_provider" | "patient" | "",
    specialization: "",
    licenseNumber: "",
    dateOfBirth: "",
    medicalHistory: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { signUp } = useAuth()

  useEffect(() => {
    if (defaultRole) {
      setFormData((prev) => ({ ...prev, role: defaultRole }))
    }
  }, [defaultRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.role) {
      setError("Please select your role")
      return
    }

    setLoading(true)

    try {
      const additionalData: any = {}

      if (formData.role === "healthcare_provider") {
        additionalData.specialization = formData.specialization
        additionalData.licenseNumber = formData.licenseNumber
      } else {
        additionalData.dateOfBirth = formData.dateOfBirth
        additionalData.medicalHistory = formData.medicalHistory
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }

      const result = await signUp(formData.email, formData.password, formData.name, formData.role, additionalData)

      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mint-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-gradient-to-r from-mint-50/80 to-purple-50/80">
            {onBack && (
              <div className="flex justify-start mb-2">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="p-2 hover:bg-white/50 rounded-full transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            )}
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-mint-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Join Forma
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Create your account to start your wellness journey
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                  I am a...
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "healthcare_provider" | "patient") => {
                    console.log("[v0] Role selected:", value)
                    setFormData((prev) => ({ ...prev, role: value }))
                  }}
                  disabled={!!defaultRole}
                >
                  <SelectTrigger className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200 bg-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-xl bg-white z-50">
                    <SelectItem
                      value="healthcare_provider"
                      className="rounded-xl hover:bg-mint-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-mint-500" />
                        Healthcare Provider
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="patient"
                      className="rounded-xl hover:bg-pink-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        Patient
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {process.env.NODE_ENV === "development" && (
                  <div className="text-xs text-gray-500">
                    Current role: {formData.role || "None selected"} | Default role: {defaultRole || "None"}
                  </div>
                )}
              </div>

              {formData.role === "healthcare_provider" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                      className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                      placeholder="e.g., Physical Therapy, Sports Medicine"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-sm font-semibold text-gray-700">
                      License Number
                    </Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                      className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                      placeholder="Professional license number"
                    />
                  </div>
                </>
              )}

              {formData.role === "patient" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory" className="text-sm font-semibold text-gray-700">
                      Medical History (Optional)
                    </Label>
                    <Input
                      id="medicalHistory"
                      type="text"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, medicalHistory: e.target.value }))}
                      className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                      placeholder="Separate conditions with commas"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="rounded-2xl border-gray-200 focus:border-mint-400 focus:ring-mint-400 h-12 transition-all duration-200"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-2xl border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !formData.role}
                className="w-full bg-gradient-to-r from-mint-400 via-purple-400 to-pink-400 hover:from-mint-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-2xl h-12 font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={onToggleMode}
                  className="text-mint-500 hover:text-mint-600 font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
