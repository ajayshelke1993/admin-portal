import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function PriceArchiveModal({ partNo, vendorId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeChart, setActiveChart] = useState('price');

  useEffect(() => { loadArchive(); }, []);

  const loadArchive = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/prices/archive?partNo=${encodeURIComponent(partNo)}&vendorId=${vendorId}`);
      const json = await res.json();
      setData(json);
    } catch { setError('Failed to load price archive'); }
    finally { setLoading(false); }
  };

  const CHARTS = [
    { key: 'price',   label: 'Price',        color: '#4F6EF7' },
    { key: 'search',  label: 'Search Price',  color: '#10B981' },
    { key: 'united',  label: 'United Price',  color: '#F59E0B' },
    { key: 'cost',    label: 'Cost',          color: '#EF4444' },
  ];

  return createPortal(
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" style={{ maxWidth: 860, width: '95vw' }} onClick={e => e.stopPropagation()}>
        <div className="ep-modal-header">
          <span>📈 Price Archive — {partNo}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ep-modal-body">
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading price history…</div>
          ) : error ? (
            <div style={{ padding: 16, color: 'var(--danger)' }}>{error}</div>
          ) : !data || data.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No price history found for this product.</div>
          ) : (
            <>
              {/* Chart selector tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {CHARTS.map(c => (
                  <button key={c.key}
                    onClick={() => setActiveChart(c.key)}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', border: '1.5px solid',
                      background: activeChart === c.key ? c.color : 'var(--bg-base)',
                      color: activeChart === c.key ? '#fff' : 'var(--text-secondary)',
                      borderColor: activeChart === c.key ? c.color : 'var(--border)',
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <MiniChart
                data={data}
                field={activeChart}
                color={CHARTS.find(c => c.key === activeChart)?.color}
              />

              {/* Data table */}
              <div style={{ marginTop: 20, maxHeight: 240, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border)' }}>
                      {['Date', 'Time', 'Price', 'Search Price', 'United Price', 'Cost', 'Source'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.3px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice().reverse().map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 12px' }}>{new Date(row.date_time).toLocaleDateString()}</td>
                        <td style={{ padding: '7px 12px', color: 'var(--text-muted)', fontSize: 11 }}>
                          {new Date(row.date_time).getHours() >= 12 ? '🌙 Evening' : '☀️ Morning'}
                        </td>
                        {['price','price_search','price_united','cost'].map(f => (
                          <td key={f} style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            ${parseFloat(row[f] || 0).toFixed(2)}
                          </td>
                        ))}
                        <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{row.sourceid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function MiniChart({ data, field, color }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PAD = { top: 20, right: 20, bottom: 40, left: 60 };

    ctx.clearRect(0, 0, W, H);

    const fieldMap = { price: 'price', search: 'price_search', united: 'price_united', cost: 'cost' };
    const key = fieldMap[field] || 'price';
    const values = data.map(d => parseFloat(d[key] || 0));
    const dates  = data.map(d => new Date(d.date_time));

    const minV = Math.min(...values) * 0.95;
    const maxV = Math.max(...values) * 1.05;
    const range = maxV - minV || 1;

    const xScale = (i) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
    const yScale = (v) => PAD.top + (1 - (v - minV) / range) * (H - PAD.top - PAD.bottom);

    // Grid lines
    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (i / 4) * (H - PAD.top - PAD.bottom);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      const val = maxV - (i / 4) * range;
      ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('$' + val.toFixed(2), PAD.left - 6, y + 4);
    }

    // Line
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = xScale(i), y = yScale(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    values.forEach((v, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xScale(i), yScale(v), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // X axis labels
    ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 8));
    dates.forEach((d, i) => {
      if (i % step === 0) {
        ctx.fillText(`${d.getMonth()+1}/${d.getDate()}`, xScale(i), H - PAD.bottom + 16);
      }
    });
  }, [data, field, color]);

  return (
    <canvas ref={canvasRef} width={820} height={220}
      style={{ width: '100%', height: 220, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff' }} />
  );
}
