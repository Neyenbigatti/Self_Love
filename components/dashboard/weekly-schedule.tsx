'use client'

import { cn } from '@/lib/utils'

interface ScheduleSlot {
  id: string
  time: string
  title: string
  type: 'appointment' | 'break' | 'blocked'
}

interface DaySchedule {
  day: string
  date: string
  isToday?: boolean
  slots: ScheduleSlot[]
}

interface WeeklyScheduleProps {
  schedule: DaySchedule[]
}

const slotStyles = {
  appointment: 'bg-accent/10 border-accent/30 text-accent',
  break: 'bg-secondary border-border text-muted-foreground',
  blocked: 'bg-muted border-border text-muted-foreground',
}

export function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Weekly Schedule</h3>
      </div>
      <div className="grid grid-cols-5 divide-x divide-border">
        {schedule.map((day) => (
          <div key={day.day} className="min-h-[200px]">
            <div
              className={cn(
                'border-b border-border px-3 py-2 text-center',
                day.isToday && 'bg-accent/5'
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{day.day}</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  day.isToday ? 'text-accent' : 'text-foreground'
                )}
              >
                {day.date}
              </p>
            </div>
            <div className="space-y-1 p-2">
              {day.slots.map((slot) => (
                <div
                  key={slot.id}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs',
                    slotStyles[slot.type]
                  )}
                >
                  <p className="font-medium">{slot.time}</p>
                  <p className="truncate">{slot.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
