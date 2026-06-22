'use client'
import { useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default function PaymentFailurePage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagamento não concluído</h2>
        <p className="text-gray-500 text-sm mb-6">Não foi possível processar seu pagamento. Tente novamente.</p>
        <a href={`/${(async () => (await params).slug)()}`} className="btn-primary">
          Tentar novamente
        </a>
      </div>
    </div>
  )
}