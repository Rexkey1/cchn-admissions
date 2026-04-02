import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--color-bg)' }}>
      {/* Desktop Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position:'fixed', inset:0, background:'rgba(15,23,42,0.5)',
            zIndex:40, backdropFilter:'blur(4px)',
          }}
        />
      )}

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflowY:'auto' }}>
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex:1, padding:'1.5rem', overflowY:'auto' }} className="page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
