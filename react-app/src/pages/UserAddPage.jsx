import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../api/client'

export default function UserAddPage() {
  const [form, setForm] = useState({ full_name:'', username:'', phone_number:'', password:'', role:'manager' })
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault(); setErrors([])
    setLoading(true)
    try { await createUser(form); navigate('/users') }
    catch(err) { setErrors([err.response?.data?.error || 'Failed to create user.']) }
    finally { setLoading(false) }
  }

  const fields = [
    { label:'Full Name *', name:'full_name', type:'text', placeholder:'John Doe', required:true },
    { label:'Username *', name:'username', type:'text', placeholder:'johndoe', required:true },
    { label:'Phone Number *', name:'phone_number', type:'text', placeholder:'054xxxxxxx', required:true },
    { label:'Password *', name:'password', type:'password', placeholder:'Min 8 characters', required:true },
  ]

  return (
    <div className="animate-fadeIn" style={{ maxWidth:560, margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Add User</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Create a new admin or manager account.</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ fontSize:13, fontWeight:600, color:'#4f46e5', background:'none' }}>← Back</button>
      </div>

      {errors.length > 0 && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'0.875rem', marginBottom:'1.25rem' }}>
        {errors.map((e,i) => <p key={i} style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>• {e}</p>)}
      </div>}

      <div className="card" style={{ padding:'2rem' }}>
        <form onSubmit={submit} style={{ display:'grid', gap:'1.25rem' }}>
          {fields.map(f => (
            <div key={f.name}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{f.label}</label>
              <input type={f.type} value={form[f.name]} onChange={e => setForm(p=>({...p,[f.name]:e.target.value}))} placeholder={f.placeholder} required={f.required} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
            </div>
          ))}
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Role *</label>
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit', fontWeight:600 }}>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={()=>navigate(-1)} style={{ padding:'0.6rem 1.5rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, fontWeight:600, color:'#475569', background:'#fff' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.75rem', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', borderRadius:10, fontSize:13, fontWeight:700, opacity:loading?0.7:1 }}>
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
