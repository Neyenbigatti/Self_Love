'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Check, Calendar, Clock, Scissors, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BookingCalendar } from '@/components/patient-portal/booking-calendar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Professional {
  id: string
  name: string
  title: string | null
  clinicName: string | null
  avatar: string | null
}

interface TreatmentType {
  id: string
  professionalId: string
  name: string
  duration: number
  description: string | null
  price: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return ''
  return `$${(cents / 100).toFixed(2)}`
}

type Step = 'treatment' | 'datetime' | 'confirm'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookAppointmentPage() {
  const router = useRouter()

  // Session data
  const [userId, setUserId] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loadingSession, setLoadingSession] = useState(true)

  // Booking state
  const [step, setStep] = useState<Step>('treatment')
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentType | null>(null)
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([])
  const [loadingTreatments, setLoadingTreatments] = useState(false)

  // Date & time state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()

  // Booking submission
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch session + professionals on mount ────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUserId(data.user?.id ?? null)
        setProfessionals(data.professionals ?? [])
        // Auto-select if only one professional
        if (data.professionals?.length === 1) {
          setSelectedProfessional(data.professionals[0])
        }
      })
      .catch(() => {
        setError('Error al cargar la sesión. Intentá de nuevo.')
      })
      .finally(() => setLoadingSession(false))
  }, [])

  // ── Fetch treatment types when professional is selected ───────────────────
  const fetchTreatments = useCallback(() => {
    if (!selectedProfessional) return

    setLoadingTreatments(true)
    setTreatmentTypes([])

    fetch(`/api/treatment-types?professionalId=${selectedProfessional.id}`)
      .then((r) => r.json())
      .then((data) => {
        setTreatmentTypes(data.treatmentTypes ?? [])
      })
      .catch(() => {
        setError('Error al cargar tratamientos.')
      })
      .finally(() => setLoadingTreatments(false))
  }, [selectedProfessional])

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments])

  // ── Refetch treatments when tab regains focus (e.g. professional toggled active/inactive) ──
  useEffect(() => {
    if (!selectedProfessional) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTreatments()
      }
    }

    const handleFocus = () => {
      fetchTreatments()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchTreatments, selectedProfessional])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTreatmentSelect = (treatment: TreatmentType) => {
    setSelectedTreatment(treatment)
    setStep('datetime')
  }

  const handleSlotSelect = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
  }

  const handleProceedToConfirm = () => {
    if (selectedDate && selectedTime) {
      setStep('confirm')
    }
  }

  const handleConfirm = async () => {
    if (!userId || !selectedProfessional || !selectedTreatment || !selectedDate || !selectedTime) return

    setBooking(true)
    setError(null)

    const endTime = addMinutes(selectedTime, selectedTreatment.duration)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          professionalId: selectedProfessional.id,
          treatmentType: selectedTreatment.name,
          treatmentTypeId: selectedTreatment.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedTime,
          endTime,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al reservar turno')
      }

      // Success — redirect to patient dashboard
      router.push('/patient?booked=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setBooking(false)
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === 'datetime') {
      setSelectedDate(undefined)
      setSelectedTime(undefined)
      setStep('treatment')
    } else if (step === 'confirm') {
      setStep('datetime')
    } else {
      router.push('/patient')
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <div className="space-y-8">
        <Link href="/patient" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Volver a mis turnos
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Iniciá sesión</CardTitle>
            <CardDescription>Necesitás iniciar sesión para reservar un turno.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Ir a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Professional not available ────────────────────────────────────────────

  if (professionals.length === 0) {
    return (
      <div className="space-y-8">
        <Link href="/patient" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Volver a mis turnos
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>No hay profesionales disponibles</CardTitle>
            <CardDescription>No hay profesionales disponibles para reservar en este momento.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // ── Professional selection (multi-professional support) ───────────────────

  if (!selectedProfessional) {
    return (
      <div className="space-y-8">
        <Link href="/patient" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Volver a mis turnos
        </Link>

        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl leading-tight">
            Reservar un Turno
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Seleccioná un profesional para reservar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {professionals.map((pro) => (
            <Card
              key={pro.id}
              className="cursor-pointer transition-all hover:border-accent hover:shadow-sm"
              onClick={() => setSelectedProfessional(pro)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{pro.name}</CardTitle>
                {pro.title && (
                  <CardDescription>{pro.title}</CardDescription>
                )}
                {pro.clinicName && (
                  <p className="text-xs text-muted-foreground">{pro.clinicName}</p>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const steps = [
    { key: 'treatment' as Step, label: 'Tratamiento', icon: Scissors },
    { key: 'datetime' as Step, label: 'Fecha y Hora', icon: Calendar },
    { key: 'confirm' as Step, label: 'Confirmar', icon: Check },
  ]

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {step === 'datetime' && 'Cambiar tratamiento'}
          {step === 'confirm' && 'Cambiar fecha y hora'}
          {step === 'treatment' && 'Volver a mis turnos'}
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const currentIndex = steps.findIndex((st) => st.key === step)
            const isActive = i <= currentIndex
            const isCurrent = s.key === step
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    isCurrent
                      ? 'bg-accent text-accent-foreground'
                      : isActive
                      ? 'bg-accent/20 text-accent'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    'hidden text-xs font-medium sm:inline',
                    isCurrent ? 'text-foreground' : isActive ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-px w-4',
                      i < currentIndex ? 'bg-accent' : 'bg-border',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Heading */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl leading-tight">
          {step === 'treatment' && 'Seleccionar Tratamiento'}
          {step === 'datetime' && 'Elegir Fecha y Hora'}
          {step === 'confirm' && 'Confirmar Turno'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Reservando con <span className="font-medium text-foreground">{selectedProfessional.name}</span>
          {selectedProfessional.clinicName && <> &middot; {selectedProfessional.clinicName}</>}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Step 1: Treatment Selection ────────────────────────────────────── */}
      {step === 'treatment' && (
        <>
          {loadingTreatments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground text-sm">Cargando tratamientos...</div>
            </div>
          ) : treatmentTypes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay tratamientos disponibles</CardTitle>
                <CardDescription>
                  Este profesional todavía no configuró sus tratamientos.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {treatmentTypes.map((treatment) => (
                <Card
                  key={treatment.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-accent hover:shadow-sm',
                    selectedTreatment?.id === treatment.id && 'border-accent ring-1 ring-accent',
                  )}
                  onClick={() => handleTreatmentSelect(treatment)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{treatment.name}</CardTitle>
                    {treatment.description && (
                      <CardDescription className="text-xs">
                        {treatment.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-0">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {treatment.duration} min
                      </span>
                    </div>
                    {treatment.price !== null && treatment.price > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatPrice(treatment.price)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Step 2: Date & Time Selection ──────────────────────────────────── */}
      {step === 'datetime' && (
        <div className="space-y-6">
          <BookingCalendar
            professionalId={selectedProfessional.id}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            duration={selectedTreatment?.duration}
          />

          {/* Continue button */}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!selectedTreatment || !selectedDate || !selectedTime}
              onClick={handleProceedToConfirm}
            >
              Continuar a Confirmar
              <Check className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ──────────────────────────────────────────── */}
      {step === 'confirm' && selectedTreatment && selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Treatment */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Tratamiento
                </p>
                <p className="font-semibold text-foreground">{selectedTreatment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTreatment.duration} min
                  {selectedTreatment.price !== null && selectedTreatment.price > 0 && (
                    <> &middot; {formatPrice(selectedTreatment.price)}</>
                  )}
                </p>
              </div>

              {/* Professional */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Profesional
                </p>
                <p className="font-semibold text-foreground">{selectedProfessional.name}</p>
                {selectedProfessional.title && (
                  <p className="text-sm text-muted-foreground">{selectedProfessional.title}</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Fecha
                </p>
                <p className="font-semibold text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {/* Time */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Horario
                </p>
                <p className="font-semibold text-foreground">
                  {selectedTime} - {addMinutes(selectedTime, selectedTreatment.duration)}
                </p>
              </div>
            </div>

            {/* Status note */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-medium">Pendiente de Confirmación</p>
              <p className="mt-1 text-amber-700">
                El turno se creará como pendiente. La clínica lo confirmará a la brevedad.
              </p>
            </div>

            {/* Book button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
                Cambiar
              </Button>
              <Button size="lg" onClick={handleConfirm} disabled={booking} className="w-full sm:w-auto">
                {booking ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  'Confirmar Reserva'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
