import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getApplicants, bulkAction, saveComment, deleteApplicant, assignInterviewDate } from '../api/client'
import { useAuth } from '../context/AuthContext'

const BADGE = {
  Diploma:     { bg:'#e0f2fe', color:'#0369a1', label:'Diploma' },
  Certificate: { bg:'#f3e8ff', color:'#7e22ce', label:'Certificate' },
}
const STATUS_BADGE = (on, bg, color, label) => on == 1
  ? <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:bg, color, marginRight:4 }}>{label}</span>
  : null

export default function ApplicantsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0 })
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [prog, setProg] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState(null)
  const [dateModal, setDateModal] = useState(false)
  const [assignDate, setAssignDate] = useState('')
  const debounce = useRef(null)

  const fetch = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const r = await getApplicants({ q, program: prog, page: pg })
      setRows(r.data.rows); setCounts(r.data.counts); setPagination(r.data.pagination)
    } finally { setLoading(false) }
  }, [q, prog, page])

  useEffect(() => { clearTimeout(debounce.current); debounce.current = setTimeout(() => { setPage(1); fetch(1) }, 350) }, [q, prog])
  useEffect(() => { fetch() }, [page])

  function showToast(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  function openModal(r) { setModal(r); setNote(r.admin_comments || '') }

  async function doSaveNote() {
    await saveComment({ id: modal.id, comment: note })
    showToast('Note saved!')
    setModal(null)
  }

  async function doBulk(action) {
    if (!selected.length) return
    if (action === 'delete' && !confirm(`Delete ${selected.length} applicant(s)?`)) return
    if (action === 'assign_date') { setDateModal(true); return }
    await bulkAction({ ids: selected, action })
    setSelected([]); fetch(); showToast('Done!')
  }

  async function doAssignDate() {
    if (!assignDate) { showToast('Please pick a date', 'error'); return }
    await assignInterviewDate({ ids: selected, date: assignDate })
    setDateModal(false); setAssignDate(''); setSelected([])
    fetch(); showToast(`Interview date set for ${selected.length} applicant(s)!`)
  }

  async function doDelete(id) {
    if (!confirm('Delete this applicant?')) return
    await deleteApplicant(id); fetch(); showToast('Deleted!')
  }

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll    = () => setSelected(s => s.length === rows.length ? [] : rows.map(r => r.id))
  const isSelected   = (id) => selected.includes(id)

  return (
    <div className="animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:100, padding:'0.75rem 1.25rem',
          background: toast.type === 'error' ? '#dc2626' : '#059669', color:'#fff',
          borderRadius:12, fontWeight:700, fontSize:13, boxShadow:'var(--shadow-lg)', animation:'fadeIn 0.2s',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Main Registry</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2, fontWeight:500 }}>All applicants — search, filter, manage</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <Link to="/applicants/add" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff',
            padding:'0.6rem 1.25rem', borderRadius:12, fontSize:13, fontWeight:700,
            boxShadow:'0 4px 12px rgba(79,70,229,0.3)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M12 4v16m8-8H4"/></svg>
            Add Applicant
          </Link>
          <Link to="/upload" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#fff', border:'1px solid var(--color-border)', color:'#374151',
            padding:'0.6rem 1.25rem', borderRadius:12, fontSize:13, fontWeight:600,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Upload CSV
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {[
          { label:'Total', val:(counts.Diploma||0)+(counts.Certificate||0), color:'#4f46e5' },
          { label:'Diploma', val:counts.Diploma||0, color:'#0284c7' },
          { label:'Certificate', val:counts.Certificate||0, color:'#7c3aed' },
          { label:'Paid', val:counts.Paid||0, color:'#059669' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'0.875rem 1rem' }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:s.color }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>{s.val.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="card" style={{ padding:'0.75rem', display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:2, minWidth:160 }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, phone, PIN…" style={{
            width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9,
            border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc',
            outline:'none', fontFamily:'inherit',
          }} />
        </div>
        <select value={prog} onChange={e=>setProg(e.target.value)} style={{
          flex:1, minWidth:130, padding:'0.55rem 0.75rem', border:'1.5px solid var(--color-border)',
          borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600,
        }}>
          <option value="">All Programs</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
        </select>
        <button onClick={() => fetch(page)} style={{
          padding:'0.55rem 1rem', Background:'#1e293b', background:'#1e293b', color:'#fff',
          borderRadius:10, fontSize:12, fontWeight:700, letterSpacing:'0.04em',
        }}>Refresh</button>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{
          background:'#1e293b', color:'#fff', padding:'0.875rem 1.25rem', borderRadius:16,
          marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap',
          animation:'fadeIn 0.2s',
        }}>
          <span style={{ fontSize:11, fontWeight:800, background:'#4f46e5', padding:'2px 10px', borderRadius:6 }}>{selected.length} SELECTED</span>
          {[['shortlist','⭐ Shortlist','#d97706'],['unshortlist','Remove Short','#64748b'],['verify','✅ Verify','#059669'],['unverify','Unverify','#64748b'],['mark_paid','Paid','#0284c7'],['unmark_paid','Unpaid','#64748b']].map(([act,lbl,c]) => (
            (act.includes('verify') && user.role !== 'admin') ? null :
            <button key={act} onClick={() => doBulk(act)} style={{ padding:'0.35rem 0.75rem', borderRadius:8, fontSize:11, fontWeight:700, color:'#fff', background:c + '33', border:'1px solid ' + c + '66' }}>{lbl}</button>
          ))}
          <button onClick={() => doBulk('assign_date')} style={{ padding:'0.35rem 0.75rem', borderRadius:8, fontSize:11, fontWeight:700, color:'#fff', background:'#0891b233', border:'1px solid #0891b266' }}>📅 Set Date</button>
          {user.role === 'admin' && <button onClick={() => doBulk('delete')} style={{ padding:'0.35rem 0.75rem', borderRadius:8, fontSize:11, fontWeight:700, color:'#f87171', background:'#7f1d1d33', border:'1px solid #dc2626' }}>🗑 Delete</button>}
          <button onClick={() => setSelected([])} style={{ marginLeft:'auto', color:'#94a3b8', padding:'0.25rem 0.5rem', borderRadius:8, fontSize:11 }}>✕ Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
        {loading && (
          <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(4px)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="spinner" />
          </div>
        )}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                <th style={{ padding:'0.875rem 1rem', textAlign:'left', width:40 }}>
                  <input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={toggleAll} style={{ width:16, height:16, cursor:'pointer' }} />
                </th>
                {['Applicant','Program & Source','Interview Date','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.875rem 1rem', textAlign: h==='Actions'?'right':'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontWeight:700 }}>No records found</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} style={{
                  borderTop:'1px solid #f1f5f9',
                  background: isSelected(r.id) ? '#eef2ff' : undefined,
                  borderLeft: isSelected(r.id) ? '3px solid #4f46e5' : '3px solid transparent',
                  transition:'background 0.15s',
                }}>
                  <td style={{ padding:'1rem' }}>
                    <input type="checkbox" checked={isSelected(r.id)} onChange={() => toggleSelect(r.id)} style={{ width:16, height:16, cursor:'pointer' }} />
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    <div style={{ fontWeight:700, color:'#0f172a' }}>{r.full_name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{r.pin_moh || 'NO PIN'}</div>
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    {BADGE[r.program] && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:BADGE[r.program].bg, color:BADGE[r.program].color }}>{BADGE[r.program].label}</span>}
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>📍 {r.source || 'Direct'}</div>
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    {r.interview_date
                      ? <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#ecfeff', color:'#0891b2' }}>
                          {new Date(r.interview_date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                        </span>
                      : <span style={{ fontSize:11, color:'#cbd5e1' }}>—</span>
                    }
                  </td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    {STATUS_BADGE(r.is_shortlisted, '#fef9c3','#92400e','Short')}
                    {STATUS_BADGE(r.is_verified, '#dcfce7','#166534','Verified')}
                    {STATUS_BADGE(r.is_paid, '#dbeafe','#1e40af','Paid')}
                  </td>
                  <td style={{ padding:'0.875rem 1rem', textAlign:'right' }}>
                    <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                      <button onClick={() => openModal(r)} style={{ padding:'0.4rem', borderRadius:8, color:'#64748b', transition:'all 0.15s' }} title="View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <Link to={`/applicants/${r.id}/edit`} style={{ padding:'0.4rem', borderRadius:8, color:'#64748b', display:'flex' }} title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </Link>
                      {user.role === 'admin' && (
                        <button onClick={() => doDelete(r.id)} style={{ padding:'0.4rem', borderRadius:8, color:'#f87171' }} title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding:'0.875rem 1.25rem', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc/50' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> — {pagination.total.toLocaleString()} records
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity: page <= 1 ? 0.4 : 1 }}>PREV</button>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:'1px solid var(--color-border)', fontSize:12, fontWeight:700, background:'#fff', opacity: page >= pagination.pages ? 0.4 : 1 }}>NEXT</button>
          </div>
        </div>
      </div>

      {/* Assign Date Modal */}
      {dateModal && (
        <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={() => setDateModal(false)} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)' }} />
          <div className="animate-fadeIn" style={{ position:'relative', background:'#fff', borderRadius:24, padding:'2rem', width:'100%', maxWidth:380, boxShadow:'var(--shadow-xl)' }}>
            <h2 style={{ fontWeight:900, fontSize:18, color:'#0f172a', marginBottom:4 }}>📅 Set Interview Date</h2>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:'1.5rem' }}>Assign a date to <strong>{selected.length}</strong> selected applicant(s).</p>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Interview Date</label>
            <input type="date" value={assignDate} onChange={e=>setAssignDate(e.target.value)} style={{ width:'100%', padding:'0.65rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:'1.25rem' }} />
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setDateModal(false)} style={{ flex:1, padding:'0.65rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, fontWeight:600, color:'#475569', background:'#fff' }}>Cancel</button>
              <button onClick={doAssignDate} style={{ flex:2, padding:'0.65rem', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', borderRadius:10, fontSize:13, fontWeight:700 }}>Assign Date</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={() => setModal(null)} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)' }} />
          <div className="animate-fadeIn" style={{ position:'relative', background:'#fff', borderRadius:24, padding:'2rem', width:'100%', maxWidth:480, boxShadow:'var(--shadow-xl)' }}>
            <h2 style={{ fontWeight:900, fontSize:20, color:'#0f172a', marginBottom:'1.5rem' }}>{modal.full_name}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              {[['PIN/MOH', modal.pin_moh||'NOT REGISTERED'],['Phone', modal.phone_number],['Program', modal.program],['Source', modal.source||'Direct'],['Interview Date', modal.interview_date ? new Date(modal.interview_date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : 'Not scheduled']].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.07em' }}>{k}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Office Notes</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} style={{ width:'100%', padding:'0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, resize:'vertical', outline:'none', fontFamily:'inherit' }} placeholder="Notes…" />
              <button onClick={doSaveNote} style={{ width:'100%', marginTop:8, padding:'0.7rem', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', borderRadius:10, fontWeight:700, fontSize:13 }}>Save Note</button>
            </div>
            <button onClick={() => setModal(null)} style={{ width:'100%', marginTop:8, padding:'0.7rem', background:'#f1f5f9', color:'#475569', borderRadius:10, fontWeight:700, fontSize:13 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
