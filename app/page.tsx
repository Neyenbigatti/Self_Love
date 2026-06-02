'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { AuthCard } from "@/components/auth/auth-card"

export default function AuthPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated professionals to dashboard
  useEffect(() => {
    if (!isLoading && user?.role === 'professional') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  // Show loading while checking session (avoids flash)
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </main>
    )
  }

  // If user is loaded and is professional, will redirect via useEffect
  if (user) return null

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative w-full">
        <AuthCard />
      </div>
    </main>
  )
}
