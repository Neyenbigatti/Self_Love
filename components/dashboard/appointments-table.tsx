'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  patientName: string
  patientAvatar?: string
  treatment: string
  time: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
}

interface AppointmentsTableProps {
  appointments: Appointment[]
  title: string
}

const statusConfig = {
  confirmed: {
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  pending: {
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  completed: {
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  cancelled: {
    classes: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-400',
  },
}

export function AppointmentsTable({ appointments, title }: AppointmentsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border/60">
        {appointments.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No appointments scheduled
          </div>
        ) : (
          appointments.map((appointment) => {
            const status = statusConfig[appointment.status]
            return (
              <div
                key={appointment.id}
                className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/40 cursor-default"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
                      {appointment.patientName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                      {appointment.treatment}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs tabular-nums text-muted-foreground font-medium">
                    {appointment.time}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                      status.classes
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                    {appointment.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
