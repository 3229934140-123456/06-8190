import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PackageX,
  ClipboardCheck,
  Truck,
  Warehouse,
  BanknoteArrowDown,
  MessageSquare,
  BarChart3,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/returns', label: '退货管理', icon: PackageX },
  { path: '/approval', label: '审批', icon: ClipboardCheck },
  { path: '/logistics', label: '物流', icon: Truck },
  { path: '/warehouse', label: '仓库验收', icon: Warehouse },
  { path: '/refund', label: '退款', icon: BanknoteArrowDown },
  { path: '/tickets', label: '工单', icon: MessageSquare },
  { path: '/reports', label: '报表', icon: BarChart3 },
  { path: '/settings', label: '设置', icon: Settings },
  { path: '/logs', label: '日志', icon: ScrollText },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-dark-700 bg-dark-800/95 backdrop-blur-xl transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-dark-700 px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan shadow-lg shadow-primary-500/30">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}
        >
          <h1 className="font-display text-lg font-bold tracking-tight text-white">
            RMA Center
          </h1>
          <p className="text-xs text-slate-400">退货管理系统</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-600/80 to-primary-500/40 text-white shadow-lg shadow-primary-500/20'
                    : 'text-slate-400 hover:bg-dark-700/50 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-cyan" />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform duration-200',
                      !collapsed && 'group-hover:scale-110'
                    )}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap transition-all duration-300',
                      collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-dark-700 p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-700 bg-dark-900/50 px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-primary-500/50 hover:bg-dark-800 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
