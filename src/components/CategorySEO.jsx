import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './styles/globals.css';

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Cascading category selects ────────────────────────────────────────
function CategoryPicker({ value, onChange }) {
  const [cats1, setCats1] = useState([]);
  const [cats2, setCats2] = useState([]);
  const [cats3, setCats3] = useState([]);
  const [cats4, setCats4] = useState([]);
  const [cats5, setCats5] = useState([]);
  const [sel, setSel]     = useState({ l1: '', l2: '', l3: '', l4: '', l5: '' });

  useEffect(() => {
    fetch(`${BASE_URL}/api/category-seo/cats/1`)
      .then(r => r.json()).then(setCats1).catch(() => {});
  }, []);

  useEffect(() => {
    if (value) setSel(value);
  }, []);

  const pick = async (level, catId) => {
    const newSel = { ...sel };
    newSel[`l${level}`] = catId;
    // Clear lower levels
    for (let i = level + 1; i <= 5; i++) newSel[`l${i}`] = '';
    setSel(newSel);
    onChange(newSel);

    if (catId && level < 5) {
      const res  = await fetch(`${BASE_URL}/api/category-seo/cats/${level + 1}?parentId=${catId}`);
      const data = await res.json();
      if (level === 1) { setCats2(data); setCats3([]); setCats4([]); setCats5([]); }
      if (level === 2) { setCats3(data); setCats4([]); setCats5([]); }
      if (level === 3) { setCats4(data); setCats5([]); }
      if (level === 4) { setCats5(data); }
    }
  };

  const SelectRow = ({ level, cats, val, label }) => (
    cats.length > 0 || level === 1 ? (
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>{label}:</label>
        <select className="portal-input no-icon" value={val} onChange={e => pick(level, e.target.value)}>
          <option value="">— Select level {level} —</option>
          {cats.map(c => <option key={c.categoryid} value={c.categoryid}>{c.name}</option>)}
        </select>
      </div>
    ) : null
  );

  return (
    <div>
      <SelectRow level={1} cats={cats1} val={sel.l1} label="Level 1" />
      {sel.l1 && <SelectRow level={2} cats={cats2} val={sel.l2} label="Level 2" />}
      {sel.l2 && <SelectRow level={3} cats={cats3} val={sel.l3} label="Level 3" />}
      {sel.l3 && <SelectRow level={4} cats={cats4} val={sel.l4} label="Level 4" />}
      {sel.l4 && <SelectRow level={5} cats={cats5} val={sel.l5} label="Level 5" />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function CategorySEO() {
  const [tabId,     setTabId]     = useState('');
  const [tabs,      setTabs]      = useState([]);
  const [subcats,   setSubcats]   = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [editModal, setEditModal] = useState(null); // { subcat } or 'new'
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/category-seo/tabs`)
      .then(r => r.json()).then(setTabs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tabId) { setSubcats([]); return; }
    setLoadingSubs(true);
    fetch(`${BASE_URL}/api/category-seo/subcats?tabId=${tabId}`)
      .then(r => r.json()).then(d => { setSubcats(d || []); })
      .catch(() => {})
      .finally(() => setLoadingSubs(false));
  }, [tabId]);

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Category SEO</h1>
          <div className="page-header-sub">Manage SEO descriptions and category mappings for tab subcategories</div>
        </div>
      </div>

      {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Tab selector */}
      <div className="ep-section-card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <div className="ep-section-head">Select Tab</div>
        <div style={{ padding: '12px 16px' }}>
          <select className="portal-input no-icon" style={{ width: '100%' }}
            value={tabId} onChange={e => setTabId(e.target.value)}>
            <option value="">— Select a tab —</option>
            {tabs.map(t => <option key={t.tab_id} value={t.tab_id}>{t.tab_name}</option>)}
          </select>
        </div>
      </div>

      {tabId && (
        <div className="ep-section-card">
          <div className="ep-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Subcategories</span>
            <button className="epm-btn-primary" style={{ fontSize: 12 }}
              onClick={() => setEditModal({ subcat: null, tabId })}>
              + Add Subcategory
            </button>
          </div>
          {loadingSubs ? (
            <div style={{ padding: 24, textAlign: 'center' }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>
          ) : subcats.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No subcategories found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
                    <th style={thS}>Text</th>
                    <th style={thS}>Category Levels</th>
                    <th style={thS}>Order</th>
                    <th style={thS}>Has Desc</th>
                    <th style={thS}></th>
                  </tr>
                </thead>
                <tbody>
                  {subcats.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
                      <td style={tdS}><strong>{s.text}</strong></td>
                      <td style={{ ...tdS, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {[s.level1, s.level2, s.level3, s.level4, s.level5].filter(Boolean).join(' › ')}
                      </td>
                      <td style={tdS}>{s.sort_order}</td>
                      <td style={tdS}>{s.ifdescription === 'y' ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span> : '—'}</td>
                      <td style={tdS}>
                        <button className="epm-btn" style={{ fontSize: 11, padding: '3px 10px' }}
                          onClick={() => setEditModal({ subcat: s, tabId })}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editModal && (
        <SubcatModal
          subcat={editModal.subcat}
          tabId={editModal.tabId}
          onClose={() => setEditModal(null)}
          onSaved={() => {
            setEditModal(null);
            setMsg('✓ Saved');
            // Reload subcats
            setLoadingSubs(true);
            fetch(`${BASE_URL}/api/category-seo/subcats?tabId=${tabId}`)
              .then(r => r.json()).then(setSubcats).finally(() => setLoadingSubs(false));
          }}
        />
      )}
    </div>
  );
}

// ── Edit/Add Subcategory Modal ────────────────────────────────────────
function SubcatModal({ subcat, tabId, onClose, onSaved }) {
  const isEdit = !!subcat;
  const [form, setForm]   = useState({
    text:      subcat?.text        || '',
    link:      subcat?.link        || '',
    notalink:  subcat?.notalink    || '',
    showPic:   subcat?.show_picture|| 'n',
    pageOrder: subcat?.sort_order  || 1,
    tabGroup:  subcat?.subcat_group|| 1,
    ifdesc:    subcat?.ifdescription || '',
  });
  const [cats, setCats]   = useState({ l1: subcat?.level1||'', l2: subcat?.level2||'', l3: subcat?.level3||'', l4: subcat?.level4||'', l5: subcat?.level5||'' });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const setF = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.text.trim()) { setMsg('✗ Text is required'); return; }
    if (!cats.l1 && form.notalink !== 'y') { setMsg('✗ Category Level 1 is required'); return; }
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/category-seo/subcat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice:    isEdit ? 1 : 2,
          subId:     subcat?.id || 0,
          tabId:     parseInt(tabId),
          text:      form.text.trim(),
          link:      form.link,
          ecat1:     parseInt(cats.l1) || 0,
          ecat2:     parseInt(cats.l2) || 0,
          ecat3:     parseInt(cats.l3) || 0,
          ecat4:     parseInt(cats.l4) || 0,
          ecat5:     parseInt(cats.l5) || 0,
          notalink:  form.notalink,
          showPic:   form.showPic,
          pageOrder: parseInt(form.pageOrder) || 1,
          tabGroup:  parseInt(form.tabGroup)  || 1,
          ifdesc:    form.ifdesc,
        }),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>{isEdit ? '✏️ Edit' : '➕ Add'} Subcategory</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>

          <div>
            <label style={lbS}>Text <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" className="portal-input no-icon" maxLength={75}
              value={form.text} onChange={e => setF('text', e.target.value)} />
          </div>

          <div>
            <label style={lbS}>Link URL</label>
            <input type="text" className="portal-input no-icon" maxLength={255}
              value={form.link} onChange={e => setF('link', e.target.value)} placeholder="https://…" />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.notalink === 'y'} onChange={e => setF('notalink', e.target.checked ? 'y' : '')} />
            Not a link
          </label>

          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
            <div style={{ ...lbS, marginBottom: 10 }}>Category Levels {form.notalink !== 'y' && <span style={{ color: 'var(--danger)' }}>*</span>}</div>
            <CategoryPicker value={cats} onChange={setCats} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbS}>Page Order</label>
              <input type="number" className="portal-input no-icon"
                value={form.pageOrder} onChange={e => setF('pageOrder', e.target.value)} />
            </div>
            <div>
              <label style={lbS}>Tab Group</label>
              <input type="number" className="portal-input no-icon"
                value={form.tabGroup} onChange={e => setF('tabGroup', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.showPic === 'Y' || form.showPic === 'y'} onChange={e => setF('showPic', e.target.checked ? 'Y' : 'n')} />
              Show Picture
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.ifdesc === 'y'} onChange={e => setF('ifdesc', e.target.checked ? 'y' : '')} />
              Has Description
            </label>
          </div>

          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? '✓ Update Subcat' : '✓ Add Subcategory'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const thS = { padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' };
const tdS = { padding: '9px 12px', verticalAlign: 'middle' };
const lbS = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
