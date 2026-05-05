import { useState, useEffect } from 'react';
import AlsoAvailableModal from './AlsoAvailableModal';
import ConfiguratorModal  from './ConfiguratorModal';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────────────────────────────
// PDF Modal
// ─────────────────────────────────────────────────────────────────────
export function PdfModal({ partNo, vendorId, productId, onClose, onSaved }) {
  const [pdfs, setPdfs]         = useState({ manual: null, brochure: null, instructions: null });
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null); // which type is uploading
  const [msg, setMsg]           = useState('');
  const fileRefs = { 1: useState(null), 2: useState(null), 3: useState(null) };

  const PDF_TYPES = [
    { choice: 1, label: 'PDF Manual',       key: 'manual' },
    { choice: 2, label: 'PDF Brochure',     key: 'brochure' },
    { choice: 3, label: 'PDF Instructions', key: 'instructions' },
  ];

  useEffect(() => { loadPdfs(); }, []);

  const loadPdfs = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/pdfs`);
      const data = await res.json();
      setPdfs(data || { manual: null, brochure: null, instructions: null });
    } catch { setMsg('Failed to load PDFs'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (choice, file) => {
    if (!file) return;
    setUploading(choice);
    setMsg('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('choice', choice);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/pdfs/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setMsg('✓ PDF uploaded'); loadPdfs(); onSaved?.(); }
      else setMsg('✗ ' + (data.error || 'Upload failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setUploading(null); }
  };

  const handleRemove = async (choice) => {
    if (!confirm('Remove this PDF?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/pdfs/${choice}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setMsg('✓ PDF removed'); loadPdfs(); onSaved?.(); }
      else setMsg('✗ ' + (data.error || 'Remove failed'));
    } catch { setMsg('✗ Network error'); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>📄 PDF Files — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            PDF_TYPES.map(({ choice, label, key }) => (
              <div key={choice} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
                {pdfs[key] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <a href={`https://www.your-site.com${pdfs[key].pdf_url}`} target="_blank" rel="noreferrer" className="ep-link-blue" style={{ fontSize: 13 }}>
                      📎 View PDF
                    </a>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" accept=".pdf" style={{ display: 'none' }}
                        onChange={e => handleUpload(choice, e.target.files[0])} />
                      <span className="epm-btn" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {uploading === choice ? 'Uploading…' : '🔄 Change'}
                      </span>
                    </label>
                    <button className="epm-btn" style={{ fontSize: 12, padding: '4px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => handleRemove(choice)}>
                      🗑 Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept=".pdf" style={{ display: 'none' }}
                      onChange={e => handleUpload(choice, e.target.files[0])} />
                    <span className="epm-btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}>
                      {uploading === choice ? 'Uploading…' : `+ Add ${label}`}
                    </span>
                  </label>
                )}
              </div>
            ))
          )}
          {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="epm-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────
// Reviews Modal
// ─────────────────────────────────────────────────────────────────────
export function ReviewsModal({ partNo, vendorId, productId, onClose }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [editReview, setEditReview] = useState(null);

  const emptyForm = { displayName: '', headerTitle: '', reviewDesc: '', rating: 5, pros: '', cons: '' };
  const [form, setForm] = useState(emptyForm);
  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/reviews`);
      const data = await res.json();
      setReviews(data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) { setMsg('✗ Display name required'); return; }
    if (!form.reviewDesc.trim())  { setMsg('✗ Review description required'); return; }
    if (!form.headerTitle.trim()) { setMsg('✗ Review title required'); return; }
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId, ...form,
          choice: editReview ? '2' : '1',
          rid: editReview?.rate_id || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Review saved');
        setShowAdd(false);
        setEditReview(null);
        setForm(emptyForm);
        loadReviews();
      } else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const STARS = [1,2,3,4,5];

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>⭐ Reviews — {partNo}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {!showAdd && <button className="epm-btn-primary" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => { setShowAdd(true); setEditReview(null); setForm(emptyForm); }}>+ Add Review</button>}
            <button className="ep-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Add/Edit form */}
          {showAdd && (
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{editReview ? 'Edit Review' : 'Add New Review'}</div>
              {[
                { label: 'Display Name *', field: 'displayName', maxLength: 50 },
                { label: 'Review Title *', field: 'headerTitle', maxLength: 50 },
              ].map(row => (
                <div key={row.field}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{row.label}</label>
                  <input type="text" className="portal-input no-icon" maxLength={row.maxLength}
                    value={form[row.field]} onChange={e => setField(row.field, e.target.value)} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Rating *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {STARS.map(s => (
                    <button key={s} onClick={() => setField('rating', s)}
                      style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: s <= form.rating ? '#f59e0b' : '#d1d5db' }}>
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{form.rating}/5</span>
                </div>
              </div>
              {[
                { label: 'Review Description *', field: 'reviewDesc', rows: 4, max: 1000 },
                { label: 'Pros', field: 'pros', rows: 2, max: 1000 },
                { label: 'Cons', field: 'cons', rows: 2, max: 1000 },
              ].map(row => (
                <div key={row.field}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{row.label}</label>
                  <textarea className="portal-input no-icon" rows={row.rows} maxLength={row.max}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                    value={form[row.field]} onChange={e => setField(row.field, e.target.value)} />
                </div>
              ))}
              {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="epm-btn" onClick={() => { setShowAdd(false); setEditReview(null); setMsg(''); }}>Cancel</button>
                <button className="epm-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save Review'}</button>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No reviews yet.</div>
          ) : (
            reviews.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{r.display_name}</span>
                    <span style={{ marginLeft: 8, color: '#f59e0b' }}>{'★'.repeat(r.overall_rating)}{'☆'.repeat(5 - r.overall_rating)}</span>
                  </div>
                  <button className="epm-btn" style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => { setEditReview(r); setForm({ displayName: r.display_name, headerTitle: r.header_title, reviewDesc: r.review_desc, rating: r.overall_rating, pros: r.pros || '', cons: r.cons || '' }); setShowAdd(true); }}>
                    ✏️ Edit
                  </button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.header_title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.review_desc}</div>
                {r.pros && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>👍 {r.pros}</div>}
                {r.cons && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>👎 {r.cons}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────
// Extras Section component — renders the table at bottom of EditParts
// ─────────────────────────────────────────────────────────────────────
export function ExtrasSection({ partNo, vendorId, productId, partData }) {
  const [showPdfModal,     setShowPdfModal]     = useState(false);
  const [showAlsoAvail,    setShowAlsoAvail]    = useState(false);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [pdfs, setPdfs]   = useState(null);
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const [pdfRes, revRes] = await Promise.all([
        fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/pdfs`),
        fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/reviews`),
      ]);
      setPdfs(await pdfRes.json());
      setReviews(await revRes.json());
    } catch {}
  };

  const LinkBtn = ({ onClick, children }) => (
    <a href="#" className="ep-link-blue" style={{ fontSize: 13 }}
      onClick={e => { e.preventDefault(); onClick(); }}>
      {children}
    </a>
  );

  return (
    <>
      <div className="ep-section-card" style={{ marginTop: 20 }}>
        <div className="ep-section-head">📎 Extras</div>
        <table className="ep-table ep-table--4col">
          <tbody>
            <tr>
              <td className="ep-td-label ep-td-shade">PDF Manual:</td>
              <td className="ep-td-val">
                {pdfs?.manual ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`https://www.your-site.com${pdfs.manual.pdf_url}`} target="_blank" rel="noreferrer" className="ep-link-blue">View</a>
                    <LinkBtn onClick={() => setShowPdfModal(true)}>Change / Remove</LinkBtn>
                  </div>
                ) : (
                  <LinkBtn onClick={() => setShowPdfModal(true)}>ADD PDF Manual</LinkBtn>
                )}
              </td>
              <td className="ep-td-label ep-td-shade">Options & Accessories:</td>
              <td className="ep-td-val">
                <a href={`https://www.your-site.com/inhouse/upsell/check.asp?part_no=${partNo}&vid=${vendorId}`}
                  target="_blank" rel="noreferrer" className="ep-link-blue">Click Here</a>
              </td>
            </tr>
            <tr>
              <td className="ep-td-label ep-td-shade">PDF Brochure:</td>
              <td className="ep-td-val">
                {pdfs?.brochure ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`https://www.your-site.com${pdfs.brochure.pdf_url}`} target="_blank" rel="noreferrer" className="ep-link-blue">View</a>
                    <LinkBtn onClick={() => setShowPdfModal(true)}>Change / Remove</LinkBtn>
                  </div>
                ) : (
                  <LinkBtn onClick={() => setShowPdfModal(true)}>ADD PDF Brochure</LinkBtn>
                )}
              </td>
              <td className="ep-td-label ep-td-shade">Also Available:</td>
              <td className="ep-td-val">
                <LinkBtn onClick={() => setShowAlsoAvail(true)}>
                  {partData?.alsoavailable_id ? 'Check / Change' : 'Add'}
                </LinkBtn>
              </td>
            </tr>
            <tr>
              <td className="ep-td-label ep-td-shade">PDF Instructions:</td>
              <td className="ep-td-val">
                {pdfs?.instructions ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`https://www.your-site.com${pdfs.instructions.pdf_url}`} target="_blank" rel="noreferrer" className="ep-link-blue">View</a>
                    <LinkBtn onClick={() => setShowPdfModal(true)}>Change / Remove</LinkBtn>
                  </div>
                ) : (
                  <LinkBtn onClick={() => setShowPdfModal(true)}>ADD PDF Instructions</LinkBtn>
                )}
              </td>
              <td className="ep-td-label ep-td-shade">Configurator:</td>
              <td className="ep-td-val">
                <LinkBtn onClick={() => setShowConfigurator(true)}>
                  {partData?.config_id ? `${partData.config_name || partData.config_id} (change)` : 'Add'}
                </LinkBtn>
              </td>
            </tr>
            <tr>
              <td className="ep-td-label ep-td-shade">Reviews:</td>
              <td className="ep-td-val">
                <LinkBtn onClick={() => setShowReviewsModal(true)}>
                  {reviews?.length > 0 ? `View ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'Add Review'}
                </LinkBtn>
              </td>
              <td className="ep-td-label ep-td-shade"></td>
              <td className="ep-td-val"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {showAlsoAvail && (
        <AlsoAvailableModal
          partNo={partNo} vendorId={vendorId}
          onClose={() => setShowAlsoAvail(false)}
          onSaved={() => { loadSummary(); setShowAlsoAvail(false); }}
        />
      )}
      {showConfigurator && (
        <ConfiguratorModal
          partNo={partNo} vendorId={vendorId}
          configId={partData?.config_id}
          configName={partData?.config_name}
          onClose={() => setShowConfigurator(false)}
          onSaved={() => { loadSummary(); setShowConfigurator(false); }}
        />
      )}
      {showPdfModal && (
        <PdfModal
          partNo={partNo} vendorId={vendorId} productId={productId}
          onClose={() => setShowPdfModal(false)}
          onSaved={() => { loadSummary(); }}
        />
      )}
      {showReviewsModal && (
        <ReviewsModal
          partNo={partNo} vendorId={vendorId} productId={productId}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </>
  );
}
