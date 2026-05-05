import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function CreditCardModal({ orderId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/orders/${encodeURIComponent(orderId)}/cc-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setMsg('Failed to load'); setLoading(false); });
  }, [orderId]);

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>💳 Credit Card Info — #{orderId}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><div className="od-spinner" style={{ margin: '0 auto' }} /></div>
          ) : msg ? (
            <div className="ba-msg err">{msg}</div>
          ) : data ? (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-secondary)', width: '40%' }}>Card #</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{data.c_card || '—'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-secondary)' }}>CVV2</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{data.c_cvv2 || '—'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-secondary)' }}>Expiry</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    {data.exp_month && data.exp_year ? `${data.exp_month} / ${data.exp_year}` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No card info found</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="epm-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
