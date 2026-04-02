import { useEffect, useState, useCallback, useRef } from 'react'
import { getShortlisted } from '../api/client'
import { exportUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { bulkAction } from '../api/client'

const PROG_BADGE = {
  Diploma:     { bg:'#e0f2fe', color:'#0369a1' },
  Certificate: { bg:'#f3e8ff', color:'#7e22ce' },
}

export default function ShortlistedPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0 })
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [prog, setProg] = useState('')
  const [page, setPage] = useState(1)
  const debounce = useRef(null)

  const fetch = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const r = await getShortlisted({ q, program: prog, page: pg })
      setRows(r.data.rows); setPagination(r.data.pagination)
    } finally { setLoading(false) }
  }, [q, prog, page])

  useEffect(() => { clearTimeout(debounce.current); debounce.current = setTimeout(() => { setPage(1); fetch(1) }, 350) }, [q, prog])
  useEffect(() => { fetch() }, [page])

  async function removeFromList(id) {
    if (!confirm('Remove this applicant from shortlist?')) return
    await bulkAction({ ids:[id], action:'unshortlist' })
    fetch()
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Shortlisted</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Qualified candidates selected for review.</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <a href={exportUrl('shortlisted', prog)} download style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#fff', border:'1px solid var(--color-border)', color:'#475569',
            padding:'0.55rem 1rem', borderRadius:10, fontSize:12, fontWeight:700,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:2, minWidth:160 }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, phone, PIN…" style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
        </div>
        <select value={prog} onChange={e=>setProg(e.target.value)} style={{ flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
          <option value="">All Programs</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
        </select>
        <span style={{ fontSize:13, fontWeight:600, color:'#64748b', alignSelf:'center', whiteSpace:'nowrap' }}>
          {pagination.total.toLocaleString()} total
        </span>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
        {loading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(4px)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['#','Applicant','Program','Contact','Source', user.role==='admin'?'Action':''].map(h => h && (
                  <th key={h} style={{ padding:'0.875rem 1rem', textAlign: h==='Action'?'right':'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontWeight:700 }}>No shortlisted applicants found</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'0.875rem 1rem', color:'#94a3b8', fontSize:12 }}>{(pagination.page-1)*25+i+1}</td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    <div style={{ fontWeight:700, color:'#0f172a' }}>{r.full_name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{r.pin_moh || ''}</div>
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    {PROG_BADGE[r.program] && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:PROG_BADGE[r.program].bg, color:PROG_BADGE[r.program].color }}>{r.program}</span>}
                  </td>
                  <td style={{ padding:'0.875rem 1rem', color:'#475569', fontFamily:'monospace', fontSize:12 }}>{r.phone_number}</td>
                  <td style={{ padding:'0.875rem 1rem', color:'#64748b', fontSize:12 }}>{r.source||'—'}</td>
                  {user.role === 'admin' && (
                    <td style={{ padding:'0.875rem 1rem', textAlign:'right' }}>
                      <button onClick={() => removeFromList(r.id)} style={{ padding:'0.35rem 0.875rem', borderRadius:8, fontSize:11, fontWeight:700, background:'#fef9c3', color:'#92400e', border:'1px solid #fde68a', cursor:'pointer' }}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'0.875rem 1.25rem', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Page {pagination.page} of {pagination.pages}</span>
          <div style={{ display:'flex', gap:8 }}>
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity:page<=1?0.4:1 }}>PREV</button>
            <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity:page>=pagination.pages?0.4:1 }}>NEXT</button>
          </div>
        </div>
      </div>
    </div>
  )
}
