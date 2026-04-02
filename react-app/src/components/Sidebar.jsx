import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '🏠' },
  { label: 'Applicants', path: '/applicants', icon: '👥' },
  { label: 'Shortlisted', path: '/shortlisted', icon: '📌' },
  { label: 'Verified', path: '/verified', icon: '✅' },
  { label: 'Interview Dates', path: '/interview-dates', icon: '📅' },
  { label: 'Reference Sources', path: '/sources', icon: '📊' },
  { label: 'Daily Admissions', path: '/admitted', icon: '✨' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar-desktop" style={{
      width: '280px',
      background: '#ffffff',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{ padding: '2rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 18 }}>C</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>CCHN</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Admissions</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: isActive ? '#4f46e5' : '#64748b',
            background: isActive ? '#f5f3ff' : 'transparent',
            transition: 'all 0.2s',
          })}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginLeft: '1rem', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Administration</div>
            <NavLink to="/users" style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: isActive ? '#4f46e5' : '#64748b',
              background: isActive ? '#f5f3ff' : 'transparent',
              transition: 'all 0.2s',
            })}>
              <span style={{ fontSize: '1.2rem' }}>⚙️</span>
              Users & System
            </NavLink>
          </div>
        )}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', margin: '0 1rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#475569', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}>{user?.full_name?.charAt(0) || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
      </div>
    </aside>
  );
}
