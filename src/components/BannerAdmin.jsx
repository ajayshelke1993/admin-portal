import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './styles/globals.css';

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Modify Banner Modal ───────────────────────────────────────────────
function ModifyBannerModal({ banner, onClose, onSaved }) {
  const [form, setForm] = useState({
    description:  banner.description  || '',
    url:          banner.url          || '',
    targetWindow: banner.target_window ? '1' : '0',
    active:       (banner.active      || 'N').toUpperCase(),
    activeExtra:  (banner.active_extra|| 'N').toUpperCase(),
    company:      banner.company      || 'COM',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const setF = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/banners/${banner.banner_id}/modify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Saved'); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>✏️ Modify Banner #{banner.banner_id}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbS}>Description</label>
            <input type="text" className="portal-input no-icon" maxLength={50}
              value={form.description} onChange={e => setF('description', e.target.value)} />
          </div>
          <div>
            <label style={lbS}>URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave blank if no URL — include http:// for external links)</span></label>
            <input type="text" className="portal-input no-icon" maxLength={300}
              value={form.url} onChange={e => setF('url', e.target.value)} placeholder="https://…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbS}>Target Window</label>
              <select className="portal-input no-icon" value={form.targetWindow} onChange={e => setF('targetWindow', e.target.value)}>
                <option value="0">Same Window</option>
                <option value="1">New Window</option>
              </select>
            </div>
            <div>
              <label style={lbS}>Whole Site Active</label>
              <select className="portal-input no-icon" value={form.active} onChange={e => setF('active', e.target.value)}>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            <div>
              <label style={lbS}>Active Specific</label>
              <select className="portal-input no-icon" value={form.activeExtra} onChange={e => setF('activeExtra', e.target.value)}>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbS}>Company</label>
            <select className="portal-input no-icon" style={{ maxWidth: 150 }} value={form.company} onChange={e => setF('company', e.target.value)}>
              <option value="COM">COM</option>
            </select>
          </div>
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ Modify This Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Keywords Modal ────────────────────────────────────────────────────
function KeywordsModal({ bannerId, onClose, onSaved }) {
  const [keys,   setKeys]   = useState(['','','','','']);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/banners/${bannerId}/keywords`)
      .then(r => r.json())
      .then(data => {
        const arr = ['','','','',''];
        (data || []).forEach((k, i) => { if (i < 5) arr[i] = k.keyword; });
        setKeys(arr);
      }).catch(() => {});
  }, [bannerId]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/banners/${bannerId}/keywords`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keys }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Saved'); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>🔑 Keywords — Banner #{bannerId}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map((k, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={lbS}>Keyword {i + 1}</label>
              <input type="text" className="portal-input no-icon" maxLength={50} value={k}
                onChange={e => setKeys(prev => prev.map((v, idx) => idx === i ? e.target.value : v))} />
            </div>
          ))}
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ Update Keywords'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Categories Modal ──────────────────────────────────────────────────
function CategoriesModal({ bannerId, onClose, onSaved }) {
  const [cats,       setCats]       = useState(['','','','']);
  const [allCats,    setAllCats]    = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/api/banners/${bannerId}/categories`).then(r => r.json()),
      fetch(`${BASE_URL}/api/banners/categories-list`).then(r => r.json()),
    ]).then(([assigned, all]) => {
      const arr = ['','','',''];
      (assigned || []).forEach((c, i) => { if (i < 4) arr[i] = String(c.etilize_cat); });
      setCats(arr);
      setAllCats(all || []);
    }).catch(() => {});
  }, [bannerId]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/banners/${bannerId}/categories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: cats.filter(Boolean) }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Saved'); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>📂 Categories — Banner #{bannerId}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cats.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={lbS}>Category {i + 1}</label>
              <select className="portal-input no-icon" value={c}
                onChange={e => setCats(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}>
                <option value="">Select category / Remove</option>
                {allCats.map(cat => (
                  <option key={cat.etilize_cat} value={String(cat.etilize_cat)}>{cat.Name}</option>
                ))}
              </select>
            </div>
          ))}
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ Update Categories'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Add Banner Modal ──────────────────────────────────────────────────
function AddBannerModal({ onClose, onSaved }) {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState('');
  const [form,    setForm]    = useState({
    description: '', url: '', targetWindow: '0',
    active: 'N', activeExtra: 'N', company: 'COM',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const setF = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!form.description) setF('description', f.name.replace(/\.[^.]+$/, ''));
  };

  const handleSave = async () => {
    if (!file)             { setMsg('✗ Please select a banner image'); return; }
    if (!form.description) { setMsg('✗ Description is required'); return; }
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('description',  form.description);
      fd.append('url',          form.url);
      fd.append('targetWindow', form.targetWindow);
      fd.append('active',       form.active);
      fd.append('activeExtra',  form.activeExtra);
      fd.append('company',      form.company);
      const res  = await fetch(`${BASE_URL}/api/banners/add`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setMsg('✓ Banner added'); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>➕ Add New Banner</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {preview && <img src={preview} alt="preview" style={{ maxWidth: 300, maxHeight: 180, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />}
          <div>
            <label style={lbS}>Banner Image <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="file" accept="image/*,.swf" onChange={handleFile}
              style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', background: 'var(--bg-base)' }} />
          </div>
          <div>
            <label style={lbS}>Description <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" className="portal-input no-icon" maxLength={50}
              value={form.description} onChange={e => setF('description', e.target.value)} />
          </div>
          <div>
            <label style={lbS}>URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(include http:// for external)</span></label>
            <input type="text" className="portal-input no-icon" maxLength={300}
              value={form.url} onChange={e => setF('url', e.target.value)} placeholder="https://…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbS}>Target Window</label>
              <select className="portal-input no-icon" value={form.targetWindow} onChange={e => setF('targetWindow', e.target.value)}>
                <option value="0">Same Window</option>
                <option value="1">New Window</option>
              </select>
            </div>
            <div>
              <label style={lbS}>Whole Site Active</label>
              <select className="portal-input no-icon" value={form.active} onChange={e => setF('active', e.target.value)}>
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>
            <div>
              <label style={lbS}>Active Specific</label>
              <select className="portal-input no-icon" value={form.activeExtra} onChange={e => setF('activeExtra', e.target.value)}>
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>
          </div>
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Adding…' : '✓ Add Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function BannerAdmin() {
  const [banners,   setBanners]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState([]);
  const [deleting,  setDeleting]  = useState(false);
  const [msg,       setMsg]       = useState('');
  const [modifyModal,    setModifyModal]    = useState(null);
  const [keywordsModal,  setKeywordsModal]  = useState(null);
  const [categoriesModal,setCategoriesModal]= useState(null);
  const [addModal,       setAddModal]       = useState(false);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/banners`);
      setBanners(await res.json() || []);
    } catch { setMsg('✗ Failed to load banners'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected banner(s)?`)) return;
    setDeleting(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/banners/delete`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Deleted'); setSelected([]); loadBanners(); }
      else setMsg('✗ ' + (data.error || 'Delete failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const toggleSelect = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Banners</h1>
          <div className="page-header-sub">Manage site banners — images, keywords, categories</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="epm-btn-primary" onClick={() => setAddModal(true)}>+ Add New Banner</button>
          {selected.length > 0 && (
            <button className="epm-btn" style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : `🗑 Delete Selected (${selected.length})`}
            </button>
          )}
        </div>
      </div>

      {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>
      ) : banners.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🖼</div><strong>No banners found</strong></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {banners.map(b => (
            <div key={b.banner_id} className="ep-section-card" style={{ overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input type="checkbox" checked={selected.includes(b.banner_id)} onChange={() => toggleSelect(b.banner_id)} />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{b.banner_id}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{b.description}</span>
                <span style={{ fontSize: 11, background: b.active === 'Y' ? '#dcfce7' : '#f3f4f6', color: b.active === 'Y' ? '#16a34a' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                  {b.active === 'Y' ? '● Site Active' : '○ Site Off'}
                </span>
                <span style={{ fontSize: 11, background: b.active_extra === 'Y' ? '#dbeafe' : '#f3f4f6', color: b.active_extra === 'Y' ? '#2563eb' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                  {b.active_extra === 'Y' ? '● Specific Active' : '○ Specific Off'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.target_window ? 'New window' : 'Same window'}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button className="epm-btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setModifyModal(b)}>Modify</button>
                  <button className="epm-btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setKeywordsModal(b.banner_id)}>Keywords</button>
                  <button className="epm-btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setCategoriesModal(b.banner_id)}>Categories</button>
                </div>
              </div>

              {/* Banner content */}
              <div style={{ display: 'flex', gap: 16, padding: 12, flexWrap: 'wrap' }}>
                {/* Image */}
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={`https://www.your-site.com/mscs_images/images/banners/${b.filename}`}
                    alt={b.description}
                    style={{ maxWidth: 180, maxHeight: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {b.url && (
                    <div><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>URL: </span>
                      <a href={b.url} target="_blank" rel="noreferrer" className="ep-link-blue">{b.url}</a>
                    </div>
                  )}

                  {/* Keywords */}
                  {b.keywords?.length > 0 && (
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Keywords: </span>
                      {b.keywords.map(k => (
                        <span key={k} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 8px', marginRight: 4, fontSize: 11 }}>{k}</span>
                      ))}
                    </div>
                  )}

                  {/* Categories */}
                  {b.categories?.length > 0 && (
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Categories: </span>
                      {b.categories.map(c => (
                        <span key={c} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 99, padding: '1px 8px', marginRight: 4, fontSize: 11, color: '#1d4ed8' }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modifyModal     && <ModifyBannerModal banner={modifyModal} onClose={() => setModifyModal(null)} onSaved={loadBanners} />}
      {keywordsModal   && <KeywordsModal bannerId={keywordsModal} onClose={() => setKeywordsModal(null)} onSaved={loadBanners} />}
      {categoriesModal && <CategoriesModal bannerId={categoriesModal} onClose={() => setCategoriesModal(null)} onSaved={loadBanners} />}
      {addModal        && <AddBannerModal onClose={() => setAddModal(false)} onSaved={loadBanners} />}
    </div>
  );
}

const lbS = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
