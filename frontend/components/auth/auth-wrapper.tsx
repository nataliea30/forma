"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import { LandingPage } from "@/components/landing-page"
import { PTAnalysisApp } from "@/components/pt-analysis-app"
import { Loader2 } from "lucide-react"

export function AuthWrapper() {
  const [authMode, setAuthMode] = useState<"landing" | "signin" | "signup">("landing")
  const [signUpRole, setSignUpRole] = useState<"healthcare_provider" | "patient" | null>(null)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-mint-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authMode === "landing") {
      return (
        <LandingPage
          onGetStarted={(role) => {
            setSignUpRole(role)
            setAuthMode("signup")
          }}
          onSignIn={() => setAuthMode("signin")}
        />
      )
    }

    if (authMode === "signup") {
      return (
        <SignUpForm
          defaultRole={signUpRole}
          onToggleMode={() => setAuthMode("signin")}
          onBack={() => setAuthMode("landing")}
        />
      )
    }

    return <SignInForm onToggleMode={() => setAuthMode("signup")} onBack={() => setAuthMode("landing")} />
  }

  return <PTAnalysisApp />
}
