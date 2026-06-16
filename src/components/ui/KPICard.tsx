import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type TrendDirection = 'up' | 'down' | 'neutral'
type GradientType = 'blue' | 'emerald' | 'orange' | 'purple' | 'cyan'

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    direction: TrendDirection
    value: string
    label?: string
  }
  gradient?: GradientType
  subtitle?: string
  onClick?: () => void
  className?: string
}

const gradientConfig: Record<
  GradientType,
  {
    bg: string
    iconBg: string
    iconColor: string
    glow: string
    ring: string
  }
> = {
  blue: {
    bg: 'from-primary-600/20 via-primary-700/10 to-dark-800',
    iconBg: 'bg-primary-500/20',
    iconColor: 'text-primary-400',
    glow: 'shadow-primary-500/20',
    ring: 'ring-primary-500/30'
  },
  emerald: {
    bg: 'from-emerald-600/20 via-emerald-700/10 to-dark-800',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/30'
  },
  orange: {
    bg: 'from-orange-600/20 via-orange-700/10 to-dark-800',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    ring: 'ring-orange-500/30'
  },
  purple: {
    bg: 'from-purple-600/20 via-purple-700/10 to-dark-800',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    ring: 'ring-purple-500/30'
  },
  cyan: {
    bg: 'from-cyan-600/20 via-cyan-700/10 to-dark-800',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/30'
  }
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus
}

const trendColors = {
  up: 'text-emerald-400 bg-emerald-500/10',
  down: 'text-red-400 bg-red-500/10',
  neutral: 'text-slate-400 bg-slate-500/10'
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'blue',
  subtitle,
  onClick,
  className
}: KPICardProps) {
  const config = gradientConfig[gradient]
  const TrendIcon = trend ? trendIcons[trend.direction] : null

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border border-dark-700 p-5 transition-all duration-300',
        'bg-gradient-to-br',
        config.bg,
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-xl',
        onClick && config.glow,
        'group',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500',
          gradient === 'blue' && 'bg-primary-500',
          gradient === 'emerald' && 'bg-emerald-500',
          gradient === 'orange' && 'bg-orange-500',
          gradient === 'purple' && 'bg-purple-500',
          gradient === 'cyan' && 'bg-cyan-500',
          'group-hover:opacity-40'
        )}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
                  trendColors[trend.direction]
                )}
              >
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-xs text-slate-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300',
            config.iconBg,
            config.ring,
            'group-hover:scale-110'
          )}
        >
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>
      </div>
    </div>
  )
}
