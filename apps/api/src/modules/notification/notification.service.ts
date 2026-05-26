import { Resend } from 'resend'
import { prisma } from '../../lib/prisma.js'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')
const EVO_URL = process.env.EVOLUTION_API_URL ?? ''
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function sendNotification(bookingId: string, type: 'confirmation' | 'reminder' | 'cancellation') {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { customer: true, provider: true, service: true },
  })

  const channel = booking.customer.whatsappOptIn && booking.customer.phone ? 'whatsapp' : 'email'
  const notif = await prisma.notification.create({
    data: { bookingId, channel, type, status: 'queued' },
  })

  const msg = buildMessage(booking, type)

  try {
    if (channel === 'whatsapp') {
      await sendWhatsApp(booking.customer.phone!, msg.text)
    } else {
      await sendEmail(booking.customer.email, booking.customer.name, msg)
    }
    await prisma.notification.update({ where: { id: notif.id }, data: { status: 'sent', sentAt: new Date() } })
  } catch (err) {
    await prisma.notification.update({ where: { id: notif.id }, data: { status: 'failed', payload: { error: String(err) } } })
    throw err
  }
}

function buildMessage(b: any, type: string) {
  const date = b.startsAt.toLocaleDateString('pt-BR')
  const time = b.startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const texts: Record<string, { subject: string; text: string }> = {
    confirmation: {
      subject: 'Agendamento confirmado',
      text: `Olá ${b.customer.name}! Seu agendamento foi confirmado.\n\nServiço: ${b.service.name}\nProfissional: ${b.provider.name}\nData: ${date} às ${time}`,
    },
    reminder: {
      subject: 'Lembrete de agendamento',
      text: `Lembrete: você tem um agendamento amanhã!\n\nServiço: ${b.service.name}\nProfissional: ${b.provider.name}\nHorário: ${time}`,
    },
    cancellation: {
      subject: 'Agendamento cancelado',
      text: `Seu agendamento de ${b.service.name} com ${b.provider.name} em ${date} às ${time} foi cancelado.`,
    },
  }
  return texts[type]
}

async function sendWhatsApp(phone: string, text: string) {
  const res = await fetch(`${EVO_URL}/message/sendText/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: phone, text }),
  })
  if (!res.ok) throw new Error(`WhatsApp error: ${res.status}`)
}

async function sendEmail(to: string, name: string, msg: { subject: string; text: string }) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'noreply@bookingsystem.app',
    to,
    subject: msg.subject,
    text: msg.text,
  })
}
