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

const statusStyles = {
  confirmed: 'bg-green-100 text-green-700 hover:bg-green-100',
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  completed: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  cancelled: 'bg-red-100 text-red-700 hover:bg-red-100',
}

export function AppointmentsTable({ appointments, title }: AppointmentsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {appointments.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No appointments scheduled
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {appointment.patientName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {appointment.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">{appointment.treatment}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{appointment.time}</span>
                <Badge
                  variant="secondary"
                  className={cn('capitalize', statusStyles[appointment.status])}
                >
                  {appointment.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
