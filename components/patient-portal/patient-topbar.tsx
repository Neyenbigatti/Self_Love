"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, X, LogOut, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PatientTopbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const pageTitles: Record<string, string> = {
  "/patient": "Inicio",
  "/patient/history": "Historial",
  "/patient/book": "Reservar Turno",
};

export function PatientTopbar({ onMenuToggle, isMenuOpen }: PatientTopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      path === "/patient" ? pathname === "/patient" : pathname.startsWith(path),
    )?.[1] ?? "Inicio";

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-brand-warm-border bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onMenuToggle}
      >
        {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        <span className="sr-only">Menú</span>
      </Button>

      {/* Logo — mobile only (visible when sidebar is hidden) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-rose">
          <span className="font-serif text-sm font-semibold text-[#6B3B3B]">
            S
          </span>
        </div>
        <span className="font-serif text-lg font-semibold text-foreground">
          SelfLove
        </span>
      </div>

      {/* Page title */}
      <h1 className="truncate text-lg font-semibold text-foreground md:text-xl">
        {pageTitle}
      </h1>

      <div className="flex-1" />

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative shrink-0">
        <Bell className="size-5" />
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-rose" />
        <span className="sr-only">Notificaciones</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 shrink-0 rounded-full">
            <Avatar className="size-9">
              <AvatarImage src={patientAvatar} alt={patientName} />
              <AvatarFallback className="bg-brand-rose-light text-brand-rose-dark">
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
    </header>
  );
}
