'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

interface Patient {
  id: string
  name: string
  avatar?: string
  lastVisit: string
  nextAppointment?: string
}

interface RecentPatientsProps {
  patients: Patient[]
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Pacientes Recientes</h3>
        <Button variant="ghost" size="sm" className="text-accent">
          Ver Todos
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div className="divide-y divide-border">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={patient.avatar} alt={patient.name} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {patient.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  Última visita: {patient.lastVisit}
                </p>
              </div>
            </div>
            {patient.nextAppointment && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Próximo turno</p>
                <p className="text-sm font-medium text-foreground">
                  {patient.nextAppointment}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
