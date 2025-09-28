"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "healthcare_provider" | "patient",
    additionalData?: any,
  ) => Promise<{ user: User; error?: string }>
  signIn: (email: string, password: string) => Promise<{ user: User; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ensure API client has token on mount (hydrates from localStorage if present)
    try {
      const storedToken = localStorage.getItem('pt_app_token')
      if (storedToken) {
        apiClient.setToken(storedToken)
      }
    } catch {
      // ignore
    }

    // Check for existing user on mount from localStorage (temporary)
    // In a real app, you'd validate the session with the backend
    const currentUserStr = localStorage.getItem('pt_app_current_user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('pt_app_current_user')
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "healthcare_provider" | "patient",
    additionalData?: any,
  ) => {
    const result = await apiClient.signUp(email, password, name, role, additionalData)
    
    if (result.error) {
      return { user: null as any, error: result.error }
    }

    if (result.data?.user) {
      // Persist JWT for backend API calls
      if ((result.data as any).token) {
        apiClient.setToken((result.data as any).token)
      }
      // Store user in localStorage (temporary - in real app, use secure cookies)
      localStorage.setItem('pt_app_current_user', JSON.stringify(result.data.user))
      setUser(result.data.user)
      return { user: result.data.user }
    }

    return { user: null as any, error: 'Sign up failed' }
  }

  const signIn = async (email: string, password: string) => {
    const result = await apiClient.signIn(email, password)
    
    if (result.error) {
      return { user: null as any, error: result.error }
    }

    if (result.data?.user) {
      // Persist JWT for backend API calls
      if ((result.data as any).token) {
        apiClient.setToken((result.data as any).token)
      }
      // Store user in localStorage (temporary - in real app, use secure cookies)
      localStorage.setItem('pt_app_current_user', JSON.stringify(result.data.user))
      setUser(result.data.user)
      return { user: result.data.user }
    }

    return { user: null as any, error: 'Sign in failed' }
  }

  const signOut = async () => {
    // Call backend sign out
    await apiClient.signOut()
    // Clear token for subsequent requests
    apiClient.setToken(null)
    
    // Clear local storage
    localStorage.removeItem('pt_app_current_user')
    setUser(null)
  }

  const refreshUser = () => {
    // In a real app, you'd validate the session with the backend
    const currentUserStr = localStorage.getItem('pt_app_current_user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('pt_app_current_user')
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
