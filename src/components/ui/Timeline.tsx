import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineItem {
  id: string | number
  title: string
  description?: string
  time?: string
  status: 'completed' | 'current' | 'pending'
  user?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const statusConfig = {
  completed: {
    line: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    dotBg: 'bg-emerald-500/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    titleColor: 'text-white',
    descColor: 'text-slate-400'
  },
  current: {
    line: 'bg-dark-600',
    dot: 'bg-primary-500',
    dotBg: 'bg-primary-500/20',
    icon: Clock,
    iconColor: 'text-primary-400',
    titleColor: 'text-white',
    descColor: 'text-slate-300'
  },
  pending: {
    line: 'bg-dark-600',
    dot: 'bg-dark-600',
    dotBg: 'bg-dark-700',
    icon: Circle,
    iconColor: 'text-slate-500',
    titleColor: 'text-slate-500',
    descColor: 'text-slate-600'
  }
}

export default function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const config = statusConfig[item.status]
        const StatusIcon = item.icon || config.icon
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[15px] top-[30px] h-[calc(100%-30px)] w-0.5 transition-colors duration-500',
                  item.status === 'completed' ? 'bg-emerald-500/60' : 'bg-dark-700'
                )}
              />
            )}

            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                config.dotBg,
                item.status === 'current' && 'ring-4 ring-primary-500/20 animate-pulse-slow'
              )}
            >
              <StatusIcon
                className={cn(
                  'h-5 w-5 transition-all duration-300',
                  config.iconColor,
                  item.status === 'completed' && 'drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                )}
              />
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4
                    className={cn(
                      'text-sm font-semibold transition-colors duration-300',
                      config.titleColor
                    )}
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p
                      className={cn(
                        'mt-1 text-sm transition-colors duration-300',
                        config.descColor
                      )}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.user && (
                    <p className="mt-1 text-xs text-slate-500">操作人：{item.user}</p>
                  )}
                </div>
                {item.time && (
                  <span className="shrink-0 text-xs text-slate-500 whitespace-nowrap">
                    {item.time}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
