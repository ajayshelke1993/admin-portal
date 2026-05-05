import { useState } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function ConditionModal({ partNo, vendorId, current, onClose, onSaved }) {
  const [val,    setVal]    = useState(current);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/condition`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: val }),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>Update Condition — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <select className="portal-input no-icon" value={val} onChange={e => setVal(e.target.value)}>
            <option value="1">New</option>
            <option value="0">Refurbished</option>
          </select>
          {msg && <div className="ba-msg err">{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ Update'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
