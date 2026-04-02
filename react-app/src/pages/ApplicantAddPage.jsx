import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplicant } from '../api/client'

export default function ApplicantAddPage() {
  const [form, setForm] = useState({full_name:'',phone_number:'',program:'',pin_moh:'',source:''})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try { await createApplicant(form); navigate('/applicants') }
    catch(err) { alert('Failed to save applicant.') }
    finally { setLoading(false) }
  }

  const fields = [
    { label:'Full Name *', name:'full_name', type:'text', req:true },
    { label:'Phone Number *', name:'phone_number', type:'text', req:true },
    { label:'Program *', name:'program', type:'select', req:true, opts:['Diploma','Certificate'] },
    { label:'PIN / MOH', name:'pin_moh', type:'text' },
    { label:'Source', name:'source', type:'text' },
  ]

  return (
    <div className="animate-fadeIn" style={{ maxWidth:640, margin:'0 auto' }}>
      <h1 style={{ fontWeight:900, marginBottom:20 }} className="gradient-text">Add Applicant</h1>
      <div className="card">
        <form onSubmit={submit} style={{ display:'grid', gap:16 }}>
          {fields.map(f => (
            <div key={f.name}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:4 }}>{f.label}</label>
              {f.opts ? (
                <select value={form[f.name]} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} required={f.req} style={{ width:'100%', padding:10, borderRadius:8, border:'1.5px solid var(--color-border)' }}>
                  <option value="">Select...</option>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.name]} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} required={f.req} style={{ width:'100%', padding:10, borderRadius:8, border:'1.5px solid var(--color-border)' }} />
              )}
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Applicant'}</button>
        </form>
      </div>
    </div>
  )
}
