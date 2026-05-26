'use client'
import { useEffect, useState } from 'react'
import { tenantApi, bookingApi } from '@/lib/api'
import { formatDate, formatTime, formatCurrency, cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock, User, Check } from 'lucide-react'
import { addDays, format, isSameDay, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React from 'react'

type Step = 'service' | 'provider' | 'slot' | 'info' | 'confirm' | 'done'

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = React.useState<string>('')
  
  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])
  const [tenant, setTenant] = useState<any>(null)
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(startOfToday())
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [booking, setBooking] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    tenantApi.get(slug).then(setTenant).catch(() => setTenant(null))
  }, [slug])

  useEffect(() => {
    if (!selectedProvider || !selectedService) return
    setSlotsLoading(true)
    bookingApi
      .getSlots({
        providerId: selectedProvider.id,
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
      })
      .then(setSlots)
      .finally(() => setSlotsLoading(false))
  }, [selectedProvider, selectedService, selectedDate])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // register user first (or use existing)
      const { token, user } = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: slug, ...form, password: `${form.email}-auto` }),
      })
        .then((r) => r.json())
        .catch(() => ({ token: null, user: null }))

      if (token) localStorage.setItem('token', token)

      const created = await bookingApi.create({
        tenantId: tenant.id,
        customerId: user?.id,
        providerId: selectedProvider.id,
        serviceId: selectedService.id,
        startsAt: selectedSlot.startsAt,
        notes: form.notes,
      })
      setBooking(created)
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Carregando...</p>
    </div>
  )

  const brandColor = tenant.settings?.brandColor ?? '#6366f1'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: brandColor }}>
            {tenant.name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{tenant.name}</p>
            <p className="text-xs text-gray-500">Agendar serviço</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* STEP: done */}
        {step === 'done' && (
          <div className="card text-center py-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-500 text-sm mb-6">Você receberá uma confirmação em breve.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Profissional</span><span className="font-medium">{selectedProvider?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="font-medium">{formatDate(selectedSlot?.startsAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Horário</span><span className="font-medium">{formatTime(selectedSlot?.startsAt)}</span></div>
            </div>
            <button className="btn-outline" onClick={() => { setStep('service'); setSelectedService(null); setSelectedProvider(null); setSelectedSlot(null) }}>
              Fazer outro agendamento
            </button>
          </div>
        )}

        {/* STEP: service */}
        {step === 'service' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Escolha o serviço</h2>
            <div className="grid gap-3">
              {tenant.services?.map((s: any) => (
                <button key={s.id} onClick={() => { setSelectedService(s); setStep('provider') }}
                  className="card text-left hover:border-brand transition-colors flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} />{s.durationMin} min</span>
                      <span className="text-xs font-medium text-green-700">{formatCurrency(Number(s.price))}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: provider */}
        {step === 'provider' && (
          <div className="space-y-4">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" onClick={() => setStep('service')}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Escolha o profissional</h2>
            <div className="grid gap-3">
              {tenant.providers?.map((p: any) => (
                <button key={p.id} onClick={() => { setSelectedProvider(p); setStep('slot') }}
                  className="card text-left hover:border-brand transition-colors flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0" style={{ background: `${brandColor}20` }}>
                    <User size={18} style={{ color: brandColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.specialty && <p className="text-sm text-gray-500">{p.specialty}</p>}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: slot */}
        {step === 'slot' && (
          <div className="space-y-4">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" onClick={() => setStep('provider')}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Escolha o horário</h2>

            {/* date picker */}
            <div className="card p-3">
              <div className="flex items-center justify-between mb-3">
                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm font-medium capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                  <ChevronRight size={18} />
                </button>
              </div>

              {slotsLoading ? (
                <p className="text-center text-sm text-gray-500 py-4">Buscando horários...</p>
              ) : slots.filter(s => s.available).length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">Sem horários disponíveis</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.filter(s => s.available).map((s: any, i: number) => (
                    <button key={i}
                      onClick={() => { setSelectedSlot(s); setStep('info') }}
                      className={cn('py-2 rounded-lg text-sm font-medium border transition-all',
                        'border-gray-200 hover:border-brand hover:text-brand bg-white'
                      )}>
                      {formatTime(s.startsAt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP: info */}
        {step === 'info' && (
          <div className="space-y-4">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" onClick={() => setStep('slot')}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Seus dados</h2>

            <div className="card space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-gray-500">{selectedService?.name} · {selectedProvider?.name}</p>
                <p className="font-medium text-gray-900 capitalize">{formatDate(selectedSlot?.startsAt)} às {formatTime(selectedSlot?.startsAt)}</p>
              </div>

              {[
                { key: 'name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
                { key: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
                { key: 'phone', label: 'WhatsApp (opcional)', type: 'tel', placeholder: '+55 11 99999-9999' },
                { key: 'notes', label: 'Observações (opcional)', type: 'text', placeholder: 'Alguma observação?' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input className="input" type={type} placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button className="btn-primary w-full" onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email}
                style={{ background: brandColor }}>
                {submitting ? 'Agendando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
