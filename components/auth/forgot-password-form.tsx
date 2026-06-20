"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedEmail, setSavedEmail] = useState("")
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resendCooldown, setResendCooldown] = useState(0)

  const emailError =
    touched && !email
      ? "El email es obligatorio"
      : touched && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Ingresá un email válido"
        : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTouched(true)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Error al enviar el correo")
      }

      setSavedEmail(email.trim())
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Resend cooldown ────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ── Resend (reuses forgot-password endpoint) ──────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return;

    setResendStatus('sending');
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: savedEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al reenviar");
      }

      setResendStatus('sent');
      setResendCooldown(30);
    } catch {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 3000);
    }
  }, [resendCooldown, resendStatus, savedEmail]);

  // ── Success state ──────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/10">
          <svg className="size-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Revisá tu email</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Te enviamos un enlace a <strong>{savedEmail}</strong> para restablecer tu contraseña.
          Si no lo ves en la bandeja de entrada, revisá la carpeta de <strong>Spam</strong> o <strong>Promociones</strong>.
        </p>

        <Button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          Volver a Iniciar Sesión
        </Button>

        <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-border/40 w-full">
          <p className="text-xs text-muted-foreground">¿No recibiste el correo?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resendCooldown > 0 || resendStatus === 'sending'}
            onClick={handleResend}
            className="h-9 rounded-xl text-xs font-medium"
          >
            {resendStatus === 'sending'
              ? 'Enviando…'
              : resendStatus === 'sent'
                ? '¡Enlace reenviado!'
                : resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : 'Enviar otro enlace'}
          </Button>
          {resendStatus === 'error' && (
            <p className="text-xs text-destructive">Error al reenviar. Intentá de nuevo.</p>
          )}
        </div>
      </div>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground text-center">
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
          Correo Electrónico
        </Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="tu@ejemplo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (touched) setError(null)
          }}
          onBlur={() => setTouched(true)}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
          aria-invalid={!!emailError}
          className={cn(
            "h-11 rounded-xl bg-input border-border/50 transition-all",
            "focus-visible:border-accent focus-visible:ring-accent/20",
            emailError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          )}
        />
        {emailError && (
          <p id="forgot-email-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {emailError}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin size-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando…
          </span>
        ) : (
          "Enviar enlace de recuperación"
        )}
      </Button>

      {/* Back to login */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">¿Recordaste tu contraseña?</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
      >
        Volver a Iniciar Sesión
      </button>
    </form>
  )
}
