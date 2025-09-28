"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, Camera } from "lucide-react"

interface Exercise {
  id: string
  name: string
  description: string
}

interface ControlPanelProps {
  exercises: Exercise[]
  selectedExercise: string
  onExerciseChange: (exercise: string) => void
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
}

export function ControlPanel({
  exercises,
  selectedExercise,
  onExerciseChange,
  isRecording,
  onStartRecording,
  onStopRecording,
}: ControlPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="space-y-1">
            <label className="text-sm font-medium">Exercise Type</label>
            <Select value={selectedExercise} onValueChange={onExerciseChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={onStartRecording} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Analysis
            </Button>
          ) : (
            <Button onClick={onStopRecording} variant="destructive" className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Stop Analysis
            </Button>
          )}

          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Camera className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>
    </Card>
  )
}
