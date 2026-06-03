// ─── Types shared between dashboard page and its sub-components ──────────────

export interface AppointmentTableItem {
  id: string
  patientName: string
  patientAvatar?: string
  treatment: string
  time: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
}

export interface ScheduleSlot {
  id: string
  time: string
  title: string
  type: 'appointment' | 'break' | 'blocked'
}

export interface DaySchedule {
  day: string
  date: string
  isToday?: boolean
  slots: ScheduleSlot[]
}
