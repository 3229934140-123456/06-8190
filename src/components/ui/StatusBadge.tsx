import { cn } from '@/lib/utils'

type StatusType =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'shipping'
  | 'delivered'
  | 'refunded'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'

interface StatusBadgeProps {
  status: StatusType
  children: React.ReactNode
  className?: string
  showDot?: boolean
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; dot: string; border: string }
> = {
  pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
    border: 'border-yellow-500/30'
  },
  processing: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    border: 'border-blue-500/30'
  },
  approved: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30'
  },
  rejected: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
    border: 'border-red-500/30'
  },
  completed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30'
  },
  cancelled: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-500/30'
  },
  shipping: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
    border: 'border-cyan-500/30'
  },
  delivered: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30'
  },
  refunded: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    dot: 'bg-green-400',
    border: 'border-green-500/30'
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
    border: 'border-red-500/30'
  },
  warning: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    border: 'border-orange-500/30'
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    border: 'border-blue-500/30'
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30'
  }
}

export default function StatusBadge({
  status,
  children,
  className,
  showDot = true
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info

  return (
    <span
      className={cn(
        'status-badge border',
        config.bg,
        config.text,
        config.border,
        'transition-all duration-200',
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
            config.dot,
            'animate-pulse-slow'
          )}
        />
      )}
      {children}
    </span>
  )
}
