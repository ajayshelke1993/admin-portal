import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function AlsoAvailableModal({ partNo, vendorId, onClose, onSaved }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [keyword, setKeyword]   = useState('');
  const [alsoId, setAlsoId]     = useState(null); // null = add mode, number = change mode
  const [vendor, setVendor]     = useState('');

  useEffect(() => { loadCurrent(); }, []);

  const loadCurrent = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/also-available`);
      const data = await res.json();
      if (data.alsoavailable_id) {
        setAlsoId(data.alsoavailable_id);
        setKeyword(data.keyword || '');
      } else {
        setAlsoId(null);
        setVendor(data.vendor || '');
      }
    } catch { setMsg('✗ Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!keyword.trim()) { setMsg('✗ Keyword cannot be blank'); return; }
    if (keyword.length > 15) { setMsg('✗ Keyword must be 15 characters or less'); return; }
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/also-available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), alsoId }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Also Available updated');
        setTimeout(() => { onSaved?.(); onClose(); }, 800);
      } else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🔗 {alsoId ? 'Change' : 'Add'} Also Available — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong>Part:</strong> {partNo}
              {vendor && <> &nbsp;·&nbsp; <strong>Vendor:</strong> {vendor}</>}
              {alsoId && <> &nbsp;·&nbsp; <strong>ID:</strong> {alsoId}</>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Keyword <span style={{ color: 'var(--danger)' }}>*</span>
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>(max 15 chars)</span>
              </label>
              <input
                type="text"
                className="portal-input no-icon"
                maxLength={15}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. printer"
              />
            </div>

            {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="epm-btn" onClick={onClose}>Cancel</button>
              <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : alsoId ? '✓ Change Keyword' : '✓ Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
