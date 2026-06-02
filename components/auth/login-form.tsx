"use client"
 
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
 
interface LoginFormProps {
  onSwitchToRegister: () => void
}
 
interface FormErrors {
  email?: string
  password?: string
}
 
export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
 
  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Password is required"
    else if (password.length < 6) errs.password = "Password must be at least 6 characters"
    return errs
  }
 
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate())
  }
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
 
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("[v0] Mock login:", { email, rememberMe })
    alert("Login successful! (Mock authentication)")
    setIsLoading(false)
  }
 
  const fieldError = (field: keyof FormErrors) =>
    touched[field] ? errors[field] : undefined
 
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (touched.email) setErrors(validate())
          }}
          onBlur={() => handleBlur("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          aria-invalid={!!fieldError("email")}
          className={cn(
            "h-11 rounded-xl bg-input border-border/50 transition-all",
            "focus-visible:border-accent focus-visible:ring-accent/20",
            fieldError("email") && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {fieldError("email") && (
          <p id="email-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {fieldError("email")}
          </p>
        )}
      </div>
 
      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <button
            type="button"
            className="text-xs text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (touched.password) setErrors(validate())
          }}
          onBlur={() => handleBlur("password")}
          aria-describedby={fieldError("password") ? "password-error" : undefined}
          aria-invalid={!!fieldError("password")}
          className={cn(
            "h-11 rounded-xl bg-input border-border/50 transition-all",
            "focus-visible:border-accent focus-visible:ring-accent/20",
            fieldError("password") && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {fieldError("password") && (
          <p id="password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {fieldError("password")}
          </p>
        )}
      </div>
 
      {/* Remember me */}
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label
          htmlFor="remember"
          className="text-sm text-muted-foreground cursor-pointer font-normal select-none"
        >
          Remember me for 30 days
        </Label>
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
            Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
 
      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">New to SelfLove?</span>
        </div>
      </div>
 
      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
      >
        Create an account
      </button>
    </form>
  )
}