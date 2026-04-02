import { useEffect, useState, useCallback, useRef } from 'react'
import { getAdmitted, getAdmittedDay } from '../api/client'

const PROG_BADGE = {
  Diploma:     { bg:'#e0f2fe', color:'#0369a1' },
  Certificate: { bg:'#f3e8ff', color:'#7e22ce' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'long', year:'numeric',
  })
}
function fmtTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
}

// ── Bar mini chart ────────────────────────────────────────────────────────
function MiniBar({ diploma, certificate }) {
  const total = diploma + certificate || 1
  return (
    <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', width:80, gap:1 }}>
      <div style={{ width:`${(diploma/total)*100}%`, background:'#38bdf8', borderRadius:'4px 0 0 4px' }} />
      <div style={{ width:`${(certificate/total)*100}%`, background:'#a78bfa', borderRadius:'0 4px 4px 0' }} />
    </div>
  )
}

export default function AdmittedPage() {
  const [groups,  setGroups]  = useState([])
  const [totals,  setTotals]  = useState({ total:0, diploma:0, certificate:0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [prog, setProg] = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  // Selected day drill-down
  const [selectedDate,  setSelectedDate]  = useState(null)
  const [dayRows,       setDayRows]       = useState([])
  const [dayLoading,    setDayLoading]    = useState(false)
  const [dayQ,          setDayQ]          = useState('')
  const [dayProg,       setDayProg]       = useState('')

  const debounce = useRef(null)

  // ── Fetch summary ─────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getAdmitted({ program:prog, from, to })
      setGroups(r.data.groups)
      setTotals(r.data.totals)
    } finally { setLoading(false) }
  }, [prog, from, to])

  useEffect(() => { fetchGroups() }, [prog, from, to])

  // ── Fetch day detail ──────────────────────────────────────────────────────
  const fetchDay = useCallback(async (date) => {
    setDayLoading(true)
    try {
      const r = await getAdmittedDay({ date, q:dayQ, program:dayProg })
      setDayRows(r.data.rows || [])
    } finally { setDayLoading(false) }
  }, [dayQ, dayProg])

  useEffect(() => {
    if (!selectedDate) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchDay(selectedDate), 300)
  }, [selectedDate, dayQ, dayProg])

  function selectDay(date) {
    setSelectedDate(date)
    setDayQ(''); setDayProg('')
  }
  function clearDay() {
    setSelectedDate(null); setDayRows([])
  }

  // ── CSV export for a selected day ─────────────────────────────────────────
  function exportDayCSV() {
    const header = ['#','Full Name','PIN/MOH','Program','Phone','Source','Paid','Time Admitted','Interview Date']
    const csvRows = dayRows.map((r,i) => [
      i+1, r.full_name, r.pin_moh||'', r.program, r.phone_number,
      r.source||'', r.is_paid==1?'Yes':'No',
      r.admitted_at ? new Date(r.admitted_at).toLocaleString('en-GB') : '',
      r.interview_date || '',
    ])
    const csv = [header, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `admitted_${selectedDate}.csv`
    a.click()
  }

  const maxTotal = Math.max(...groups.map(g => Number(g.total)), 1)

  return (
    <div className="animate-fadeIn">

      {/* ── Header ── */}
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Admissions by Day</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Track how many applicants were admitted each day.</p>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.875rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total Admitted',  value:totals.total,       color:'#4f46e5', bg:'#eef2ff' },
          { label:'Diploma',         value:totals.diploma,     color:'#0369a1', bg:'#e0f2fe' },
          { label:'Certificate',     value:totals.certificate, color:'#7e22ce', bg:'#f5f3ff' },
          { label:'Days Active',     value:groups.length,      color:'#059669', bg:'#f0fdf4' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'1rem', background:s.bg, border:`1px solid ${s.color}22` }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:s.color }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <select value={prog} onChange={e => setProg(e.target.value)} style={{ flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
          <option value="">All Programs</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
        </select>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:120 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#64748b', whiteSpace:'nowrap' }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ flex:1, padding:'0.5rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:120 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#64748b', whiteSpace:'nowrap' }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ flex:1, padding:'0.5rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
        </div>
        {(prog || from || to) && (
          <button onClick={() => { setProg(''); setFrom(''); setTo('') }} style={{ padding:'0.5rem 0.875rem', borderRadius:10, fontSize:12, fontWeight:700, background:'#fef2f2', color:'#dc2626', border:'none', cursor:'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Breadcrumb ── */}
      {selectedDate && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontSize:13, fontWeight:600 }}>
          <button onClick={clearDay} style={{ color:'#4f46e5', background:'none', fontWeight:700 }}>← All Days</button>
          <span style={{ color:'#94a3b8' }}>/</span>
          <span style={{ color:'#0f172a' }}>{fmtDate(selectedDate)}</span>
          <span style={{ fontSize:11, background:'#f0fdf4', color:'#166534', fontWeight:700, padding:'2px 8px', borderRadius:5, border:'1px solid #bbf7d0', marginLeft:4 }}>
            {dayRows.length} admitted
          </span>
        </div>
      )}

      {/* ── DAY DETAIL VIEW ── */}
      {selectedDate && (
        <div>
          {/* Day sub-filters */}
          <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:2, minWidth:160 }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={dayQ} onChange={e => setDayQ(e.target.value)} placeholder="Search name, phone…" style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
            </div>
            <select value={dayProg} onChange={e => setDayProg(e.target.value)} style={{ flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
              <option value="">All Programs</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>
            <button onClick={exportDayCSV} disabled={dayRows.length === 0} style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'0.55rem 1rem', borderRadius:10, fontSize:12, fontWeight:700,
              background:'#fff', border:'1px solid var(--color-border)', color:'#475569', cursor:'pointer',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export CSV
            </button>
          </div>

          {/* Day applicants table */}
          <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
            {dayLoading && (
              <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(4px)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div className="spinner" />
              </div>
            )}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['#','Applicant','Program','Phone','Source','Time Admitted','Paid'].map(h => (
                      <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!dayLoading && dayRows.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontWeight:700 }}>No applicants match.</td></tr>
                  )}
                  {dayRows.map((r, i) => (
                    <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1rem', color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        <div style={{ fontWeight:700, color:'#0f172a' }}>{r.full_name}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{r.pin_moh||''}</div>
                      </td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        {PROG_BADGE[r.program] && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:PROG_BADGE[r.program].bg, color:PROG_BADGE[r.program].color }}>
                            {r.program}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'0.875rem 1rem', color:'#475569', fontFamily:'monospace', fontSize:12 }}>{r.phone_number}</td>
                      <td style={{ padding:'0.875rem 1rem', color:'#64748b', fontSize:12 }}>{r.source||'—'}</td>
                      <td style={{ padding:'0.875rem 1rem', color:'#4f46e5', fontSize:12, fontWeight:600 }}>{fmtTime(r.admitted_at)}</td>
                      <td style={{ padding:'0.875rem 1rem' }}>
                        {r.is_paid == 1 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'#dbeafe', color:'#1e40af' }}>Paid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW: day cards ── */}
      {!selectedDate && (
        <div>
          {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}
          {!loading && groups.length === 0 && (
            <div className="card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎓</div>
              <p style={{ fontWeight:700, fontSize:14 }}>No admission records found.</p>
              <p style={{ fontSize:13, marginTop:4 }}>Verify applicants from the <strong>Applicants</strong> page to start tracking admissions.</p>
            </div>
          )}

          {/* Bar chart overview */}
          {!loading && groups.length > 0 && (
            <div className="card" style={{ padding:'1.25rem', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:'1rem' }}>
                Daily Admission Volume
                <span style={{ fontSize:11, fontWeight:500, color:'#94a3b8', marginLeft:8 }}>click a bar to drill down</span>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100, overflowX:'auto', paddingBottom:4 }}>
                {[...groups].reverse().map(g => {
                  const h = Math.max(8, Math.round((Number(g.total) / maxTotal) * 88))
                  const d = new Date(g.admit_date + 'T00:00:00')
                  return (
                    <button
                      key={g.admit_date}
                      title={`${fmtDate(g.admit_date)}: ${g.total} admitted`}
                      onClick={() => selectDay(g.admit_date)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', flexShrink:0, minWidth:32 }}
                    >
                      <div style={{
                        width:28, height:h,
                        background:'linear-gradient(180deg,#4f46e5,#7c3aed)',
                        borderRadius:'6px 6px 2px 2px',
                        transition:'opacity 0.15s',
                      }} />
                      <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textAlign:'center', lineHeight:1.2 }}>
                        {d.getDate()}<br/>{d.toLocaleDateString('en-GB',{month:'short'})}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:'1rem', marginTop:'0.75rem', fontSize:11, fontWeight:600 }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#38bdf8', display:'inline-block' }} />Diploma</span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#a78bfa', display:'inline-block' }} />Certificate</span>
              </div>
            </div>
          )}

          {/* Day list */}
          {!loading && groups.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Date','Total','Diploma','Certificate','Breakdown',''].map((h,i) => (
                        <th key={i} style={{ padding:'0.875rem 1rem', textAlign: i===5 ? 'right' : 'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(g => (
                      <tr key={g.admit_date} style={{ borderTop:'1px solid #f1f5f9', cursor:'pointer' }} onClick={() => selectDay(g.admit_date)}>
                        <td style={{ padding:'0.875rem 1rem' }}>
                          <div style={{ fontWeight:700, color:'#0f172a' }}>{fmtDate(g.admit_date)}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:1 }}>{g.admit_date}</div>
                        </td>
                        <td style={{ padding:'0.875rem 1rem' }}>
                          <span style={{ fontSize:20, fontWeight:900, color:'#4f46e5' }}>{Number(g.total).toLocaleString()}</span>
                        </td>
                        <td style={{ padding:'0.875rem 1rem' }}>
                          <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#e0f2fe', color:'#0369a1' }}>{Number(g.diploma).toLocaleString()}</span>
                        </td>
                        <td style={{ padding:'0.875rem 1rem' }}>
                          <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#f3e8ff', color:'#7e22ce' }}>{Number(g.certificate).toLocaleString()}</span>
                        </td>
                        <td style={{ padding:'0.875rem 1rem' }}>
                          <MiniBar diploma={Number(g.diploma)} certificate={Number(g.certificate)} />
                        </td>
                        <td style={{ padding:'0.875rem 1rem', textAlign:'right' }}>
                          <span style={{ fontSize:11, fontWeight:700, color:'#4f46e5' }}>View →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
