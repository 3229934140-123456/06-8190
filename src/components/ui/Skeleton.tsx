import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700',
        className
      )}
      style={{
        backgroundSize: '1000px 100%'
      }}
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

Skeleton.Text = function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '60%'
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && `w-[${lastLineWidth}]`,
            i !== lines - 1 && 'w-full'
          )}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
  showAvatar?: boolean
}

Skeleton.Card = function SkeletonCard({ className, showAvatar = true }: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-5 space-y-4', className)}>
      <div className="flex items-center gap-4">
        {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton.Text lines={2} />
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

Skeleton.Table = function SkeletonTable({
  rows = 5,
  columns = 4,
  className
}: SkeletonTableProps) {
  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      <div className="border-b border-dark-700 bg-dark-800/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-dark-700/50">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3.5">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    'h-4 flex-1',
                    colIndex === 0 && 'w-1/3 flex-none'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const circleSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

Skeleton.Circle = function SkeletonCircle({
  size = 'md',
  className
}: SkeletonCircleProps) {
  return (
    <Skeleton
      className={cn('rounded-full', circleSizes[size], className)}
    />
  )
}

interface SkeletonButtonProps {
  className?: string
}

Skeleton.Button = function SkeletonButton({ className }: SkeletonButtonProps) {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />
}

export default Skeleton
