import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':  'Dashboard',
  '/applicants': 'Applicants',
  '/shortlisted':'Shortlisted',
  '/verified':   'Verified',
  '/upload':     'Upload CSV',
  '/users':      'Users',
}

export default function MobileHeader({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'CCHN Portal'

  return (
    <header style={{
      display:'flex', alignItems:'center', gap:'1rem',
      padding:'0.875rem 1.25rem',
      background:'#fff', borderBottom:'1px solid var(--color-border)',
      position:'sticky', top:0, zIndex:30,
    }} className="mobile-header">
      <button onClick={onMenuClick} style={{
        padding:'0.5rem', borderRadius:'0.625rem', border:'1px solid var(--color-border)',
        background:'transparent', color:'#475569',
        display:'flex', alignItems:'center', justifyContent:'center',
      }} aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <span style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>{title}</span>

      <style>{`
        @media (min-width: 768px) { .mobile-header { display: none !important; } }
      `}</style>
    </header>
  )
}
