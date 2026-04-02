import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/client'

const NAV_ADMIN = [
  { to: '/dashboard',        label: 'Dashboard',      icon: '▦' },
  { to: '/applicants',       label: 'Applicants',     icon: '👥' },
  { to: '/shortlisted',      label: 'Shortlisted',    icon: '⭐' },
  { to: '/verified',         label: 'Verified',       icon: '✅' },
  { to: '/admitted',         label: 'Admitted by Day',icon: '🎓' },
  { to: '/interview-dates',  label: 'Interview Dates',icon: '📅' },
  { to: '/sources',          label: 'Sources',        icon: '🌐' },
  { to: '/upload',           label: 'Upload CSV',     icon: '📤' },
  { to: '/users',            label: 'Users',          icon: '🔑' },
]
const NAV_MANAGER = [
  { to: '/dashboard',       label: 'Dashboard',      icon: '▦' },
  { to: '/applicants',      label: 'Applicants',     icon: '👥' },
  { to: '/shortlisted',     label: 'Shortlisted',    icon: '⭐' },
  { to: '/verified',        label: 'Verified',       icon: '✅' },
  { to: '/admitted',        label: 'Admitted by Day',icon: '🎓' },
  { to: '/interview-dates', label: 'Interview Dates',icon: '📅' },
  { to: '/sources',         label: 'Sources',        icon: '🌐' },
  { to: '/upload',          label: 'Upload CSV',     icon: '📤' },
]

const iconSvg = {
  '🎓': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>,
  '▦': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  '👥': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  '⭐': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  '✅': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  '📅': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  '🌐': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  '📤': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
  '🔑': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
}

export default function Sidebar({ open, onClose }) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_MANAGER

  async function handleLogout() {
    try { await logout() } catch {}
    setUser(null)
    navigate('/')
  }

  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: '260px', flexShrink: 0,
      background: '#fff',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', inset: '0 auto 0 0', zIndex: 50,
      transform: `translateX(${open ? '0' : '-100%'})`,
      transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      /* Desktop: always visible */
    }} className="sidebar-aside"
    >
      {/* Logo area */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:800, fontSize:18, flexShrink:0,
          }}>C</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#0f172a', letterSpacing:'-0.3px' }}>CCHN Portal</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>Selection System</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'1rem 0.75rem', overflowY:'auto' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem', paddingLeft:'0.5rem' }}>
          Menu
        </div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.6rem 0.75rem', borderRadius:'0.75rem', marginBottom:'0.25rem',
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              color: isActive ? '#4f46e5' : '#475569',
              background: isActive ? '#eef2ff' : 'transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            })}
          >
            <span style={{ opacity: 0.8 }}>{iconSvg[item.icon]}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding:'1rem', borderTop:'1px solid var(--color-border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
          <div style={{
            width:36, height:36, borderRadius:'50%',
            background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:700, fontSize:13, flexShrink:0,
          }}>{initials(user?.name)}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          width:'100%', padding:'0.5rem', borderRadius:'0.75rem',
          background:'#fef2f2', color:'#dc2626',
          fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
          transition:'background 0.15s',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Logout
        </button>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-aside {
            position: relative !important;
            transform: translateX(0) !important;
            height: 100vh;
          }
        }
      `}</style>
    </aside>
  )
}
