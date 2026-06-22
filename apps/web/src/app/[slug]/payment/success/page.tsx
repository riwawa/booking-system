'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

export default function PaymentSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagamento aprovado!</h2>
        <p className="text-gray-500 text-sm mb-6">Seu agendamento foi confirmado. Você receberá uma confirmação em breve.</p>
      </div>
    </div>
  )
}