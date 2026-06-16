import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: number
  type: 'error' | 'success' | 'info'
  title: string
  message: string
  time: string
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'error',
    title: '退货申请待处理',
    message: 'RMA20250615001 需要您的审批',
    time: '5分钟前'
  },
  {
    id: 2,
    type: 'success',
    title: '退款成功',
    message: 'RMA20250614003 退款已完成',
    time: '30分钟前'
  },
  {
    id: 3,
    type: 'info',
    title: '物流更新',
    message: 'SF1234567890 已到达仓库',
    time: '2小时前'
  }
]

const notificationIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info
}

const notificationColors = {
  error: 'text-red-400 bg-red-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  info: 'text-blue-400 bg-blue-500/10'
}

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = mockNotifications.length

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-dark-700 bg-dark-800/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索订单、RMA编号、客户名称..."
              className="w-full rounded-lg border border-dark-700 bg-dark-900/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200',
                showNotifications
                  ? 'border-primary-500/50 bg-dark-700 text-white'
                  : 'border-dark-700 text-slate-400 hover:border-dark-600 hover:bg-dark-700 hover:text-white'
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-bold text-white ring-2 ring-dark-800">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-2xl shadow-black/50 animate-fade-in-up">
                <div className="border-b border-dark-700 px-4 py-3">
                  <h3 className="font-display text-sm font-semibold text-white">通知中心</h3>
                  <p className="text-xs text-slate-400">您有 {unreadCount} 条未读通知</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type]
                    return (
                      <div
                        key={notification.id}
                        className="flex gap-3 border-b border-dark-700/50 px-4 py-3 transition-colors duration-200 hover:bg-dark-700/30"
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            notificationColors[notification.type]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{notification.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">{notification.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-dark-700 px-4 py-2">
                  <button className="w-full py-1.5 text-xs font-medium text-primary-400 transition-colors duration-200 hover:text-primary-300">
                    查看全部通知
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all duration-200',
                showUserMenu
                  ? 'border-primary-500/50 bg-dark-700'
                  : 'border-dark-700 hover:border-dark-600 hover:bg-dark-700'
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">管理员</p>
                <p className="text-[10px] text-slate-400 leading-tight">admin@rma.com</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-2xl shadow-black/50 animate-fade-in-up">
                <div className="border-b border-dark-700 px-4 py-3">
                  <p className="font-display text-sm font-semibold text-white">管理员账户</p>
                  <p className="text-xs text-slate-400">admin@rma.com</p>
                </div>
                <div className="p-1">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-dark-700 hover:text-white">
                    <User className="h-4 w-4" />
                    个人资料
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-dark-700 hover:text-white">
                    <Settings className="h-4 w-4" />
                    账户设置
                  </button>
                </div>
                <div className="border-t border-dark-700 p-1">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors duration-200 hover:bg-red-500/10">
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
