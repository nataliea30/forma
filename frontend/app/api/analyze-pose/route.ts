import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

export async function POST(request: NextRequest) {
  try {
    const analysisData: PoseAnalysisData = await request.json()
    
    console.log("[API] Starting pose analysis for:", analysisData.exercise)

    // Validate input data
    if (!analysisData.exercise || !analysisData.landmarks) {
      return NextResponse.json(
        { error: 'Exercise and landmarks are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[API] OpenAI API key not found, using fallback analysis")
      return NextResponse.json(performLocalAnalysis(analysisData))
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a physiotherapy AI analyzing patient exercise form. Provide suggestions, warnings, encouragement, and technical explanations as JSON.

Return your response in this exact JSON format:
{
  "suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"],
  "encouragement": "optional encouragement message",
  "technicalExplanation": "optional technical explanation"
}

Focus on:
- Safety warnings for dangerous form issues
- Actionable suggestions for improvement
- Encouragement for good form
- Technical explanations for why certain corrections matter`
        },
        {
          role: "user",
          content: `Exercise: ${analysisData.exercise}
Form Issues: ${analysisData.formIssues.join(", ") || "No major issues detected"}
Current Phase: ${analysisData.currentPhase ?? "N/A"}
Landmark Count: ${analysisData.landmarks.length} (${analysisData.landmarks.filter(l => l.visibility > 0.5).length} visible)

Please analyze this exercise form and provide feedback.`
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const text = response.choices[0]?.message?.content ?? ""

    try {
      // Try to parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: MastraResponse = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      } else {
        // Fallback if no JSON found
        return NextResponse.json(parseTextResponse(text))
      }
    } catch (parseError) {
      console.error("[API] Failed to parse AI response:", parseError)
      return NextResponse.json(parseTextResponse(text))
    }

  } catch (error) {
    console.error("[API] GPT analysis failed:", error)
    
    // Fallback to local analysis
    const analysisData: PoseAnalysisData = await request.json()
    return NextResponse.json(performLocalAnalysis(analysisData))
  }
}

function performLocalAnalysis(data: PoseAnalysisData): MastraResponse {
  const suggestions: string[] = []
  const warnings: string[] = []
  let encouragement: string | undefined
  let technicalExplanation: string | undefined

  // Analyze based on exercise type and form issues
  const exerciseAnalysis = getExerciseSpecificAnalysis(data.exercise, data.formIssues)
  suggestions.push(...exerciseAnalysis.suggestions)
  warnings.push(...exerciseAnalysis.warnings)

  // Analyze pose landmarks for additional insights
  const landmarkAnalysis = analyzeLandmarks(data.landmarks, data.exercise)
  if (landmarkAnalysis.suggestion) suggestions.push(landmarkAnalysis.suggestion)
  if (landmarkAnalysis.warning) warnings.push(landmarkAnalysis.warning)

  // Add technical explanation for major issues
  if (data.formIssues.length > 0) {
    technicalExplanation = getTechnicalExplanation(data.exercise, data.formIssues)
  }

  // Generate encouragement for good form
  if (data.formIssues.length === 0 && suggestions.length === 0) {
    encouragement = getPositiveEncouragement(data.exercise)
  }

  return {
    suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
    warnings: warnings.slice(0, 2), // Limit to top 2 warnings
    encouragement,
    technicalExplanation,
  }
}

function getExerciseSpecificAnalysis(
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

function analyzeLandmarks(
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

  return {}
}

function getTechnicalExplanation(exercise: string, formIssues: string[]): string {
  const explanations: { [key: string]: string } = {
    knee_valgus: "Knee valgus (inward collapse) increases ACL injury risk and reduces force production",
    forward_lean: "Excessive forward lean shifts load to your back instead of your legs",
    sagging_hips: "Hip sagging puts excessive stress on your lower back and reduces core activation",
    heel_lift: "Rising onto toes indicates ankle mobility limitations and reduces stability",
  }

  const primaryIssue = formIssues[0]
  return explanations[primaryIssue] || "Proper form ensures safety and maximizes exercise effectiveness"
}

function getPositiveEncouragement(exercise: string): string {
  const encouragements = [
    "Excellent form! Keep up the great work!",
    "Perfect technique - you're really getting the hang of this!",
    "Outstanding control and alignment!",
    "Your form is looking fantastic - keep it up!",
    "Great job maintaining proper technique!",
  ]

  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

function parseTextResponse(text: string): MastraResponse {
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
