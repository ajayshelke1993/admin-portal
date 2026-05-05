import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function FraudIpModal({ ip, onClose }) {
  const [record, setRecord]     = useState(null);  // existing fraud record or null
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg]           = useState('');
  const [history, setHistory]   = useState([]);    // order attempts from this IP

  useEffect(() => {
    loadData();
  }, [ip]);

  const loadData = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/check?ip=${encodeURIComponent(ip)}`);
      const data = await res.json();
      setRecord(data.record || null);
      setHistory(data.history || []);
    } catch { setMsg('Failed to load IP data.'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!window.confirm(`Add ${ip} to fraud list?`)) return;
    setAdding(true);
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, person: 'admin' }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ IP added to fraud list'); loadData(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setAdding(false); }
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!window.confirm(`Remove ${ip} from fraud list?`)) return;
    setDeleting(true);
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fraud_id: record.fraud_id }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ IP removed from fraud list'); loadData(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const handleMarkSecondTime = async () => {
    if (!record) return;
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/second-offense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fraud_id: record.fraud_id }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Marked as 2nd offense'); loadData(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
  };

  const fmtDate = d => {
    try { return new Date(d).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return d || '—'; }
  };

  const isInFraud = !!record;

  return createPortal(
    <div className="fim-overlay" onClick={onClose}>
      <div className="fim-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fim-header">
          <div>
            <div className="fim-title">IP Address Info</div>
            <div className="fim-ip">{ip}</div>
          </div>
          <button className="fim-close" onClick={onClose}>✕</button>
        </div>

        {/* Status badge */}
        <div className={`fim-status-bar ${isInFraud ? 'fraud' : 'clean'}`}>
          {isInFraud ? (
            <>
              🚫 This IP is in the fraud list
              {record.secondtime === 'Y' && <span className="fim-2nd-badge">2nd Offense</span>}
              {record.user_delete && <span className="fim-user">Added by: {record.user_delete}</span>}
              {record.date_time  && <span className="fim-user">{fmtDate(record.date_time)}</span>}
            </>
          ) : (
            '✅ This IP is NOT in the fraud list'
          )}
        </div>

        <div className="fim-body">

          {loading ? (
            <div className="fim-loading"><div className="od-spinner" /> Loading IP data…</div>
          ) : (
            <>
              {/* External lookup links */}
              <div className="fim-section-head">IP Lookup</div>
              <div className="fim-links">
                <a href={`https://whatismyipaddress.com/ip/${ip}`} target="_blank" rel="noreferrer" className="fim-link-btn">🌐 WhatIsMyIP</a>
                <a href={`https://www.abuseipdb.com/check/${ip}`} target="_blank" rel="noreferrer" className="fim-link-btn">⚠️ AbuseIPDB</a>
                <a href={`https://ipinfo.io/${ip}`}               target="_blank" rel="noreferrer" className="fim-link-btn">📍 IPInfo</a>
                <a href={`https://www.ip2location.com/${ip}`}     target="_blank" rel="noreferrer" className="fim-link-btn">🗺 IP2Location</a>
              </div>

              {/* Actions */}
              <div className="fim-section-head">Fraud List Actions</div>
              <div className="fim-actions">
                {!isInFraud ? (
                  <button className="fim-btn-danger" onClick={handleAdd} disabled={adding}>
                    {adding ? 'Adding…' : '🚫 Add to Fraud List'}
                  </button>
                ) : (
                  <>
                    <button className="fim-btn-safe" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Removing…' : '✓ Remove from Fraud List'}
                    </button>
                    {record.secondtime !== 'Y' && (
                      <button className="fim-btn-warn" onClick={handleMarkSecondTime}>
                        ⚠️ Mark as 2nd Offense
                      </button>
                    )}
                  </>
                )}
              </div>

              {msg && (
                <div className={`fim-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>
              )}

              {/* Order history from this IP */}
              {history.length > 0 && (
                <>
                  <div className="fim-section-head">
                    Order Attempts from this IP
                    <span className="od-count-badge" style={{ marginLeft: 8 }}>{history.length}</span>
                  </div>
                  <div className="fim-history">
                    <table className="fim-table">
                      <thead>
                        <tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => (
                          <tr key={i}>
                            <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.order_number || h.CART_ID}</span></td>
                            <td style={{ fontSize: 11 }}>{fmtDate(h.TIME_IN)}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>${parseFloat(h.total_price || 0).toFixed(2)}</td>
                            <td>
                              {h.delete_fraud === 'Y'
                                ? <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>Deleted</span>
                                : <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>Active</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
