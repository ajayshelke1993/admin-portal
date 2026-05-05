import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/globals.css';
// import './styles/ProductImages.css';

const BASE_URL = import.meta.env.VITE_API_URL;

const IMAGE_TYPES = [
  { key: 'main',   label: 'Main (300)',  field: 'picture',     urlField: 'picture' },
  { key: 'large',  label: 'Large (500)', field: 'large',       urlField: 'large' },
  { key: 'left',   label: 'Left',        field: 'left_pics',   urlField: 'left_pics' },
  { key: 'right',  label: 'Right',       field: 'right_pics',  urlField: 'right_pics' },
  { key: 'bottom', label: 'Bottom',      field: 'bottom_pics', urlField: 'bottom_pics' },
  { key: 'top',    label: 'Top',         field: 'top_pics',    urlField: 'top_pics' },
  { key: 'front',  label: 'Front',       field: 'front_pics',  urlField: 'front_pics' },
  { key: 'rear',   label: 'Rear',        field: 'rear_pics',   urlField: 'rear_pics' },
];

function ProductImages() {
  const { partNo, vendorid } = useParams();
  const navigate = useNavigate();

  const [images, setImages]       = useState([]);
  const [partInfo, setPartInfo]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');

  // Upload modal state
  const [uploadModal, setUploadModal] = useState(null); // { imageId, type, label }
  const [uploadFile, setUploadFile]   = useState(null);
  const [preview, setPreview]         = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState('');
  const fileRef = useRef();

  // Load images
  const loadImages = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/images`)
      .then(r => r.json())
      .then(d => {
        setImages(d.images || []);
        setPartInfo(d.partInfo || null);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { loadImages(); }, [partNo, vendorid]);

  // Toggle active
  const toggleActive = (id) => {
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, active: img.active === 'Y' ? 'N' : 'Y' } : img
    ));
  };

  // Save active states + sync to markedup_items
  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/images/update-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: images.map(i => ({ id: i.id, active: i.active })) }),
      });
      const data = await res.json();
      setMsg(data.success ? '✓ Saved and synced to product' : '✗ ' + (data.error || 'Failed'));
      if (data.success) loadImages();
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  // Delete image
  const handleDelete = async (id) => {
    if (!confirm('Delete this image record? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/images/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) { loadImages(); setMsg('✓ Image deleted'); }
      else setMsg('✗ ' + (data.error || 'Delete failed'));
    } catch { setMsg('✗ Network error'); }
  };

  // Delete single angle pic
  const handleDeleteAngle = async (id, type) => {
    if (!confirm(`Delete ${type} image?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/images/${id}/angle`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) { loadImages(); setMsg(`✓ ${type} image removed`); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
  };

  // Open upload modal
  const openUpload = (imageId, type, label) => {
    setUploadModal({ imageId, type, label });
    setUploadFile(null);
    setPreview(null);
    setUploadMsg('');
  };

  // File selected
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Upload submit
  const handleUpload = async () => {
    if (!uploadFile) { setUploadMsg('Please select a file.'); return; }
    setUploading(true);
    setUploadMsg('');
    const form = new FormData();
    form.append('file', uploadFile);
    form.append('type', uploadModal.type);
    form.append('imageId', uploadModal.imageId || '');
    try {
      const res = await fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/images/upload`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setUploadModal(null);
        setUploadFile(null);
        setPreview(null);
        loadImages();
        setMsg('✓ Image uploaded successfully');
      } else {
        setUploadMsg('✗ ' + (data.error || 'Upload failed'));
      }
    } catch { setUploadMsg('✗ Network error'); }
    finally { setUploading(false); }
  };

  const etilizeId = images[0]?.etilize_flag || partInfo?.etilize_flag;

  if (loading) return (
    <div className="portal-page">
      <div className="od-loading"><div className="od-spinner" /><p>Loading images…</p></div>
    </div>
  );

  return (
    <div className="portal-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="od-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <h1 style={{ marginTop: 12 }}>
            Product Images&nbsp;
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{partNo}</span>
          </h1>
          {partInfo && (
            <div className="page-header-sub">
              {partInfo.vendor} · {partInfo.description?.substring(0, 80)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {msg && <span className={`pi-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</span>}
          <button className="pi-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '✓ Save & Sync to Product'}
          </button>
        </div>
      </div>

      {/* Etilize reference row */}
      {etilizeId && (
        <div className="ep-section-card" style={{ marginBottom: 16 }}>
          <div className="ep-section-head">Etilize Reference Images (read-only)</div>
          <div className="pi-etilize-row">
            {['', 'Left', 'Right', 'Bottom', 'Top', 'Front', 'Rear'].map(angle => (
              <div key={angle} className="pi-etilize-item">
                <div className="pi-etilize-label">{angle || 'Main'}</div>
                <a href={`https://content.etilize.com/${angle || 'Thumbnail'}/${etilizeId}.jpg`}
                  target="_blank" rel="noreferrer">
                  <img
                    src={`https://content.etilize.com/images/70/70/${etilizeId}.jpg`}
                    alt={angle || 'Main'}
                    className="pi-etilize-img"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>view</div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image rows */}
      {images.length === 0 ? (
        <div className="ep-section-card">
          <div className="pi-empty">
            <div className="empty-state-icon">🖼️</div>
            <strong>No images found</strong>
            <p>No image records exist for this part yet.</p>
            <button className="pi-btn-add" onClick={() => openUpload(null, 'main', 'Main (300)')}>
              + Add First Image
            </button>
          </div>
        </div>
      ) : (
        images.map((img, idx) => (
          <div key={img.id} className="ep-section-card pi-image-card">
            <div className="ep-section-head" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Image Record #{img.id}</span>
                <span className={`pi-active-badge ${img.active === 'Y' ? 'active' : 'inactive'}`}>
                  {img.active === 'Y' ? '● Active' : '○ Inactive'}
                </span>
                {img.sourceid && <span className="ep-badge ep-badge-blue">{img.sourceid}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`pi-toggle-btn ${img.active === 'Y' ? 'on' : 'off'}`}
                  onClick={() => toggleActive(img.id)}
                >
                  {img.active === 'Y' ? 'Set Inactive' : 'Set Active'}
                </button>
                <button className="pi-btn-danger" onClick={() => handleDelete(img.id)}>
                  🗑 Delete Record
                </button>
              </div>
            </div>

            <div className="pi-angles-grid">
              {IMAGE_TYPES.map(({ key, label, field }) => {
                const val = img[field];
                const hasImg = val && val !== '' && val.toLowerCase() !== 'thumb';
                const imgUrl = hasImg ? `https://www.your-site.com${val}` : null;

                return (
                  <div key={key} className="pi-angle-cell">
                    <div className="pi-angle-label">{label}</div>
                    {hasImg ? (
                      <div className="pi-angle-img-wrap">
                        <img
                          src={key === 'main'
                            ? imgUrl.replace('/hd/300/', '/hd/thumbs_100/')
                            : imgUrl}
                          alt={label}
                          className="pi-angle-img"
                          onError={e => { e.target.src = 'https://www.your-site.com/mscs_images/pics/noimage.png'; }}
                        />
                        {/* Hover zoom overlay */}
                        <div className="pi-zoom-overlay">
                          <img
                            src={imgUrl}
                            alt={`${label} full`}
                            className="pi-zoom-img"
                            onLoad={e => {
                              const w = e.target.naturalWidth;
                              const h = e.target.naturalHeight;
                              const badge = e.target.parentElement.querySelector('.pi-res-badge');
                              if (badge) badge.textContent = `${w}×${h}`;
                              badge.style.color = (w >= 300 && h >= 300) ? 'var(--success)' : 'var(--danger)';
                            }}
                          />
                          <div className="pi-res-badge">loading…</div>
                        </div>
                        <div className="pi-angle-actions">
                          <a href={imgUrl} target="_blank" rel="noreferrer" className="pi-action-link">view</a>
                          <button className="pi-action-del" onClick={() => handleDeleteAngle(img.id, key)}>delete</button>
                        </div>
                        <button className="pi-angle-change" onClick={() => openUpload(img.id, key, label)}>
                          change
                        </button>
                      </div>
                    ) : (
                      <button className="pi-angle-add" onClick={() => openUpload(img.id, key, label)}>
                        + add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="epm-overlay" onClick={() => setUploadModal(null)}>
          <div className="epm-modal" onClick={e => e.stopPropagation()}>
            <div className="epm-header">
              <span>Upload {uploadModal.label} Image</span>
              <button className="epm-close" onClick={() => setUploadModal(null)}>✕</button>
            </div>
            <div className="epm-body">
              <div className="epm-row epm-row-info">
                <span className="epm-label">Part</span>
                <span className="epm-value-static">{partNo}</span>
              </div>
              <div className="epm-row epm-row-info">
                <span className="epm-label">Type</span>
                <span className="epm-value-static">{uploadModal.label}</span>
              </div>

              {/* Size hints */}
              <div className="pi-upload-hint">
                {uploadModal.type === 'main'   && '📐 Image must be square, min 300×300. Will create 300×300 technote + 70×70 thumbnail.'}
                {uploadModal.type === 'large'  && '📐 Image must be square, min 500×500. Will create 500×500 large + 300×300 + 70×70 thumbnail.'}
                {!['main','large'].includes(uploadModal.type) && `📐 Rollover image for ${uploadModal.label} view. Will be resized to 500×500.`}
              </div>

              <div className="epm-row">
                <label className="epm-label">Select Image</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="epm-input"
                  onChange={handleFileChange}
                />
              </div>

              {preview && (
                <div className="pi-preview-wrap">
                  <img src={preview} alt="preview" className="pi-preview-img" />
                </div>
              )}

              {uploadMsg && <div className="epm-error">{uploadMsg}</div>}
            </div>
            <div className="epm-footer">
              <button className="epm-btn-cancel" onClick={() => setUploadModal(null)}>Cancel</button>
              <button className="epm-btn-save" onClick={handleUpload} disabled={uploading || !uploadFile}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductImages;
