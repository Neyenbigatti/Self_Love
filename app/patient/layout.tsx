'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { PatientNavbar } from '@/components/patient-portal/patient-navbar'

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect non-patient users away
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'patient')) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'patient') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
