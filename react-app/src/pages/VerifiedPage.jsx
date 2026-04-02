import { useEffect, useState, useCallback, useRef } from 'react';
import * as api from '../api/client';

export default function VerifiedPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [prog, setProg] = useState('');
  const [page, setPage] = useState(1);
  const debounce = useRef(null);

  const fetch = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.getVerified({ q, program: prog, page: pg });
      setRows(res.data.rows);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [q, prog]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      fetch(1);
    }, 400);
  }, [q, prog]);

  useEffect(() => { fetch(page); }, [page]);

  const handleExport = () => {
    const url = api.getExportUrl('verified', prog);
    window.open(url, '_blank');
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }} className="gradient-text">Verified Applicants</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>Total {pagination.total.toLocaleString()} verified.</p>
        </div>
        <button onClick={handleExport} className="btn btn-primary" style={{ fontSize: 13, fontWeight: 700 }}>📥 Export CSV</button>
      </div>

      <div className="card" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search verified..." style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', outline: 'none', background: '#f8fafc', fontSize: '13px', fontWeight: 500 }} />
        </div>
        <select value={prog} onChange={e => setProg(e.target.value)} style={{ flex: 1, minWidth: '130px', padding: '0.625rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', fontSize: '13px', fontWeight: 600, background: '#f8fafc', outline: 'none' }}>
          <option value="">All Programs</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Applicant</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Program</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PIN</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Interview Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8' }}>{(page - 1) * 25 + i + 1}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#0f172a' }}>{r.full_name}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: r.program === 'Diploma' ? '#4f46e5' : '#7c3aed' }}>{r.program}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#475569', fontFamily: 'monospace' }}>{r.pin_moh || ''}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#059669', fontWeight: 700 }}>{r.interview_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Page {pagination.page} of {pagination.pages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '11px' }}>Previous</button>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '11px' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
