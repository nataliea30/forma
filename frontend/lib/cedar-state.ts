import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

export interface PTSessionState {
  // Session data
  sessionId: string
  startTime: number | null
  duration: number
  isActive: boolean

  // Exercise data
  currentExercise: string
  exerciseCount: number
  totalReps: number

  // Form analysis data
  currentFormScore: number
  averageFormScore: number
  formHistory: Array<{
    timestamp: number
    score: number
    phase: string
    issues: string[]
  }>

  // AI coaching data
  aiSuggestions: string[]
  coachingHistory: Array<{
    timestamp: number
    suggestion: string
    type: "form" | "motivation" | "safety"
  }>

  // User preferences
  preferences: {
    showOverlay: boolean
    aiCoachingEnabled: boolean
    voiceFeedback: boolean
    difficultyLevel: "beginner" | "intermediate" | "advanced"
  }
}

export interface PTSessionActions {
  // Session management
  startSession: (exercise: string) => void
  endSession: () => void
  updateDuration: () => void

  // Exercise tracking
  setCurrentExercise: (exercise: string) => void
  incrementReps: () => void

  // Form analysis
  updateFormScore: (score: number, phase: string, issues: string[]) => void

  // AI coaching
  addAISuggestion: (suggestion: string, type: "form" | "motivation" | "safety") => void
  clearSuggestions: () => void

  // Preferences
  updatePreferences: (preferences: Partial<PTSessionState["preferences"]>) => void

  // Reset
  resetSession: () => void
}

export type PTSessionStore = PTSessionState & PTSessionActions

const initialState: PTSessionState = {
  sessionId: "",
  startTime: null,
  duration: 0,
  isActive: false,
  currentExercise: "squat",
  exerciseCount: 0,
  totalReps: 0,
  currentFormScore: 0,
  averageFormScore: 0,
  formHistory: [],
  aiSuggestions: [],
  coachingHistory: [],
  preferences: {
    showOverlay: true,
    aiCoachingEnabled: true,
    voiceFeedback: false,
    difficultyLevel: "intermediate",
  },
}

export const usePTSessionStore = create<PTSessionStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    startSession: (exercise: string) => {
      const sessionId = `session_${Date.now()}`
      set({
        sessionId,
        startTime: Date.now(),
        isActive: true,
        currentExercise: exercise,
        exerciseCount: 1,
        formHistory: [],
        coachingHistory: [],
      })
    },

    endSession: () => {
      set({
        isActive: false,
        startTime: null,
        duration: 0,
      })
    },

    updateDuration: () => {
      const { startTime } = get()
      if (startTime) {
        set({ duration: Date.now() - startTime })
      }
    },

    setCurrentExercise: (exercise: string) => {
      set((state) => ({
        currentExercise: exercise,
        exerciseCount: state.exerciseCount + 1,
      }))
    },

    incrementReps: () => {
      set((state) => ({ totalReps: state.totalReps + 1 }))
    },

    updateFormScore: (score: number, phase: string, issues: string[]) => {
      set((state) => {
        const newFormEntry = {
          timestamp: Date.now(),
          score,
          phase,
          issues,
        }

        const newFormHistory = [...state.formHistory, newFormEntry].slice(-50) // Keep last 50 entries
        const averageScore = newFormHistory.reduce((sum, entry) => sum + entry.score, 0) / newFormHistory.length

        return {
          currentFormScore: score,
          averageFormScore: Math.round(averageScore),
          formHistory: newFormHistory,
        }
      })
    },

    addAISuggestion: (suggestion: string, type: "form" | "motivation" | "safety") => {
      set((state) => {
        const newCoachingEntry = {
          timestamp: Date.now(),
          suggestion,
          type,
        }

        return {
          aiSuggestions: [...state.aiSuggestions, suggestion].slice(-5), // Keep last 5 suggestions
          coachingHistory: [...state.coachingHistory, newCoachingEntry].slice(-100), // Keep last 100 entries
        }
      })
    },

    clearSuggestions: () => {
      set({ aiSuggestions: [] })
    },

    updatePreferences: (preferences) => {
      set((state) => ({
        preferences: { ...state.preferences, ...preferences },
      }))
    },

    resetSession: () => {
      set(initialState)
    },
  })),
)

// Cedar OS compatible hooks for AI agent interaction
export const usePTSessionData = () => {
  const store = usePTSessionStore()
  return {
    sessionData: {
      sessionId: store.sessionId,
      isActive: store.isActive,
      duration: store.duration,
      currentExercise: store.currentExercise,
      formScore: store.currentFormScore,
      averageScore: store.averageFormScore,
    },
    actions: {
      startSession: store.startSession,
      endSession: store.endSession,
      updateFormScore: store.updateFormScore,
    },
  }
}

export const usePTCoachingData = () => {
  const store = usePTSessionStore()
  return {
    suggestions: store.aiSuggestions,
    coachingHistory: store.coachingHistory,
    preferences: store.preferences,
    actions: {
      addSuggestion: store.addAISuggestion,
      clearSuggestions: store.clearSuggestions,
      updatePreferences: store.updatePreferences,
    },
  }
}
