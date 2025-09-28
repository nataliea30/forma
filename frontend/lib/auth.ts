export interface User {
  id: string
  email: string
  name: string
  role: "healthcare_provider" | "patient"
  createdAt: string
  profileImage?: string
  specialization?: string // for healthcare providers
  licenseNumber?: string // for healthcare providers
  dateOfBirth?: string // for patients
  medicalHistory?: string[] // for patients
}

interface UserWithPassword extends User {
  password: string
}

export interface PatientProviderConnection {
  id: string
  patientId: string
  providerId: string
  connectedAt: string
  status: "pending" | "active" | "inactive"
  notes?: string
}

export interface ProgressEntry {
  id: string
  patientId: string
  providerId: string
  exerciseType: string
  date: string
  duration: number
  formScore: number
  notes: string
  landmarks?: any[]
  improvements: string[]
  concerns: string[]
}

class LocalAuthService {
  private readonly USERS_KEY = "pt_app_users"
  private readonly CURRENT_USER_KEY = "pt_app_current_user"
  private readonly CONNECTIONS_KEY = "pt_app_connections"
  private readonly PROGRESS_KEY = "pt_app_progress"
  private readonly DEMO_SEEDED_KEY = "pt_app_demo_seeded"

  // User Management
  async signUp(
    email: string,
    password: string,
    name: string,
    role: "healthcare_provider" | "patient",
    additionalData?: any,
  ): Promise<{ user: User; error?: string }> {
    try {
      console.log("[v0] Sign up attempt:", { email, name, role })
      const users = this.getUsersWithPasswords()

      // Check if user already exists
      if (users.find((u) => u.email === email)) {
        console.log("[v0] User already exists:", email)
        return { user: null as any, error: "User with this email already exists" }
      }

      const newUserWithPassword: UserWithPassword = {
        id: this.generateId(),
        email,
        password, // Store password for validation
        name,
        role,
        createdAt: new Date().toISOString(),
        ...additionalData,
      }

      users.push(newUserWithPassword)
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))

      const { password: _, ...userWithoutPassword } = newUserWithPassword
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))

      console.log("[v0] Account created successfully:", { email, role })
      return { user: userWithoutPassword }
    } catch (error) {
      console.log("[v0] Sign up error:", error)
      return { user: null as any, error: "Failed to create account" }
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User; error?: string }> {
    try {
      console.log("[v0] Attempting sign in for:", email)
      console.log("[v0] Provided password:", password)

      this.seedDemoAccounts()

      const users = this.getUsersWithPasswords()
      console.log("[v0] Total users in storage:", users.length)
      console.log(
        "[v0] All users:",
        users.map((u) => ({ email: u.email, role: u.role, hasPassword: !!u.password })),
      )

      const user = users.find((u) => u.email === email)

      if (!user) {
        console.log("[v0] User not found for email:", email)
        return { user: null as any, error: "Invalid email or password" }
      }

      console.log("[v0] Found user:", user.email, "Role:", user.role)
      console.log("[v0] Stored password:", user.password)

      if (user.password !== password) {
        console.log("[v0] Password mismatch for", user.role, "account")
        console.log("[v0] Expected:", user.password)
        console.log("[v0] Received:", password)
        return { user: null as any, error: "Invalid email or password" }
      }

      console.log("[v0] Sign in successful for", user.role, "account")
      const { password: _, ...userWithoutPassword } = user
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
      return { user: userWithoutPassword }
    } catch (error) {
      console.log("[v0] Sign in error:", error)
      return { user: null as any, error: "Failed to sign in" }
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  private getUsersWithPasswords(): UserWithPassword[] {
    try {
      const usersStr = localStorage.getItem(this.USERS_KEY)
      return usersStr ? JSON.parse(usersStr) : []
    } catch {
      return []
    }
  }

  private getUsers(): User[] {
    try {
      const usersWithPasswords = this.getUsersWithPasswords()
      return usersWithPasswords.map(({ password, ...user }) => user)
    } catch {
      return []
    }
  }

  // Add or update a user in local storage (without relying on password)
  upsertUserWithoutPassword(user: User): void {
    try {
      const users = this.getUsersWithPasswords()
      if (!users.find((u) => u.id === user.id)) {
        const userWithPassword: UserWithPassword = { ...user, password: "" }
        users.push(userWithPassword)
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
      } else {
        const idx = users.findIndex((u) => u.id === user.id)
        const existing = users[idx]
        const updated: UserWithPassword = {
          ...existing,
          ...user,
          password: existing.password ?? "",
        }
        users[idx] = updated
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
      }
    } catch {
      // no-op
    }
  }

  // Patient-Provider Connections
  async connectPatientToProvider(
    patientId: string,
    providerId: string,
  ): Promise<{ connection: PatientProviderConnection; error?: string }> {
    try {
      const connections = this.getConnections()

      // Check if connection already exists
      const existingConnection = connections.find((c) => c.patientId === patientId && c.providerId === providerId)
      if (existingConnection) {
        return { connection: null as any, error: "Connection already exists" }
      }

      const newConnection: PatientProviderConnection = {
        id: this.generateId(),
        patientId,
        providerId,
        connectedAt: new Date().toISOString(),
        status: "active",
      }

      connections.push(newConnection)
      localStorage.setItem(this.CONNECTIONS_KEY, JSON.stringify(connections))

      return { connection: newConnection }
    } catch (error) {
      return { connection: null as any, error: "Failed to create connection" }
    }
  }

  getPatientsByProvider(providerId: string): User[] {
    const connections = this.getConnections().filter((c) => c.providerId === providerId && c.status === "active")
    const users = this.getUsers()
    return connections.map((c) => users.find((u) => u.id === c.patientId)).filter(Boolean) as User[]
  }

  getProvidersByPatient(patientId: string): User[] {
    const connections = this.getConnections().filter((c) => c.patientId === patientId && c.status === "active")
    const users = this.getUsers()
    return connections.map((c) => users.find((u) => u.id === c.providerId)).filter(Boolean) as User[]
  }

  private getConnections(): PatientProviderConnection[] {
    try {
      const connectionsStr = localStorage.getItem(this.CONNECTIONS_KEY)
      return connectionsStr ? JSON.parse(connectionsStr) : []
    } catch {
      return []
    }
  }

  // Progress Tracking
  async saveProgress(progressEntry: Omit<ProgressEntry, "id">): Promise<{ progress: ProgressEntry; error?: string }> {
    try {
      const progressEntries = this.getProgressEntries()

      const newEntry: ProgressEntry = {
        id: this.generateId(),
        ...progressEntry,
      }

      progressEntries.push(newEntry)
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progressEntries))

      return { progress: newEntry }
    } catch (error) {
      return { progress: null as any, error: "Failed to save progress" }
    }
  }

  getProgressByPatient(patientId: string): ProgressEntry[] {
    return this.getProgressEntries().filter((p) => p.patientId === patientId)
  }

  getProgressByProvider(providerId: string): ProgressEntry[] {
    return this.getProgressEntries().filter((p) => p.providerId === providerId)
  }

  private getProgressEntries(): ProgressEntry[] {
    try {
      const progressStr = localStorage.getItem(this.PROGRESS_KEY)
      return progressStr ? JSON.parse(progressStr) : []
    } catch {
      return []
    }
  }

  // Search functionality
  searchProviders(query: string): User[] {
    const users = this.getUsers()
    return users.filter(
      (u) =>
        u.role === "healthcare_provider" &&
        (u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.specialization?.toLowerCase().includes(query.toLowerCase())),
    )
  }

  searchPatients(query: string, providerId: string): User[] {
    const allUsers = this.getUsers()
    const q = query.toLowerCase()

    // Exclude patients already connected to this provider (active or pending)
    const alreadyConnectedIds = this.getConnections()
      .filter((c) => c.providerId === providerId)
      .map((c) => c.patientId)

    return allUsers.filter((u) => {
      if (u.role !== "patient") return false
      if (alreadyConnectedIds.includes(u.id)) return false
      const nameMatch = u.name.toLowerCase().includes(q)
      const emailMatch = u.email.toLowerCase().includes(q)
      const historyMatch = (u.medicalHistory ?? []).some((h) => h.toLowerCase().includes(q))
      return nameMatch || emailMatch || historyMatch
    })
  }

  // Demo Accounts
  private seedDemoAccounts(): void {
    // Always re-seed demo accounts to ensure they exist with correct passwords
    const users = this.getUsersWithPasswords()
    console.log("[v0] Seeding demo accounts. Current users:", users.length)

    const demoProvider: UserWithPassword = {
      id: "demo-provider-001",
      email: "provider@demo.com",
      password: "password", // Demo password
      name: "Dr. Sarah Johnson",
      role: "healthcare_provider",
      createdAt: new Date().toISOString(),
      specialization: "Physical Therapy",
      licenseNumber: "PT-12345",
    }

    const demoPatient: UserWithPassword = {
      id: "demo-patient-001",
      email: "patient@demo.com",
      password: "password", // Demo password
      name: "John Smith",
      role: "patient",
      createdAt: new Date().toISOString(),
      dateOfBirth: "1985-06-15",
      medicalHistory: ["Lower back pain", "Previous knee surgery"],
    }

    // Remove existing demo accounts and add fresh ones
    const filteredUsers = users.filter((u) => u.email !== "provider@demo.com" && u.email !== "patient@demo.com")
    filteredUsers.push(demoProvider, demoPatient)

    // Save updated users list
    localStorage.setItem(this.USERS_KEY, JSON.stringify(filteredUsers))
    console.log("[v0] Demo accounts seeded successfully. Total users now:", filteredUsers.length)
    console.log("[v0] Demo provider:", demoProvider.email, "password:", demoProvider.password)
    console.log("[v0] Demo patient:", demoPatient.email, "password:", demoPatient.password)

    // Create a connection between demo provider and patient
    const connections = this.getConnections()
    const demoConnection: PatientProviderConnection = {
      id: "demo-connection-001",
      patientId: "demo-patient-001",
      providerId: "demo-provider-001",
      connectedAt: new Date().toISOString(),
      status: "active",
    }

    if (!connections.find((c) => c.id === "demo-connection-001")) {
      connections.push(demoConnection)
      localStorage.setItem(this.CONNECTIONS_KEY, JSON.stringify(connections))
    }
  }

  constructor() {
    // Seed demo accounts on initialization
    if (typeof window !== "undefined") {
      this.seedDemoAccounts()
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const authService = new LocalAuthService()
