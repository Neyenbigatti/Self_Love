'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthCard } from '@/components/auth/auth-card'

/**
 * Wraps AuthCard with useSearchParams access to detect ?token=
 * Suspense boundary is required by Next.js for useSearchParams().
 */
function AuthCardWithToken() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || undefined

  return <AuthCard initialToken={token} />
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative w-full">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground text-sm">Cargando...</div>
          </div>
        }>
          <AuthCardWithToken />
        </Suspense>
      </div>
    </main>
  )
}
