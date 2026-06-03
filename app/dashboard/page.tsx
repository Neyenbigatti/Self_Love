'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Users, CheckCircle, Clock, Loader2 } from 'lucide-react'
import {
  startOfWeek, endOfWeek, addDays, format, isSameDay,
  parseISO,
} from 'date-fns'
import { StatsCard } from '@/components/dashboard/stats-card'
import { AppointmentsTable } from '@/components/dashboard/appointments-table'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule'
import { RecentPatients } from '@/components/dashboard/recent-patients'
import type {
  AppointmentTableItem,
  DaySchedule,
  ScheduleSlot,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

/** Map an API appointment to the AppointmentsTable shape */
function toAppointmentRow(apt: {
  id: string
  patientName: string
  patientAvatar: string | null
  treatmentType: string
  startTime: string
  status: string
}): AppointmentTableItem {
  return {
    id: apt.id,
    patientName: apt.patientName,
    patientAvatar: apt.patientAvatar ?? undefined,
    treatment: apt.treatmentType,
    time: formatTime12h(apt.startTime),
    status: apt.status as AppointmentTableItem['status'],
  }
}

/** Build the weekly schedule from availability rules + appointments */
function buildWeeklySchedule(
  availEntries: Array<{
    dayOfWeek: number | null
    startTime: string
    endTime: string
    type: string
    label: string | null
  }>,
  weekAppointments: Array<{
    date: string
    startTime: string
    endTime: string
    patientName: string
  }>,
  now: Date,
): DaySchedule[] {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const days: DaySchedule[] = []

  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i)
    const dayOfWeek = day.getDay() // 1=Mon … 5=Fri
    const dateStr = format(day, 'yyyy-MM-dd')
    const isToday = isSameDay(day, now)

    // Get rules for this day of week
    const dayRules = availEntries.filter((e) => e.dayOfWeek === dayOfWeek)
    const regularRules = dayRules.filter((e) => e.type === 'regular')
    const breakRules = dayRules.filter((e) => e.type === 'break')
    const blockedRules = dayRules.filter((e) => e.type === 'blocked')

    // Get appointments for this day
    const dayAppts = weekAppointments.filter((a) => a.date === dateStr)

    // Generate 30-min slots from regular rules
    const slots: ScheduleSlot[] = []
    const slotIdCounter: Record<string, number> = {}

    for (const rule of regularRules) {
      const start = timeToMinutes(rule.startTime)
      const end = timeToMinutes(rule.endTime)

      for (let t = start; t < end; t += 30) {
        const h = Math.floor(t / 60)
        const m = t % 60
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        // Check if this slot falls in a break period
        const inBreak = breakRules.some(
          (br) => t >= timeToMinutes(br.startTime) && t < timeToMinutes(br.endTime),
        )
        if (inBreak) {
          const label = breakRules.find(
            (br) => t >= timeToMinutes(br.startTime) && t < timeToMinutes(br.endTime),
          )?.label
          const counter = (slotIdCounter['break'] ?? 0) + 1
          slotIdCounter['break'] = counter
          slots.push({
            id: `break-${dayOfWeek}-${counter}`,
            time,
            title: label ?? 'Break',
            type: 'break',
          })
          continue
        }

        // Check if this slot is in a blocked period
        const inBlocked = blockedRules.some(
          (bl) => t >= timeToMinutes(bl.startTime) && t < timeToMinutes(bl.endTime),
        )
        if (inBlocked) {
          const label = blockedRules.find(
            (bl) => t >= timeToMinutes(bl.startTime) && t < timeToMinutes(bl.endTime),
          )?.label
          const counter = (slotIdCounter['blocked'] ?? 0) + 1
          slotIdCounter['blocked'] = counter
          slots.push({
            id: `blocked-${dayOfWeek}-${counter}`,
            time,
            title: label ?? 'Blocked',
            type: 'blocked',
          })
          continue
        }

        // Check if an appointment falls in this slot
        const slotEnd = t + 30
        const matchingAppt = dayAppts.find((apt) => {
          const aptStart = timeToMinutes(apt.startTime)
          const aptEnd = timeToMinutes(apt.endTime)
          return t < aptEnd && slotEnd > aptStart
        })

        if (matchingAppt) {
          const counter = (slotIdCounter['appt'] ?? 0) + 1
          slotIdCounter['appt'] = counter
          // Use first name only for compact display
          const firstName = matchingAppt.patientName.split(' ')[0]
          slots.push({
            id: `appt-${dayOfWeek}-${counter}`,
            time,
            title: firstName,
            type: 'appointment',
          })
        }
        // Don't add empty available slots — the mock shows only used+break+blocked
      }
    }

    days.push({
      day: format(day, 'EEE'),
      date: format(day, 'd'),
      isToday,
      slots,
    })
  }

  return days
}

// ─── Types for the API responses ─────────────────────────────────────────────

interface StatsResponse {
  stats: {
    appointmentsToday: number
    appointmentsTodayCompleted: number
    confirmedThisWeek: number
    pendingCount: number
    totalPatients: number
    newPatientsThisMonth: number
    trends: {
      appointmentsToday: number
      confirmedThisWeek: number
      totalPatients: number
    }
  }
}

interface AppointmentRow {
  id: string
  patientId: string
  patientName: string
  patientAvatar: string | null
  treatmentType: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
}

interface AppointmentsResponse {
  appointments: AppointmentRow[]
}

interface RecentPatientsResponse {
  patients: Array<{
    id: string
    name: string
    avatar: string | null
    lastVisit: string
    nextAppointment?: string
  }>
}

interface AvailabilityEntry {
  id: string
  professionalId: string
  dayOfWeek: number | null
  specificDate: string | null
  startTime: string
  endTime: string
  isAvailable: boolean
  type: string
  label: string | null
}

interface AvailabilityResponse {
  availability: AvailabilityEntry[]
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data slices
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null)
  const [upcoming, setUpcoming] = useState<AppointmentRow[]>([])
  const [pending, setPending] = useState<AppointmentRow[]>([])
  const [recentPatientsData, setRecentPatientsData] = useState<
    RecentPatientsResponse['patients']
  >([])
  const [weeklyScheduleData, setWeeklyScheduleData] = useState<DaySchedule[]>([])
  const [professionalName, setProfessionalName] = useState<string>('')

  // ── Fetch all dashboard data ──────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

      // Fetch all data slices in parallel
      const [
        meRes,
        statsRes,
        upcomingRes,
        pendingRes,
        recentRes,
        availRes,
        weekApptsRes,
      ] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/dashboard/stats'),
        fetch(`/api/appointments?startDate=${weekStart}&endDate=${weekEnd}&status=confirmed`),
        fetch('/api/appointments?status=pending'),
        fetch('/api/patients/recent'),
        fetch('/api/availability'),
        fetch(`/api/appointments?startDate=${weekStart}&endDate=${weekEnd}`),
      ])

      // Check for errors
      const allOk = [
        meRes, statsRes, upcomingRes, pendingRes, recentRes, availRes, weekApptsRes,
      ].every((r) => r.ok)

      if (!allOk) {
        throw new Error('Failed to load dashboard data')
      }

      const meData = await meRes.json()
      const statsData: StatsResponse = await statsRes.json()
      const upcomingData: AppointmentsResponse = await upcomingRes.json()
      const pendingData: AppointmentsResponse = await pendingRes.json()
      const recentData: RecentPatientsResponse = await recentRes.json()
      const availData: AvailabilityResponse = await availRes.json()
      const weekApptsData: AppointmentsResponse = await weekApptsRes.json()

      setProfessionalName(meData.user?.name?.split(' ')[0] ?? '')
      setStats(statsData.stats)
      setUpcoming(upcomingData.appointments)
      setPending(pendingData.appointments)
      setRecentPatientsData(recentData.patients)

      // Build weekly schedule from availability + week appointments
      const schedule = buildWeeklySchedule(
        availData.availability,
        weekApptsData.appointments,
        now,
      )
      setWeeklyScheduleData(schedule)
    } catch (err) {
      console.error('[dashboard] Failed to load:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
              Overview
            </p>
            <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl leading-tight">
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground animate-pulse">
              Loading your overview...
            </p>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="h-3 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-16 bg-muted rounded mb-3" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card shadow-sm animate-pulse">
              <div className="border-b border-border px-5 py-4">
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-3 w-32 bg-muted rounded mb-1" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card shadow-sm animate-pulse">
              <div className="border-b border-border px-5 py-4">
                <div className="h-4 w-36 bg-muted rounded" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-3 w-28 bg-muted rounded mb-1" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            Could not load dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Transform data for components ─────────────────────────────────────────

  const upcomingRows = upcoming.map(toAppointmentRow)
  const pendingRows = pending.map(toAppointmentRow)

  const statsCards = stats
    ? [
        {
          title: 'Appointments Today',
          value: stats.appointmentsToday,
          description: `${stats.appointmentsTodayCompleted} completed, ${stats.appointmentsToday - stats.appointmentsTodayCompleted} remaining`,
          icon: CalendarDays,
          trend: {
            value: Math.abs(stats.trends.appointmentsToday),
            isPositive: stats.trends.appointmentsToday >= 0,
          },
        },
        {
          title: 'Confirmed Reservations',
          value: stats.confirmedThisWeek,
          description: 'This week',
          icon: CheckCircle,
          trend: {
            value: Math.abs(stats.trends.confirmedThisWeek),
            isPositive: stats.trends.confirmedThisWeek >= 0,
          },
        },
        {
          title: 'Pending Reservations',
          value: stats.pendingCount,
          description: 'Awaiting confirmation',
          icon: Clock,
        },
        {
          title: 'Registered Patients',
          value: stats.totalPatients,
          description: `${stats.newPatientsThisMonth} new this month`,
          icon: Users,
          trend: {
            value: Math.abs(stats.trends.totalPatients),
            isPositive: stats.trends.totalPatients >= 0,
          },
        },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
            Overview
          </p>
          <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl leading-tight">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Welcome back{professionalName ? `, ${professionalName}` : ''}. Here&apos;s
            your overview for today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Appointments — 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          <AppointmentsTable
            title="Upcoming Appointments"
            appointments={upcomingRows}
          />
          <WeeklySchedule schedule={weeklyScheduleData} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AppointmentsTable
            title="Pending Confirmations"
            appointments={pendingRows}
          />
          <RecentPatients
            patients={recentPatientsData.map((p) => ({
              ...p,
              avatar: p.avatar ?? undefined,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
