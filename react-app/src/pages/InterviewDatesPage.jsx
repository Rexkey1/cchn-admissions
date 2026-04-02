import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api/client'

export default function InterviewDatesPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [prog, setProg] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [detailRows, setDetailRows] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const navigate = useNavigate()

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.getInterviewDates({ program: prog })
      setGroups(r.data.groups)
    } finally { setLoading(false) }
  }, [prog])

  const fetchDetail = useCallback(async (date) => {
    setDetailLoading(true)
    try {
      const r = await api.getInterviewDateDetail({ date, program: prog })
      setDetailRows(r.data.rows)
    } finally { setDetailLoading(false) }
  }, [prog])

  useEffect(() => { fetchSummary() }, [prog])

  function selectDate(d) { setSelectedDate(d); fetchDetail(d) }

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }} className="gradient-text">Interview Scheduling</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>Manage and view applicants grouped by their interview dates.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/upload-dates" className="btn btn-outline" style={{ fontSize: 13, fontWeight: 700 }}>Upload CSV</Link>
          <Link to="/bulk-schedule" className="btn btn-primary" style={{ fontSize: 13, fontWeight: 700 }}>+ Bulk Schedule</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 1.5fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Summary List */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800 }}>Schedule Overview</h2>
            <select value={prog} onChange={e => setProg(e.target.value)} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600 }}>
              <option value="">All Programs</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>
          </div>
          {loading && <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>}
          {!loading && groups.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No dates scheduled.</div>}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {groups.map(g => (
              <button key={g.interview_date} onClick={() => selectDate(g.interview_date)} style={{ width: '100%', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderBottom: '1px solid #f1f5f9', background: selectedDate === g.interview_date ? '#f5f3ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: selectedDate === g.interview_date ? '#4f46e5' : '#1e293b' }}>{new Date(g.interview_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>D: {g.diploma}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>C: {g.certificate}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{g.total}</div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedDate === g.interview_date ? '#4f46e5' : '#e2e8f0' }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDate && (
          <div className="card animate-fadeIn" style={{ padding: 0, position: 'relative' }}>
            {detailLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', zIndex: 5, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Date Detail</div>
                <h3 style={{ fontSize: 16, fontWeight: 900 }}>{new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h3>
              </div>
              <button onClick={() => setSelectedDate(null)} style={{ padding: '4px 10px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 800, color: '#94a3b8' }}>Applicant</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 800, color: '#94a3b8' }}>Prog</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 800, color: '#94a3b8' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ fontWeight: 700 }}>{r.full_name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.phone_number}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{r.program.charAt(0)}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>{r.is_verified == 1 ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
