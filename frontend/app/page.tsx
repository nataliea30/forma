"use client"

import { AuthWrapper } from "@/components/auth/auth-wrapper"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AuthWrapper />
    </main>
  )
}
