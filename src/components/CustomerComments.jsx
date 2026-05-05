import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './styles/globals.css';

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Add/Edit Comment Modal ────────────────────────────────────────────
function CommentModal({ commentId, onClose, onSaved }) {
  const isEdit = !!commentId;
  const today  = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    dateWritten: today, header: '', writtenText: '',
    name: 'Anonymous', emailUser: '', active: '1', leftNav: '0',
  });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [errors,  setErrors]  = useState([]);
  const setF = (k,v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    fetch(`${BASE_URL}/api/comments/${commentId}`)
      .then(r => r.json())
      .then(d => setForm({
        dateWritten: d.date_written ? d.date_written.split('T')[0] : today,
        header:      d.header       || '',
        writtenText: d.written_text || '',
        name:        d.name         || 'Anonymous',
        emailUser:   d.email_user   || '',
        active:      d.active ? '1' : '0',
        leftNav:     d.left_nav ? '1' : '0',
      })).catch(() => {});
  }, [commentId]);

  const handleSave = async () => {
    const errs = [];
    if (!form.dateWritten) errs.push('Date written is required');
    if (!form.writtenText.trim()) errs.push('Comments cannot be blank');
    if (!form.header.trim()) errs.push('Title cannot be blank');
    if (form.writtenText.length > 1500) errs.push('Comments must be 1500 characters or less');
    if (errs.length) { setErrors(errs); return; }
    setSaving(true); setMsg(''); setErrors([]);
    try {
      const url = isEdit ? `${BASE_URL}/api/comments/${commentId}` : `${BASE_URL}/api/comments`;
      const res  = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: form.name || 'Anonymous' }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Saved'); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>{isEdit ? '✏️ Edit' : '➕ Add'} Customer Comment</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {errors.length > 0 && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: '#dc2626' }}>
              {errors.map((e,i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <label style={{ ...lbS, color: '#dc2626' }}>Date Written *</label>
            <input type="date" className="portal-input no-icon" value={form.dateWritten} onChange={e => setF('dateWritten', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <label style={{ ...lbS, color: '#dc2626' }}>Title *</label>
            <input type="text" className="portal-input no-icon" maxLength={150} value={form.header} onChange={e => setF('header', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'flex-start' }}>
            <label style={{ ...lbS, color: '#dc2626', paddingTop: 6 }}>Comments *</label>
            <div>
              <textarea className="portal-input no-icon" rows={5} maxLength={1500}
                value={form.writtenText} onChange={e => setF('writtenText', e.target.value)}
                style={{ width: '100%', resize: 'vertical' }} />
              <div style={{ fontSize: 11, color: form.writtenText.length > 1400 ? '#dc2626' : 'var(--text-muted)', textAlign: 'right' }}>
                {form.writtenText.length}/1500
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <label style={{ ...lbS, color: '#dc2626' }}>Name *</label>
            <input type="text" className="portal-input no-icon" maxLength={100} value={form.name}
              onChange={e => setF('name', e.target.value)} placeholder="Anonymous if blank" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <label style={lbS}>Email</label>
            <input type="text" className="portal-input no-icon" maxLength={250} value={form.emailUser} onChange={e => setF('emailUser', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={{ ...lbS, color: '#dc2626' }}>Active *</label>
              <select className="portal-input no-icon" value={form.active} onChange={e => setF('active', e.target.value)}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={{ ...lbS, color: '#dc2626' }}>Left Nav *</label>
              <select className="portal-input no-icon" value={form.leftNav} onChange={e => setF('leftNav', e.target.value)}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
          </div>
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Cancel</button>
            <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? '✓ Update This Comment' : '✓ Add This Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Comments Table ────────────────────────────────────────────────────
function CommentsTable({ comments, selected, onToggle, onEdit }) {
  const fmtDate = d => { try { return new Date(d).toLocaleDateString(); } catch { return d || ''; } };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
            <th style={thS}>✓</th>
            <th style={thS}>Date</th>
            <th style={thS}>Header</th>
            <th style={thS}>Comment</th>
            <th style={thS}>Name</th>
            <th style={thS}>Email</th>
            <th style={thS}>Active</th>
            <th style={thS}>Left Nav</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c, i) => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: selected.includes(c.id) ? '#fee2e2' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)' }}>
              <td style={tdS}><input type="checkbox" checked={selected.includes(c.id)} onChange={() => onToggle(c.id)} /></td>
              <td style={{ ...tdS, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{fmtDate(c.date_written)}</td>
              <td style={{ ...tdS, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.header}</td>
              <td style={tdS}>
                <button className="ep-link-blue" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, padding: 0, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  onClick={() => onEdit(c.id)}>
                  {c.written_text}
                </button>
              </td>
              <td style={tdS}>{c.name}</td>
              <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: 11 }}>{c.email_user}</td>
              <td style={tdS}>{c.active ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>Yes</span> : <span style={{ color: 'var(--text-muted)' }}>No</span>}</td>
              <td style={tdS}>{c.left_nav ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>Yes</span> : <span style={{ color: 'var(--text-muted)' }}>No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function CustomerComments() {
  const [tab,       setTab]       = useState('all');  // 'all' | 'pending'
  const [comments,  setComments]  = useState([]);
  const [pending,   setPending]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState([]);
  const [deleting,  setDeleting]  = useState(false);
  const [msg,       setMsg]       = useState('');
  const [editModal, setEditModal] = useState(null); // null | 'add' | id

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allRes, pendRes] = await Promise.all([
        fetch(`${BASE_URL}/api/comments`),
        fetch(`${BASE_URL}/api/comments/pending`),
      ]);
      setComments(await allRes.json() || []);
      setPending(await pendRes.json()  || []);
    } catch { setMsg('✗ Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected comment(s)?`)) return;
    setDeleting(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/comments/delete`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Deleted'); setSelected([]); loadAll(); }
      else setMsg('✗ ' + (data.error || 'Delete failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const toggleSelect = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const activeComments = tab === 'all' ? comments : pending;

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Customer Comments</h1>
          <div className="page-header-sub">Manage customer testimonials and reviews</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="epm-btn-primary" onClick={() => setEditModal('add')}>+ Add Comment</button>
          {selected.length > 0 && (
            <button className="epm-btn" style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : `🗑 Delete Selected (${selected.length})`}
            </button>
          )}
        </div>
      </div>

      {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'all',     label: `All Comments (${comments.length})` },
          { key: 'pending', label: `Pending Approval (${pending.length})`, badge: pending.length > 0 },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelected([]); }}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              marginBottom: -2,
            }}>
            {t.label}
            {t.badge && <span style={{ marginLeft: 6, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px' }}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>
      ) : activeComments.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💬</div><strong>No comments found</strong></div>
      ) : (
        <div className="ep-section-card">
          <CommentsTable
            comments={activeComments}
            selected={selected}
            onToggle={toggleSelect}
            onEdit={id => setEditModal(id)}
          />
        </div>
      )}

      {editModal === 'add' && <CommentModal onClose={() => setEditModal(null)} onSaved={loadAll} />}
      {editModal && editModal !== 'add' && <CommentModal commentId={editModal} onClose={() => setEditModal(null)} onSaved={loadAll} />}
    </div>
  );
}

const thS = { padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' };
const tdS = { padding: '7px 10px', verticalAlign: 'middle' };
const lbS = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 0 };
