'use client'

import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
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
      if (!res.ok) throw new Error('Failed to load appointments')
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
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

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
        <div className="animate-pulse text-muted-foreground text-sm">Loading appointments...</div>
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
            Could not load appointments
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Retry
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
          My Appointments
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          View and manage your upcoming appointments.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming appointments.{' '}
              <a href="/patient/book" className="text-accent underline underline-offset-2 hover:text-accent/80">
                Book one now
              </a>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* Appointment History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            History
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
