import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, deleteUser } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function UsersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [q, setQ] = useState('')
  const debounce = useRef(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { const r = await getUsers({ q }); setRows(r.data.rows) }
    finally { setLoading(false) }
  }, [q])

  useEffect(() => { clearTimeout(debounce.current); debounce.current = setTimeout(fetch, 350) }, [q])

  async function remove(id, name) {
    if (!confirm(`Delete user "${name}"?`)) return
    try { await deleteUser(id); fetch() } catch(err) { alert('Delete failed') }
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ fontWeight:900 }} className="gradient-text">Users</h1>
        <Link to="/users/add" className="btn btn-primary">+ Add User</Link>
      </div>
      <div className="card" style={{ padding:0 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#f8fafc' }}>
            <th style={{ padding:16, textAlign:'left' }}>Name</th>
            <th style={{ padding:16, textAlign:'left' }}>Role</th>
            <th style={{ padding:16, textAlign:'right' }}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:16 }}><strong>{u.full_name}</strong><br/><small>@{u.username}</small></td>
                <td style={{ padding:16 }}>{u.role}</td>
                <td style={{ padding:16, textAlign:'right' }}>
                  <Link to={`/users/${u.id}/edit`}>Edit</Link>
                  {u.id !== user.id && <button onClick={()=>remove(u.id, u.full_name)} style={{ marginLeft:8, color:'red' }}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
