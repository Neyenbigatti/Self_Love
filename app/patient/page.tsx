'use client'

import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentCard } from '@/components/patient-portal/appointment-card'
import type { Appointment } from '@/lib/types'

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/appointments')
      if (!res.ok)       throw new Error('Error al cargar turnos')
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
      setError(err instanceof Error ? err.message : 'Error al cargar turnos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleCancelAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel appointment')
      }

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: 'cancelled' as const } : apt,
        ),
      )
      toast.success('Turno cancelado')
    } catch (err) {
      console.error('Failed to cancel appointment:', err)
      toast.error(err instanceof Error ? err.message : 'Error al cancelar turno')
    }
  }

  const now = new Date()
  const upcoming = appointments.filter(
    (apt) => apt.date >= now && apt.status !== 'cancelled',
  )
  const history = appointments.filter(
    (apt) => apt.date < now || apt.status === 'completed' || apt.status === 'cancelled',
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground text-sm">Cargando turnos...</div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center max-w-md">
          <Loader2 className="mx-auto size-8 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No se pudieron cargar los turnos
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl leading-tight">
          Mis Turnos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gestioná tus turnos y consultá los próximos.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            Próximos
          </h2>
          {upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No tenés turnos próximos.{' '}
                <a href="/patient/book" className="text-accent underline underline-offset-2 hover:text-accent/80">
                  Reservá uno ahora
                </a>
              </p>
            </div>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} variant="upcoming" onCancel={handleCancelAppointment} />
            ))}
          </div>
        )}
      </section>

      {/* Appointment History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            Historial
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {history.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} variant="history" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
