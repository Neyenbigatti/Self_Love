'use client'

import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { AppointmentHistoryCard } from '@/components/patient-portal/appointment-history-card'
import type { Appointment } from '@/lib/types'

export default function PatientHistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/appointments')
      if (!res.ok) throw new Error('Error al cargar el historial')
      const data = await res.json()
      const transformed = (data.appointments ?? []).map(
        (apt: Record<string, string>) => ({
          ...apt,
          date: parseISO(apt.date),
        }),
      ) as Appointment[]
      setAppointments(transformed)
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const now = new Date()
  const history = appointments.filter(
    (apt) => apt.date < now || apt.status === 'completed' || apt.status === 'cancelled',
  )
  // Most recent first
  const sorted = [...history].sort((a, b) => b.date.getTime() - a.date.getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-muted-foreground">
          Cargando historial...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <Loader2 className="mx-auto mb-3 size-8 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No se pudo cargar el historial
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-[#6B3B3B] transition-colors hover:bg-brand-rose/90"
          >
            <Loader2 className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
          Historial de Turnos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Turnos completados y cancelados
        </p>
      </div>

      {/* History list */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-warm-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tenés turnos anteriores.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((apt) => (
            <AppointmentHistoryCard key={apt.id} appointment={apt} />
          ))}
        </div>
      )}
    </div>
  )
}
