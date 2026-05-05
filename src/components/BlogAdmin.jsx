import { useEffect, useState, useRef } from 'react';
import './styles/globals.css';
import './styles/BlogAdmin.css';

const BASE_URL   = import.meta.env.VITE_API_URL;
const BANNER_URL = '';

const AUTHORS = [
  { value: 'John Doe',  label: 'John Doe'  },
  { value: 'Sara Lee', label: 'Sara Lee' },
];

const AUTHOR_FOOTERS = {
  'John Doe':  `<section style="margin-top:40px"><hr style="border:1px solid #ccc;margin-bottom:20px"><h3>About the Author</h3><div style="display:flex;align-items:center"><img src="https://www.your-site.com/mscs_images/authors/image.jpg" alt="John Doe" width="120" height="120" style="border-radius:50%;margin-right:20px"><div><h4>John Doe</h4><p>John Doe is the CEO of your-site. With over 35 years of experience, John is passionate about innovation and delivering top-tier customer service.</p><p>Connect: <a href="https://www.linkedin.com/" target="_blank">LinkedIn</a></p></div></div></section>`,
  'Sara Lee': `<section style="margin-top:40px"><hr style="border:1px solid #ccc;margin-bottom:20px"><h3>About the Author</h3><div style="display:flex;align-items:center"><img src="https://www.your-site.com/mscs_images/authors/sara.jpg" alt="Sara Lee" width="120" height="120" style="border-radius:50%;margin-right:20px"><div><h4>Sara Lee</h4><p>Sara Lee is passionate about Marketing and Sales, thriving on creating impactful strategies that engage audiences.</p><p>Connect: <a href="https://www.linkedin.com/" target="_blank">LinkedIn</a></p></div></div></section>`,
};

const emptyForm = { blogID: '', title: '', slug: '', author: '', content: '', bannerImage: '', authorFooter: '' };

export default function BlogAdmin() {
  const [blogs, setBlogs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [bannerFile, setBannerFile]           = useState(null);
  const [bannerPreview, setBannerPreview]     = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadBlogs(); }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blogs`);
      const data = await res.json();
      setBlogs(data || []);
    } catch { setMsg('Failed to load blogs.'); }
    finally { setLoading(false); }
  };

  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleAuthorChange = (author) => {
    setField('author', author);
    setField('authorFooter', AUTHOR_FOOTERS[author] || '');
  };

  const generateSlug = (title) => setField('slug',
    title.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  );

  const handleTitleChange = (val) => {
    setField('title', val);
    if (!form.blogID) generateSlug(val);
  };

  const editBlog = (blog) => {
    setForm({
      blogID:       String(blog.BlogID),
      title:        blog.Title        || '',
      slug:         blog.Slug         || '',
      author:       blog.Author       || '',
      content:      blog.Content      || '',
      bannerImage:  blog.BannerImage  || '',
      authorFooter: blog.Authorfooter || AUTHOR_FOOTERS[blog.Author] || '',
    });
    setBannerFile(null);
    setBannerPreview(blog.BannerImage ? BANNER_URL + blog.BannerImage : null);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setBannerFile(null);
    setBannerPreview(null);
    setMsg('');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMsg('✗ Title is required.');  return; }
    if (!form.slug.trim())  { setMsg('✗ Slug is required.');   return; }
    if (!form.author)       { setMsg('✗ Author is required.'); return; }
    setSaving(true);
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Blog saved successfully');
        loadBlogs();
        if (!form.blogID && data.blogID) setField('blogID', String(data.blogID));
      } else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (blogID) => {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/blogs/${blogID}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { loadBlogs(); if (form.blogID === String(blogID)) resetForm(); }
      else setMsg('✗ Delete failed');
    } catch { setMsg('✗ Network error'); }
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = ev => setBannerPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async () => {
    if (!bannerFile)  { setMsg('✗ Select a file first'); return; }
    if (!form.blogID) { setMsg('✗ Save the blog first before uploading a banner'); return; }
    setUploadingBanner(true);
    setMsg('');
    const fd = new FormData();
    fd.append('file',   bannerFile);
    fd.append('blogID', form.blogID);
    try {
      const res  = await fetch(`${BASE_URL}/api/blogs/${form.blogID}/banner`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setField('bannerImage', data.filename);
        setBannerPreview(BANNER_URL + data.filename);
        setBannerFile(null);
        setMsg('✓ Banner uploaded');
        loadBlogs();
      } else setMsg('✗ ' + (data.error || 'Upload failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setUploadingBanner(false); }
  };

  const handleDeleteBanner = async () => {
    if (!form.blogID || !confirm('Remove banner image?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/blogs/${form.blogID}/banner`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setField('bannerImage', ''); setBannerPreview(null); setMsg('✓ Banner removed'); loadBlogs(); }
    } catch { setMsg('✗ Network error'); }
  };

  return (
    <div className="portal-page">

      {/* Preview Modal */}
      {showPreview && (
        <div className="ba-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="ba-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ba-preview-header">
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Preview</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{form.title || 'Untitled'}</div>
              </div>
              <button className="ba-btn-ghost" onClick={() => setShowPreview(false)}>✕ Close</button>
            </div>
            <div className="ba-preview-body">
              {bannerPreview && (
                <img src={bannerPreview} alt="banner"
                  style={{ width: '100%', maxHeight: 300, objectFit: 'cover', marginBottom: 24, borderRadius: 8 }} />
              )}
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{form.title}</h1>
              {form.author && <p style={{ color: '#666', marginBottom: 24 }}>By {form.author}</p>}
              <div dangerouslySetInnerHTML={{ __html: form.content }} />
              {form.author && (
                <div dangerouslySetInnerHTML={{ __html: AUTHOR_FOOTERS[form.author] || '' }} />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Blog Admin</h1>
          <div className="page-header-sub">Add and manage blog posts</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-label">Total Posts</div>
          <div className="stat-chip-value accent">{blogs.length}</div>
        </div>
      </div>

      <div className="ba-layout">

        {/* ── LEFT: Form ── */}
        <div className="ba-form-col">
          <div className="ba-card">
            <div className="ba-card-head">
              {form.blogID ? `✏️ Editing: ${form.title || 'Blog Post'}` : '➕ New Blog Post'}
              {form.blogID && <button className="ba-btn-ghost" onClick={resetForm}>+ New Post</button>}
            </div>
            <div className="ba-card-body">

              <div className="ba-field">
                <label className="ba-label">Title <span className="ba-req">*</span></label>
                <input type="text" className="ba-input" value={form.title}
                  onChange={e => handleTitleChange(e.target.value)} placeholder="Enter blog title…" />
              </div>

              <div className="ba-field">
                <label className="ba-label">Slug <span className="ba-req">*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="ba-input" value={form.slug}
                    onChange={e => setField('slug', e.target.value)}
                    placeholder="url-friendly-slug"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  <button className="ba-btn-ghost" onClick={() => generateSlug(form.title)}>↻ Generate</button>
                </div>
                {form.slug && (
                  <small className="ba-hint">
                    URL: your-site.com/blog/{form.slug}{' '}
                    <a href={`https://www.your-site.com/blog/blog_content.asp?slug=${form.slug}`}
                      target="_blank" rel="noreferrer" className="ba-view-link">↗ View live</a>
                  </small>
                )}
              </div>

              <div className="ba-field">
                <label className="ba-label">Author <span className="ba-req">*</span></label>
                <select className="ba-select" value={form.author} onChange={e => handleAuthorChange(e.target.value)}>
                  <option value="">— Select Author —</option>
                  {AUTHORS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              {form.author && (
                <div className="ba-field">
                  <label className="ba-label">Author Footer Preview</label>
                  <div className="ba-footer-preview"
                    dangerouslySetInnerHTML={{ __html: AUTHOR_FOOTERS[form.author] }} />
                </div>
              )}

              <div className="ba-field">
                <label className="ba-label">Banner Image</label>
                {bannerPreview && (
                  <div className="ba-banner-preview-wrap">
                    <img src={bannerPreview} alt="banner" className="ba-banner-preview" />
                    <button className="ba-btn-danger-sm" onClick={handleDeleteBanner}>🗑 Remove</button>
                  </div>
                )}
                <div className="ba-banner-upload">
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp"
                    style={{ display: 'none' }} onChange={handleBannerFileChange} />
                  <button className="ba-btn-ghost" onClick={() => fileRef.current.click()}>
                    📁 {bannerFile ? bannerFile.name : 'Choose Image'}
                  </button>
                  {bannerFile && (
                    <button className="ba-btn-primary-sm" onClick={handleBannerUpload} disabled={uploadingBanner}>
                      {uploadingBanner ? 'Uploading…' : '⬆ Upload Banner'}
                    </button>
                  )}
                  {!form.blogID && bannerFile && (
                    <small className="ba-hint" style={{ color: 'var(--warning)' }}>
                      Save the post first, then upload banner
                    </small>
                  )}
                </div>
              </div>

              {/* ── HTML Content Editor ── */}
              <div className="ba-field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="ba-label" style={{ marginBottom: 0 }}>Content (HTML)</label>
                  <button className="ba-btn-preview" onClick={() => setShowPreview(true)}>
                    👁 Preview
                  </button>
                </div>
                <div className="ba-editor-note">
                  Write raw HTML. Use inline styles for images: <code>{'<img src="…" style="width:600px;height:auto;">'}</code>
                  Schema/JSON-LD scripts are preserved and won't show on the live page as text.
                </div>
                <textarea
                  className="ba-html-editor"
                  value={form.content}
                  onChange={e => setField('content', e.target.value)}
                  placeholder="<h2>Introduction</h2><p>Your blog content here…</p>"
                  spellCheck={false}
                />
                <div className="ba-char-count">{form.content.length.toLocaleString()} characters</div>
              </div>

              {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ba-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : form.blogID ? '✓ Update Blog Post' : '✓ Save New Blog Post'}
                </button>
                <button className="ba-btn-preview" onClick={() => setShowPreview(true)}>👁 Preview</button>
                {form.blogID && (
                  <button className="ba-btn-ghost"
                    onClick={() => window.open(`https://www.your-site.com/blog/blog_content.asp?slug=${form.slug}`, '_blank')}>
                    ↗ View Live
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ── RIGHT: Blog list ── */}
        <div className="ba-list-col">
          <div className="ba-card">
            <div className="ba-card-head">
              Existing Blog Posts
              <span className="od-count-badge" style={{ marginLeft: 8 }}>{blogs.length}</span>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="od-spinner" style={{ margin: '0 auto 8px' }} />Loading…
              </div>
            ) : blogs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No blog posts yet.</div>
            ) : (
              <div className="ba-blog-list">
                {blogs.map(blog => (
                  <div key={blog.BlogID}
                    className={`ba-blog-item ${form.blogID === String(blog.BlogID) ? 'active' : ''}`}>
                    {blog.BannerImage && (
                      <img src={BANNER_URL + blog.BannerImage} alt={blog.Title}
                        className="ba-blog-thumb"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="ba-blog-info">
                      <div className="ba-blog-title">{blog.Title}</div>
                      <div className="ba-blog-meta">
                        <span>{blog.Author}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{blog.Slug}</span>
                      </div>
                    </div>
                    <div className="ba-blog-actions">
                      <button className="ba-action-edit" onClick={() => editBlog(blog)}>✏️ Edit</button>
                      <a href={`https://www.your-site.com/blog/blog_content.asp?slug=${blog.Slug}`}
                        target="_blank" rel="noreferrer" className="ba-action-view">↗ View</a>
                      <button className="ba-action-delete" onClick={() => handleDelete(blog.BlogID)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
