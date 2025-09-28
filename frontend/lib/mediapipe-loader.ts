export class MediaPipeLoader {
  private static instance: MediaPipeLoader
  private isLoaded = false
  private loadPromise: Promise<any> | null = null

  static getInstance(): MediaPipeLoader {
    if (!MediaPipeLoader.instance) {
      MediaPipeLoader.instance = new MediaPipeLoader()
    }
    return MediaPipeLoader.instance
  }

  async loadMediaPipe(): Promise<any> {
    if (this.isLoaded && (window as any).MediaPipeVision) {
      return (window as any).MediaPipeVision
    }

    if (this.loadPromise) return this.loadPromise

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("[v0] Loading MediaPipe from npm package...")

        // Dynamic import of the MediaPipe package
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")

        console.log("[v0] MediaPipe package loaded, initializing vision tasks...")

        // Initialize the vision tasks
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
        )

        // Store in global scope for compatibility
        const MediaPipeVision = {
          FilesetResolver,
          PoseLandmarker,
          vision,
        }
        ;(window as any).MediaPipeVision = MediaPipeVision
        ;(window as any).vision = { FilesetResolver, PoseLandmarker }

        this.isLoaded = true
        console.log("[v0] MediaPipe initialized successfully")
        resolve(MediaPipeVision)
      } catch (error) {
        console.error("[v0] Failed to load MediaPipe:", error)
        reject(error)
      }
    })

    return this.loadPromise
  }

  isMediaPipeLoaded(): boolean {
    return this.isLoaded && !!(window as any).MediaPipeVision
  }
}
