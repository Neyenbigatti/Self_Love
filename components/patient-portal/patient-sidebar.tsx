"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarClock,
  CalendarPlus,
  User,
  Bell,
  LogOut,
} from "lucide-react";

interface PatientSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/history", label: "Historial", icon: CalendarClock },
  { href: "/patient/book", label: "Reservar Turno", icon: CalendarPlus },
];

const upcomingItems = [
  { href: "#", label: "Perfil", icon: User },
  { href: "#", label: "Notificaciones", icon: Bell },
];

export function PatientSidebar({ isOpen = false, onClose }: PatientSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/patient") return pathname === "/patient";
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-warm-border bg-white transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-brand-warm-border px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-rose">
            <span className="font-serif text-lg font-semibold text-[#6B3B3B]">
              S
            </span>
          </div>
          <span className="font-serif text-xl font-semibold text-foreground">
            SelfLove
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-rose-light text-brand-rose-dark"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {/* "Preparado para" section */}
          <div className="pt-6">
            <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preparado para
            </p>
            <div className="space-y-1">
              {upcomingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/50"
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Cerrar Sesión */}
        <div className="border-t border-brand-warm-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
