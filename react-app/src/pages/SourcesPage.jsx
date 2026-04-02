import { useEffect, useState, useCallback, useRef } from 'react'
import * as api from '../api/client'

const PROG_BADGE = {
  Diploma:     { bg:'#e0f2fe', color:'#0369a1' },
  Certificate: { bg:'#f3e8ff', color:'#7e22ce' },
}

export default function SourcesPage() {
  const [groups, setGroups]         = useState([])
  const [selectedSource, setSelectedSource] = useState(null)
  const [rows, setRows]             = useState([])
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0 })
  const [loading, setLoading]       = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [prog, setProg]             = useState('')
  const [q, setQ]                   = useState('')
  const [page, setPage]             = useState(1)
  const debounce                    = useRef(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.getSources({ program: prog })
      setGroups(r.data.groups)
    } finally { setLoading(false) }
  }, [prog])

  const fetchDetail = useCallback(async (src, pg=1) => {
    setDetailLoading(true)
    try {
      const r = await api.getSourceDetail({ source: src, program: prog, q, page: pg })
      setRows(r.data.rows); setPagination(r.data.pagination)
    } finally { setDetailLoading(false) }
  }, [prog, q])

  useEffect(() => { fetchGroups() }, [prog])
  useEffect(() => {
    if (!selectedSource) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setPage(1); fetchDetail(selectedSource, 1) }, 300)
  }, [q, prog, selectedSource])
  useEffect(() => {
    if (!selectedSource) return
    fetchDetail(selectedSource, page)
  }, [page])

  function selectSource(src) { setSelectedSource(src); setQ(''); setPage(1); fetchDetail(src, 1) }
  function back() { setSelectedSource(null); setRows([]); setPagination({ page:1,pages:1,total:0 }) }

  const grandTotal = groups.reduce((s,g) => s + Number(g.total), 0)

  // Color cycle for source cards
  const COLORS = [
    ['#eef2ff','#4f46e5'], ['#f0fdf4','#059669'], ['#fff7ed','#d97706'],
    ['#fdf4ff','#9333ea'], ['#f0f9ff','#0284c7'], ['#fff1f2','#e11d48'],
    ['#ecfeff','#0891b2'], ['#fafaf9','#78716c'],
  ]

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Sources</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Referral source breakdown — click any source to view its applicants.</p>
        </div>
        <select value={prog} onChange={e=>{ setProg(e.target.value); back() }} style={{ padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#fff', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
          <option value="">All Programs</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
        </select>
      </div>

      {/* Breadcrumb */}
      {selectedSource && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontSize:13, fontWeight:600 }}>
          <button onClick={back} style={{ color:'#4f46e5', background:'none', padding:0 }}>← All Sources</button>
          <span style={{ color:'#94a3b8' }}>/</span>
          <span style={{ color:'#0f172a' }}>{selectedSource}</span>
        </div>
      )}

      {/* ── Overview: source cards ── */}
      {!selectedSource && (
        <>
          {/* Grand total strip */}
          <div className="card" style={{ padding:'1rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', background:'#1e293b' }}>
            <span style={{ color:'#94a3b8', fontWeight:700, fontSize:13 }}>Total Applicants Across All Sources</span>
            <span style={{ color:'#fff', fontWeight:900, fontSize:28, letterSpacing:'-0.5px' }}>{grandTotal.toLocaleString()}</span>
          </div>

          {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}
          {!loading && groups.length === 0 && (
            <div className="card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
              <p style={{ fontWeight:700, fontSize:14 }}>No source data found.</p>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
            {groups.map((g, i) => {
              const [bg, accent] = COLORS[i % COLORS.length]
              const pct = grandTotal > 0 ? Math.round(Number(g.total)/grandTotal*100) : 0
              return (
                <button key={g.source_label} onClick={() => selectSource(g.source_label)} style={{
                  textAlign:'left', padding:'1.25rem', borderRadius:18,
                  background:bg, border:`1.5px solid ${accent}22`,
                  boxShadow:'0 2px 8px rgba(0,0,0,.04)', cursor:'pointer',
                  transition:'all 0.15s transform, box-shadow 0.15s', width:'100%',
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.1)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)' }}
                >
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.875rem' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:accent, marginBottom:2 }}>{g.source_label}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{pct}% of total</div>
                    </div>
                    <div style={{ fontSize:32, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px', lineHeight:1 }}>{Number(g.total).toLocaleString()}</div>
                  </div>
                  <div style={{ height:5, background:'#e2e8f0', borderRadius:99, marginBottom:'0.875rem', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:accent, borderRadius:99 }} />
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#e0f2fe', color:'#0369a1' }}>Dip: {g.diploma}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#f3e8ff', color:'#7e22ce' }}>Cert: {g.certificate}</span>
                    {Number(g.shortlisted) > 0 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#fef9c3', color:'#92400e' }}>Short: {g.shortlisted}</span>}
                    {Number(g.verified) > 0 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#dcfce7', color:'#166534' }}>Verified: {g.verified}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── Detail view: applicants for a source ── */}
      {selectedSource && (
        <>
          <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:2, minWidth:160 }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search applicants..." style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
            </div>
            <select value={prog} onChange={e=>setProg(e.target.value)} style={{ flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
              <option value="">All Programs</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>
            <span style={{ fontSize:13, fontWeight:600, color:'#64748b', alignSelf:'center', whiteSpace:'nowrap' }}>{pagination.total.toLocaleString()} applicant(s)</span>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
            {detailLoading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr style={{ background:'#f8fafc' }}>
                  {['#','Applicant','Program','Phone','Interview Date','Status'].map(h => (
                    <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1rem', color:'#94a3b8' }}>{(pagination.page-1)*25+i+1}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        <div style={{ fontWeight:700, color:'#0f172a' }}>{r.full_name}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>{r.pin_moh||''}</div>
                      </td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        {PROG_BADGE[r.program] && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:PROG_BADGE[r.program].bg, color:PROG_BADGE[r.program].color }}>{r.program}</span>}
                      </td>
                      <td style={{ padding:'0.875rem 1rem' }}>{r.phone_number}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>{r.interview_date || '—'}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        {r.is_shortlisted==1 && <span title="Short" style={{ width:6, height:6, borderRadius:'50%', background:'#a855f7', display:'inline-block', marginRight:4 }}/>}
                        {r.is_verified==1   && <span title="Verified" style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', marginRight:4 }}/>}
                        {r.is_paid==1       && <span title="Paid" style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', display:'inline-block', marginRight:4 }}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'0.875rem 1.25rem', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display:'flex', gap:8 }}>
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity:page<=1?0.4:1, cursor:page<=1?'not-allowed':'pointer' }}>PREV</button>
                <button disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity:page>=pagination.pages?0.4:1, cursor:page>=pagination.pages?'not-allowed':'pointer' }}>NEXT</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
