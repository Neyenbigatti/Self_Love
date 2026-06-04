'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { PatientSidebar } from '@/components/patient-portal/patient-sidebar'
import { PatientTopbar } from '@/components/patient-portal/patient-topbar'

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect non-patient users away
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'patient')) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'patient') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-brand-warm-bg">
      <PatientSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col md:pl-64">
        <PatientTopbar
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          isMenuOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
