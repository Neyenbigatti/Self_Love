'use client'

import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { AppointmentCard } from '@/components/patient-portal/appointment-card'
import type { Appointment } from '@/lib/types'

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => {
        const transformed = (data.appointments ?? []).map(
          (apt: Record<string, string>) => ({
            ...apt,
            date: parseISO(apt.date),
          }),
        ) as Appointment[]
        setAppointments(transformed)
      })
      .catch((err) => {
        console.error('Failed to fetch appointments:', err)
      })
      .finally(() => setLoading(false))
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
