"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Home, Shield } from "lucide-react"

export interface UserRole {
  type: "therapist" | "patient"
  name: string
  id?: string
}

interface UserRoleSelectorProps {
  onRoleSelect: (role: UserRole) => void
  currentRole?: UserRole
}

export function UserRoleSelector({ onRoleSelect, currentRole }: UserRoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(currentRole || null)

  const roles = [
    {
      type: "therapist" as const,
      title: "Healthcare Provider",
      description: "Physical therapist, clinician, or healthcare professional",
      icon: Stethoscope,
      features: [
        "Patient management",
        "Clinical notes & reports",
        "Progress tracking",
        "Professional analytics",
        "Remote monitoring",
      ],
      color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    },
    {
      type: "patient" as const,
      title: "Patient/Home User",
      description: "Individual using the app for personal physical therapy",
      icon: Home,
      features: [
        "Simplified interface",
        "Safety-first feedback",
        "Progress tracking",
        "Exercise guidance",
        "Emergency protocols",
      ],
      color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    },
  ]

  const handleRoleSelect = (roleType: "therapist" | "patient") => {
    const role: UserRole = {
      type: roleType,
      name: roleType === "therapist" ? "Healthcare Provider" : "Patient",
      id: `${roleType}_${Date.now()}`,
    }
    setSelectedRole(role)
    onRoleSelect(role)
  }

  if (currentRole) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentRole.type === "therapist" ? (
              <Stethoscope className="w-5 h-5 text-blue-600" />
            ) : (
              <Home className="w-5 h-5 text-green-600" />
            )}
            <div>
              <p className="font-medium">{currentRole.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentRole.type === "therapist" ? "Professional Mode" : "Patient Mode"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onRoleSelect({ type: "patient", name: "" })}>
            Switch Mode
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Welcome to PT Form Analyzer</h2>
        <p className="text-muted-foreground">Please select your user type to customize your experience</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card
              key={role.type}
              className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-102 ${role.color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-background">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleRoleSelect(role.type)}
                  className="w-full"
                  variant={role.type === "therapist" ? "default" : "secondary"}
                >
                  Continue as {role.title}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Privacy & Security</p>
            <p className="text-muted-foreground">
              All video analysis is processed locally in your browser. No video data is transmitted or stored on
              external servers. Healthcare providers can securely manage patient data with HIPAA-compliant features.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
