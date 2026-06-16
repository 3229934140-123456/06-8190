import { Inbox, Search, FileX, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateVariant = 'default' | 'search' | 'error' | 'no-data'

interface EmptyStateProps {
  title?: string
  description?: string
  variant?: EmptyStateVariant
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

const variantConfig: Record<
  EmptyStateVariant,
  {
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
    iconBg: string
  }
> = {
  default: {
    icon: Inbox,
    iconColor: 'text-slate-400',
    iconBg: 'bg-dark-700'
  },
  search: {
    icon: Search,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10'
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10'
  },
  'no-data': {
    icon: FileX,
    iconColor: 'text-slate-500',
    iconBg: 'bg-dark-700'
  }
}

export default function EmptyState({
  title = '暂无数据',
  description = '当前没有可显示的数据',
  variant = 'default',
  action,
  icon: CustomIcon,
  className
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const Icon = CustomIcon || config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center animate-fade-in-up',
        className
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-20 w-20 items-center justify-center rounded-2xl',
          config.iconBg
        )}
      >
        <Icon className={cn('h-10 w-10', config.iconColor)} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
