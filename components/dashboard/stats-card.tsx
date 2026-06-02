import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        // Shell — canonical card surface
        'card-shell group flex flex-col gap-4 rounded-xl border border-border bg-card p-5',
        className,
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>

        {/* Icon badge */}
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            'bg-accent/10 text-accent',
            'transition-colors duration-150 group-hover:bg-accent/15',
          )}
        >
          <Icon style={{ width: '1rem', height: '1rem' }} />
        </span>
      </div>

      {/* Value */}
      <p className="text-[2rem] font-bold leading-none tabular-nums text-foreground">
        {value}
      </p>

      {/* Footer: trend + description */}
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5',
              'text-[0.6875rem] font-semibold leading-none tabular-nums',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600',
            )}
          >
            {trend.isPositive ? '↑' : '↓'}&thinsp;{Math.abs(trend.value)}%
          </span>
        )}
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
