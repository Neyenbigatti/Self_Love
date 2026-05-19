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

export function RegisterForm({
  userType,
  onUserTypeChange,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    professionalTitle: "",
    clinicName: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock registration
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("[v0] Mock registration:", { userType, ...formData })
    alert(`Account created successfully as ${userType}! (Mock authentication)`)

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* User Type Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          I am registering as a
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUserTypeChange("patient")}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
              userType === "patient"
                ? "border-accent bg-accent/5"
                : "border-border/50 hover:border-border bg-background/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  userType === "patient"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Patient</p>
                <p className="text-xs text-muted-foreground">
                  Book treatments
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUserTypeChange("professional")}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
              userType === "professional"
                ? "border-accent bg-accent/5"
                : "border-border/50 hover:border-border bg-background/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  userType === "professional"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Professional
                </p>
                <p className="text-xs text-muted-foreground">Manage clinic</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Common Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full Name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
          />
        </div>

        {/* Professional-specific fields */}
        {userType === "professional" && (
          <>
            <div className="space-y-2">
              <Label
                htmlFor="professionalTitle"
                className="text-sm font-medium text-foreground"
              >
                Professional Title
              </Label>
              <Input
                id="professionalTitle"
                name="professionalTitle"
                type="text"
                placeholder="e.g., Dermatologist, Cosmetic Surgeon"
                value={formData.professionalTitle}
                onChange={handleChange}
                required
                className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="clinicName"
                className="text-sm font-medium text-foreground"
              >
                Clinic Name
              </Label>
              <Input
                id="clinicName"
                name="clinicName"
                type="text"
                placeholder="Enter your clinic name"
                value={formData.clinicName}
                onChange={handleChange}
                required
                className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters
          </p>
        </div>

        {/* Patient phone field */}
        {userType === "patient" && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
              className="h-12 bg-input border-border/50 focus:border-accent focus:ring-accent/20 rounded-xl transition-all"
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating account...
          </span>
        ) : (
          `Create ${userType === "patient" ? "Patient" : "Professional"} Account`
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-sm text-accent hover:text-accent/80 font-medium transition-colors"
      >
        Sign in instead
      </button>
    </form>
  )
}
