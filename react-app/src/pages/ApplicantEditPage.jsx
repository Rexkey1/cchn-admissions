import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApplicant, updateApplicant } from '../api/client'

export default function ApplicantEditPage() {
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getApplicant(id).then(r => setForm(r.data.row)).catch(() => navigate('/applicants'))
  }, [id])

  async function submit(e) {
    e.preventDefault(); setErrors([])
    setLoading(true)
    try {
      await updateApplicant(id, form)
      navigate('/applicants')
    } catch(err) {
      setErrors([err.response?.data?.error || 'Failed to save.'])
    } finally { setLoading(false) }
  }

  if (!form) return <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>

  const fields = [
    { label:'Full Name *', name:'full_name', type:'text', required:true, span:2 },
    { label:'Phone Number *', name:'phone_number', type:'text', required:true },
    { label:'Program *', name:'program', type:'select', required:true, opts:['Diploma','Certificate'] },
    { label:'PIN / MOH', name:'pin_moh', type:'text' },
    { label:'Source', name:'source', type:'text' },
  ]

  return (
    <div className="animate-fadeIn" style={{ maxWidth:640, margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Edit Applicant</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Update applicant information below.</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ fontSize:13, fontWeight:600, color:'#4f46e5', background:'none' }}>← Back</button>
      </div>

      {errors.length > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'0.875rem 1.25rem', marginBottom:'1.25rem' }}>
          {errors.map((e, i) => <p key={i} style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>• {e}</p>)}
        </div>
      )}

      <div className="card" style={{ padding:'2rem' }}>
        <form onSubmit={submit} style={{ display:'grid', gap:'1.25rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            {fields.map(f => (
              <div key={f.name} style={{ gridColumn: f.span === 2 ? 'span 2' : undefined }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{f.label}</label>
                {f.opts ? (
                  <select value={form[f.name]||''} onChange={e => setForm(p => ({...p,[f.name]:e.target.value}))} required={f.required} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }}>
                    <option value="">Select Program</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.name]||''} onChange={e => setForm(p => ({...p,[f.name]:e.target.value}))} placeholder={f.label} required={f.required} style={{ width:'100%', padding:'0.6rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, background:'#f8fafc', outline:'none', fontFamily:'inherit' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={() => navigate(-1)} style={{ padding:'0.6rem 1.5rem', border:'1.5px solid var(--color-border)', borderRadius:10, fontSize:13, fontWeight:600, color:'#475569', background:'#fff' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.75rem', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', borderRadius:10, fontSize:13, fontWeight:700, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : 'Update Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
