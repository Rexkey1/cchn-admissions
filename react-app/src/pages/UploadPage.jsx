import { useState, useRef } from 'react';
import * as api from '../api/client';
import { NavLink } from 'react-router-dom';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a CSV file.');
    setError('');
    setLoading(true);
    try {
      const res = await api.uploadApplicants(file);
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError('Upload failed. Please ensure the CSV format is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }} className="gradient-text">Bulk Import</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>Upload a CSV file containing applicant records.</p>
      </header>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', fontSize: '14px', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>{error}</div>}

      {result ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#166534', marginBottom: '0.5rem' }}>Import Complete</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>{result.inserted}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inserted</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>{result.skipped}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Duplicates</div>
            </div>
          </div>
          <button onClick={() => setResult(null)} className="btn btn-primary">Import More</button>
          <NavLink to="/applicants" style={{ display: 'block', marginTop: '1rem', fontSize: 13, fontWeight: 700, color: '#059669' }}>View Applicants →</NavLink>
        </div>
      ) : (
        <div className="card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: file ? '#f5f3ff' : 'transparent', borderColor: file ? '#4f46e5' : 'var(--color-border)' }} onClick={() => fileInput.current.click()}>
              <input type="file" ref={fileInput} accept=".csv" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              <div style={{ fontSize: 40, marginBottom: '1rem' }}>📄</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{(file.size / 1024).toFixed(2)} KB — Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Click to browse or drop CSV</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Required: name, phone, program, pin, source</div>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', color: '#64748b' }}>📌 CSV Template Guide</h3>
              <code style={{ display: 'block', fontSize: 11, color: '#4f46e5', fontWeight: 700, marginBottom: '0.5rem' }}>full_name, phone_number, program, pin_moh, source</code>
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>The first row must be headers. Valid programs are "Diploma" or "Certificate". Duplicate phone numbers for the same program will be skipped.</p>
            </div>

            <button type="submit" disabled={!file || loading} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> : 'Start Upload'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
