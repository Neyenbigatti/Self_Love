"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { ForgotPasswordForm } from "./forgot-password-form"
import { ResetPasswordForm } from "./reset-password-form"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  /** Optional raw token from URL — activates reset mode on mount */
  initialToken?: string
}

export function AuthCard({ initialToken }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(
    initialToken ? "reset" : "login",
  )

  // If initialToken is provided, go to reset mode
  useEffect(() => {
    if (initialToken) {
      setMode("reset")
    }
  }, [initialToken])

  const showTabs = mode === "login" || mode === "register"

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo & Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">
          SelfLove
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Estética Médica Premium
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 overflow-hidden">
        {/* Mode Toggle (only for login/register) */}
        {showTabs && (
          <div className="flex border-b border-border/50">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 py-4 text-sm font-medium transition-all duration-200",
                mode === "login"
                  ? "text-foreground bg-background/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30",
              )}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 py-4 text-sm font-medium transition-all duration-200",
                mode === "register"
                  ? "text-foreground bg-background/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30",
              )}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {mode === "login" && (
            <LoginForm
              onSwitchToRegister={() => setMode("register")}
              onSwitchToForgot={() => setMode("forgot")}
            />
          )}
          {mode === "register" && (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
          {mode === "forgot" && (
            <ForgotPasswordForm onSwitchToLogin={() => setMode("login")} />
          )}
          {mode === "reset" && (
            <ResetPasswordForm
              onSwitchToLogin={() => setMode("login")}
              onSwitchToForgot={() => setMode("forgot")}
            />
          )}
        </div>
      </div>

      {/* Footer (hide for reset mode — cleaner UX) */}
      {mode !== "reset" && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          Al continuar, aceptás nuestros{" "}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Términos de Servicio
          </a>{" "}
          y nuestra{" "}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Política de Privacidad
          </a>
        </p>
      )}
    </div>
  )
}
