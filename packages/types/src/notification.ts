export type NotificationChannel = 'whatsapp' | 'email' | 'sms'
export type NotificationType = 'confirmation' | 'reminder' | 'cancellation'
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'failed'
export interface Notification {
  id: string
  bookingId: string
  channel: NotificationChannel
  type: NotificationType
  status: NotificationStatus
  sentAt: Date | null
  createdAt: Date
}
