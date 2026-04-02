import { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/client';
import { NavLink } from 'react-router-dom';

const STAT_CARDS = [
  { label: 'Total Applicants', key: 'total', icon: '👥', color: '#4f46e5', bg: '#f5f3ff' },
  { label: 'Shortlisted', key: 'shortlisted', icon: '📌', color: '#7c3aed', bg: '#fdf4ff' },
  { label: 'Verified', key: 'verified', icon: '✅', color: '#059669', bg: '#f0fdf4' },
  { label: 'Payments', key: 'paid', icon: '💳', color: '#2563eb', bg: '#eff6ff' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(res => {
      setStats(res.data.stats);
      setRecent(res.data.recent);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadeIn">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.75px' }} className="gradient-text">Overview Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 500, marginTop: '0.25rem' }}>Track real-time admission metrics and recent activity.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{card.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>{stats?.[card.key]?.toLocaleString() || 0}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            {/* Background design */}
            <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 100, opacity: 0.03 }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent Activity */}
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Recent Applicants</h2>
            <NavLink to="/applicants" style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>View All →</NavLink>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1.75rem', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Applicant</th>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1.75rem', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Program</th>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1.75rem', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.75rem', fontWeight: 700, fontSize: 14 }}>{r.full_name}</td>
                    <td style={{ padding: '1rem 1.75rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: r.program === 'Diploma' ? '#eef2ff' : '#fdf4ff', color: r.program === 'Diploma' ? '#4f46e5' : '#7c3aed' }}>{r.program}</span>
                    </td>
                    <td style={{ padding: '1rem 1.75rem', color: '#64748b', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rapid Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: '#1e293b', color: 'white', border: 'none' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: '0.5rem' }}>Quick Actions</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: '1.25rem' }}>Frequently used management tools.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <NavLink to="/upload" className="btn btn-primary" style={{ justifyContent: 'flex-start', background: '#334155' }}>📤 Import Applicants</NavLink>
              <NavLink to="/interview-dates" className="btn btn-primary" style={{ justifyContent: 'flex-start', background: '#334155' }}>📅 Interview Schedule</NavLink>
              <NavLink to="/admitted" className="btn btn-primary" style={{ justifyContent: 'flex-start', background: '#334155' }}>✨ Daily Admissions</NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
