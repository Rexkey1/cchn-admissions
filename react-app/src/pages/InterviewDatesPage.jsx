import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/client'

const PROG_BADGE = {
  Diploma:     { bg:'#e0f2fe', color:'#0369a1' },
  Certificate: { bg:'#f3e8ff', color:'#7e22ce' },
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' })
}

export default function InterviewDatesPage() {
  const { user } = useAuth()
  const [groups, setGroups]         = useState([])
  const [unscheduled, setUnscheduled] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null) // null = overview
  const [dateRows, setDateRows]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [q, setQ]                   = useState('')
  const [prog, setProg]             = useState('')
  const [toast, setToast]           = useState(null)
  const debounce                    = useRef(null)

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.getInterviewDatesGroups({ program: prog })
      setGroups(r.data.groups); setUnscheduled(r.data.unscheduled)
    } finally { setLoading(false) }
  }, [prog])

  const fetchDateDetail = useCallback(async (date) => {
    setDetailLoading(true)
    try {
      const r = await api.getInterviewDatesGroups({ date, q, program: prog })
      setDateRows(r.data.rows || [])
    } finally { setDetailLoading(false) }
  }, [q, prog])

  useEffect(() => { fetchGroups() }, [prog])
  useEffect(() => {
    if (!selectedDate) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchDateDetail(selectedDate), 300)
  }, [selectedDate, q, prog])

  async function clearDate(id) {
    await api.clearInterviewDate(id)
    showToast('Date cleared')
    fetchDateDetail(selectedDate); fetchGroups()
  }

  const totalScheduled = groups.reduce((s, g) => s + Number(g.total), 0)

  return (
    <div className="animate-fadeIn">
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:100, padding:'0.75rem 1.25rem',
          background: toast.type==='error'?'#dc2626':'#059669', color:'#fff',
          borderRadius:12, fontWeight:700, fontSize:13, boxShadow:'0 8px 30px rgba(0,0,0,.15)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Interview Dates</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Schedule and manage applicant interview sessions.</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          {user.role === 'admin' && (
            <Link to="/interview-dates/bulk-upload" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff',
              padding:'0.55rem 1.1rem', borderRadius:10, fontSize:12, fontWeight:800,
              boxShadow:'0 4px 14px rgba(79,70,229,0.35)',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Bulk Schedule Upload
            </Link>
          )}
          <Link to="/interview-dates/upload" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#fff', border:'1px solid var(--color-border)', color:'#475569',
            padding:'0.55rem 1rem', borderRadius:10, fontSize:12, fontWeight:700,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Upload Dates CSV
          </Link>
          <Link to="/applicants" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#fff', border:'1px solid var(--color-border)', color:'#475569',
            padding:'0.55rem 1rem', borderRadius:10, fontSize:12, fontWeight:700,
          }}>
            Assign Dates →
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.875rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Scheduled',   value:totalScheduled, color:'#4f46e5', bg:'#eef2ff' },
          { label:'Unique Dates', value:groups.length, color:'#7c3aed', bg:'#f5f3ff' },
          { label:'Unscheduled', value:unscheduled,   color:'#d97706', bg:'#fffbeb' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'1rem', background:s.bg, border:'1px solid '+ s.color+'22' }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:s.color }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Breadcrumb trail */}
      {selectedDate && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontSize:13, fontWeight:600 }}>
          <button onClick={() => { setSelectedDate(null); setDateRows([]) }} style={{ color:'#4f46e5', background:'none' }}>← All Dates</button>
          <span style={{ color:'#94a3b8' }}>/</span>
          <span style={{ color:'#0f172a' }}>{fmt(selectedDate)}</span>
        </div>
      )}

      {/* Filter bar (shown in detail view) */}
      {selectedDate && (
        <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:2, minWidth:160 }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, phone…" style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
          </div>
          <select value={prog} onChange={e=>setProg(e.target.value)} style={{ flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
            <option value="">All Programs</option>
            <option value="Diploma">Diploma</option>
            <option value="Certificate">Certificate</option>
          </select>
          <span style={{ fontSize:13, fontWeight:600, color:'#64748b', alignSelf:'center' }}>{dateRows.length} applicant(s)</span>
        </div>
      )}

      {/* Overview: date cards */}
      {!selectedDate && (
        <div style={{ position:'relative' }}>
          {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}
          {!loading && groups.length === 0 && (
            <div className="card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
              <p style={{ fontWeight:700, fontSize:14 }}>No interview dates scheduled yet.</p>
              <p style={{ fontSize:13, marginTop:4 }}>Go to <Link to="/applicants" style={{ color:'#4f46e5' }}>Applicants</Link> to assign dates, or <Link to="/interview-dates/upload" style={{ color:'#4f46e5' }}>upload a CSV</Link>.</p>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
            {groups.map(g => {
              const d   = new Date(g.interview_date + 'T00:00:00')
              const day = d.toLocaleDateString('en-GB', { weekday:'long' })
              const num = d.getDate()
              const mon = d.toLocaleDateString('en-GB', { month:'long', year:'numeric' })
              return (
                <button key={g.interview_date} onClick={() => setSelectedDate(g.interview_date)} style={{
                  textAlign:'left', padding:'1.25rem', borderRadius:18,
                  background:'#fff', border:'1.5px solid #e2e8f0',
                  boxShadow:'0 2px 8px rgba(0,0,0,.05)', cursor:'pointer',
                  transition:'all 0.15s', width:'100%',
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>{day}</div>
                      <div style={{ fontSize:36, fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{num}</div>
                      <div style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{mon}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:24, fontWeight:900, color:'#4f46e5' }}>{Number(g.total).toLocaleString()}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>total</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#e0f2fe', color:'#0369a1' }}>Diploma: {g.diploma}</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#f3e8ff', color:'#7e22ce' }}>Cert: {g.certificate}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail view: applicants for a date */}
      {selectedDate && (
        <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
          {detailLoading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(4px)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Applicant','Program','Phone','Source','Status', user.role==='admin'?'Action':''].filter(Boolean).map(h => (
                    <th key={h} style={{ padding:'0.875rem 1rem', textAlign: h==='Action'?'right':'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!detailLoading && dateRows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontWeight:700 }}>No applicants match.</td></tr>
                )}
                {dateRows.map((r, i) => (
                  <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'0.875rem 1rem', color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <div style={{ fontWeight:700, color:'#0f172a' }}>{r.full_name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{r.pin_moh||''}</div>
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      {PROG_BADGE[r.program] && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:PROG_BADGE[r.program].bg, color:PROG_BADGE[r.program].color }}>{r.program}</span>}
                    </td>
                    <td style={{ padding:'0.875rem 1rem', color:'#475569', fontFamily:'monospace', fontSize:12 }}>{r.phone_number}</td>
                    <td style={{ padding:'0.875rem 1rem', color:'#64748b', fontSize:12 }}>{r.source||'—'}</td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      {r.is_shortlisted==1 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'#fef9c3', color:'#92400e', marginRight:3 }}>Short</span>}
                      {r.is_verified==1   && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'#dcfce7', color:'#166534', marginRight:3 }}>Verified</span>}
                      {r.is_paid==1       && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'#dbeafe', color:'#1e40af' }}>Paid</span>}
                    </td>
                    {user.role==='admin' && (
                      <td style={{ padding:'0.875rem 1rem', textAlign:'right' }}>
                        <button onClick={() => clearDate(r.id)} style={{ padding:'0.35rem 0.75rem', borderRadius:8, fontSize:11, fontWeight:700, background:'#fef2f2', color:'#dc2626', border:'none', cursor:'pointer' }}>Clear</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
