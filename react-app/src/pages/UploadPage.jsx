import { useState, useRef } from 'react'
import { uploadCSV } from '../api/client'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function submit() {
    if (!file) { setError('Please select a CSV file.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const r = await uploadCSV(file)
      setResult(r.data); setFile(null)
    } catch(err) {
      setError(err.response?.data?.error || 'Upload failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth:600, margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px' }} className="gradient-text">Upload Applicants</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Import applicants in bulk from a CSV file.</p>
      </div>

      {/* Format guide */}
      <div className="card" style={{ padding:'1.25rem', marginBottom:'1.25rem', background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:'#166534', marginBottom:6 }}>📋 Expected CSV Columns</h3>
        <code style={{ fontSize:12, color:'#15803d', letterSpacing:0 }}>full_name, program, phone_number, pin_moh (opt.), source (opt.)</code>
        <p style={{ fontSize:12, color:'#4ade80', marginTop:4, color:'#166534' }}>Program values: <strong>Diploma</strong> or <strong>Certificate</strong></p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border:`2px dashed ${dragging ? '#4f46e5' : '#c7d2fe'}`,
          borderRadius:16, padding:'3rem 2rem', textAlign:'center', cursor:'pointer',
          background: dragging ? '#eef2ff' : '#fff', marginBottom:'1.25rem',
          transition:'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,.txt" onChange={e => setFile(e.target.files[0])} style={{ display:'none' }} />
        <div style={{ fontSize:40, marginBottom:12 }}>📤</div>
        {file ? (
          <div>
            <div style={{ fontWeight:700, color:'#0f172a', fontSize:15, marginBottom:4 }}>{file.name}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{(file.size / 1024).toFixed(1)} KB — Click to change</div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight:700, color:'#374151', fontSize:14, marginBottom:4 }}>Drop CSV here or click to browse</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>Supports .csv and .txt files</div>
          </div>
        )}
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:13, color:'#dc2626', fontWeight:600 }}>{error}</div>}

      {result && (
        <div className="card animate-fadeIn" style={{ padding:'1.25rem', marginBottom:'1.25rem', background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
          <h3 style={{ fontWeight:800, color:'#166534', marginBottom:'0.75rem', fontSize:15 }}>✅ Import Complete</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div style={{ background:'#fff', borderRadius:10, padding:'0.75rem', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#059669' }}>{result.inserted}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Inserted</div>
            </div>
            <div style={{ background:'#fff', borderRadius:10, padding:'0.75rem', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#d97706' }}>{result.skipped}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Skipped</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop:'0.75rem' }}>
              <details><summary style={{ fontSize:12, fontWeight:600, color:'#dc2626', cursor:'pointer' }}>View {result.errors.length} row error(s)</summary>
                <ul style={{ marginTop:6 }}>{result.errors.map((e,i) => <li key={i} style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>• {e}</li>)}</ul>
              </details>
            </div>
          )}
        </div>
      )}

      <button onClick={submit} disabled={loading || !file} style={{
        width:'100%', padding:'0.875rem',
        background: (loading||!file) ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
        color:'#fff', borderRadius:12, fontWeight:700, fontSize:14,
        boxShadow: (loading||!file) ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
        cursor: (loading||!file) ? 'not-allowed' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
        {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} />Importing…</> : 'Import Applicants'}
      </button>
    </div>
  )
}
