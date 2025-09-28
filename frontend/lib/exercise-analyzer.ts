import type { PoseLandmark } from "@/components/pt-analysis-app"

export interface ExercisePhase {
  name: string
  description: string
  keyPoints: string[]
}

export interface BiomechanicalAnalysis {
  jointAngles: Record<string, number>
  symmetry: number
  stability: number
  range: number
  timing: number
}

export interface FormAssessment {
  score: number // 0-100
  criticalErrors: string[]
  minorIssues: string[]
  strengths: string[]
  phase: string
  biomechanics: BiomechanicalAnalysis
}

export class ExerciseAnalyzer {
  private frameHistory: PoseLandmark[][] = []
  private phaseHistory: string[] = []
  private readonly maxHistoryFrames = 30 // 1 second at 30fps

  analyzeExercise(landmarks: PoseLandmark[], exercise: string): FormAssessment {
    // Add to history
    this.frameHistory.push(landmarks)
    if (this.frameHistory.length > this.maxHistoryFrames) {
      this.frameHistory.shift()
    }

    // Analyze based on exercise type
    switch (exercise) {
      case "squat":
        return this.analyzeSquat(landmarks)
      case "pushup":
        return this.analyzePushup(landmarks)
      case "plank":
        return this.analyzePlank(landmarks)
      case "lunge":
        return this.analyzeLunge(landmarks)
      default:
        return this.getDefaultAssessment()
    }
  }

  private analyzeSquat(landmarks: PoseLandmark[]): FormAssessment {
    const biomechanics = this.calculateSquatBiomechanics(landmarks)
    const phase = this.detectSquatPhase(landmarks)

    const criticalErrors: string[] = []
    const minorIssues: string[] = []
    const strengths: string[] = []

    // Knee alignment analysis
    const kneeAlignment = this.analyzeKneeAlignment(landmarks)
    if (kneeAlignment.valgus > 15) {
      criticalErrors.push("Knees caving inward - risk of injury")
    } else if (kneeAlignment.valgus > 8) {
      minorIssues.push("Slight knee valgus - focus on external rotation")
    } else {
      strengths.push("Good knee alignment")
    }

    // Back angle analysis
    const backAngle = this.calculateBackAngle(landmarks)
    if (backAngle > 45) {
      criticalErrors.push("Excessive forward lean - maintain upright torso")
    } else if (backAngle > 30) {
      minorIssues.push("Slight forward lean - engage core more")
    } else {
      strengths.push("Good torso position")
    }

    // Depth analysis
    const depth = this.calculateSquatDepth(landmarks)
    if (depth < 70) {
      minorIssues.push("Increase squat depth for full range of motion")
    } else {
      strengths.push("Good squat depth")
    }

    // Symmetry analysis
    if (biomechanics.symmetry < 0.85) {
      minorIssues.push("Slight asymmetry detected - check balance")
    } else {
      strengths.push("Good bilateral symmetry")
    }

    const score = this.calculateFormScore(criticalErrors, minorIssues, strengths)

    return {
      score,
      criticalErrors,
      minorIssues,
      strengths,
      phase,
      biomechanics,
    }
  }

  private analyzePushup(landmarks: PoseLandmark[]): FormAssessment {
    const biomechanics = this.calculatePushupBiomechanics(landmarks)
    const phase = this.detectPushupPhase(landmarks)

    const criticalErrors: string[] = []
    const minorIssues: string[] = []
    const strengths: string[] = []

    // Body alignment analysis
    const bodyAlignment = this.analyzePushupAlignment(landmarks)
    if (bodyAlignment.hipSag > 20) {
      criticalErrors.push("Hips sagging - engage core muscles")
    } else if (bodyAlignment.hipSag > 10) {
      minorIssues.push("Slight hip sag - tighten core")
    } else {
      strengths.push("Good plank position")
    }

    // Elbow path analysis
    const elbowAngle = this.calculateElbowAngle(landmarks)
    if (elbowAngle > 90) {
      minorIssues.push("Elbows flaring too wide - aim for 45 degrees")
    } else {
      strengths.push("Good elbow position")
    }

    // Range of motion
    const rom = this.calculatePushupROM(landmarks)
    if (rom < 60) {
      minorIssues.push("Increase range of motion - lower chest closer to ground")
    } else {
      strengths.push("Good range of motion")
    }

    const score = this.calculateFormScore(criticalErrors, minorIssues, strengths)

    return {
      score,
      criticalErrors,
      minorIssues,
      strengths,
      phase,
      biomechanics,
    }
  }

  private analyzePlank(landmarks: PoseLandmark[]): FormAssessment {
    const biomechanics = this.calculatePlankBiomechanics(landmarks)
    const phase = "hold"

    const criticalErrors: string[] = []
    const minorIssues: string[] = []
    const strengths: string[] = []

    // Spinal alignment
    const spinalAlignment = this.analyzePlankAlignment(landmarks)
    if (spinalAlignment.deviation > 25) {
      criticalErrors.push("Significant spinal misalignment")
    } else if (spinalAlignment.deviation > 15) {
      minorIssues.push("Minor spinal deviation - adjust position")
    } else {
      strengths.push("Excellent spinal alignment")
    }

    // Hip position
    const hipPosition = this.calculateHipPosition(landmarks)
    if (hipPosition.height < 0.3) {
      criticalErrors.push("Hips too low - lift to neutral")
    } else if (hipPosition.height > 0.7) {
      criticalErrors.push("Hips too high - lower to neutral")
    } else {
      strengths.push("Good hip position")
    }

    // Stability analysis
    if (biomechanics.stability < 0.7) {
      minorIssues.push("Work on stability - reduce trembling")
    } else {
      strengths.push("Good stability")
    }

    const score = this.calculateFormScore(criticalErrors, minorIssues, strengths)

    return {
      score,
      criticalErrors,
      minorIssues,
      strengths,
      phase,
      biomechanics,
    }
  }

  private analyzeLunge(landmarks: PoseLandmark[]): FormAssessment {
    const biomechanics = this.calculateLungeBiomechanics(landmarks)
    const phase = this.detectLungePhase(landmarks)

    const criticalErrors: string[] = []
    const minorIssues: string[] = []
    const strengths: string[] = []

    // Front knee alignment
    const frontKnee = this.analyzeFrontKneeAlignment(landmarks)
    if (frontKnee.overAnkle > 20) {
      criticalErrors.push("Front knee too far forward - shift weight back")
    } else if (frontKnee.overAnkle > 10) {
      minorIssues.push("Front knee slightly forward - adjust stance")
    } else {
      strengths.push("Good front knee position")
    }

    // Torso position
    const torsoLean = this.calculateTorsoLean(landmarks)
    if (torsoLean > 20) {
      minorIssues.push("Excessive forward lean - keep torso upright")
    } else {
      strengths.push("Good torso position")
    }

    // Balance assessment
    if (biomechanics.stability < 0.6) {
      minorIssues.push("Work on balance - engage core")
    } else {
      strengths.push("Good balance")
    }

    const score = this.calculateFormScore(criticalErrors, minorIssues, strengths)

    return {
      score,
      criticalErrors,
      minorIssues,
      strengths,
      phase,
      biomechanics,
    }
  }

  // Biomechanical calculation methods
  private calculateSquatBiomechanics(landmarks: PoseLandmark[]): BiomechanicalAnalysis {
    return {
      jointAngles: {
        hip: this.calculateHipAngle(landmarks),
        knee: this.calculateKneeAngle(landmarks),
        ankle: this.calculateAnkleAngle(landmarks),
      },
      symmetry: this.calculateBilateralSymmetry(landmarks),
      stability: this.calculateStability(landmarks),
      range: this.calculateSquatDepth(landmarks) / 100,
      timing: this.calculateMovementTiming(),
    }
  }

  private calculatePushupBiomechanics(landmarks: PoseLandmark[]): BiomechanicalAnalysis {
    return {
      jointAngles: {
        shoulder: this.calculateShoulderAngle(landmarks),
        elbow: this.calculateElbowAngle(landmarks),
        wrist: this.calculateWristAngle(landmarks),
      },
      symmetry: this.calculateBilateralSymmetry(landmarks),
      stability: this.calculateCoreStability(landmarks),
      range: this.calculatePushupROM(landmarks) / 100,
      timing: this.calculateMovementTiming(),
    }
  }

  private calculatePlankBiomechanics(landmarks: PoseLandmark[]): BiomechanicalAnalysis {
    return {
      jointAngles: {
        shoulder: this.calculateShoulderAngle(landmarks),
        hip: this.calculateHipAngle(landmarks),
        spine: this.calculateSpinalAngle(landmarks),
      },
      symmetry: this.calculateBilateralSymmetry(landmarks),
      stability: this.calculatePlankStability(landmarks),
      range: 1.0, // Isometric exercise
      timing: this.calculateHoldTime(),
    }
  }

  private calculateLungeBiomechanics(landmarks: PoseLandmark[]): BiomechanicalAnalysis {
    return {
      jointAngles: {
        frontHip: this.calculateFrontHipAngle(landmarks),
        frontKnee: this.calculateFrontKneeAngle(landmarks),
        backHip: this.calculateBackHipAngle(landmarks),
      },
      symmetry: this.calculateLateralSymmetry(landmarks),
      stability: this.calculateSingleLegStability(landmarks),
      range: this.calculateLungeDepth(landmarks) / 100,
      timing: this.calculateMovementTiming(),
    }
  }

  // Helper methods for specific calculations
  private calculateAngle(p1: PoseLandmark, p2: PoseLandmark, p3: PoseLandmark): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

    const dot = v1.x * v2.x + v1.y * v2.y
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

    const cos = dot / (mag1 * mag2)
    return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI)
  }

  private calculateDistance(p1: PoseLandmark, p2: PoseLandmark): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  // Specific joint angle calculations
  private calculateHipAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: shoulder, hip, knee
    return this.calculateAngle(landmarks[11], landmarks[23], landmarks[25])
  }

  private calculateKneeAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: hip, knee, ankle
    return this.calculateAngle(landmarks[23], landmarks[25], landmarks[27])
  }

  private calculateAnkleAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: knee, ankle, foot
    return this.calculateAngle(landmarks[25], landmarks[27], landmarks[31])
  }

  private calculateShoulderAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: elbow, shoulder, hip
    return this.calculateAngle(landmarks[13], landmarks[11], landmarks[23])
  }

  private calculateElbowAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: shoulder, elbow, wrist
    return this.calculateAngle(landmarks[11], landmarks[13], landmarks[15])
  }

  private calculateWristAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: elbow, wrist, index finger
    return this.calculateAngle(landmarks[13], landmarks[15], landmarks[19])
  }

  private calculateSpinalAngle(landmarks: PoseLandmark[]): number {
    // Using landmarks: shoulder, hip, knee for spinal alignment
    return this.calculateAngle(landmarks[11], landmarks[23], landmarks[25])
  }

  // Analysis helper methods
  private analyzeKneeAlignment(landmarks: PoseLandmark[]): { valgus: number } {
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    // Calculate knee valgus angle (simplified)
    const leftValgus = Math.abs(leftKnee.x - leftAnkle.x) * 100
    const rightValgus = Math.abs(rightKnee.x - rightAnkle.x) * 100

    return { valgus: Math.max(leftValgus, rightValgus) }
  }

  private calculateBackAngle(landmarks: PoseLandmark[]): number {
    // Calculate forward lean of torso
    const shoulder = landmarks[11]
    const hip = landmarks[23]

    const angle = Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x) * (180 / Math.PI)
    return Math.abs(angle)
  }

  private calculateSquatDepth(landmarks: PoseLandmark[]): number {
    const hip = landmarks[23]
    const knee = landmarks[25]

    // Calculate depth as percentage (simplified)
    const depth = Math.abs(hip.y - knee.y) * 100
    return Math.min(100, depth)
  }

  private calculateBilateralSymmetry(landmarks: PoseLandmark[]): number {
    // Compare left and right side landmarks
    const leftSide = [landmarks[11], landmarks[13], landmarks[15], landmarks[23], landmarks[25], landmarks[27]]
    const rightSide = [landmarks[12], landmarks[14], landmarks[16], landmarks[24], landmarks[26], landmarks[28]]

    let symmetryScore = 0
    for (let i = 0; i < leftSide.length; i++) {
      const leftY = leftSide[i].y
      const rightY = rightSide[i].y
      const diff = Math.abs(leftY - rightY)
      symmetryScore += Math.max(0, 1 - diff * 10) // Penalize differences
    }

    return symmetryScore / leftSide.length
  }

  private calculateStability(landmarks: PoseLandmark[]): number {
    if (this.frameHistory.length < 5) return 0.5

    // Calculate movement variance over recent frames
    const recentFrames = this.frameHistory.slice(-5)
    let totalVariance = 0

    for (let i = 0; i < landmarks.length; i++) {
      const positions = recentFrames.map((frame) => frame[i])
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length

      const variance =
        positions.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2), 0) / positions.length

      totalVariance += variance
    }

    // Convert variance to stability score (lower variance = higher stability)
    return Math.max(0, 1 - totalVariance * 100)
  }

  // Phase detection methods
  private detectSquatPhase(landmarks: PoseLandmark[]): string {
    const hipHeight = landmarks[23].y

    if (this.frameHistory.length < 3) return "starting"

    const recentHipHeights = this.frameHistory.slice(-3).map((frame) => frame[23].y)
    const trend = recentHipHeights[2] - recentHipHeights[0]

    if (trend > 0.01) return "descending"
    if (trend < -0.01) return "ascending"
    return "bottom"
  }

  private detectPushupPhase(landmarks: PoseLandmark[]): string {
    const shoulderHeight = landmarks[11].y

    if (this.frameHistory.length < 3) return "starting"

    const recentHeights = this.frameHistory.slice(-3).map((frame) => frame[11].y)
    const trend = recentHeights[2] - recentHeights[0]

    if (trend > 0.01) return "descending"
    if (trend < -0.01) return "ascending"
    return "bottom"
  }

  private detectLungePhase(landmarks: PoseLandmark[]): string {
    const hipHeight = landmarks[23].y

    if (this.frameHistory.length < 3) return "starting"

    const recentHeights = this.frameHistory.slice(-3).map((frame) => frame[23].y)
    const trend = recentHeights[2] - recentHeights[0]

    if (trend > 0.01) return "descending"
    if (trend < -0.01) return "ascending"
    return "bottom"
  }

  // Additional helper methods (simplified implementations)
  private analyzePushupAlignment(landmarks: PoseLandmark[]): { hipSag: number } {
    const shoulder = landmarks[11]
    const hip = landmarks[23]
    const ankle = landmarks[27]

    // Calculate hip sag relative to shoulder-ankle line
    const expectedHipY = shoulder.y + (ankle.y - shoulder.y) * 0.6
    const hipSag = Math.abs(hip.y - expectedHipY) * 100

    return { hipSag }
  }

  private calculatePushupROM(landmarks: PoseLandmark[]): number {
    // Simplified ROM calculation based on shoulder movement
    if (this.frameHistory.length < 10) return 50

    const shoulderHeights = this.frameHistory.map((frame) => frame[11].y)
    const maxHeight = Math.max(...shoulderHeights)
    const minHeight = Math.min(...shoulderHeights)

    return (maxHeight - minHeight) * 100
  }

  private analyzePlankAlignment(landmarks: PoseLandmark[]): { deviation: number } {
    const shoulder = landmarks[11]
    const hip = landmarks[23]
    const ankle = landmarks[27]

    // Calculate deviation from straight line
    const expectedHipY = shoulder.y + (ankle.y - shoulder.y) * 0.6
    const deviation = Math.abs(hip.y - expectedHipY) * 100

    return { deviation }
  }

  private calculateHipPosition(landmarks: PoseLandmark[]): { height: number } {
    const hip = landmarks[23]
    return { height: hip.y }
  }

  private analyzeFrontKneeAlignment(landmarks: PoseLandmark[]): { overAnkle: number } {
    const knee = landmarks[25]
    const ankle = landmarks[27]

    const overAnkle = Math.abs(knee.x - ankle.x) * 100
    return { overAnkle }
  }

  private calculateTorsoLean(landmarks: PoseLandmark[]): number {
    const shoulder = landmarks[11]
    const hip = landmarks[23]

    const angle = Math.atan2(shoulder.x - hip.x, shoulder.y - hip.y) * (180 / Math.PI)
    return Math.abs(angle)
  }

  // Simplified implementations for remaining methods
  private calculateCoreStability(landmarks: PoseLandmark[]): number {
    return this.calculateStability(landmarks)
  }
  private calculatePlankStability(landmarks: PoseLandmark[]): number {
    return this.calculateStability(landmarks)
  }
  private calculateSingleLegStability(landmarks: PoseLandmark[]): number {
    return this.calculateStability(landmarks)
  }
  private calculateLateralSymmetry(landmarks: PoseLandmark[]): number {
    return this.calculateBilateralSymmetry(landmarks)
  }
  private calculateFrontHipAngle(landmarks: PoseLandmark[]): number {
    return this.calculateHipAngle(landmarks)
  }
  private calculateFrontKneeAngle(landmarks: PoseLandmark[]): number {
    return this.calculateKneeAngle(landmarks)
  }
  private calculateBackHipAngle(landmarks: PoseLandmark[]): number {
    return this.calculateHipAngle(landmarks)
  }
  private calculateLungeDepth(landmarks: PoseLandmark[]): number {
    return this.calculateSquatDepth(landmarks)
  }
  private calculateMovementTiming(): number {
    return 1.0
  }
  private calculateHoldTime(): number {
    return 1.0
  }

  private calculateFormScore(criticalErrors: string[], minorIssues: string[], strengths: string[]): number {
    let score = 100
    score -= criticalErrors.length * 25 // Major deductions for critical errors
    score -= minorIssues.length * 10 // Minor deductions for issues
    score += strengths.length * 5 // Small bonus for strengths

    return Math.max(0, Math.min(100, score))
  }

  private getDefaultAssessment(): FormAssessment {
    return {
      score: 75,
      criticalErrors: [],
      minorIssues: [],
      strengths: ["Exercise detected"],
      phase: "unknown",
      biomechanics: {
        jointAngles: {},
        symmetry: 0.8,
        stability: 0.7,
        range: 0.8,
        timing: 1.0,
      },
    }
  }
}
