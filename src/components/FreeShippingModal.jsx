import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function FreeShippingModal({ partNo, vendorId, userName, onClose, onSaved }) {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [existing, setExisting]     = useState(null); // existing free_ship record
  const [freeId, setFreeId]         = useState(null); // free_id for modify mode

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 30);
  const fmt = d => d.toISOString().split('T')[0];

  const [form, setForm] = useState({
    free: '0', freeSearch: '0', reason: '', endDate: fmt(tomorrow),
  });
  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shipRes, existRes] = await Promise.all([
        fetch(`${BASE_URL}/api/shipping/options`),
        fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/free-shipping`),
      ]);
      const shipData  = await shipRes.json();
      const existData = await existRes.json();
      setShippingOptions(shipData || []);

      if (existData.free_id) {
        setFreeId(existData.free_id);
        setExisting(existData);
        setForm({
          free:       String(existData.free_ship  || '0'),
          freeSearch: String(existData.freeshipping2 || '0'),
          reason:     existData.reason_text || '',
          endDate:    existData.end_date ? existData.end_date.split('T')[0] : fmt(tomorrow),
        });
      }
    } catch (err) { setMsg('✗ Failed to load: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.reason || form.reason.length < 4) { setMsg('✗ Reason must be at least 4 characters'); return; }
    if (!form.endDate) { setMsg('✗ End date is required'); return; }
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/free-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          free:       form.free,
          freeSearch: form.freeSearch,
          reason:     form.reason,
          endDate:    form.endDate,
          freeId:     freeId || null,
          person:     userName || 'admin',
          choice:     freeId ? 1 : 2, // 1=modify, 2=add
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Shipping updated');
        setTimeout(() => { onSaved?.(); onClose(); }, 800);
      } else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!freeId) return;
    if (!window.confirm('Remove free shipping override for this part?')) return;
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/free-shipping/${freeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Free shipping removed');
        setTimeout(() => { onSaved?.(); onClose(); }, 800);
      } else setMsg('✗ ' + (data.error || 'Delete failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const ShipSelect = ({ label, field }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
        {label} <span style={{ color: 'var(--danger)' }}>*</span>
      </label>
      <select className="portal-input no-icon" style={{ width: '100%' }}
        value={form[field]} onChange={e => setField(field, e.target.value)}>
        <option value="0">NOT FREE</option>
        {shippingOptions.map(s => (
          <option key={s.shipping_id} value={s.shipping_id}>
            {s.ship_method} — {s.shipping_id === 1 || s.shipping_id === 12 ? 'FREE' : `$${parseFloat(s.ship_price).toFixed(2)}`}
          </option>
        ))}
      </select>
    </div>
  );

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🚚 {freeId ? 'Modify' : 'Add'} Free Shipping — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="od-spinner" style={{ margin: '0 auto 12px' }} />Loading…
          </div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Existing record info */}
            {existing && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>Existing override</strong> — set by {existing.person} · expires {existing.end_date?.split('T')[0]}
                </span>
                <button className="epm-btn" style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={handleDelete} disabled={saving}>
                  🗑 Remove
                </button>
              </div>
            )}

            <ShipSelect label="Free Shipping"        field="free" />
            <ShipSelect label="Search Free Shipping" field="freeSearch" />

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Reason <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="text" className="portal-input no-icon" maxLength={150}
                value={form.reason} onChange={e => setField('reason', e.target.value)}
                placeholder="Reason for change (min 4 chars)" />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                End Date <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="date" className="portal-input no-icon"
                value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
            </div>

            {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="epm-btn" onClick={onClose}>Cancel</button>
              <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : freeId ? '✓ Modify this Part' : '✓ Add this Part'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
