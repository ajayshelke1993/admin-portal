import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

const vpnRemove = (str) =>
  (str || '').replace(/[/.#+=*()'"<>;| -]/g, '').toUpperCase();

// ── Tab: Product Upsell ───────────────────────────────────────────────
function ProductUpsellTab({ partNo, vendorId, onSaved }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [majorId,  setMajorId]  = useState(null);
  const [minors,   setMinors]   = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [selected, setSelected] = useState([]);
  const [msg,      setMsg]      = useState('');
  const [errors,   setErrors]   = useState([]);
  const [rows,     setRows]     = useState(
    Array.from({ length: 5 }, () => ({ part: '', vendorid: '' }))
  );

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    try {
      const [majRes, venRes] = await Promise.all([
        fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/upsell/init`),
        fetch(`${BASE_URL}/api/parts/vendors-list`),
      ]);
      const majData = await majRes.json();
      const venData = await venRes.json();
      setMajorId(majData.major_id);
      setMinors(majData.minors || []);
      setVendors(venData || []);
    } catch { setMsg('✗ Failed to load'); }
    finally { setLoading(false); }
  };

  const reload = async () => {
    const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/upsell/init`);
    const data = await res.json();
    setMajorId(data.major_id); setMinors(data.minors || []);
  };

  const handleSave = async () => {
    const toAdd = rows.filter(r => r.part.trim());
    if (!toAdd.length) { setMsg('✗ Enter at least one part number'); return; }
    setSaving(true); setMsg(''); setErrors([]);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorId, rows: toAdd.map(r => ({ part: vpnRemove(r.part), vendorid: r.vendorid })) }),
      });
      const data = await res.json();
      if (data.errors?.length) { setErrors(data.errors); setMsg(`✗ ${data.errors.length} part(s) not found`); }
      else setMsg('✓ Saved');
      if (data.added > 0) { await reload(); onSaved?.(); setRows(Array.from({ length: 5 }, () => ({ part: '', vendorid: '' }))); }
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected part(s)?`)) return;
    setDeleting(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/upsell`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      const data = await res.json();
      if (data.success) { setSelected([]); setMsg(`✓ Deleted`); await reload(); onSaved?.(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const setRow = (i, field, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const maxRows = Math.max(0, 14 - minors.length);

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {minors.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Current Parts ({minors.length})</span>
            {selected.length > 0 && (
              <button className="epm-btn" style={{ fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={handleDelete} disabled={deleting}>
                {deleting ? '…' : `🗑 Delete (${selected.length})`}
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
              <th style={thS}>✓</th><th style={thS}>Part Number</th><th style={thS}>Vendor</th><th style={thS}>Status</th>
            </tr></thead>
            <tbody>
              {minors.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
                  <td style={tdS}><input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                  <td style={{ ...tdS, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {(m.displaypublic === false || m.displaypublic === null)
                      ? <span style={{ color: '#dc2626' }}>{m.minor_part}</span>
                      : <a href={`https://www.compsource.com/parts/part_details.asp?part_no=${m.minor_part}&vid=${m.vendorid}`} target="_blank" rel="noreferrer" className="ep-link-blue">{m.minor_part}</a>}
                  </td>
                  <td style={{ ...tdS, fontSize: 11, color: 'var(--text-muted)' }}>{m.vendor}</td>
                  <td style={tdS}>
                    {(m.displaypublic === false || m.displaypublic === null)
                      ? <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>NOT DISPLAYED</span>
                      : <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>✓ Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {minors.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No upsell parts yet</div>}

      {maxRows > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Add Parts <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(max 14 total)</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
              <th style={thS}>#</th><th style={thS}>Part Number</th><th style={thS}>Vendor</th>
            </tr></thead>
            <tbody>
              {rows.slice(0, maxRows).map((row, i) => {
                const hasErr = errors.find(e => e.part === vpnRemove(row.part));
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: hasErr ? '#fff5f5' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
                    <td style={{ ...tdS, color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={tdS}>
                      <input type="text" className="portal-input no-icon"
                        style={{ background: hasErr ? '#fee2e2' : undefined }}
                        value={row.part} maxLength={25}
                        onChange={e => setRow(i, 'part', e.target.value)} placeholder="Part number" />
                      {hasErr && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Not a valid part</div>}
                    </td>
                    <td style={tdS}>
                      <select className="portal-input no-icon" value={row.vendorid} onChange={e => setRow(i, 'vendorid', e.target.value)}>
                        <option value="">Select vendor</option>
                        {vendors.map(v => <option key={v.vendorid} value={v.vendorid}>{v.vendor}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
      {maxRows > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '✓ Add This Product'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Category Upsell ──────────────────────────────────────────────
function CategoryUpsellTab({ onSaved }) {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [catParts,   setCatParts]   = useState([]);
  const [vendors,    setVendors]    = useState([]);
  const [selected,   setSelected]   = useState([]);
  const [rows,       setRows]       = useState(
    Array.from({ length: 5 }, () => ({ part: '', vendorid: '' }))
  );
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg,      setMsg]      = useState('');
  const [errors,   setErrors]   = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/api/upsell/categories`).then(r => r.json()),
      fetch(`${BASE_URL}/api/parts/vendors-list`).then(r => r.json()),
    ]).then(([cats, vens]) => { setCategories(cats || []); setVendors(vens || []); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCat) { setCatParts([]); return; }
    setLoadingParts(true);
    fetch(`${BASE_URL}/api/upsell/category-parts?catId=${selectedCat}`)
      .then(r => r.json()).then(setCatParts).catch(() => {})
      .finally(() => setLoadingParts(false));
  }, [selectedCat]);

  const handleSave = async () => {
    if (!selectedCat) { setMsg('✗ Select a category first'); return; }
    const toAdd = rows.filter(r => r.part.trim());
    if (!toAdd.length) { setMsg('✗ Enter at least one part number'); return; }
    setSaving(true); setMsg(''); setErrors([]);
    try {
      const res  = await fetch(`${BASE_URL}/api/upsell/category-parts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catId: selectedCat, rows: toAdd.map(r => ({ part: vpnRemove(r.part), vendorid: r.vendorid })) }),
      });
      const data = await res.json();
      if (data.errors?.length) { setErrors(data.errors); setMsg(`✗ ${data.errors.length} part(s) not found`); }
      else { setMsg('✓ Saved'); setRows(Array.from({ length: 5 }, () => ({ part: '', vendorid: '' }))); }
      if (data.added > 0) { reloadCatParts(); onSaved?.(); }
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected part(s)?`)) return;
    setDeleting(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/upsell/category-parts`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      const data = await res.json();
      if (data.success) { setSelected([]); setMsg('✓ Deleted'); reloadCatParts(); onSaved?.(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const reloadCatParts = async () => {
    if (!selectedCat) return;
    const res  = await fetch(`${BASE_URL}/api/upsell/category-parts?catId=${selectedCat}`);
    setCatParts(await res.json() || []);
  };

  const setRow = (i, field, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const maxRows = Math.max(0, 14 - catParts.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Category selector */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          Select Category
        </label>
        <select className="portal-input no-icon" style={{ width: '100%' }}
          value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setSelected([]); setMsg(''); setErrors([]); }}>
          <option value="">— Select a category —</option>
          {categories.map(c => <option key={c.etilize_cat} value={c.etilize_cat}>{c.catname}</option>)}
        </select>
      </div>

      {selectedCat && (
        <>
          {loadingParts ? (
            <div style={{ textAlign: 'center', padding: 16 }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <>
              {catParts.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Current Parts ({catParts.length})</span>
                    {selected.length > 0 && (
                      <button className="epm-btn" style={{ fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={handleDelete} disabled={deleting}>
                        {deleting ? '…' : `🗑 Delete (${selected.length})`}
                      </button>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
                      <th style={thS}>✓</th><th style={thS}>Part Number</th><th style={thS}>Vendor</th><th style={thS}>Status</th>
                    </tr></thead>
                    <tbody>
                      {catParts.map((p, i) => (
                        <tr key={p.cat_id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
                          <td style={tdS}><input type="checkbox" checked={selected.includes(p.cat_id)} onChange={() => toggleSelect(p.cat_id)} /></td>
                          <td style={{ ...tdS, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {(p.displaypublic === false || p.displaypublic === null)
                              ? <span style={{ color: '#dc2626' }}>{p.part_no}</span>
                              : <a href={`https://www.compsource.com/parts/part_details.asp?part_no=${p.part_no}&vid=${p.vendorid}`} target="_blank" rel="noreferrer" className="ep-link-blue">{p.part_no}</a>}
                          </td>
                          <td style={{ ...tdS, fontSize: 11, color: 'var(--text-muted)' }}>{p.vendor}</td>
                          <td style={tdS}>
                            {(p.displaypublic === false || p.displaypublic === null)
                              ? <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>NOT DISPLAYED</span>
                              : <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>✓ Active</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {catParts.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No parts for this category yet</div>}

              {maxRows > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Add Parts</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
                      <th style={thS}>#</th><th style={thS}>Part Number</th><th style={thS}>Vendor</th>
                    </tr></thead>
                    <tbody>
                      {rows.slice(0, maxRows).map((row, i) => {
                        const hasErr = errors.find(e => e.part === vpnRemove(row.part));
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: hasErr ? '#fff5f5' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
                            <td style={{ ...tdS, color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                            <td style={tdS}>
                              <input type="text" className="portal-input no-icon"
                                style={{ background: hasErr ? '#fee2e2' : undefined }}
                                value={row.part} maxLength={25}
                                onChange={e => setRow(i, 'part', e.target.value)} placeholder="Part number" />
                              {hasErr && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Not a valid part</div>}
                            </td>
                            <td style={tdS}>
                              <select className="portal-input no-icon" value={row.vendorid} onChange={e => setRow(i, 'vendorid', e.target.value)}>
                                <option value="">Select vendor</option>
                                {vendors.map(v => <option key={v.vendorid} value={v.vendorid}>{v.vendor}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
      {selectedCat && maxRows > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '✓ Add These Products'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export default function OptionsAccessoriesModal({ partNo, vendorId, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState('product');

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 700, width: '95vw' }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🔧 Options &amp; Accessories — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
            {[
              { key: 'product',  label: '📦 Product Upsell' },
              { key: 'category', label: '📂 Category Upsell' },
            ].map(t => (
              <button key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  marginBottom: -2,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'product'  && <ProductUpsellTab  partNo={partNo} vendorId={vendorId} onSaved={onSaved} />}
          {activeTab === 'category' && <CategoryUpsellTab onSaved={onSaved} />}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="epm-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const thS = { padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' };
const tdS = { padding: '7px 10px', verticalAlign: 'middle' };
