import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../../lib/prisma.js'
import { notificationQueue } from '../../lib/queue.js'

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN ?? 'TEST' })

export async function createCheckoutPreference(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { customer: true, service: true, tenant: true },
  })
  if (booking.status !== 'pending') throw new Error('BOOKING_NOT_PENDING')

  const preference = new Preference(mpClient)
  const baseUrl = process.env.APP_URL ?? 'http://localhost:3000'

  const result = await preference.create({
    body: {
      items: [
        {
          id: booking.service.id,
          title: booking.service.name,
          quantity: 1,
          unit_price: Number(booking.priceSnapshot),
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: booking.customer.name,
        email: booking.customer.email,
      },
      back_urls: {
        success: `${baseUrl}/${booking.tenant.slug}/payment/success?bookingId=${bookingId}`,
        failure: `${baseUrl}/${booking.tenant.slug}/payment/failure?bookingId=${bookingId}`,
        pending: `${baseUrl}/${booking.tenant.slug}/payment/pending?bookingId=${bookingId}`,
      },
      auto_return: 'approved',
      external_reference: bookingId,
      notification_url: `${process.env.API_URL ?? 'http://localhost:3001'}/api/payments/webhook`,
    },
  })

  // cria o registro de payment como pending
  await prisma.payment.upsert({
    where: { bookingId },
    update: { gatewayPaymentId: result.id },
    create: {
      bookingId,
      tenantId: booking.tenantId,
      gateway: 'mercadopago',
      gatewayPaymentId: result.id ?? null,
      method: 'credit_card',
      amount: booking.priceSnapshot,
      status: 'pending',
    },
  })

  return { checkoutUrl: result.init_point, preferenceId: result.id }
}

export async function handleWebhook(gatewayPaymentId: string, raw: unknown) {
  const payment = await prisma.payment.findFirst({ where: { gatewayPaymentId } })

  // tenta pelo external_reference (bookingId) se não achar pelo paymentId
  const rawData = raw as any
  const bookingId = rawData?.data?.id
    ? undefined
    : rawData?.resource

  if (!payment) {
    // webhook veio com ID de pagamento MP, busca pelo booking via external_reference
    try {
      const mpPayment = new Payment(mpClient)
      const mpData = await mpPayment.get({ id: Number(gatewayPaymentId) })
      if (!mpData.external_reference) return

      const booking = await prisma.booking.findUnique({ where: { id: mpData.external_reference } })
      if (!booking) return

      const existingPayment = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      if (!existingPayment || existingPayment.status === 'paid') return

      if (mpData.status === 'approved') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'paid',
              paidAt: new Date(),
              gatewayPaymentId: String(mpData.id),
              webhookRaw: raw as any,
            },
          }),
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'confirmed' },
          }),
        ])
        await notificationQueue.add('notify', { bookingId: booking.id, type: 'confirmation' })
      }
    } catch (err) {
      console.error('[webhook] erro ao processar:', err)
    }
    return
  }

  if (payment.status === 'paid') return

  try {
    const mpPayment = new Payment(mpClient)
    const mpData = await mpPayment.get({ id: Number(gatewayPaymentId) })
    if (mpData.status !== 'approved') return

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', paidAt: new Date(), webhookRaw: raw as any },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'confirmed' },
      }),
    ])
    await notificationQueue.add('notify', { bookingId: payment.bookingId, type: 'confirmation' })
  } catch (err) {
    console.error('[webhook] erro:', err)
  }
}

export async function getPaymentByBooking(bookingId: string) {
  return prisma.payment.findUnique({ where: { bookingId } })
}