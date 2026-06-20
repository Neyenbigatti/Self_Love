"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  phone?: string
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive flex items-center gap-1" role="alert">
      <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
      {message}
    </p>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [cooldown, setCooldown] = useState(0)

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!formData.fullName.trim()) errs.fullName = "El nombre completo es obligatorio"
    if (!formData.email) errs.email = "El email es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Ingresá un email válido"
    if (!formData.password) errs.password = "La contraseña es obligatoria"
    else if (formData.password.length < 8) errs.password = "Debe tener al menos 8 caracteres"
    return errs
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) setErrors(validate())
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const inputClass = (field: keyof FormErrors) =>
    cn(
      "h-11 rounded-xl bg-input border-border/50 transition-all",
      "focus-visible:border-accent focus-visible:ring-accent/20",
      touched[field] && errors[field] && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
    )

  const fieldError = (field: keyof FormErrors) =>
    touched[field] ? errors[field] : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setErrors({})
    const allFields = ["fullName", "email", "password"]
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])))
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Error al registrarse')
      }

      // Show success — user needs to check email
      setIsSuccess(true)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Cooldown countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Resend verification email ──────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendStatus === 'sending') return;

    setResendStatus('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al reenviar el correo');
      }

      setResendStatus('sent');
      setCooldown(60);
    } catch (err) {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 3000);
    }
  }, [cooldown, resendStatus, formData.email]);

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
          Te enviamos un link de verificación a <strong>{formData.email}</strong>.
          Hacé clic en el enlace para activar tu cuenta.
        </p>
        <Button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          Ir a Iniciar Sesión
        </Button>

        <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-border/40 w-full">
          <p className="text-xs text-muted-foreground">¿No recibiste el correo?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cooldown > 0 || resendStatus === 'sending'}
            onClick={handleResend}
            className="h-9 rounded-xl text-xs font-medium"
          >
            {resendStatus === 'sending'
              ? 'Enviando…'
              : resendStatus === 'sent'
                ? '¡Correo reenviado!'
                : cooldown > 0
                  ? `Reenviar en ${cooldown}s`
                  : 'Reenviar correo de verificación'}
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
      {/* API Error */}
      {apiError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" role="alert">
          {apiError}
        </div>
      )}

      <Field id="fullName" label="Nombre Completo" error={fieldError("fullName")}>
        <Input
          id="fullName"
          type="text"
          placeholder="Ingresá tu nombre completo"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={() => handleBlur("fullName")}
          aria-invalid={!!fieldError("fullName")}
          aria-describedby={fieldError("fullName") ? "fullName-error" : undefined}
          className={inputClass("fullName")}
        />
      </Field>

      <Field id="email" label="Correo Electrónico" error={fieldError("email")}>
        <Input
          id="email"
          type="email"
          placeholder="tu@ejemplo.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          aria-invalid={!!fieldError("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className={inputClass("email")}
        />
      </Field>

      <Field
        id="password"
        label="Contraseña"
        error={fieldError("password")}
        hint="Mínimo 8 caracteres"
      >
        <Input
          id="password"
          type="password"
          placeholder="Creá una contraseña segura"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          aria-invalid={!!fieldError("password")}
          aria-describedby={fieldError("password") ? "password-error" : "password-hint"}
          className={inputClass("password")}
        />
      </Field>

      <Field id="phone" label="Teléfono (opcional)" error={fieldError("phone")}>
        <Input
          id="phone"
          type="tel"
          placeholder="+54 11 1234-5678"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          className={inputClass("phone")}
        />
      </Field>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 mt-1"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin size-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creando cuenta…
          </span>
        ) : (
          "Crear Cuenta"
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">¿Ya tenés una cuenta?</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
      >
        Iniciar Sesión
      </button>
    </form>
  )
}
