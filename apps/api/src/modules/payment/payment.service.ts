import MercadoPago, { Payment } from 'mercadopago'
import { prisma } from '../../lib/prisma.js'
import { notificationQueue } from '../../lib/queue.js'

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN ?? 'TEST' })

export async function initiatePayment(bookingId: string, method: 'pix' | 'credit_card' | 'boleto') {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { customer: true, service: true },
  })
  if (booking.status !== 'pending') throw new Error('BOOKING_NOT_PENDING')

  const mpPayment = new Payment(mp)
  const result = await mpPayment.create({
    body: {
      transaction_amount: Number(booking.priceSnapshot),
      description: booking.service.name,
      payment_method_id: method === 'pix' ? 'pix' : method === 'boleto' ? 'bolbradesco' : 'visa',
      payer: { email: booking.customer.email },
    },
  })

  return prisma.payment.create({
    data: {
      bookingId,
      tenantId: booking.tenantId,
      gateway: 'mercadopago',
      gatewayPaymentId: String(result.id),
      method,
      amount: booking.priceSnapshot,
      status: 'pending',
    },
  })
}

export async function handleWebhook(gatewayPaymentId: string, raw: unknown) {
  const payment = await prisma.payment.findFirst({ where: { gatewayPaymentId } })
  if (!payment || payment.status === 'paid') return // idempotência

  const mpPayment = new Payment(mp)
  const mpData = await mpPayment.get({ id: Number(gatewayPaymentId) })
  if (mpData.status !== 'approved') return

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'paid', paidAt: new Date(), webhookRaw: raw as any },
    }),
    prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'confirmed' } }),
  ])

  await notificationQueue.add('notify', { bookingId: payment.bookingId, type: 'confirmation' })
}

export async function getPaymentByBooking(bookingId: string) {
  return prisma.payment.findUnique({ where: { bookingId } })
}
