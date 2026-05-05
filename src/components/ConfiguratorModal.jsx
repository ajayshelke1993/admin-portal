import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function ConfiguratorModal({ partNo, vendorId, configId, configName, onClose, onSaved }) {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [removing, setRemoving]     = useState(false);
  const [msg, setMsg]               = useState('');
  const [configurators, setConfigurators] = useState([]);
  const [selectedCid, setSelectedCid]     = useState('0');

  useEffect(() => { loadConfigurators(); }, []);

  const loadConfigurators = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/configurators`);
      const data = await res.json();
      setConfigurators(data || []);
      if (configId) setSelectedCid(String(configId));
    } catch { setMsg('✗ Failed to load configurators'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/configurator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid: selectedCid }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(selectedCid === '0' ? '✓ Configurator removed' : '✓ Configurator added');
        setTimeout(() => { onSaved?.(); onClose(); }, 800);
      } else setMsg('✗ ' + (data.error || 'Save failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove configurator from this part?')) return;
    setRemoving(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/parts/${vendorId}/${partNo}/configurator`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid: configId }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Configurator removed');
        setTimeout(() => { onSaved?.(); onClose(); }, 800);
      } else setMsg('✗ ' + (data.error || 'Remove failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setRemoving(false); }
  };

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>⚙️ Configurator — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div className="ep-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Current configurator */}
            {configId && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>Current:</strong> {configName || configId}
                </span>
                <button
                  className="epm-btn"
                  style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={handleRemove}
                  disabled={removing}
                >
                  {removing ? '…' : '🗑 Remove'}
                </button>
              </div>
            )}

            {configurators.length === 0 ? (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: 16, color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
                No configurators have been created yet.
              </div>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Select Configurator
                  </label>
                  <select
                    className="portal-input no-icon"
                    value={selectedCid}
                    onChange={e => setSelectedCid(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="0">Select a Configurator</option>
                    {configurators.map(c => (
                      <option key={c.config_id} value={c.config_id}>
                        {c.config_name?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {msg && <div className={`ba-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="epm-btn" onClick={onClose}>Cancel</button>
                  <button
                    className="epm-btn-primary"
                    onClick={handleSave}
                    disabled={saving || selectedCid === '0'}
                  >
                    {saving ? 'Saving…' : '✓ Add This Configurator'}
                  </button>
                </div>
              </>
            )}

            {!configurators.length && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="epm-btn" onClick={onClose}>Close</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
