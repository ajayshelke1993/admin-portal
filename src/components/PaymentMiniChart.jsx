import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/PaymentChart.css';

const METHOD_COLORS = {
  'Credit Card': { color: '#4F6EF7', light: '#EEF1FE' },
  'PayPal':      { color: '#10B981', light: '#ECFDF5' },
  'Net Terms':   { color: '#F59E0B', light: '#FFFBEB' },
  'CreditKey':   { color: '#8B5CF6', light: '#F5F3FF' },
  'Amazon':      { color: '#FF9900', light: '#FFF8EC' },
  'Unknown':     { color: '#9CA3AF', light: '#F3F4F6' },
  'C':           { color: '#4F6EF7', light: '#EEF1FE' },
  'CK':          { color: '#8B5CF6', light: '#F5F3FF' },
  'P':           { color: '#10B981', light: '#ECFDF5' },
  'AC':          { color: '#FF9900', light: '#FFF8EC' },
};
const FALLBACK = [
  { color: '#EF4444', light: '#FEF2F2' },
  { color: '#06B6D4', light: '#ECFEFF' },
  { color: '#F97316', light: '#FFF7ED' },
];
const METHOD_LABELS = { C: 'Credit Card', CK: 'CreditKey', P: 'PayPal', AC: 'Amazon', AF: 'Affirm' };

function normalizeMethod(raw) {
  const t = (raw || 'Unknown').trim();
  return METHOD_LABELS[t.toUpperCase()] ?? t;
}
function getStyle(method, idx) {
  return METHOD_COLORS[method] ?? FALLBACK[idx % FALLBACK.length];
}
function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MiniPie({ slices, total, size = 130, hovered, onHover }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;

  // ── Single slice — SVG arc can't do a full circle, use a circle element instead
  if (slices.length === 1) {
    const s = slices[0];
    return (
      <svg width={size} height={size} style={{ flexShrink: 0, overflow: 'visible' }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill={s.color}
          stroke="var(--bg-card)" strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => onHover(0)}
          onMouseLeave={() => onHover(null)}
        />
        <text x={cx} y={cy}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fontWeight={700} fill="#fff"
          style={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
          100%
        </text>
      </svg>
    );
  }

  let cumAngle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const angle = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const midAngle = cumAngle - angle / 2;
    const labelR = r * 0.62;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const isHov = hovered === i;
    const dx = isHov ? Math.cos(midAngle) * 4 : 0;
    const dy = isHov ? Math.sin(midAngle) * 4 : 0;
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`, lx, ly, midAngle, dx, dy, ...s };
  });

  return (
    <svg width={size} height={size} style={{ flexShrink: 0, overflow: 'visible' }}>
      {paths.map((p, i) => (
        <g key={p.label}
          style={{ cursor: 'pointer', transition: 'transform .18s ease' }}
          transform={`translate(${p.dx},${p.dy})`}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
        >
          <path d={p.d} fill={p.color} stroke="var(--bg-card)" strokeWidth={2}
            opacity={hovered !== null && hovered !== i ? 0.45 : 1}
            style={{ transition: 'opacity .18s' }} />
          {(p.value / total) > 0.08 && (
            <text x={p.lx} y={p.ly}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight={700} fill="#fff"
              style={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
              {((p.value / total) * 100).toFixed(0)}%
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const PaymentMiniChart = ({ orders }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const { slices, total, totalOrders, avgOrder, referrals } = useMemo(() => {
    const map = {};
    const refMap = {};
    orders.forEach(o => {
      const m = normalizeMethod(o.payment_method);
      if (!map[m]) map[m] = { revenue: 0, orderNums: new Set() };
      map[m].revenue += o.Qty * o.Unit_Price;
      map[m].orderNums.add(o.order_number);
      const ref = (o.referral || 'Direct').trim() || 'Direct';
      if (!refMap[ref]) refMap[ref] = { orders: new Set(), revenue: 0 };
      refMap[ref].orders.add(o.order_number);
      refMap[ref].revenue += o.Qty * o.Unit_Price;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
    const slices = sorted.map(([label, v], i) => ({
      label, value: +v.revenue.toFixed(2), orders: v.orderNums.size, ...getStyle(label, i),
    }));
    const total = slices.reduce((a, s) => a + s.value, 0);
    const totalOrders = slices.reduce((a, s) => a + s.orders, 0);
    const avgOrder = totalOrders > 0 ? total / totalOrders : 0;
    const referrals = Object.entries(refMap)
      .map(([site, data]) => ({ site, orders: data.orders.size, revenue: data.revenue }))
      .sort((a, b) => b.orders - a.orders);
    return { slices, total, totalOrders, avgOrder, referrals };
  }, [orders]);

  if (slices.length === 0) return null;

  const hov = hovered !== null ? slices[hovered] : null;

  return (
    <div className="pc-mini-wrap" onClick={() => navigate('/payment-chart')}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate('/payment-chart')}
      title="Open full payment analytics">
      <div className="pc-mini-topbar">
        <div>
          <span className="pc-mini-title">Payment Options</span>
          <span className="pc-mini-cta">View full analytics →</span>
        </div>
        <div className="pc-mini-stats-row">
          <div className="pc-mini-stat">
            <span className="pc-mini-stat-label">Avg / Order</span>
            <span className="pc-mini-stat-val">${fmt(avgOrder)}</span>
          </div>
          <div className="pc-mini-stat-divider" />
          <div className="pc-mini-stat">
            <span className="pc-mini-stat-label">Orders</span>
            <span className="pc-mini-stat-val">{totalOrders}</span>
          </div>
          <div className="pc-mini-stat-divider" />
          <div className="pc-mini-stat">
            <span className="pc-mini-stat-label">Total Revenue</span>
            <span className="pc-mini-stat-val accent">${fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="pc-mini-body">
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <MiniPie slices={slices} total={total} size={130} hovered={hovered} onHover={setHovered} />
          {hov && (
            <div className="pc-mini-tooltip" style={{ borderColor: hov.color }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: hov.color }}>{hov.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>${fmt(hov.value)}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{hov.orders} orders</span>
            </div>
          )}
        </div>
        <div className="pc-mini-legend-grid">
          {slices.map((s, i) => (
            <div key={s.label} className="pc-mini-leg-item"
              style={{ opacity: hovered !== null && hovered !== i ? 0.4 : 1 }}
              onMouseEnter={e => { e.stopPropagation(); setHovered(i); }}
              onMouseLeave={e => { e.stopPropagation(); setHovered(null); }}>
              <span className="pc-mini-leg-dot" style={{ background: s.color }} />
              <div className="pc-mini-leg-info">
                <span className="pc-mini-leg-name">{s.label}</span>
                <span className="pc-mini-leg-val" style={{ color: s.color }}>${fmt(s.value)}</span>
                <span className="pc-mini-leg-pct">{s.orders} orders</span>
                <span className="pc-mini-leg-pct">{((s.value / total) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="pc-mini-ref-section">
          <div className="pc-mini-ref-title">Referral Sites</div>
          <div className="pc-mini-ref-grid">
            {referrals.map(r => {
              const barPct = (r.orders / referrals[0].orders) * 100;
              return (
                <div key={r.site} className="pc-mini-ref-row" style={{
                  display: 'grid', gridTemplateColumns: '140px 1fr 30px 70px',
                  alignItems: 'center', gap: 8 }}>
                  <span className="pc-mini-ref-site" title={r.site}>
                    {r.site.length > 30 ? r.site.slice(0, 30) + '…' : r.site}
                  </span>
                  <div className="pc-mini-ref-bar-wrap">
                    <div className="pc-mini-ref-bar" style={{ width: `${barPct}%`, background: 'var(--accent)' }} />
                  </div>
                  <span style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {r.orders}
                  </span>
                  <span style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
                    ${fmt(r.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMiniChart;
