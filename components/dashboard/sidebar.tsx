'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ClipboardList,
  Stethoscope,
  Calendar,
  Clock,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Syringe,
} from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────
// Settings is visually separated at the bottom; clinical items sit above.
const primaryNav = [
  { label: 'Calendario',            href: '/dashboard/calendar',              icon: Calendar     },
  { label: 'Disponibilidad',        href: '/dashboard/availability',          icon: Clock        },
  { label: 'Pacientes',             href: '/dashboard/patients',              icon: Users        },
  { label: 'Tratamientos',          href: '/dashboard/treatments',            icon: Syringe      },
  { label: 'Historial Clínico',    href: '/dashboard/clinical-history',      icon: ClipboardList },
  { label: 'Exploración Física',    href: '/dashboard/exploration',           icon: Stethoscope  },
]

const secondaryNav = [
  { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  collapsed,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        // Base
        'group relative flex items-center gap-3 rounded-lg text-sm font-medium',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        // Collapsed vs expanded padding
        collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5',
        // State
        isActive
          ? [
              'text-accent-foreground',
              // Left accent bar via before pseudo using box-shadow trick with ring
              'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
              'before:h-[60%] before:w-0.5 before:rounded-full before:bg-accent',
              collapsed ? 'before:hidden' : '',
              // Background: subtle tinted fill, not full accent
              'bg-accent/10',
            ]
          : [
              'text-muted-foreground',
              'hover:text-foreground hover:bg-secondary/70',
            ],
      )}
    >
      {/* Icon — fixed size via inline style to avoid Tailwind JIT miss on h-4.5 */}
      <Icon
        style={{ width: '1.0625rem', height: '1.0625rem' }}
        className={cn(
          'shrink-0 transition-transform duration-200',
          isActive ? 'text-accent' : 'group-hover:scale-105',
        )}
      />

      {/* Label — clips cleanly when collapsing */}
      {!collapsed && (
        <span
          className={cn(
            'truncate leading-none tracking-[-0.01em]',
            isActive && 'font-semibold text-foreground',
          )}
        >
          {label}
        </span>
      )}

      {/* Active dot for collapsed state */}
      {collapsed && isActive && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
      )}
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  return (
    <aside
      className={cn(
        // Layout
        'flex h-full flex-col',
        // Visual
        'border-r border-border bg-card',
        // Width transition — overflow:hidden prevents label bleed during animation
        'overflow-hidden transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[3.75rem]' : 'w-60',
      )}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border',
          collapsed ? 'justify-center px-0' : 'gap-3 px-4',
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 rounded-lg outline-none',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          )}
          title={collapsed ? 'SelfLove' : undefined}
        >
          {/* Wordmark icon */}
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg',
              'bg-accent text-accent-foreground',
              'shadow-sm shadow-accent/30',
              'font-serif text-sm font-bold leading-none',
              'h-8 w-8',
            )}
          >
            SL
          </span>

          {!collapsed && (
            <span className="whitespace-nowrap font-serif text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
              SelfLove
            </span>
          )}
        </Link>
      </div>

      {/* ── Primary Nav ───────────────────────────────────────────────────── */}
      <nav
        className={cn(
          'flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden py-3',
          collapsed ? 'px-0' : 'px-2',
        )}
        aria-label="Navegación principal"
      >
        {primaryNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="mx-3 border-t border-border/60" />

      {/* ── Secondary Nav (Settings) ──────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col gap-0.5 py-3',
          collapsed ? 'px-0' : 'px-2',
        )}
      >
        {secondaryNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* ── Collapse Toggle ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border">
        <button
          type="button"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className={cn(
            'flex w-full items-center gap-2.5 py-3 text-xs text-muted-foreground',
            'transition-colors duration-150 hover:text-foreground',
            'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
            collapsed ? 'justify-center px-0' : 'px-4',
          )}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? (
            <PanelLeftOpen
              style={{ width: '0.9375rem', height: '0.9375rem' }}
              className="shrink-0"
            />
          ) : (
            <>
              <PanelLeftClose
                style={{ width: '0.9375rem', height: '0.9375rem' }}
                className="shrink-0"
              />
              <span className="font-medium tracking-[-0.01em]">Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
