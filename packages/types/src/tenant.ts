export type TenantPlan = 'free' | 'starter' | 'pro'
export interface TenantSettings {
  cancellationWindowHours: number
  bookingExpirationMinutes: number
  reminderHoursBefore: number
  requirePaymentUpfront: boolean
  brandColor: string
  brandName: string
}
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  cancellationWindowHours: 24,
  bookingExpirationMinutes: 15,
  reminderHoursBefore: 24,
  requirePaymentUpfront: false,
  brandColor: '#6366f1',
  brandName: '',
}
