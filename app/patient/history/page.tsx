// P7 — Auditoría de estabilidad
// Archivos analizados:
//   app/patient/page.tsx        → useEffect(() => { loadAppointments() }, [])
//   app/patient/book/page.tsx   → router.push('/patient?booked=true')
//
// Hallazgos:
// 1. El dashboard carga turnos solo en mount via useEffect([ ]). Si el usuario
//    viene de /patient/book después de crear un turno, el componente puede estar
//    montado y NO refetchea — la navegación con router.push no garantiza remount
//    porque Next.js App Router reusa el layout padre.
// 2. React 18 Strict Mode renderiza dos veces en desarrollo, lo que mitiga
//    parcialmente el stale data, pero en producción el problema persiste.
// 3. Posible race condition: loadAppointments en mount + router.push sin await
//    → el fetch puede completarse antes de que la DB persista el nuevo turno.
//
// Recomendación:
//   a) Usar un search param (booked=true) como KEY del componente para forzar
//      remount. Ej: <DashboardPage key={searchParams.booked} />
//   b) O refetchear en focus via useCallback + useEffect con focus event.
//   c) O usar router.refresh() después de push para invalidar el cache del
//      Server Component y forzar re-render del layout.
//   NOTA: Este archivo (history) no tiene el mismo problema porque la paginación
//   es client-side sobre datos ya cargados.

'use client'

import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { AppointmentHistoryCard } from '@/components/patient-portal/appointment-history-card'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/lib/types'

const PER_PAGE = 5

export default function PatientHistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/appointments')
      if (!res.ok) throw new Error('Error al cargar el historial')
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
      setError(err instanceof Error ? err.message : 'Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const history = appointments.filter(
    (apt) => apt.date < today || apt.status === 'completed' || apt.status === 'cancelled',
  )
  // Most recent first
  const sorted = [...history].sort((a, b) => b.date.getTime() - a.date.getTime())

  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const paged = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [sorted.length])

  // ── Pagination helpers ────────────────────────────────────────────────────────

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    // Always show first 3
    pages.push(1, 2, 3)

    // Current page in the middle block → show it
    if (currentPage > 4 && currentPage < totalPages - 3) {
      pages.push('ellipsis', currentPage, 'ellipsis')
    } else if (currentPage <= 4) {
      pages.push('ellipsis')
    } else {
      pages.push('ellipsis')
    }

    // Last 3
    pages.push(totalPages - 2, totalPages - 1, totalPages)
    return pages
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-muted-foreground">
          Cargando historial...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <Loader2 className="mx-auto mb-3 size-8 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No se pudo cargar el historial
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={loadAppointments}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-[#6B3B3B] transition-colors hover:bg-brand-rose/90"
          >
            <Loader2 className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
          Historial de Turnos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Turnos completados y cancelados
        </p>
      </div>

      {/* History list */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-warm-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tenés turnos anteriores.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((apt) => (
              <AppointmentHistoryCard key={apt.id} appointment={apt} />
            ))}
          </div>

          {/* Pagination — only if more than one page */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginación del historial"
              className="flex items-center justify-center gap-1 pt-4"
            >
              {/* Previous */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  currentPage === 1
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Page numbers — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-2 text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        'inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                        page === currentPage
                          ? 'bg-brand-rose-light text-brand-rose-dark'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  currentPage === totalPages
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
