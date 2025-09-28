"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, LogIn, Activity, ArrowLeft } from "lucide-react"

interface SignInFormProps {
  onToggleMode: () => void
  onBack?: () => void
}

export function SignInForm({ onToggleMode, onBack }: SignInFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to sign in")
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
              <Activity className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Sign in to continue your wellness journey
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-2xl border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-mint-400 via-purple-400 to-pink-400 hover:from-mint-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-2xl h-12 font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={onToggleMode}
                  className="text-mint-500 hover:text-mint-600 font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 text-center space-y-1 bg-gray-50 p-3 rounded-2xl">
                <p className="font-semibold text-gray-600">Demo accounts:</p>
                <p>Provider: provider@demo.com / password123</p>
                <p>Patient: patient@demo.com / password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
