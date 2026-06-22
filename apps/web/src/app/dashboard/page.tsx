'use client'
import { useEffect, useState } from 'react'
import { bookingApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Calendar, Clock, User, DollarSign, LogOut, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendente',   color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
  completed: { label: 'Concluído',  color: 'bg-blue-100 text-blue-700' },
  no_show:   { label: 'Não veio',   color: 'bg-gray-100 text-gray-600' },
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated, ready } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!ready) return
    if (!isAuthenticated) { window.location.href = '/login'; return }
    setLoading(true)
    bookingApi.list({ date }).then(setBookings).finally(() => setLoading(false))
  }, [date, isAuthenticated, ready])
  
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue: bookings.filter(b => b.payment?.status === 'paid').reduce((s: number, b: any) => s + Number(b.priceSnapshot), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">B</div>
            <span className="font-semibold text-gray-900">BookingSystem</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={logout} className="btn-outline py-1.5 text-xs gap-1.5">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand"><Calendar size={20} /></div>
            <div><p className="text-sm text-gray-500">Agendamentos</p><p className="text-2xl font-semibold">{stats.total}</p></div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><CheckCircle size={20} /></div>
            <div><p className="text-sm text-gray-500">Confirmados</p><p className="text-2xl font-semibold">{stats.confirmed}</p></div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><DollarSign size={20} /></div>
            <div><p className="text-sm text-gray-500">Receita paga</p><p className="text-2xl font-semibold">{formatCurrency(stats.revenue)}</p></div>
          </div>
        </div>

        {/* filters */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Data:</label>
          <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* bookings list */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Agendamentos do dia</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum agendamento para esta data.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((b) => {
                const st = STATUS_MAP[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={b.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0 w-10 text-center">
                        <p className="text-sm font-semibold text-gray-900">{formatTime(b.startsAt)}</p>
                        <p className="text-xs text-gray-400">{formatTime(b.endsAt)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.customer?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{b.service?.name} · {b.provider?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(Number(b.priceSnapshot))}</span>
                      <span className={`badge ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
