import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.username || !form.password) { setError('Username and password are required.'); return }
    setLoading(true)
    try {
      const r = await login(form)
      setUser(r.data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem', position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg, #eef2ff 0%, #fff 50%, #f1f5f9 100%)',
    }}>
      {/* Decorative blobs */}
      {[
        { top:'-10%', left:'-10%', color:'#c7d2fe', delay:'0s' },
        { top:'10%', right:'-5%', color:'#ddd6fe', delay:'2s' },
        { bottom:'-10%', left:'20%', color:'#fbcfe8', delay:'4s' },
      ].map((b, i) => (
        <div key={i} className="animate-blob" style={{
          position:'absolute', width:350, height:350, borderRadius:'50%',
          background:b.color, filter:'blur(64px)', opacity:0.3,
          mixBlendMode:'multiply', animationDelay:b.delay, ...b, color:undefined,
        }} />
      ))}

      <div className="animate-fadeIn" style={{
        position:'relative', zIndex:10, width:'100%', maxWidth:420,
        background:'rgba(255,255,255,0.85)', backdropFilter:'blur(16px)',
        borderRadius:28, border:'1px solid rgba(255,255,255,0.7)',
        boxShadow:'0 20px 60px rgba(79,70,229,0.12)', padding:'2.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{
            width:56, height:56, borderRadius:16, margin:'0 auto 1.25rem',
            background:'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:900, fontSize:22, boxShadow:'0 8px 20px rgba(79,70,229,0.35)',
          }}>C</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px', marginBottom:4 }}>
            Sign In
          </h1>
          <p style={{ color:'#64748b', fontSize:13, fontWeight:500 }}>CCHN Selection Portal</p>
        </div>

        {error && (
          <div style={{
            background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
            borderRadius:12, padding:'0.75rem 1rem', marginBottom:'1.25rem',
            fontSize:13, display:'flex', gap:'0.5rem', alignItems:'flex-start',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { name:'username', label:'Username', type:'text', placeholder:'Enter your username', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
            { name:'password', label:'Password', type:'password', placeholder:'••••••••', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> },
          ].map(f => (
            <div key={f.name} style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{f.label}</label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}>{f.icon}</div>
                <input
                  type={f.type} value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder} autoComplete={f.name}
                  style={{
                    width:'100%', paddingLeft:40, paddingRight:14, paddingTop:10, paddingBottom:10,
                    border:'1.5px solid #e2e8f0', borderRadius:12, fontSize:14,
                    background:'#f8fafc', outline:'none', transition:'all 0.2s',
                    fontFamily:'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor='#4f46e5'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 4px rgba(79,70,229,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none' }}
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'0.8rem', marginTop:8,
            background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color:'#fff', borderRadius:12, fontWeight:700, fontSize:14,
            boxShadow:'0 4px 12px rgba(79,70,229,0.35)',
            transition:'all 0.2s', cursor: loading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} />Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
