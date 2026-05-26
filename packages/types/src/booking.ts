export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export interface Booking {
  id: string
  tenantId: string
  customerId: string
  providerId: string
  serviceId: string
  startsAt: Date
  endsAt: Date
  status: BookingStatus
  notes: string | null
  priceSnapshot: number
  idempotencyKey: string
  createdAt: Date
}
export interface TimeSlot {
  startsAt: Date
  endsAt: Date
  available: boolean
}
