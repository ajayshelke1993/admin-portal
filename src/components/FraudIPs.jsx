import { useState } from 'react';
import './styles/globals.css';
import './styles/FraudIpModal.css';
import './styles/FraudIPs.css';
import SearchInput from './SearchInput';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function FraudIPs() {
  const [searchIp, setSearchIp]     = useState('');
  const [newIp, setNewIp]           = useState('');
  const [record, setRecord]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [searched, setSearched]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [adding, setAdding]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [msg, setMsg]               = useState('');
  const [addMsg, setAddMsg]         = useState('');

  const [fraudList, setFraudList]   = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  const [yearFilter, setYearFilter]   = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');

  const fmtDate = d => {
    try { return new Date(d).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return d || '—'; }
  };

  const handleSearch = async (ipToSearch) => {
    const ip = (ipToSearch || searchIp).trim();
    if (!ip) return;
    setLoading(true); setMsg(''); setSearched(false);
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/check?ip=${encodeURIComponent(ip)}`);
      const data = await res.json();
      setRecord(data.record || null);
      setHistory(data.history || []);
      setSearchIp(ip);
      setSearched(true);
    } catch { setMsg('Failed to load IP data.'); }
    finally { setLoading(false); }
  };

  const reload = () => handleSearch(searchIp);

  const handleAdd = async (ip) => {
    const ipToAdd = (ip || newIp).trim();
    if (!ipToAdd) return;
    if (!window.confirm(`Add ${ipToAdd} to fraud list?`)) return;
    setAdding(true); setAddMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipToAdd, person: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        setAddMsg('✓ ' + ipToAdd + ' added to fraud list');
        setNewIp('');
        if (ip === searchIp) reload();
        if (listLoaded) loadFraudList();
      } else setAddMsg('✗ ' + (data.error || 'Failed'));
    } catch { setAddMsg('✗ Network error'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (fraud_id) => {
    if (!window.confirm('Remove this IP from fraud list?')) return;
    setDeleting(true); setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/delete`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fraud_id }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ IP removed from fraud list'); reload(); if (listLoaded) loadFraudList(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
    finally { setDeleting(false); }
  };

  const handleSecondOffense = async (fraud_id) => {
    setMsg('');
    try {
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/second-offense`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fraud_id }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Marked as 2nd offense'); reload(); }
      else setMsg('✗ ' + (data.error || 'Failed'));
    } catch { setMsg('✗ Network error'); }
  };

  const loadFraudList = async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter)  params.set('year',     yearFilter);
      if (monthFilter) params.set('month',    monthFilter);
      if (dateFrom)    params.set('dateFrom', dateFrom);
      if (dateTo)      params.set('dateTo',   dateTo);
      const res  = await fetch(`${BASE_URL}/api/fraud-ip/attempts?${params}`);
      const data = await res.json();
      setFraudList(data || []);
      setListLoaded(true);
    } catch {}
    finally { setListLoading(false); }
  };

  const clearFilters = () => {
    setYearFilter(''); setMonthFilter(''); setDateFrom(''); setDateTo('');
  };

  const isInFraud = !!record;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>Fraud IP Management</h1>
          <div className="page-header-sub">Search, add and manage fraud IP addresses</div>
        </div>
      </div>

      <div className="fip-layout">
        <div className="fip-sidebar">

          {/* Search */}
          <div className="fip-card">
            <div className="fip-card-head">🔍 Search IP</div>
            <div className="fip-card-body">
              <div className="fip-field">
                <SearchInput
                  storageKey="search_fraud_ip"
                  value={searchIp}
                  onChange={setSearchIp}
                  onSearch={v => { setSearchIp(v); handleSearch(v); }}
                  placeholder="Enter IP address…"
                />
                <button className="fip-btn-search" onClick={() => handleSearch()} disabled={loading}>
                  {loading ? '…' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Add */}
          <div className="fip-card">
            <div className="fip-card-head">🚫 Add IP to Fraud List</div>
            <div className="fip-card-body">
              <div className="fip-field">
                <SearchInput
                  storageKey="search_fraud_ip_add"
                  value={newIp}
                  onChange={setNewIp}
                  onSearch={v => { setNewIp(v); }}
                  placeholder="Enter IP to block…"
                />
                <button className="fip-btn-danger" onClick={() => handleAdd()} disabled={adding || !newIp.trim()}>
                  {adding ? '…' : 'Add'}
                </button>
              </div>
              {addMsg && <div className={`fip-msg ${addMsg.startsWith('✓') ? 'ok' : 'err'}`}>{addMsg}</div>}
            </div>
          </div>

          {/* Filter */}
          <div className="fip-card">
            <div className="fip-card-head">📊 Fraud Attempts Filter</div>
            <div className="fip-card-body">
              {/* Show year/month only when no date range active */}
              {!dateFrom && !dateTo && (
                <>
                  <div className="fip-field-group">
                    <label className="fip-label">Year</label>
                    <select className="fip-select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                      <option value="">All Years</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="fip-field-group">
                    <label className="fip-label">Month</label>
                    <select className="fip-select" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                      <option value="">All Months</option>
                      {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Date range — hides year/month when used */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                <label className="fip-label" style={{ marginBottom: 6, display: 'block', fontWeight: 700 }}>
                  {!dateFrom && !dateTo ? '— or Date Range —' : '📅 Date Range'}
                </label>
                {/* Show year/month only when no date range active */}
                {!yearFilter && !monthFilter && (
                  <>
                    <div className="fip-field-group">
                      <label className="fip-label">From</label>
                      <input type="date" className="fip-select" value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div className="fip-field-group">
                      <label className="fip-label">To</label>
                      <input type="date" className="fip-select" value={dateTo}
                        onChange={e => setDateTo(e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="fip-btn-primary" onClick={loadFraudList} disabled={listLoading} style={{ flex: 1 }}>
                  {listLoading ? 'Loading…' : 'Load Fraud Attempts'}
                </button>
                {(yearFilter || monthFilter || dateFrom || dateTo) && (
                  <button className="fip-btn-search" onClick={clearFilters} title="Clear filters">✕</button>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="fip-results">

          {searched && (
            <div className="fip-card" style={{ marginBottom: 20 }}>
              <div className={`fim-status-bar ${isInFraud ? 'fraud' : 'clean'}`} style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: '1.5px solid var(--border)' }}>
                {isInFraud ? (
                  <>
                    🚫 <strong>{searchIp}</strong> is in the fraud list
                    {record.secondtime === 'Y' && <span className="fim-2nd-badge">2nd Offense</span>}
                    {record.user_delete && <span className="fim-user">Added by: {record.user_delete}</span>}
                    {record.date_time   && <span className="fim-user">{fmtDate(record.date_time)}</span>}
                  </>
                ) : (
                  <>✅ <strong>{searchIp}</strong> is NOT in the fraud list</>
                )}
              </div>
              <div className="fip-card-body">
                <div className="fip-section-label">IP Lookup</div>
                <div className="fim-links" style={{ marginBottom: 16 }}>
                  <a href={`https://whatismyipaddress.com/ip/${searchIp}`} target="_blank" rel="noreferrer" className="fim-link-btn">🌐 WhatIsMyIP</a>
                  <a href={`https://www.abuseipdb.com/check/${searchIp}`} target="_blank" rel="noreferrer" className="fim-link-btn">⚠️ AbuseIPDB</a>
                  <a href={`https://ipinfo.io/${searchIp}`}               target="_blank" rel="noreferrer" className="fim-link-btn">📍 IPInfo</a>
                  <a href={`https://www.ip2location.com/${searchIp}`}     target="_blank" rel="noreferrer" className="fim-link-btn">🗺 IP2Location</a>
                </div>
                <div className="fip-section-label">Actions</div>
                <div className="fim-actions" style={{ marginBottom: 12 }}>
                  {!isInFraud ? (
                    <button className="fim-btn-danger" onClick={() => handleAdd(searchIp)} disabled={adding}>
                      {adding ? 'Adding…' : '🚫 Add to Fraud List'}
                    </button>
                  ) : (
                    <>
                      <button className="fim-btn-safe" onClick={() => handleDelete(record.fraud_id)} disabled={deleting}>
                        {deleting ? 'Removing…' : '✓ Remove from Fraud List'}
                      </button>
                      {record.secondtime !== 'Y' && (
                        <button className="fim-btn-warn" onClick={() => handleSecondOffense(record.fraud_id)}>
                          ⚠️ Mark as 2nd Offense
                        </button>
                      )}
                    </>
                  )}
                </div>
                {msg && <div className={`fip-msg ${msg.startsWith('✓') ? 'ok' : 'err'}`}>{msg}</div>}
                {history.length > 0 && (
                  <>
                    <div className="fip-section-label" style={{ marginTop: 16 }}>
                      Order Attempts from this IP
                      <span className="od-count-badge" style={{ marginLeft: 8 }}>{history.length}</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="fim-table">
                        <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>
                          {history.map((h, i) => (
                            <tr key={i}>
                              <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.order_number || h.CART_ID}</span></td>
                              <td style={{ fontSize: 11 }}>{fmtDate(h.TIME_IN)}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>${parseFloat(h.total_price || 0).toFixed(2)}</td>
                              <td>{h.delete_fraud === 'Y'
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
                {history.length === 0 && searched && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>No order history found for this IP.</div>
                )}
              </div>
            </div>
          )}

          {listLoaded && (
            <div className="fip-card">
              <div className="fip-card-head">
                Fraudulent IP Attempts
                {(dateFrom || dateTo) && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                    {dateFrom && `From ${dateFrom}`}{dateFrom && dateTo && ' → '}{dateTo && `To ${dateTo}`}
                  </span>
                )}
                <span className="od-count-badge" style={{ marginLeft: 8 }}>{fraudList.length}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {fraudList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No fraud attempts found.</div>
                ) : (
                  <table className="fim-table">
                    <thead>
                      <tr><th>IP Address</th><th>Year</th><th>Month</th><th>Attempts</th><th>First Seen</th><th>Last Seen</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {fraudList.map((f, i) => (
                        <tr key={i}>
                          <td>
                            <button className="fip-ip-link" onClick={() => { setSearchIp(f.host_ip); handleSearch(f.host_ip); }}>
                              {f.host_ip}
                            </button>
                          </td>
                          <td>{f.Year}</td>
                          <td>{MONTHS[(f.Month || 1) - 1]}</td>
                          <td><span className="la-hits-badge">{f.AttemptCount}</span></td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(f.FirstSeen)}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(f.LastSeen)}</td>
                          <td>
                            <button className="fip-btn-sm-danger" onClick={() => handleAdd(f.host_ip)}>
                              + Add to Fraud
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {!searched && !listLoaded && (
            <div className="fip-empty">
              <div style={{ fontSize: 48 }}>🛡️</div>
              <strong>Search an IP or load fraud attempts</strong>
              <p>Enter an IP address to check if it's in the fraud list, view its order history, and manage it. Or load the fraud attempts list to see which IPs have been flagged.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
