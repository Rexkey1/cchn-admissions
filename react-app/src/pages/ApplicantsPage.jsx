import { useEffect, useState, useCallback, useRef } from 'react';
import * as api from '../api/client';
import { NavLink, Link } from 'react-router-dom';

const PROG_BADGE = {
  Diploma: { bg: '#eef2ff', color: '#4f46e5' },
  Certificate: { bg: '#fdf4ff', color: '#a855f7' },
};

export default function ApplicantsPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [prog, setProg] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const debounce = useRef(null);

  const fetch = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.getApplicants({ q, program: prog, page: pg });
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

  useEffect(() => {
    fetch(page);
  }, [page]);

  const toggleSelect = (id) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.length === rows.length ? [] : rows.map(r => r.id));
  };

  const handleBulk = async (action) => {
    if (!selectedIds.length) return;
    setIsBulkLoading(true);
    try {
      await api.bulkAction(selectedIds, action);
      setSelectedIds([]);
      fetch(page);
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }} className="gradient-text">Applicant Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>Total {pagination.total.toLocaleString()} records found.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/upload" className="btn btn-outline" style={{ fontSize: 13, fontWeight: 700 }}>Import CSV</Link>
          <Link to="/applicants/add" className="btn btn-primary" style={{ fontSize: 13, fontWeight: 700 }}>+ Add Applicant</Link>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="card" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name, PIN, or phone..."
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', outline: 'none', background: '#f8fafc', fontSize: '13px', fontWeight: 500 }}
            />
          </div>
          <select
            value={prog}
            onChange={e => setProg(e.target.value)}
            style={{ flex: 1, minWidth: '130px', padding: '0.625rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', fontSize: '13px', fontWeight: 600, background: '#f8fafc', outline: 'none' }}
          >
            <option value="">All Programs</option>
            <option value="Diploma">Diploma</option>
            <option value="Certificate">Certificate</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.5rem 0.75rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #dbeafe', animation: 'fadeIn 0.2s ease-out' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>{selectedIds.length} Selected</span>
            <div style={{ height: '16px', width: '1px', background: '#bfdbfe' }} />
            <button disabled={isBulkLoading} onClick={() => handleBulk('shortlist')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>📌 Shortlist</button>
            <button disabled={isBulkLoading} onClick={() => handleBulk('verify')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✅ Verify</button>
            <button disabled={isBulkLoading} onClick={() => handleBulk('pay')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>💳 Pay</button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem', width: '40px' }}><input type="checkbox" checked={selectedIds.length === rows.length && rows.length > 0} onChange={selectAll} /></th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicant</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Program</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIN/MOH</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem' }}><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{r.phone_number}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {PROG_BADGE[r.program] && (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: PROG_BADGE[r.program].bg, color: PROG_BADGE[r.program].color }}>{r.program}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontFamily: 'monospace' }}>{r.pin_moh || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {r.is_shortlisted == 1 && <span title="Shortlisted" style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />}
                      {r.is_verified == 1 && <span title="Verified" style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />}
                      {r.is_paid == 1 && <span title="Paid" style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />}
                      {r.is_shortlisted == 0 && r.is_verified == 0 && r.is_paid == 0 && <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}>New</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link to={`/applicants/${r.id}/edit`} style={{ padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}>Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
