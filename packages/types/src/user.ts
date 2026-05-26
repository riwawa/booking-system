export type UserRole = 'owner' | 'staff' | 'customer'
export interface User {
  id: string
  tenantId: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  whatsappOptIn: boolean
  createdAt: Date
}
export interface AuthPayload {
  sub: string
  tenantId: string
  role: UserRole
  name: string
}
