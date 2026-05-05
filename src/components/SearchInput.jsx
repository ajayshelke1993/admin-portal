import { useState, useEffect, useRef } from 'react';

/**
 * Reusable SearchInput with localStorage history dropdown
 * 
 * Props:
 *   storageKey   — unique key per page e.g. 'search_parts', 'search_phone'
 *   value        — controlled value
 *   onChange     — called with new string value
 *   onSearch     — called when user submits (Enter or clicks result)
 *   placeholder  — input placeholder
 *   sanitize     — optional fn to sanitize input (e.g. strip special chars)
 *   className    — extra class on wrapper
 */
export default function SearchInput({
  storageKey,
  value,
  onChange,
  onSearch,
  placeholder = 'Search…',
  sanitize,
  className = '',
}) {
  const [history,     setHistory]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  });
  const [showDrop,    setShowDrop]    = useState(false);
  const inputRef = useRef(null);

  // Save to history when search is triggered
  const saveToHistory = (val) => {
    if (!val?.trim()) return;
    const updated = [val, ...history.filter(h => h !== val)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleSubmit = (val) => {
    const v = val ?? value;
    saveToHistory(v);
    setShowDrop(false);
    onSearch?.(v);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const clean = sanitize ? sanitize(raw) : raw;
    onChange(clean);
    setShowDrop(true);
  };

  const handleSelect = (h) => {
    onChange(h);
    handleSubmit(h);
    inputRef.current?.focus();
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem(storageKey);
  };

  // Filter history to match current input
  const filtered = value
    ? history.filter(h => h.toLowerCase().startsWith(value.toLowerCase()))
    : history;

  return (
    <form
      style={{ position: 'relative', width: '100%' }}
      className={className}
      onSubmit={e => { e.preventDefault(); handleSubmit(); }}
      autoComplete="off"
    >
      <div className="search-wrap">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="portal-input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          onKeyDown={e => { if (e.key === 'Escape') setShowDrop(false); }}
        />
        {value && (
          <button type="button"
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
              fontSize:16, lineHeight:1, padding:0 }}>
            ✕
          </button>
        )}
      </div>

      {/* History dropdown */}
      {showDrop && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
          marginTop: 2, overflow: 'hidden',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'5px 10px', borderBottom:'1px solid var(--border)',
            fontSize:11, color:'var(--text-muted)' }}>
            <span>Recent searches</span>
            <button type="button" onClick={clearHistory}
              style={{ background:'none', border:'none', cursor:'pointer',
                color:'var(--text-muted)', fontSize:11, padding:0 }}>
              Clear
            </button>
          </div>
          {filtered.map((h, i) => (
            <div key={i}
              onMouseDown={() => handleSelect(h)}
              style={{ padding:'8px 12px', fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', gap:8,
                background: 'transparent',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color:'var(--text-muted)', fontSize:12 }}>🕐</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}

      <button type="submit" style={{ display:'none' }} />
    </form>
  );
}
