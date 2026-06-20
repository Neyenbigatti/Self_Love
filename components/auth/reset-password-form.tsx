"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void
  onSwitchToForgot: () => void
}

interface FormErrors {
  password?: string
  confirm?: string
}

export function ResetPasswordForm({ onSwitchToLogin, onSwitchToForgot }: ResetPasswordFormProps) {
  const searchParams = useSearchParams()
  const rawToken = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // If there's no token in the URL, show an error immediately
  const noToken = !rawToken

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!password) {
      errs.password = "La contraseña es obligatoria"
    } else if (password.length < 6) {
      errs.password = "La contraseña debe tener al menos 6 caracteres"
    }
    if (!confirm) {
      errs.confirm = "Confirmá la contraseña"
    } else if (password !== confirm) {
      errs.confirm = "Las contraseñas no coinciden"
    }
    return errs
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setTouched({ password: true, confirm: true })
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        // Map API errors to contextual messages
        if (res.status === 404) {
          throw new Error("Token inválido. Solicitá un nuevo enlace.")
        }
        if (res.status === 410) {
          throw new Error(json.error || "Token expirado o ya utilizado. Solicitá un nuevo enlace.")
        }
        throw new Error(json.error || "Error al restablecer la contraseña")
      }

      setIsSuccess(true)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Ocurrió un error. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const fieldError = (field: keyof FormErrors) =>
    touched[field] ? errors[field] : undefined

  // ── No token state ────────────────────────────────────────────────────
  if (noToken) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <svg className="size-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Enlace inválido</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          El enlace que usaste no contiene un token de recuperación válido.
        </p>
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:underline"
        >
          Solicitar un nuevo enlace
        </button>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/10">
          <svg className="size-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Contraseña actualizada</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu contraseña fue actualizada exitosamente. Ya podés iniciar sesión con tu nueva contraseña.
        </p>
        <Button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          Ir a Iniciar Sesión
        </Button>
      </div>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground text-center">
        Ingresá tu nueva contraseña.
      </p>

      {/* API Error */}
      {apiError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" role="alert">
          {apiError}
        </div>
      )}

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password" className="text-sm font-medium text-foreground">
          Nueva Contraseña
        </Label>
        <Input
          id="reset-password"
          type="password"
          placeholder="Creá una contraseña segura"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (touched.password) setErrors(validate())
          }}
          onBlur={() => handleBlur("password")}
          aria-describedby={fieldError("password") ? "reset-password-error" : undefined}
          aria-invalid={!!fieldError("password")}
          className={cn(
            "h-11 rounded-xl bg-input border-border/50 transition-all",
            "focus-visible:border-accent focus-visible:ring-accent/20",
            fieldError("password") && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          )}
        />
        {fieldError("password") && (
          <p id="reset-password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {fieldError("password")}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm" className="text-sm font-medium text-foreground">
          Confirmar Contraseña
        </Label>
        <Input
          id="reset-confirm"
          type="password"
          placeholder="Repetí la contraseña"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            if (touched.confirm) setErrors(validate())
          }}
          onBlur={() => handleBlur("confirm")}
          aria-describedby={fieldError("confirm") ? "reset-confirm-error" : undefined}
          aria-invalid={!!fieldError("confirm")}
          className={cn(
            "h-11 rounded-xl bg-input border-border/50 transition-all",
            "focus-visible:border-accent focus-visible:ring-accent/20",
            fieldError("confirm") && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          )}
        />
        {fieldError("confirm") && (
          <p id="reset-confirm-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {fieldError("confirm")}
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
            Restableciendo…
          </span>
        ) : (
          "Restablecer contraseña"
        )}
      </Button>

      {/* Links */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">¿Problemas con el enlace?</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchToForgot}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
      >
        Solicitar un nuevo enlace
      </button>
    </form>
  )
}
