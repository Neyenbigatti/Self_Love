"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Calendar, Clock, User, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function PatientNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const patientName = user?.name ?? "";
  const patientAvatar = user?.avatar ?? undefined;
  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/patient" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <span className="font-serif text-lg font-semibold text-accent-foreground">A</span>
          </div>
          <span className="hidden font-serif text-xl font-semibold text-foreground sm:block">
            SelfLove
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/patient"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                Mis Turnos
              </span>
          </Link>
          <Link
            href="/patient/book"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
              <span className="flex items-center gap-2">
                <Clock className="size-4" />
                Reservar Turno
              </span>
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-accent" />
            <span className="sr-only">Notificaciones</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="size-9">
                  <AvatarImage src={patientAvatar} alt={patientName} />
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{patientName}</p>
                  <p className="text-xs leading-none text-muted-foreground">Paciente</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 size-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="mr-2 size-4" />
                  <span>Mis Turnos</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 size-4" />
                  <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Abrir menú</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "overflow-hidden border-t border-border md:hidden",
          mobileMenuOpen ? "max-h-48" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/patient"
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar className="size-4" />
            Mis Turnos
          </Link>
          <Link
            href="/patient/book"
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Clock className="size-4" />
            Reservar Turno
          </Link>
        </nav>
      </div>
    </header>
  );
}
