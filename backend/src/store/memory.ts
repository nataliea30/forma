import bcrypt from 'bcryptjs'

// Shared in-memory store for demo/dev environments.
// In production, replace with a persistent database.

export type Role = 'healthcare_provider' | 'patient'

export interface UserRecord {
  id: string
  email: string
  password: string // hashed
  name: string
  role: Role
  createdAt: Date
  additionalData?: any
}

export type ConnectionStatus = 'pending' | 'active' | 'inactive'

export interface ConnectionRecord {
  id: string
  patientId: string
  providerId: string
  connectedAt: Date
  status: ConnectionStatus
  notes?: string
}

// Exported singletons to ensure shared state across routes
export const users: UserRecord[] = []
export const connections: ConnectionRecord[] = []

// Helpers
export function findUserByEmail(email: string): UserRecord | undefined {
  return users.find(u => u.email === email)
}

export function findUserById(id: string): UserRecord | undefined {
  return users.find(u => u.id === id)
}

export function addUser(user: UserRecord): void {
  users.push(user)
}

export function listUsersByRole(role: Role, query?: string): Omit<UserRecord, 'password'>[] {
  const filtered = users.filter(u => u.role === role)
  const q = query?.toLowerCase().trim()

  const searched = q && q.length > 0
    ? filtered.filter(u => {
        const nameMatch = u.name.toLowerCase().includes(q)
        const emailMatch = u.email.toLowerCase().includes(q)
        const specialization = (u.additionalData?.specialization as string | undefined)?.toLowerCase() || ''
        const dob = (u.additionalData?.dateOfBirth as string | undefined)?.toLowerCase() || ''
        const medHistory: string[] = Array.isArray((u.additionalData as any)?.medicalHistory)
          ? ((u.additionalData as any).medicalHistory as string[])
          : []
        const medMatch = medHistory.some(h => h.toLowerCase().includes(q))

        return nameMatch || emailMatch || specialization.includes(q) || dob.includes(q) || medMatch
      })
    : filtered

  return searched.map(({ password, ...rest }) => rest)
}

export function getConnectionsByProvider(providerId: string): ConnectionRecord[] {
  return connections.filter(c => c.providerId === providerId && c.status === 'active')
}

export function getConnectionsByPatient(patientId: string): ConnectionRecord[] {
  return connections.filter(c => c.patientId === patientId && c.status === 'active')
}

export function findConnection(patientId: string, providerId: string): ConnectionRecord | undefined {
  return connections.find(c => c.patientId === patientId && c.providerId === providerId)
}

export function addConnection(patientId: string, providerId: string, status: ConnectionStatus = 'active', notes?: string): ConnectionRecord {
  const existing = findConnection(patientId, providerId)
  if (existing) return existing

  const newConn: ConnectionRecord = {
    id: `conn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    patientId,
    providerId,
    connectedAt: new Date(),
    status
  }
  if (typeof notes === 'string') {
    newConn.notes = notes
  }
  connections.push(newConn)
  return newConn
}

// Seed demo users (idempotent)
export function seedDemoUsers(bcryptRounds: number): void {
  const ensureUser = (u: Omit<UserRecord, 'password'> & { rawPassword: string }) => {
    const existing = findUserByEmail(u.email)
    if (existing) return
    const hashed = bcrypt.hashSync(u.rawPassword, bcryptRounds)
    const record: UserRecord = {
      id: u.id,
      email: u.email,
      password: hashed,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      additionalData: u.additionalData,
    }
    addUser(record)
  }

  ensureUser({
    id: 'demo-provider-001',
    email: 'provider@demo.com',
    rawPassword: 'password123',
    name: 'Dr. Sarah Johnson',
    role: 'healthcare_provider',
    createdAt: new Date(),
    additionalData: { specialization: 'Physical Therapy', licenseNumber: 'PT-12345' },
  })

  ensureUser({
    id: 'demo-patient-001',
    email: 'patient@demo.com',
    rawPassword: 'password123',
    name: 'John Smith',
    role: 'patient',
    createdAt: new Date(),
    additionalData: { dateOfBirth: '1985-06-15', medicalHistory: ['Lower back pain', 'Previous knee surgery'] },
  })
}