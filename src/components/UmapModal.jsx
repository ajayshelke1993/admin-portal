import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function UmapModal({ partNo, vendorId, onClose, onSaved, userName }) {
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [existing, setExisting] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [umapPrice, setUmapPrice] = useState('');
  const [reason, setReason]       = useState('');

  useEffect(() => { checkExisting(); }, []);

  const checkExisting = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/umap/check?partNo=${encodeURIComponent(partNo)}&vendorId=${vendorId}`);
      const data = await res.json();
      setExisting(data.existing || null);
      if (data.existing) setUmapPrice(data.existing.umap_price || '');
    } catch {}
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!umapPrice)               { setMsg('✗ UMAP price is required'); return; }
    if (!reason || reason.length < 4) { setMsg('✗ Reason must be at least 4 characters'); return; }

    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/umap/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNo, vendorId, umapPrice, reason,
          person: userName || 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ UMAP price set successfully'); setTimeout(() => { onSaved?.(); onClose(); }, 1000); }
      else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🔒 {existing ? 'Update' : 'Add'} UMAP — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {existing && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12 }}>
                <strong>⚠️ Existing UMAP:</strong> ${existing.umap_price} — set by {existing.person} on {new Date(existing.date_time).toLocaleDateString()}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                UMAP Price <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" min="0" className="portal-input no-icon"
                  style={{ paddingLeft: 24 }} value={umapPrice}
                  onChange={e => setUmapPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Reason <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="text" className="portal-input no-icon" value={reason}
                onChange={e => setReason(e.target.value)} placeholder="Reason for UMAP (min 4 chars)" />
            </div>

            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
              ℹ️ Setting UMAP will update price, search price, and united price to the UMAP value on both markedup_items and tblProducts.
            </div>

            {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="epm-btn" onClick={onClose}>Cancel</button>
              <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : existing ? '✓ Update UMAP' : '✓ Set UMAP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
