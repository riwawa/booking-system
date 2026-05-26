export type PaymentGateway = 'mercadopago' | 'stripe' | 'pagseguro'
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export interface Payment {
  id: string
  bookingId: string
  tenantId: string
  gateway: PaymentGateway
  gatewayPaymentId: string | null
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  paidAt: Date | null
  createdAt: Date
}
