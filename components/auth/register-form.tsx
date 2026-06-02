"use client"
 
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
 
interface RegisterFormProps {
  userType: "patient" | "professional"
  onUserTypeChange: (type: "patient" | "professional") => void
  onSwitchToLogin: () => void
}
 
interface FormErrors {
  fullName?: string
  professionalTitle?: string
  clinicName?: string
  email?: string
  password?: string
  phone?: string
}
 
const userTypeOptions = [
  {
    value: "patient" as const,
    label: "Patient",
    sub: "Book treatments",
    icon: (
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: "professional" as const,
    label: "Professional",
    sub: "Manage clinic",
    icon: (
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
]
 
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
 
export function RegisterForm({ userType, onUserTypeChange, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    professionalTitle: "",
    clinicName: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
 
  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!formData.fullName.trim()) errs.fullName = "Full name is required"
    if (!formData.email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Enter a valid email address"
    if (!formData.password) errs.password = "Password is required"
    else if (formData.password.length < 8) errs.password = "Must be at least 8 characters"
    if (userType === "professional") {
      if (!formData.professionalTitle.trim()) errs.professionalTitle = "Professional title is required"
      if (!formData.clinicName.trim()) errs.clinicName = "Clinic name is required"
    }
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
    const allFields = ["fullName", "email", "password", ...(userType === "professional" ? ["professionalTitle", "clinicName"] : [])]
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])))
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
 
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    alert(`Account created successfully as ${userType}! (Mock authentication)`)
    setIsLoading(false)
  }
 
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* User type selector */}
      <fieldset>
        <legend className="text-sm font-medium text-foreground mb-2">I am registering as a</legend>
        <div className="grid grid-cols-2 gap-3">
          {userTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUserTypeChange(opt.value)}
              aria-pressed={userType === opt.value}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                userType === opt.value
                  ? "border-accent bg-accent/5"
                  : "border-border/50 hover:border-border bg-background/50 hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                  userType === opt.value ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                )}
              >
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </fieldset>
 
      {/* Common fields */}
      <Field id="fullName" label="Full Name" error={fieldError("fullName")}>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={() => handleBlur("fullName")}
          aria-invalid={!!fieldError("fullName")}
          aria-describedby={fieldError("fullName") ? "fullName-error" : undefined}
          className={inputClass("fullName")}
        />
      </Field>
 
      {/* Professional-specific fields */}
      {userType === "professional" && (
        <>
          <Field id="professionalTitle" label="Professional Title" error={fieldError("professionalTitle")}>
            <Input
              id="professionalTitle"
              type="text"
              placeholder="e.g., Dermatologist, Cosmetic Surgeon"
              value={formData.professionalTitle}
              onChange={(e) => handleChange("professionalTitle", e.target.value)}
              onBlur={() => handleBlur("professionalTitle")}
              aria-invalid={!!fieldError("professionalTitle")}
              aria-describedby={fieldError("professionalTitle") ? "professionalTitle-error" : undefined}
              className={inputClass("professionalTitle")}
            />
          </Field>
 
          <Field id="clinicName" label="Clinic Name" error={fieldError("clinicName")}>
            <Input
              id="clinicName"
              type="text"
              placeholder="Enter your clinic name"
              value={formData.clinicName}
              onChange={(e) => handleChange("clinicName", e.target.value)}
              onBlur={() => handleBlur("clinicName")}
              aria-invalid={!!fieldError("clinicName")}
              aria-describedby={fieldError("clinicName") ? "clinicName-error" : undefined}
              className={inputClass("clinicName")}
            />
          </Field>
        </>
      )}
 
      <Field id="email" label="Email Address" error={fieldError("email")}>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
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
        label="Password"
        error={fieldError("password")}
        hint="Minimum 8 characters"
      >
        <Input
          id="password"
          type="password"
          placeholder="Create a secure password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          aria-invalid={!!fieldError("password")}
          aria-describedby={fieldError("password") ? "password-error" : "password-hint"}
          className={inputClass("password")}
        />
      </Field>
 
      {/* Patient phone */}
      {userType === "patient" && (
        <Field id="phone" label="Phone Number" error={fieldError("phone")}>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            className={inputClass("phone")}
          />
        </Field>
      )}
 
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
            Creating account…
          </span>
        ) : (
          `Create ${userType === "patient" ? "Patient" : "Professional"} Account`
        )}
      </Button>
 
      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">Already have an account?</span>
        </div>
      </div>
 
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
      >
        Sign in instead
      </button>
    </form>
  )
}