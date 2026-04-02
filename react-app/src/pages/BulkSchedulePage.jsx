import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bulkScheduleUpload } from '../api/client'

// ── CSV parser (client-side preview only) ─────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1, 6).map(l => {
    const cols = l.split(',').map(c => c.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cols[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

const TEMPLATE_CSV =
  'full_name,pin_moh,interview_date\n' +
  'John Doe,MOH001,2025-06-15\n' +
  'Jane Smith,MOH002,2025-06-15\n' +
  'Alice Mensah,MOH003,2025-06-20\n'

const REQUIRED_COLS = ['full_name', 'pin_moh', 'interview_date']

export default function BulkSchedulePage() {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)   // { headers, rows }
  const [colErrors, setColErrors] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // ── File selection ────────────────────────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f); setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result)
      setPreview(parsed)
      const missing = REQUIRED_COLS.filter(
        c => !parsed.headers.map(h => h.toLowerCase()).includes(c)
      )
      setColErrors(missing)
    }
    reader.readAsText(f)
  }, [])

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!file) { setError('Please select a CSV file.'); return }
    if (colErrors.length > 0) { setError('Fix missing columns before uploading.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const r = await bulkScheduleUpload(file)
      setResult(r.data)
      setFile(null); setPreview(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── Template download ────────────────────────────────────────────────────
  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'bulk_schedule_template.csv'
    a.click()
  }

  const canSubmit = file && colErrors.length === 0 && !loading

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }} className="gradient-text">
            Bulk Schedule Upload
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Upload a CSV to assign applicants their Full Name, MOH/PIN, and Interview Date in one go.
          </p>
        </div>
        <button onClick={() => navigate(-1)} style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5', background: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ← Back
        </button>
      </div>

      {/* ── Format guide ── */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #c7d2fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#4338ca' }}>📋 Required CSV Columns</h3>
          <button onClick={downloadTemplate} style={{
            fontSize: 12, fontWeight: 700, color: '#4338ca',
            background: '#e0e7ff', border: '1px solid #c7d2fe',
            borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Download Template
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.5rem' }}>
          {[
            { col: 'full_name',       req: true,  desc: 'Applicant full name' },
            { col: 'pin_moh',         req: true,  desc: 'MOH / PIN number' },
            { col: 'interview_date',  req: true,  desc: 'Date (any format)' },
            { col: 'program',         req: false, desc: 'Diploma or Certificate' },
            { col: 'phone_number',    req: false, desc: 'Contact number' },
            { col: 'source',          req: false, desc: 'Referral source' },
          ].map(({ col, req, desc }) => (
            <div key={col} style={{ background: '#fff', borderRadius: 8, padding: '0.5rem 0.75rem', border: req ? '1.5px solid #c7d2fe' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: req ? '#4338ca' : '#94a3b8', fontFamily: 'monospace' }}>
                {col} {req && <span style={{ color: '#dc2626' }}>*</span>}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#6366f1', marginTop: 10, fontWeight: 600 }}>
          ✦ Existing applicants (matched by pin_moh) will have their interview date updated. New PINs create new applicant records.
        </p>
      </div>

      {/* ── Drop zone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#4f46e5' : colErrors.length > 0 ? '#f59e0b' : file ? '#6366f1' : '#c7d2fe'}`,
          borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#eef2ff' : file ? '#f8f7ff' : '#fff',
          marginBottom: '1rem', transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,.txt" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
        <div style={{ fontSize: 36, marginBottom: 10 }}>
          {file ? '📊' : '📤'}
        </div>
        {file ? (
          <div>
            <div style={{ fontWeight: 800, color: '#1e1b4b', fontSize: 15, marginBottom: 4 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB · Click to change file</div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 4 }}>Drop your CSV here or click to browse</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Supports .csv files with headers</div>
          </div>
        )}
      </div>

      {/* ── Column validation errors ── */}
      {colErrors.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          ⚠️ Missing required columns: <strong>{colErrors.join(', ')}</strong>. Please fix the CSV and re-upload.
        </div>
      )}

      {/* ── Preview table ── */}
      {preview && preview.rows.length > 0 && colErrors.length === 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Preview <span style={{ color: '#64748b', fontWeight: 500 }}>(first {preview.rows.length} rows)</span></span>
            <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0' }}>✓ Columns OK</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {preview.headers.map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.875rem', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    {preview.headers.map(h => (
                      <td key={h} style={{ padding: '0.6rem 0.875rem', color: '#374151', fontFamily: h === 'pin_moh' ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>
                        {row[h] || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Upload error ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="card animate-fadeIn" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1px solid #bbf7d0' }}>
          <h3 style={{ fontWeight: 800, color: '#166534', marginBottom: '1rem', fontSize: 15 }}>✅ Bulk Schedule Complete</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Inserted',  val: result.inserted, color: '#059669', bg: '#d1fae5' },
              { label: 'Updated',   val: result.updated,  color: '#2563eb', bg: '#dbeafe' },
              { label: 'Skipped',   val: result.skipped,  color: '#d97706', bg: '#fef3c7' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color }}>{val ?? 0}</div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform:'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <details style={{ marginBottom: '0.75rem' }}>
              <summary style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer', padding: '0.5rem 0' }}>
                View {result.errors.length} row error(s)
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 4 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>• {e}</li>
                ))}
              </ul>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/interview-dates" style={{
              flex: 1, padding: '0.6rem', textAlign: 'center',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
            }}>
              View Interview Dates →
            </Link>
            <button onClick={() => setResult(null)} style={{
              padding: '0.6rem 1.25rem', background: '#fff', color: '#374151',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: '1.5px solid #e2e8f0', cursor: 'pointer',
            }}>
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* ── Submit button ── */}
      {!result && (
        <button
          id="bulk-schedule-submit"
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '0.9rem',
            background: canSubmit
              ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
              : '#a5b4fc',
            color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14,
            boxShadow: canSubmit ? '0 4px 14px rgba(79,70,229,0.35)' : 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Processing…</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Upload &amp; Schedule
            </>
          )}
        </button>
      )}
    </div>
  )
}
