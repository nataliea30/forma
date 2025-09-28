"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePTSessionStore, usePTCoachingData } from "@/lib/cedar-state"
import { PTMastraAgent } from "@/lib/mastra-agent"
import { apiClient } from "@/lib/api-client"
import { Bot, User, Send, Settings, Mic, MicOff } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: number
  metadata?: {
    formScore?: number
    exercise?: string
    suggestions?: string[]
  }
}

export function CedarAgentInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const { preferences, actions } = usePTCoachingData()
  const { currentExercise, currentFormScore, isActive } = usePTSessionStore()
  const mastraAgent = PTMastraAgent.getInstance()

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "agent",
          content:
            "Hi! I'm your AI PT coach. I'll help you improve your form and provide personalized guidance during your workout. Start exercising and I'll give you real-time feedback!",
          timestamp: Date.now(),
        },
      ])
    }
  }, [messages.length])

  // Auto-generate coaching messages based on form analysis
  useEffect(() => {
    if (!isActive || !preferences.aiCoachingEnabled) return

    const generateContextualCoaching = async () => {
      if (currentFormScore > 0) {
        try {
          const response = await mastraAgent.analyzePoseWithAI({
            exercise: currentExercise,
            landmarks: [], // Would be populated with actual landmarks
            formIssues: currentFormScore < 70 ? ["form-needs-improvement"] : [],
            currentPhase: "coaching-request",
          })

          if (response.suggestions.length > 0 || response.warnings.length > 0) {
            const coachingContent = [...response.suggestions, ...response.warnings, response.encouragement]
              .filter(Boolean)
              .join(" ")

            if (coachingContent) {
              const newMessage: ChatMessage = {
                id: `coaching-${Date.now()}`,
                type: "agent",
                content: coachingContent,
                timestamp: Date.now(),
                metadata: {
                  formScore: currentFormScore,
                  exercise: currentExercise,
                  suggestions: response.suggestions,
                },
              }

              setMessages((prev) => [...prev, newMessage].slice(-20)) // Keep last 20 messages
            }
          }
        } catch (error) {
          console.error("Failed to generate contextual coaching:", error)
        }
      }
    }

    // Generate coaching every 10 seconds during active session
    const interval = setInterval(generateContextualCoaching, 10000)
    return () => clearInterval(interval)
  }, [isActive, currentFormScore, currentExercise, preferences.aiCoachingEnabled, mastraAgent])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Generate GPT response using backend-proxied OpenAI API
      const systemPrompt =
        `You are Forma's AI PT coach. Provide concise, supportive, and practical guidance about exercise form, ` +
        `progressions, and safety. Use the provided context if available. Avoid medical diagnoses; instead suggest ` +
        `consulting a professional when necessary. Keep responses to 2-4 short sentences or a brief bullet list.` +
        (currentExercise ? ` Current exercise: ${currentExercise}.` : ``) +
        (currentFormScore ? ` Current form score: ${currentFormScore}/100.` : ``)

      // Use last 10 messages as chat history plus the new user message
      const history = [...messages, userMessage]
        .slice(-10)
        .map((m) => ({
          role: m.type === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }))

      const gpt = await apiClient.gptChat(
        [{ role: "system", content: systemPrompt }, ...history],
        { temperature: 0.7 }
      )

      const reply = (gpt.data as any)?.reply?.trim() ||
        "Thanks for the question. Focus on stable alignment, controlled tempo, and breathing. Let me know what feels challenging."

      const agentResponse: ChatMessage = {
        id: `agent-${Date.now()}`,
        type: "agent",
        content: reply,
        timestamp: Date.now(),
        metadata: {
          formScore: currentFormScore,
          exercise: currentExercise,
        },
      }

      setMessages((prev) => [...prev, agentResponse])
    } catch (error) {
      console.error("Failed to get AI response:", error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "agent",
        content:
          "I'm having trouble processing your request right now. Please continue with your exercise and I'll help you with form feedback.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVoiceInput = () => {
    const w = window as any
    if (!("webkitSpeechRecognition" in w) && !("SpeechRecognition" in w)) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    if (isListening) {
      setIsListening(false)
      // Stop speech recognition (not persisted between toggles in this simple demo)
    } else {
      setIsListening(true)
      // Start speech recognition
      const SpeechRecognitionCtor = w.webkitSpeechRecognition || w.SpeechRecognition
      const recognition = new SpeechRecognitionCtor()

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="flex flex-col max-h-96 min-h-0">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Coach Chat
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active Session" : "Inactive"}</Badge>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 h-64 min-h-0 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              {message.type === "agent" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}>
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                  } break-words whitespace-pre-wrap`}
                >
                  {message.content}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{formatTime(message.timestamp)}</span>
                  {message.metadata?.formScore && (
                    <Badge variant="outline" className="text-xs">
                      Form: {message.metadata.formScore}/100
                    </Badge>
                  )}
                  {message.metadata?.exercise && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {message.metadata.exercise}
                    </Badge>
                  )}
                </div>
              </div>

              {message.type === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your form, get exercise tips..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoiceInput}
            className={isListening ? "bg-red-100 dark:bg-red-900" : ""}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
