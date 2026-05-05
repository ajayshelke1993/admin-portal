import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

const RESTRICTIONS = [
  { value: '0', label: 'Cash Back by Mail!' },
  { value: '2', label: 'Additional Purchase Required' },
  { value: '1', label: 'Miscellaneous Rebate' },
  { value: '3', label: 'Instant Rebate' },
];

export default function RebateModal({ partNo, vendorId, onClose, onSaved }) {
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [existing, setExisting] = useState(null);
  const [loading, setLoading]   = useState(true);

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 30);
  const fmt = d => d.toISOString().split('T')[0];

  const [form, setForm] = useState({
    partNo2: '', partNo3: '', partNo4: '',
    offerText: '', restrictions: '0', rebateAmount: '',
    endDate: fmt(tomorrow), company: 'COM',
  });

  useEffect(() => { checkExisting(); }, []);

  const checkExisting = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/rebate/check?partNo=${encodeURIComponent(partNo)}&vendorId=${vendorId}`);
      const data = await res.json();
      setExisting(data.existing || null);
    } catch {}
    finally { setLoading(false); }
  };

  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const isInstant = form.restrictions === '3';

  const handleSave = async () => {
    if (!form.offerText)    { setMsg('✗ Offer text is required'); return; }
    if (!form.endDate)      { setMsg('✗ End date is required'); return; }
    if (!form.rebateAmount && !isInstant) { setMsg('✗ Rebate amount is required'); return; }

    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/rebate/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNo, partNo2: form.partNo2, partNo3: form.partNo3, partNo4: form.partNo4,
          vendorId, offerText: form.offerText, restrictions: form.restrictions,
          rebateAmount: isInstant ? 0 : form.rebateAmount,
          endDate: form.endDate, company: form.company,
          isInstant,
        }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Rebate added successfully'); setTimeout(() => { onSaved?.(); onClose(); }, 1000); }
      else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🎁 Add Rebate — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Checking existing rebates…</div>
        ) : existing ? (
          <div className="ep-modal-body">
            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: 13 }}>
              <strong>⚠️ This part already has a rebate:</strong>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <div>Offer: {existing.link_label}</div>
                <div>Amount: ${existing.rebate_amount}</div>
                <div>Expires: {existing.end_date}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="epm-btn" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Part # 1 (primary)', field: 'partNo1', value: partNo, readOnly: true },
                { label: 'Part # 2 (optional)', field: 'partNo2', value: form.partNo2 },
                { label: 'Part # 3 (optional)', field: 'partNo3', value: form.partNo3 },
                { label: 'Part # 4 (optional)', field: 'partNo4', value: form.partNo4 },
              ].map(row => (
                <div key={row.field}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{row.label}</label>
                  <input type="text" className="portal-input no-icon"
                    value={row.value} readOnly={row.readOnly}
                    style={row.readOnly ? { background: 'var(--bg-base)', opacity: 0.7 } : {}}
                    onChange={e => !row.readOnly && setField(row.field, e.target.value)} />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Offer Text <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" className="portal-input no-icon" value={form.offerText}
                onChange={e => setField('offerText', e.target.value)} placeholder="e.g. $50 Cash Back by Mail" maxLength={125} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Restrictions</label>
                <select className="portal-input no-icon" value={form.restrictions} onChange={e => setField('restrictions', e.target.value)}>
                  {RESTRICTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Rebate Amount {!isInstant && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                  <input type="number" step="0.01" min="0" className="portal-input no-icon" style={{ paddingLeft: 24 }}
                    value={form.rebateAmount} disabled={isInstant}
                    onChange={e => setField('rebateAmount', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="date" className="portal-input no-icon" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Company</label>
                <select className="portal-input no-icon" value={form.company} onChange={e => setField('company', e.target.value)}>
                  <option value="COM">COM</option>
                  <option value="COMUOP">COM/UOP</option>
                </select>
              </div>
            </div>

            {isInstant && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--accent)' }}>
                ℹ️ Instant Rebate — amount will be set to $0, price is adjusted directly
              </div>
            )}

            {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="epm-btn" onClick={onClose}>Cancel</button>
              <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isInstant ? '✓ Add Instant Rebate' : '✓ Add Rebate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
