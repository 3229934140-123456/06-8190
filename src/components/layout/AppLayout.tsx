import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[1600px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
