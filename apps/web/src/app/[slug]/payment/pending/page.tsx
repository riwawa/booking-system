'use client'
import { Clock } from 'lucide-react'

export default function PaymentPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-4">
          <Clock size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagamento em processamento</h2>
        <p className="text-gray-500 text-sm">Seu pagamento está sendo processado. Você receberá uma confirmação assim que for aprovado.</p>
      </div>
    </div>
  )
}