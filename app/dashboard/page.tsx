import { CalendarDays, Users, CheckCircle, Clock } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { AppointmentsTable } from '@/components/dashboard/appointments-table'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule'
import { RecentPatients } from '@/components/dashboard/recent-patients'

// Mock data
const statsData = [
  {
    title: 'Appointments Today',
    value: 8,
    description: '2 completed, 6 remaining',
    icon: CalendarDays,
    trend: { value: 12, isPositive: true },
  },
  {
    title: 'Confirmed Reservations',
    value: 24,
    description: 'This week',
    icon: CheckCircle,
    trend: { value: 8, isPositive: true },
  },
  {
    title: 'Pending Reservations',
    value: 5,
    description: 'Awaiting confirmation',
    icon: Clock,
  },
  {
    title: 'Registered Patients',
    value: 1248,
    description: '32 new this month',
    icon: Users,
    trend: { value: 4, isPositive: true },
  },
]

const upcomingAppointments = [
  {
    id: '1',
    patientName: 'Sarah Johnson',
    treatment: 'Botox Treatment',
    time: '09:00 AM',
    status: 'confirmed' as const,
  },
  {
    id: '2',
    patientName: 'Michael Chen',
    treatment: 'Dermal Filler Consultation',
    time: '10:30 AM',
    status: 'confirmed' as const,
  },
  {
    id: '3',
    patientName: 'Emily Davis',
    treatment: 'Chemical Peel',
    time: '11:45 AM',
    status: 'pending' as const,
  },
  {
    id: '4',
    patientName: 'Robert Wilson',
    treatment: 'Laser Hair Removal',
    time: '02:00 PM',
    status: 'confirmed' as const,
  },
  {
    id: '5',
    patientName: 'Jennifer Brown',
    treatment: 'Microneedling Session',
    time: '03:30 PM',
    status: 'pending' as const,
  },
]

const pendingConfirmations = [
  {
    id: '6',
    patientName: 'Amanda White',
    treatment: 'Initial Consultation',
    time: 'Tomorrow 10:00 AM',
    status: 'pending' as const,
  },
  {
    id: '7',
    patientName: 'David Lee',
    treatment: 'Follow-up Visit',
    time: 'Tomorrow 02:30 PM',
    status: 'pending' as const,
  },
  {
    id: '8',
    patientName: 'Lisa Anderson',
    treatment: 'Lip Enhancement',
    time: 'May 20, 09:00 AM',
    status: 'pending' as const,
  },
]

const recentPatients = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastVisit: 'May 15, 2026',
    nextAppointment: 'May 18, 2026',
  },
  {
    id: '2',
    name: 'Michael Chen',
    lastVisit: 'May 14, 2026',
    nextAppointment: 'May 18, 2026',
  },
  {
    id: '3',
    name: 'Emily Davis',
    lastVisit: 'May 12, 2026',
  },
  {
    id: '4',
    name: 'Robert Wilson',
    lastVisit: 'May 10, 2026',
    nextAppointment: 'May 18, 2026',
  },
]

const weeklySchedule = [
  {
    day: 'Mon',
    date: '18',
    isToday: true,
    slots: [
      { id: '1', time: '09:00', title: 'Sarah J.', type: 'appointment' as const },
      { id: '2', time: '10:30', title: 'Michael C.', type: 'appointment' as const },
      { id: '3', time: '12:00', title: 'Lunch', type: 'break' as const },
      { id: '4', time: '14:00', title: 'Robert W.', type: 'appointment' as const },
    ],
  },
  {
    day: 'Tue',
    date: '19',
    slots: [
      { id: '5', time: '09:00', title: 'Amanda W.', type: 'appointment' as const },
      { id: '6', time: '11:00', title: 'Team Meeting', type: 'blocked' as const },
      { id: '7', time: '14:30', title: 'David L.', type: 'appointment' as const },
    ],
  },
  {
    day: 'Wed',
    date: '20',
    slots: [
      { id: '8', time: '09:00', title: 'Lisa A.', type: 'appointment' as const },
      { id: '9', time: '10:30', title: 'Jennifer B.', type: 'appointment' as const },
      { id: '10', time: '15:00', title: 'Training', type: 'blocked' as const },
    ],
  },
  {
    day: 'Thu',
    date: '21',
    slots: [
      { id: '11', time: '09:00', title: 'Emily D.', type: 'appointment' as const },
      { id: '12', time: '12:00', title: 'Lunch', type: 'break' as const },
      { id: '13', time: '14:00', title: 'Mark T.', type: 'appointment' as const },
    ],
  },
  {
    day: 'Fri',
    date: '22',
    slots: [
      { id: '14', time: '09:00', title: 'Sophie R.', type: 'appointment' as const },
      { id: '15', time: '11:30', title: 'Admin', type: 'blocked' as const },
    ],
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, Dr. Martinez. Here&apos;s your overview for today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Appointments - Takes 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          <AppointmentsTable
            title="Upcoming Appointments"
            appointments={upcomingAppointments}
          />
          <WeeklySchedule schedule={weeklySchedule} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AppointmentsTable
            title="Pending Confirmations"
            appointments={pendingConfirmations}
          />
          <RecentPatients patients={recentPatients} />
        </div>
      </div>
    </div>
  )
}
