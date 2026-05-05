import React, { useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL;

function ModalShell({ title, onClose, onSave, saving, children }) {
  return (
    <div className="epm-overlay" onClick={onClose}>
      <div className="epm-modal" onClick={e => e.stopPropagation()}>
        <div className="epm-header">
          <span>{title}</span>
          <button className="epm-close" onClick={onClose}>✕</button>
        </div>
        <div className="epm-body">{children}</div>
        <div className="epm-footer">
          <button className="epm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="epm-btn-save" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="epm-row">
      <label className="epm-label">{label}</label>
      <div className="epm-control">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="epm-row epm-row-info">
      <span className="epm-label">{label}</span>
      <span className="epm-value-static">{value}</span>
    </div>
  );
}

// Shared reason input — saves history via autoComplete
function ReasonInput({ value, onChange }) {
  return (
    <input className="epm-input" value={value} onChange={e => onChange(e.target.value)}
      placeholder="Enter reason (min 4 chars)…"
      autoComplete="on" name="edit_reason" />
  );
}

function useSave(url, body, onSuccess, onClose) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { onSuccess(data); onClose(); }
      else setError(data.error || 'Save failed');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };
  return { saving, error, handleSave };
}

export function AvailableModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'y');
  const [qty, setQty]         = useState('');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'available', value: val, reason, end_date: endDate, qty, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Update Availability" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Availability">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes — Available</option>
          <option value="n">No — Not Available</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: Yes</small>
      </FieldRow>
      <FieldRow label="Qty">
        <input className="epm-input" type="number" min="0" value={qty}
          onChange={e => setQty(e.target.value)} placeholder="0" autoComplete="off" />
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Set to 0 if not available</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function CallForPriceModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'n');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'callforprice', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Call For Price" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Call For Price">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes</option>
          <option value="n">No</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: No</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function DisplayBuyModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'y');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'displaybuy', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Display Buy Button" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Display Buy Button">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes — show buy button</option>
          <option value="n">No — hide buy button</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: Yes</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function DisplayPublicModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'y');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'displaypublic', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Display Public" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Display Public">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes — visible on site</option>
          <option value="n">No — hidden from site</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: Yes</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function DisplayRealtimeModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'y');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'displayrealtime', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Display Realtime Stock" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Display Realtime Stock">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes</option>
          <option value="n">No</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: Yes</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      <div style={{ padding:'8px 0', fontSize:12, color:'#f59e0b' }}>
        ⚠️ If changing to No, also disable Realtime to prevent disti data from overriding.
      </div>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function ShowPriceCartModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'n');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'displaycartonlyprice', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Display Cart Only Price" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Display Cart Only Price">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes</option>
          <option value="n">No</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: No</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function AvailableInhouseModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'n');
  const [qty, setQty]         = useState('');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'csavailable', value: val, reason, end_date: endDate, qty, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Compsource (Cleveland) Available" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Compsource Available">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes</option>
          <option value="n">No</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: No</small>
      </FieldRow>
      <FieldRow label="Qty">
        <input className="epm-input" type="number" min="0" value={qty}
          onChange={e => setQty(e.target.value)} placeholder="0" autoComplete="off" />
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function VendorDropModal({ partNo, vendorid, currentVal, availId, onClose, onSaved }) {
  const [val, setVal]         = useState(currentVal ?? 'n');
  const [reason, setReason]   = useState('');
  const [endDate, setEndDate] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-field`,
    { field: 'dropship', value: val, reason, end_date: endDate, id: availId ?? 0 },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Manufacturer Drop Shipping" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Manufacturer Drop Shipping">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="y">Yes</option>
          <option value="n">No</option>
        </select>
        <small style={{ color:'var(--text-muted)', fontSize:11 }}>Default: No</small>
      </FieldRow>
      <FieldRow label="Reason (required)"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      <FieldRow label="End Date"><input className="epm-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} autoComplete="off" /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function WeightModal({ partNo, vendorid, currentVal, onClose, onSaved }) {
  const [val, setVal]       = useState(currentVal ?? '');
  const [reason, setReason] = useState('');
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-weight`,
    { weight: val, reason },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Update Weight" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Weight (lbs)">
        <input className="epm-input" type="number" step="0.01" min="0"
          value={val} onChange={e => setVal(e.target.value)} placeholder="0.00" autoComplete="off" />
      </FieldRow>
      <FieldRow label="Reason"><ReasonInput value={reason} onChange={setReason} /></FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}

export function AllowReturnsModal({ partNo, vendorid, currentVal, onClose, onSaved }) {
  const [val, setVal] = useState(String(currentVal ?? '1'));
  const { saving, error, handleSave } = useSave(
    `${BASE_URL}/api/parts/${vendorid}/${partNo}/update-returns`,
    { allow_returns: val },
    () => onSaved(val), onClose
  );
  return (
    <ModalShell title="Allow Returns" onClose={onClose} onSave={handleSave} saving={saving}>
      <InfoRow label="Part Number" value={partNo} />
      <InfoRow label="Vendor" value={vendorid} />
      <FieldRow label="Allow Returns">
        <select className="epm-select" value={val} onChange={e => setVal(e.target.value)}>
          <option value="1">Returns Allowed</option>
          <option value="0">No Returns</option>
          <option value="2">Exchange Only</option>
          <option value="3">Deal Direct with Manufacturer</option>
        </select>
      </FieldRow>
      {error && <div className="epm-error">{error}</div>}
    </ModalShell>
  );
}
