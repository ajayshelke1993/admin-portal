import { useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://192.168.88.77:5000';

const C = {
  green:'#1D9E75', red:'#E24B4A', amber:'#EF9F27', blue:'#378ADD',
  border:'#e5e7eb', text:'#111827', muted:'#6b7280', bg:'#ffffff', bg2:'#f9fafb',
};

const fmt   = n => (n == null ? '–' : Number(n).toLocaleString());
const pct   = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '–';
const diff  = (a, b) => { const d = a - b; return (d >= 0 ? '+' : '') + Number(d).toLocaleString(); };

const BADGE = {
  ok:      { bg:'#dcfce7', color:'#166534', label:'OK'      },
  low:     { bg:'#fef9c3', color:'#854d0e', label:'Low'     },
  alert:   { bg:'#fee2e2', color:'#991b1b', label:'Alert'   },
  success: { bg:'#dcfce7', color:'#166534', label:'Success' },
  failed:  { bg:'#fee2e2', color:'#991b1b', label:'Failed'  },
  running: { bg:'#fef9c3', color:'#854d0e', label:'Running' },
  unknown: { bg:'#f3f4f6', color:'#374151', label:'–'       },
};
function Badge({ type }) {
  const b = BADGE[type] || BADGE.unknown;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:6, background:b.bg, color:b.color, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:b.color }} />{b.label}
    </span>
  );
}
function Card({ title, sub, children, style={} }) {
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', ...style }}>
      {title && <div style={{ fontWeight:600, fontSize:14, color:C.text, marginBottom:2 }}>{title}</div>}
      {sub   && <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>{sub}</div>}
      {children}
    </div>
  );
}
function MetricCard({ label, value, sub, highlight }) {
  return (
    <div style={{ background:C.bg2, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600, color: highlight || C.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{sub}</div>}
    </div>
  );
}
function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:C.muted, margin:'24px 0 10px' }}>{children}</div>;
}
function ChartLegend({ items }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:10, fontSize:11, color:C.muted }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
          <i style={{ width:10, height:10, borderRadius:2, background:color, display:'inline-block' }} />{label}
        </span>
      ))}
    </div>
  );
}

function loadChartJS() {
  if (window.Chart) return Promise.resolve(window.Chart);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => resolve(window.Chart);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function useChart(canvasRef, buildConfig, deps) {
  useEffect(() => {
    if (!canvasRef.current) return;
    let chart;
    loadChartJS().then(Chart => {
      const existing = Chart.getChart(canvasRef.current);
      if (existing) existing.destroy();
      chart = new Chart(canvasRef.current, buildConfig());
    });
    return () => { if (chart) chart.destroy(); };
  }, deps); // eslint-disable-line
}

// ── Live vs Backup comparison table ───────────────────────────────
function SourceCompareTable({ data, loading, error }) {
  return (
    <div>
      {loading && <div style={{ padding:'20px 0', color:C.muted, fontSize:13 }}>Loading...</div>}
      {error   && <div style={{ padding:'20px 0', color:C.red,  fontSize:13 }}>Error: {error}</div>}
      {!loading && !error && (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>
                {['Source ID','Live','Backup','Diff','% of Backup'].map(h => (
                  <th key={h} style={{ textAlign: h==='Source ID'?'left':'right', padding:'6px 8px', fontSize:11, fontWeight:600, color:C.muted, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data||[]).length === 0
                ? <tr><td colSpan={5} style={{ padding:'20px 0', textAlign:'center', color:C.muted }}>No records</td></tr>
                : (data||[]).map((r, i) => {
                    const diffVal = r.live - r.backup;
                    const isLow   = r.backup > 0 && (r.live / r.backup) < 0.95;
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: isLow ? '#fff5f5' : 'transparent' }}>
                        <td style={{ padding:'8px', color:C.text, fontWeight:500 }}>{r.sourceid}</td>
                        <td style={{ padding:'8px', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(r.live)}</td>
                        <td style={{ padding:'8px', textAlign:'right', color:C.muted, fontVariantNumeric:'tabular-nums' }}>{fmt(r.backup)}</td>
                        <td style={{ padding:'8px', textAlign:'right', color: diffVal < 0 ? C.red : diffVal > 0 ? C.green : C.muted, fontVariantNumeric:'tabular-nums', fontWeight:600 }}>
                          {diff(r.live, r.backup)}
                        </td>
                        <td style={{ padding:'8px', textAlign:'right' }}>
                          <Badge type={isLow ? 'alert' : 'ok'} />
                          <span style={{ marginLeft:6, color:C.muted }}>{pct(r.live, r.backup)}</span>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OperationsReport() {
  const [now, setNow]               = useState(new Date());
  const [kpi, setKpi]               = useState(null);
  const [sqlDonut, setSqlDonut]     = useState([]);
  const [sqlJobs, setSqlJobs]       = useState([]);
  const [sqlHistory, setSqlHistory]       = useState([]);
  const [sqlDonutDev, setSqlDonutDev]     = useState([]);
  const [sqlHistoryDev, setSqlHistoryDev] = useState([]);
  const [sqlJobsDev,    setSqlJobsDev]    = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [loading, setLoading]       = useState({});
  const [errors, setErrors]         = useState({});

  const refDonut   = useRef(null);
  const refHistory    = useRef(null);
  const refDonutDev   = useRef(null);
  const refHistoryDev = useRef(null);
  const refBar     = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async (key, endpoint, setter) => {
    setLoading(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: null }));
    try {
      const res = await fetch(`${API}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setter(await res.json());
    } catch (e) {
      setErrors(p => ({ ...p, [key]: e.message }));
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  }, []);

  useEffect(() => {
    load('kpi',        '/api/reports/kpi',                setKpi);
    load('sqlDonut',   '/api/reports/sql-jobs-today',     setSqlDonut);
    load('sqlJobs',    '/api/reports/sql-jobs-recent',    setSqlJobs);
    load('sqlHistory',    '/api/reports/sql-jobs-history',     setSqlHistory);
    load('sqlDonutDev',   '/api/reports/sql-jobs-today-dev',    setSqlDonutDev);
    load('sqlHistoryDev', '/api/reports/sql-jobs-history-dev', setSqlHistoryDev);
    load('sqlJobsDev',    '/api/reports/sql-jobs-recent-dev',  setSqlJobsDev);
    load('source',     '/api/reports/source-comparison',  setSourceData);
  }, [load]);

  // ── Chart: SQL donut ───────────────────────────────────────────
  useChart(refDonut, () => ({
    type: 'doughnut',
    data: {
      labels: sqlDonut.map(r => r.name),
      datasets: [{ data:sqlDonut.map(r=>r.value), backgroundColor:[C.green, C.red, C.amber], borderWidth:0, hoverOffset:4 }],
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{ position:'right', labels:{ color:C.muted, font:{size:11}, boxWidth:10, boxHeight:10, padding:10 } } },
    },
  }), [sqlDonut]);

  // ── Chart: SQL 30-day history ──────────────────────────────────
  useChart(refHistory, () => ({
    type: 'line',
    data: {
      labels: sqlHistory.map(r => r.day),
      datasets: [
        { label:'Total runs', data:sqlHistory.map(r=>r.total_runs), borderColor:C.blue,  backgroundColor:C.blue+'22',  fill:true, tension:0.35, borderWidth:1.5, pointRadius:0 },
        { label:'Failed',     data:sqlHistory.map(r=>r.failed),     borderColor:C.red,   backgroundColor:C.red+'22',   fill:true, tension:0.35, borderWidth:1.5, pointRadius:0, borderDash:[4,3] },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ ticks:{ color:C.muted, font:{size:10}, maxRotation:45, autoSkip:true, maxTicksLimit:10 }, grid:{ display:false } },
        y:{ ticks:{ color:C.muted, font:{size:11} }, grid:{ color:'rgba(0,0,0,.06)' }, beginAtZero:true },
      },
    },
  }), [sqlHistory]);

  // ── Chart: live vs backup grouped bar by sourceid ──────────────
  useEffect(() => {
    if (!refDonutDev.current || !sqlDonutDev.length) return;
    let chart;
    loadChartJS().then(Chart => {
      const existing = Chart.getChart(refDonutDev.current);
      if (existing) existing.destroy();
      chart = new Chart(refDonutDev.current, {
        type: 'doughnut',
        data: {
          labels: sqlDonutDev.map(r => r.name),
          datasets: [{ data: sqlDonutDev.map(r => r.value), backgroundColor:[C.green, C.red, C.amber], borderWidth:0, hoverOffset:4 }],
        },
        options: {
          responsive:true, maintainAspectRatio:false, cutout:'65%',
          plugins:{ legend:{ position:'right', labels:{ color:C.muted, font:{size:11}, boxWidth:10, boxHeight:10, padding:10 } } },
        },
      });
    });
    return () => { if (chart) chart.destroy(); };
  }, [sqlDonutDev]);

  useEffect(() => {
    if (!refHistoryDev.current || !sqlHistoryDev.length) return;
    let chart;
    loadChartJS().then(Chart => {
      const existing = Chart.getChart(refHistoryDev.current);
      if (existing) existing.destroy();
      chart = new Chart(refHistoryDev.current, {
        type: 'line',
        data: {
          labels: sqlHistoryDev.map(r => r.day),
          datasets: [
            { label:'Total runs', data:sqlHistoryDev.map(r=>r.total_runs), borderColor:C.blue, backgroundColor:C.blue+'22', fill:true, tension:0.35, borderWidth:1.5, pointRadius:0 },
            { label:'Failed',     data:sqlHistoryDev.map(r=>r.failed),     borderColor:C.red,  backgroundColor:C.red+'22',  fill:true, tension:0.35, borderWidth:1.5, pointRadius:0, borderDash:[4,3] },
          ],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            x:{ ticks:{ color:C.muted, font:{size:10}, maxRotation:45, autoSkip:true, maxTicksLimit:10 }, grid:{ display:false } },
            y:{ ticks:{ color:C.muted, font:{size:11} }, grid:{ color:'rgba(0,0,0,.06)' }, beginAtZero:true },
          },
        },
      });
    });
    return () => { if (chart) chart.destroy(); };
  }, [sqlHistoryDev]);

  useChart(refBar, () => ({
    type: 'bar',
    data: {
      labels: sourceData.map(r => r.sourceid),
      datasets: [
        { label:'Live',   data:sourceData.map(r=>r.live),   backgroundColor:C.blue,  borderRadius:3, barPercentage:0.7 },
        { label:'Backup', data:sourceData.map(r=>r.backup), backgroundColor:C.green, borderRadius:3, barPercentage:0.7 },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ ticks:{ color:C.muted, font:{size:11}, maxRotation:30, autoSkip:false }, grid:{ display:false } },
        y:{ ticks:{ color:C.muted, font:{size:11} }, grid:{ color:'rgba(0,0,0,.06)' }, beginAtZero:true },
      },
    },
  }), [sourceData]);

  const K = kpi || {};
  const totalDiff = K.total_diff || 0;

  return (
    <div style={{ padding:'0 0 40px', fontFamily:'inherit' }}>

      {/* top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:16, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:600, color:C.text, margin:0 }}>Operations Reports</h2>
        <span style={{ fontSize:12, color:C.muted }}>
          {now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} · {now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </span>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:10, marginBottom:20 }}>
        <MetricCard label="SQL jobs — live"     value={loading.kpi?'…':fmt(K.sql_total)}        sub={`${fmt(K.sql_succeeded)} succeeded · ${fmt(K.sql_failed)} failed`} />
        <MetricCard label="SQL jobs — dev"      value={loading.kpi?'…':fmt(K.sql_dev_total)}    sub={`${fmt(K.sql_dev_succeeded)} succeeded · ${fmt(K.sql_dev_failed)} failed`} />
        <MetricCard label="Live_website rows" value={loading.kpi?'…':fmt(K.live_total)}   sub="Live" />
        <MetricCard label="Dev Server rows"     value={loading.kpi?'…':fmt(K.backup_total)} sub="Dev" />
        <MetricCard label="Live vs Backup diff"
          value={loading.kpi ? '…' : (totalDiff >= 0 ? '+' : '') + fmt(totalDiff)}
          highlight={totalDiff < 0 ? C.red : totalDiff > 0 ? C.green : C.muted}
          sub={totalDiff < 0 ? '⚠️ Live has fewer rows than backup' : totalDiff > 0 ? '✓ Live has more rows' : 'Counts match'} />
      </div>

      {/* SQL monitoring */}
      <SectionLabel>SQL Agent Jobs</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:12, marginBottom:12 }}>
        <Card title="SQL agent jobs — today" sub="Success rate and recent runs">
          {loading.sqlDonut
            ? <div style={{ color:C.muted, fontSize:13, height:140, display:'flex', alignItems:'center' }}>Loading…</div>
            : <div style={{ position:'relative', height:140 }}><canvas ref={refDonut} /></div>
          }
          {!loading.sqlJobs && (
            <ul style={{ listStyle:'none', padding:0, margin:'12px 0 0' }}>
              {(sqlJobs||[]).map((j,i) => (
                <li key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:i<sqlJobs.length-1?`1px solid ${C.border}`:'none', fontSize:12 }}>
                  <span style={{ fontWeight:500, color:C.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>{j.name}</span>
                  <span style={{ color:C.muted, fontSize:11, marginRight:8, whiteSpace:'nowrap' }}>{j.run_time}</span>
                  <Badge type={j.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="SQL job run history — past 30 days" sub="Total runs and failure rate trend">
          <ChartLegend items={[{ color:C.blue, label:'Total runs' },{ color:C.red, label:'Failed' }]} />
          {loading.sqlHistory
            ? <div style={{ color:C.muted, fontSize:13, height:160, display:'flex', alignItems:'center' }}>Loading…</div>
            : <div style={{ position:'relative', height:160 }}><canvas ref={refHistory} /></div>
          }
        </Card>
      </div>

      {/* Dev SQL monitoring */}
      <SectionLabel>SQL Agent Jobs — Dev Server</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:12, marginBottom:12 }}>
        <Card title="SQL agent jobs — dev today" sub="Latest run per job">
          {loading.sqlJobsDev
            ? <div style={{ color:C.muted, fontSize:13, padding:'20px 0' }}>Loading…</div>
            : <div style={{ maxHeight:320, overflowY:'auto' }}>
                <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                  {sqlJobsDev.map((j,i) => (
                    <li key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<sqlJobsDev.length-1?`1px solid ${C.border}`:'none', fontSize:12 }}>
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8, fontWeight:600, color: j.run_status===1 ? C.green : j.run_status===0 ? C.red : C.amber }}>
                        {j.run_status===1 ? '✓' : j.run_status===0 ? '✗' : '●'} {j.name}
                      </span>
                      <span style={{ color:C.muted, fontSize:11, whiteSpace:'nowrap', marginRight:8 }}>{j.run_date ? new Date(j.run_date).toLocaleDateString('en-US',{month:'numeric',day:'numeric'}) : ''}</span>
                      <span style={{ color:C.muted, fontSize:11, whiteSpace:'nowrap' }}>{j.run_time}</span>
                    </li>
                  ))}
                </ul>
              </div>
          }
        </Card>
        <Card title="SQL job run history — dev past 30 days" sub="Total runs and failure rate trend">
          <ChartLegend items={[{ color:C.blue, label:'Total runs' },{ color:C.red, label:'Failed' }]} />
          {loading.sqlHistoryDev
            ? <div style={{ color:C.muted, fontSize:13, height:160, display:'flex', alignItems:'center' }}>Loading…</div>
            : <div style={{ position:'relative', height:160 }}><canvas ref={refHistoryDev} /></div>
          }
        </Card>
      </div>

      {/* Data comparison */}
      <SectionLabel>Live vs Dev  — by sourceid</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.2fr) minmax(0,0.8fr)', gap:12, marginBottom:12 }}>
        <Card title="Row count comparison by source" sub="Live vs Dev · flags below 95%">
          <SourceCompareTable data={sourceData} loading={loading.source} error={errors.source} />
        </Card>
        <Card title="Live vs Backup — bar chart" sub="Count per sourceid">
          <ChartLegend items={[{ color:C.blue, label:'markedup_items' },{ color:C.green, label:'tblproducts' }]} />
          {loading.source
            ? <div style={{ color:C.muted, fontSize:13, height:220, display:'flex', alignItems:'center' }}>Loading…</div>
            : <div style={{ position:'relative', height:220 }}><canvas ref={refBar} /></div>
          }
        </Card>
      </div>

    </div>
  );
}
