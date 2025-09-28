
export interface PoseAnalysisData {
  exercise: string
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  formIssues: string[]
  currentPhase?: string
}

export interface MastraResponse {
  suggestions: string[]
  warnings: string[]
  encouragement?: string
  technicalExplanation?: string
}

export class PTMastraAgent {
  private static instance: PTMastraAgent
  private analysisHistory: PoseAnalysisData[] = []

  static getInstance(): PTMastraAgent {
    if (!PTMastraAgent.instance) {
      PTMastraAgent.instance = new PTMastraAgent()
    }
    return PTMastraAgent.instance
  }

  async analyzePoseWithAI(analysisData: PoseAnalysisData): Promise<MastraResponse> {
    try {
      console.log("[v0] Starting AI pose analysis for:", analysisData.exercise)

      // Add to history for context
      this.analysisHistory.push(analysisData)

      // Keep only last 10 analyses for context
      if (this.analysisHistory.length > 10) {
        this.analysisHistory = this.analysisHistory.slice(-10)
      }

      // Call the API route instead of OpenAI directly
      const response = await fetch('/api/analyze-pose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const result: MastraResponse = await response.json()
      return result
    } catch (error) {
      console.error("AI analysis failed:", error)
      return this.performLocalAnalysis(analysisData)
    }
  }

  private performLocalAnalysis(data: PoseAnalysisData): MastraResponse {
    const suggestions: string[] = []
    const warnings: string[] = []
    let encouragement: string | undefined
    let technicalExplanation: string | undefined

    // Analyze based on exercise type and form issues
    const exerciseAnalysis = this.getExerciseSpecificAnalysis(data.exercise, data.formIssues)
    suggestions.push(...exerciseAnalysis.suggestions)
    warnings.push(...exerciseAnalysis.warnings)

    // Analyze pose landmarks for additional insights
    const landmarkAnalysis = this.analyzeLandmarks(data.landmarks, data.exercise)
    if (landmarkAnalysis.suggestion) suggestions.push(landmarkAnalysis.suggestion)
    if (landmarkAnalysis.warning) warnings.push(landmarkAnalysis.warning)

    // Generate contextual feedback based on history
    const contextualFeedback = this.getContextualFeedback(data)
    if (contextualFeedback.suggestion) suggestions.push(contextualFeedback.suggestion)
    if (contextualFeedback.encouragement) encouragement = contextualFeedback.encouragement

    // Add technical explanation for major issues
    if (data.formIssues.length > 0) {
      technicalExplanation = this.getTechnicalExplanation(data.exercise, data.formIssues)
    }

    // Generate encouragement for good form
    if (data.formIssues.length === 0 && suggestions.length === 0) {
      encouragement = this.getPositiveEncouragement(data.exercise)
    }

    return {
      suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
      warnings: warnings.slice(0, 2), // Limit to top 2 warnings
      encouragement,
      technicalExplanation,
    }
  }

  private getExerciseSpecificAnalysis(
    exercise: string,
    formIssues: string[],
  ): { suggestions: string[]; warnings: string[] } {
    const suggestions: string[] = []
    const warnings: string[] = []

    switch (exercise) {
      case "squat":
        if (formIssues.includes("knee_valgus")) {
          suggestions.push("Focus on pushing your knees out in line with your toes")
        }
        if (formIssues.includes("forward_lean")) {
          suggestions.push("Keep your chest up and sit back into your hips more")
        }
        if (formIssues.includes("shallow_depth")) {
          suggestions.push("Try to get your hip crease below your knee cap")
        }
        if (formIssues.includes("heel_lift")) {
          warnings.push("Keep your heels planted - consider ankle mobility work")
        }
        break

      case "pushup":
        if (formIssues.includes("sagging_hips")) {
          warnings.push("Engage your core to prevent lower back strain")
          suggestions.push("Think about holding a plank position throughout")
        }
        if (formIssues.includes("flared_elbows")) {
          suggestions.push("Keep your elbows at about 45 degrees from your body")
        }
        if (formIssues.includes("partial_range")) {
          suggestions.push("Lower your chest closer to the ground")
        }
        break

      case "plank":
        if (formIssues.includes("sagging_hips")) {
          warnings.push("Lift your hips to protect your lower back")
        }
        if (formIssues.includes("raised_hips")) {
          suggestions.push("Lower your hips to create a straight line")
        }
        if (formIssues.includes("head_position")) {
          suggestions.push("Keep your head in neutral - look at the floor")
        }
        break

      case "lunge":
        if (formIssues.includes("knee_over_toe")) {
          warnings.push("Keep your front knee over your ankle, not past your toes")
        }
        if (formIssues.includes("leaning_forward")) {
          suggestions.push("Keep your torso upright and core engaged")
        }
        if (formIssues.includes("shallow_lunge")) {
          suggestions.push("Drop your back knee closer to the ground")
        }
        break
    }

    return { suggestions, warnings }
  }

  private analyzeLandmarks(
    landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
    exercise: string,
  ): { suggestion?: string; warning?: string } {
    if (!landmarks || landmarks.length === 0) {
      return {}
    }

    // Check landmark visibility for pose quality
    const visibleLandmarks = landmarks.filter((l) => l.visibility > 0.5)
    const visibilityRatio = visibleLandmarks.length / landmarks.length

    if (visibilityRatio < 0.7) {
      return {
        suggestion: "Try to stay fully visible in the camera frame for better analysis",
      }
    }

    // Exercise-specific landmark analysis
    switch (exercise) {
      case "squat":
        // Check for knee alignment (simplified)
        const kneeAlignment = this.checkKneeAlignment(landmarks)
        if (kneeAlignment === "valgus") {
          return { warning: "Watch your knee alignment - avoid letting knees cave inward" }
        }
        break

      case "pushup":
        // Check for body alignment
        const bodyAlignment = this.checkBodyAlignment(landmarks)
        if (bodyAlignment === "sagging") {
          return { warning: "Keep your body in a straight line - engage your core" }
        }
        break
    }

    return {}
  }

  private getContextualFeedback(data: PoseAnalysisData): { suggestion?: string; encouragement?: string } {
    if (this.analysisHistory.length < 3) {
      return {}
    }

    const recentAnalyses = this.analysisHistory.slice(-3)
    const consistentIssues = this.findConsistentIssues(recentAnalyses)

    if (consistentIssues.length > 0) {
      const primaryIssue = consistentIssues[0]
      return {
        suggestion: `You've had ${primaryIssue} for several reps - focus on this correction`,
      }
    }

    // Check for improvement
    const improvementDetected = this.detectImprovement(recentAnalyses)
    if (improvementDetected) {
      return {
        encouragement: "Great improvement! Your form is getting better with each rep",
      }
    }

    return {}
  }

  private checkKneeAlignment(
    landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  ): "good" | "valgus" | "varus" {
    // Simplified knee alignment check
    // In a real implementation, you'd use specific landmark indices for knees, hips, and ankles
    return "good" // Placeholder
  }

  private checkBodyAlignment(
    landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  ): "good" | "sagging" | "piked" {
    // Simplified body alignment check
    return "good" // Placeholder
  }

  private findConsistentIssues(analyses: PoseAnalysisData[]): string[] {
    const issueCount: { [key: string]: number } = {}

    analyses.forEach((analysis) => {
      analysis.formIssues.forEach((issue) => {
        issueCount[issue] = (issueCount[issue] || 0) + 1
      })
    })

    return Object.entries(issueCount)
      .filter(([_, count]) => count >= 2)
      .map(([issue, _]) => issue)
  }

  private detectImprovement(analyses: PoseAnalysisData[]): boolean {
    if (analyses.length < 2) return false

    const firstAnalysis = analyses[0]
    const lastAnalysis = analyses[analyses.length - 1]

    return lastAnalysis.formIssues.length < firstAnalysis.formIssues.length
  }

  private getTechnicalExplanation(exercise: string, formIssues: string[]): string {
    const explanations: { [key: string]: string } = {
      knee_valgus: "Knee valgus (inward collapse) increases ACL injury risk and reduces force production",
      forward_lean: "Excessive forward lean shifts load to your back instead of your legs",
      sagging_hips: "Hip sagging puts excessive stress on your lower back and reduces core activation",
      heel_lift: "Rising onto toes indicates ankle mobility limitations and reduces stability",
    }

    const primaryIssue = formIssues[0]
    return explanations[primaryIssue] || "Proper form ensures safety and maximizes exercise effectiveness"
  }

  private getPositiveEncouragement(exercise: string): string {
    const encouragements = [
      "Excellent form! Keep up the great work!",
      "Perfect technique - you're really getting the hang of this!",
      "Outstanding control and alignment!",
      "Your form is looking fantastic - keep it up!",
      "Great job maintaining proper technique!",
    ]

    return encouragements[Math.floor(Math.random() * encouragements.length)]
  }

  private getExerciseContext(exercise: string): string {
    const contexts = {
      squat: "Lower body compound movement. Key points: knee tracking, hip hinge, spinal alignment, depth control.",
      pushup:
        "Upper body pushing movement. Key points: plank position, elbow path, shoulder stability, core engagement.",
      plank: "Isometric core exercise. Key points: neutral spine, hip alignment, shoulder position, breathing.",
      lunge: "Single-leg strength exercise. Key points: knee alignment, balance, hip mobility, controlled descent.",
    }
    return contexts[exercise as keyof typeof contexts] || "General exercise movement analysis."
  }

  private getHistoryContext(): string {
    if (this.analysisHistory.length < 2) return "No previous analysis available."

    const recent = this.analysisHistory.slice(-3)
    return recent
      .map(
        (analysis, index) =>
          `Frame ${index + 1}: ${analysis.formIssues.length} issues - ${analysis.formIssues.join(", ") || "Good form"}`,
      )
      .join("\n")
  }

  private parseAIResponse(text: string): MastraResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          suggestions: parsed.suggestions || [],
          warnings: parsed.warnings || [],
          encouragement: parsed.encouragement,
          technicalExplanation: parsed.technicalExplanation,
        }
      }

      // Fallback: parse as plain text
      return this.parseTextResponse(text)
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      return this.parseTextResponse(text)
    }
  }

  private parseTextResponse(text: string): MastraResponse {
    const lines = text.split("\n").filter((line) => line.trim())
    const suggestions: string[] = []
    const warnings: string[] = []

    lines.forEach((line) => {
      const cleaned = line.replace(/^[-•*]\s*/, "").trim()
      if (cleaned.toLowerCase().includes("warning") || cleaned.toLowerCase().includes("danger")) {
        warnings.push(cleaned)
      } else if (cleaned.length > 10) {
        suggestions.push(cleaned)
      }
    })

    return {
      suggestions: suggestions.slice(0, 3),
      warnings: warnings.slice(0, 2),
      encouragement: lines.find(
        (line) =>
          line.toLowerCase().includes("good") ||
          line.toLowerCase().includes("great") ||
          line.toLowerCase().includes("keep"),
      ),
    }
  }

  private getFallbackResponse(data: PoseAnalysisData): MastraResponse {
    // Fallback responses when AI fails
    const fallbacks = {
      squat: {
        suggestions: ["Keep your chest up and core engaged", "Ensure knees track over toes"],
        warnings: data.formIssues.includes("back") ? ["Maintain neutral spine to prevent injury"] : [],
      },
      pushup: {
        suggestions: ["Maintain straight line from head to heels", "Control the descent"],
        warnings: data.formIssues.includes("back") ? ["Avoid sagging hips"] : [],
      },
      plank: {
        suggestions: ["Engage core muscles", "Keep head in neutral position"],
        warnings: [],
      },
      lunge: {
        suggestions: ["Keep front knee over ankle", "Maintain upright torso"],
        warnings: data.formIssues.includes("knee") ? ["Avoid knee valgus"] : [],
      },
    }

    const fallback = fallbacks[data.exercise as keyof typeof fallbacks] || {
      suggestions: ["Focus on controlled movement"],
      warnings: [],
    }

    return {
      ...fallback,
      encouragement: data.formIssues.length === 0 ? "Great form! Keep it up!" : undefined,
    }
  }

  // Method to get exercise-specific coaching cues
  getCoachingCues(exercise: string): string[] {
    const cues = {
      squat: ["Sit back into your hips", "Drive through your heels", "Keep your chest proud", "Knees out, not in"],
      pushup: ["Think plank position", "Elbows at 45 degrees", "Push the floor away", "Breathe out on the push"],
      plank: ["Squeeze your glutes", "Pull belly button to spine", "Long, strong line", "Breathe steadily"],
      lunge: ["Step with purpose", "Drop the back knee", "Drive up through front heel", "Keep torso tall"],
    }

    return cues[exercise as keyof typeof cues] || ["Focus on form over speed"]
  }
}
