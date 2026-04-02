import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/client'

export default function UploadDatesPage() {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  async function submit() {
    if (!file) { setError('Please select a CSV file.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const r = await api.uploadInterviewDates(file)
      setResult(r.data); setFile(null)
    } catch (err) { setError(err.response?.data?.error || 'Upload failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900 }} className="gradient-text">Upload Dates</h1>
          <p style={{ fontSize:13, color:'#64748b' }}>Import CSV to assign interview dates.</p>
        </div>
      </div>

      {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'1rem', borderRadius:12, marginBottom:16 }}>{error}</div>}

      {result ? (
        <div className="card" style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#166534' }}>Upload Complete</h2>
          <p>Updated: {result.updated} | Skipped: {result.skipped}</p>
          <button onClick={()=>navigate('/interview-dates')} className="btn btn-primary" style={{ marginTop:16 }}>View Schedule</button>
        </div>
      ) : (
        <div className="card" style={{ padding:'2rem' }}>
          <div onClick={()=>inputRef.current.click()} style={{ border:'2px dashed var(--color-border)', borderRadius:16, padding:'3rem', textAlign:'center', cursor:'pointer' }}>
            <input ref={inputRef} type="file" hidden onChange={e=>setFile(e.target.files[0])} />
            {file ? <strong>{file.name}</strong> : 'Click to select CSV'}
          </div>
          <button onClick={submit} disabled={!file || loading} className="btn btn-primary" style={{ width:'100%', marginTop:24 }}>
            {loading ? 'Uploading...' : 'Import Dates'}
          </button>
        </div>
      )}
    </div>
  )
}
