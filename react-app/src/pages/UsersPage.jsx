import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, deleteUser } from '../api/client'
import { useAuth } from '../context/AuthContext'

function initials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }

export default function UsersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [toast, setToast] = useState(null)
  const debounce = useRef(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { const r = await getUsers({ q }); setRows(r.data.rows) }
    finally { setLoading(false) }
  }, [q])

  useEffect(() => { clearTimeout(debounce.current); debounce.current = setTimeout(fetch, 350) }, [q])

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null),3000) }

  async function remove(id, name) {
    if (!confirm(`Delete user "${name}"?`)) return
    try { await deleteUser(id); fetch(); showToast('User deleted!') }
    catch(err) { showToast(err.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="animate-fadeIn">
      {toast && <div style={{ position:'fixed', bottom:24, right:24, zIndex:100, padding:'0.75rem 1.25rem', background:'#059669', color:'#fff', borderRadius:12, fontWeight:700, fontSize:13, boxShadow:'var(--shadow-lg)' }}>{toast}</div>}
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">System Users</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Manage admin and manager accounts.</p>
        </div>
        <Link to="/users/add" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', padding:'0.6rem 1.25rem', borderRadius:12, fontSize:13, fontWeight:700, boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M12 4v16m8-8H4"/></svg>
          Add User
        </Link>
      </div>

      <div className="card" style={{ padding:'0.75rem', marginBottom:'1.25rem' }}>
        <div style={{ position:'relative' }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or username…" style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
        {loading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.7)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['User','Username','Role','Created','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.875rem 1rem', textAlign: h==='Actions'?'right':'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', fontWeight:700 }}>No users found</td></tr>}
              {rows.map(u => (
                <tr key={u.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0 }}>{initials(u.full_name)}</div>
                      <div>
                        <div style={{ fontWeight:700, color:'#0f172a' }}>{u.full_name}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{u.phone_number}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'0.875rem 1rem', color:'#64748b', fontSize:12 }}>@{u.username}</td>
                  <td style={{ padding:'0.875rem 1rem' }}>
                    <span style={{ padding:'2px 10px', borderRadius:6, fontSize:11, fontWeight:700, background: u.role==='admin'?'#f3e8ff':'#f1f5f9', color: u.role==='admin'?'#7e22ce':'#475569' }}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding:'0.875rem 1rem', color:'#94a3b8', fontSize:12 }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}
                  </td>
                  <td style={{ padding:'0.875rem 1rem', textAlign:'right' }}>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                      <Link to={`/users/${u.id}/edit`} style={{ padding:'0.35rem 0.875rem', borderRadius:8, fontSize:11, fontWeight:700, background:'#eef2ff', color:'#4f46e5', border:'none' }}>Edit</Link>
                      {u.id !== user.id && <button onClick={() => remove(u.id, u.full_name)} style={{ padding:'0.35rem 0.875rem', borderRadius:8, fontSize:11, fontWeight:700, background:'#fef2f2', color:'#dc2626', border:'none', cursor:'pointer' }}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
