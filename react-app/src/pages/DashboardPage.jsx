import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/client'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="card" style={{ padding:'1.5rem', position:'relative', overflow:'hidden', cursor:'default' }}>
      <div style={{ position:'absolute', top:-8, right:-8, opacity:0.08 }}>{icon}</div>
      <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color, marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:42, fontWeight:900, color:'#0f172a', letterSpacing:'-1px', lineHeight:1 }}>{value?.toLocaleString() ?? 0}</p>
      {sub && <p style={{ fontSize:12, color:'#64748b', marginTop:6, fontWeight:500 }}>{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13, fontWeight:600 }}>
        <span style={{ color:'#475569' }}>{label}</span>
        <span style={{ color }}>{value?.toLocaleString()} <span style={{ color:'#94a3b8', fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height:8, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner" /></div>
  if (!stats) return null

  const s = stats.stats

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom:'2rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, letterSpacing:'-0.8px' }} className="gradient-text">Overview</h1>
          <p style={{ color:'#64748b', marginTop:4, fontWeight:500 }}>Real-time application statistics and metrics.</p>
        </div>
        <Link to="/applicants" style={{
          display:'inline-flex', alignItems:'center', gap:'0.5rem',
          background:'#fff', border:'1px solid var(--color-border)', color:'#374151',
          padding:'0.6rem 1.25rem', borderRadius:12, fontSize:13, fontWeight:600,
          boxShadow:'var(--shadow-sm)', transition:'all 0.2s',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 4v16m8-8H4"/></svg>
          Manage Applicants
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
        <StatCard label="Total Applicants" value={s.total} color="#4f46e5"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5" width="80" height="80"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} />
        <StatCard label="Diploma" value={s.total_dip} color="#0284c7"
          sub={`${s.total > 0 ? Math.round(s.total_dip/s.total*100) : 0}% of total`}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.5" width="80" height="80"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} />
        <StatCard label="Certificate" value={s.total_cert} color="#7c3aed"
          sub={`${s.total > 0 ? Math.round(s.total_cert/s.total*100) : 0}% of total`}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="80" height="80"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>} />
        {stats.hasPaid && <StatCard label="Paid" value={s.paid_total} color="#059669"
          sub={`${s.total > 0 ? Math.round(s.paid_total/s.total*100) : 0}% of total`}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" width="80" height="80"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />}
      </div>

      {/* Progress section */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.25rem' }}>
        <div className="card" style={{ padding:'1.5rem' }}>
          <h3 style={{ fontWeight:800, fontSize:15, marginBottom:'1.25rem', color:'#0f172a' }}>Shortlisted Progress</h3>
          <ProgressBar label="Total Shortlisted" value={s.sl_total} total={s.total} color="linear-gradient(90deg,#10b981,#059669)" />
          <ProgressBar label="Diploma" value={s.sl_dip} total={s.total_dip} color="linear-gradient(90deg,#38bdf8,#0284c7)" />
          <ProgressBar label="Certificate" value={s.sl_cert} total={s.total_cert} color="linear-gradient(90deg,#a78bfa,#7c3aed)" />
        </div>

        {stats.hasVerified && (
          <div className="card" style={{ padding:'1.5rem' }}>
            <h3 style={{ fontWeight:800, fontSize:15, marginBottom:'1.25rem', color:'#0f172a' }}>Verified Progress</h3>
            <ProgressBar label="Total Verified" value={s.v_total} total={s.total} color="linear-gradient(90deg,#34d399,#059669)" />
            <ProgressBar label="Diploma" value={s.v_dip} total={s.total_dip} color="linear-gradient(90deg,#38bdf8,#0284c7)" />
            <ProgressBar label="Certificate" value={s.v_cert} total={s.total_cert} color="linear-gradient(90deg,#a78bfa,#7c3aed)" />
          </div>
        )}
      </div>
    </div>
  )
}
