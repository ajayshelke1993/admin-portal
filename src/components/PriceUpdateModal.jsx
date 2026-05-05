import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Defined OUTSIDE component to prevent re-render focus loss ─────────
function PriceRow({ label, field, curValue, hint, form, setField }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px 1fr', gap: 8, alignItems: 'center' }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>
        New {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>$</span>
        <input type="number" step="0.01" min="0"
          className="portal-input" style={{ paddingLeft: 24 }}
          value={form[field]}
          onChange={e => setField(field, e.target.value)} />
      </div>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
        {hint || `Current ${label}`}
      </label>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        ${parseFloat(curValue || 0).toFixed(2)}
      </div>
    </div>
  );
}

export default function PriceUpdateModal({ partNo, vendorId, onClose, onSaved, userName }) {
  const [current,      setCurrent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState('');
  const [overrideCost, setOverrideCost] = useState(false);

  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fmt = d => d.toISOString().split('T')[0];

  const [form, setForm] = useState({
    price: '', searchPrice: '', unitedPrice: '',
    reason: '', startDate: fmt(today), endDate: fmt(tomorrow),
  });

  useEffect(() => { loadCurrentPrices(); }, []);

  const loadCurrentPrices = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/prices/current?partNo=${encodeURIComponent(partNo)}&vendorId=${vendorId}`);
      const data = await res.json();
      setCurrent(data);
      const hasMap = data.bmap != null && data.bmap > 0;
      setForm(prev => ({
        ...prev,
        price:       hasMap ? (data.bmap || '') : (data.price        || ''),
        searchPrice: hasMap ? (data.bmap || '') : (data.price_search  || ''),
        unitedPrice: hasMap ? (data.bmap || '') : (data.price_united  || ''),
      }));
    } catch { setMsg('Failed to load current prices'); }
    finally { setLoading(false); }
  };

  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const hasMap   = current?.bmap != null && current?.bmap > 0;

  const handleSave = async () => {
    if (!form.reason || form.reason.length < 4) { setMsg('✗ Reason must be at least 4 characters'); return; }
    if (!form.price)       { setMsg('✗ Price is required'); return; }
    if (!form.searchPrice) { setMsg('✗ Search price is required'); return; }
    if (!form.unitedPrice) { setMsg('✗ United price is required'); return; }
    if (!form.endDate)     { setMsg('✗ End date is required'); return; }
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/prices/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNo, vendorId,
          price:           form.price,
          searchPrice:     form.searchPrice,
          unitedPrice:     form.unitedPrice,
          reason:          form.reason,
          person:          userName || 'admin',
          startDate:       form.startDate,
          endDate:         form.endDate,
          overrideCost,
          bmap:            current?.bmap || 0,
          lastPrice:       current?.price        || 0,
          lastPriceSearch: current?.price_search || 0,
          lastPriceUnited: current?.price_united || 0,
        }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Price updated successfully'); setTimeout(() => { onSaved?.(); onClose(); }, 1000); }
      else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>💲 Update Prices — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading current prices…</div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {hasMap && (
              <div style={{ background: '#fff7ed', border: '1px solid #fb923c', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12 }}>
                <strong>⚠️ MAP Pricing Active</strong>
                <div style={{ marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>Current MAP: <strong>${parseFloat(current.bmap).toFixed(2)}</strong></span>
                  <span>Site Price: <strong>${parseFloat(current.price).toFixed(2)}</strong></span>
                  <span>Search: <strong>${parseFloat(current.price_search).toFixed(2)}</strong></span>
                  <span>United: <strong>${parseFloat(current.price_united).toFixed(2)}</strong></span>
                </div>
                <div style={{ fontSize: 11, color: '#92400e', marginTop: 4, fontWeight: 600 }}>
                  → Clicking Update Price will update the <u>MAP (bmap)</u> value.
                </div>
              </div>
            )}

            <PriceRow label="Price"        field="price"       form={form} setField={setField}
              curValue={hasMap ? current?.bmap : current?.price}
              hint={hasMap ? 'Current MAP' : 'Current Price'} />
            <PriceRow label="Search Price" field="searchPrice" form={form} setField={setField}
              curValue={hasMap ? current?.bmap : current?.price_search}
              hint={hasMap ? 'Current MAP' : 'Current Search'} />
            <PriceRow label="United Price" field="unitedPrice" form={form} setField={setField}
              curValue={hasMap ? current?.bmap : current?.price_united}
              hint={hasMap ? 'Current MAP' : 'Current United'} />

            {current?.cost > 0 && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12 }}>
                Cost: <strong>${parseFloat(current.cost).toFixed(2)}</strong>
                <label style={{ marginLeft: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={overrideCost} onChange={e => setOverrideCost(e.target.checked)} />
                  Override Cost Check
                </label>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Reason <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input type="text" className="portal-input no-icon" value={form.reason}
                onChange={e => setField('reason', e.target.value)}
                placeholder="Reason for price change (min 4 chars)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Start Date</label>
                <input type="date" className="portal-input no-icon" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  End Date <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="date" className="portal-input no-icon" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
              </div>
            </div>

            {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="epm-btn" onClick={onClose}>Cancel</button>
              <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : hasMap ? '✓ Update MAP Price' : '✓ Update Price'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
