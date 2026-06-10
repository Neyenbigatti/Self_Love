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
      if (!res.ok) throw new Error('Error al cargar turnos')
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = appointments.filter(
    (apt) => apt.date >= today && apt.status !== 'cancelled',
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-muted-foreground">
          Cargando turnos...
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <Loader2 className="mx-auto mb-3 size-8 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No se pudieron cargar los turnos
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
          Mis Turnos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gestioná tus turnos y consultá los próximos.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-rose-dark">
          Próximos
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-warm-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No tenés turnos próximos.{' '}
              <a
                href="/patient/book"
                className="text-brand-rose-dark underline underline-offset-2 hover:text-brand-rose"
              >
                Reservá uno ahora
              </a>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                variant="upcoming"
                onCancel={handleCancelAppointment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
