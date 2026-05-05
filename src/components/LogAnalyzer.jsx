import { useEffect, useState } from 'react';
import './styles/globals.css';
import './styles/LogAnalyzer.css';

const BASE_URL = import.meta.env.VITE_API_URL;

const REPORT_TYPES = [
  { key: 'ip_hits',    label: 'IP Hit Count', icon: '🌐', desc: 'Client IPs with hit count and user agent' },
  { key: 'top_urls',   label: 'Top URLs',      icon: '🔗', desc: 'Most requested URLs' },
  { key: 'errors_404', label: '404 Errors',    icon: '⚠️', desc: 'Pages returning 404 not found' },
];

export default function LogAnalyzer() {
  const [activeReport, setActiveReport] = useState('ip_hits');
  const [minHits, setMinHits]           = useState(500);
  const [excludeIp, setExcludeIp]       = useState('147.0.242.114');
  const [running, setRunning]           = useState(false);
  const [results, setResults]           = useState(null);
  const [error, setError]               = useState('');
  const [history, setHistory]           = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');

  // File picker
  const [logFiles, setLogFiles]             = useState([]);
  const [selectedFiles, setSelectedFiles]   = useState([]);
  const [loadingFiles, setLoadingFiles]     = useState(true);
  const [selectAll, setSelectAll]           = useState(false);

  // Delete state
  const [selectedLogFilesToDelete, setSelectedLogFilesToDelete] = useState([]);
  const [deleteMode, setDeleteMode]         = useState(false);
  const [deletingFiles, setDeletingFiles]   = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);

  useEffect(() => { loadHistory(); loadSchedule(); loadLogFiles(); }, []);

  const loadLogFiles = async () => {
    setLoadingFiles(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/logs/files`);
      const data = await res.json();
      setLogFiles(data.files || []);
      setSelectedFiles((data.files || []).map(f => f.name));
      setSelectAll(true);
    } catch { setLogFiles([]); }
    finally { setLoadingFiles(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/logs/history`);
      const data = await res.json();
      setHistory(data || []);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const loadSchedule = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/logs/schedule`);
      const data = await res.json();
      setScheduleInfo(data);
    } catch {}
  };

  // ── Run query toggle ─────────────────────────────────────────────────
  const toggleFile = (name) => {
    setSelectedFiles(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedFiles([]); setSelectAll(false); }
    else { setSelectedFiles(logFiles.map(f => f.name)); setSelectAll(true); }
  };

  useEffect(() => {
    if (logFiles.length > 0) setSelectAll(selectedFiles.length === logFiles.length);
  }, [selectedFiles, logFiles]);

  // ── Delete mode toggles ───────────────────────────────────────────────
  const toggleDeleteFileSelect = (name) => {
    setSelectedLogFilesToDelete(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  // ── Run query ────────────────────────────────────────────────────────
  const runQuery = async () => {
    if (selectedFiles.length === 0) { setError('Please select at least one log file.'); return; }
    setRunning(true); setError(''); setResults(null);
    try {
      const res = await fetch(`${BASE_URL}/api/logs/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: activeReport, minHits, excludeIp, selectedFiles }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResults(data);
      loadHistory();
    } catch (err) { setError('Failed to run query: ' + err.message); }
    finally { setRunning(false); }
  };

  const downloadCsv = (runId) => window.open(`${BASE_URL}/api/logs/download/${runId}`, '_blank');

  const loadHistoryResult = async (runId) => {
    try {
      const res  = await fetch(`${BASE_URL}/api/logs/result/${runId}`);
      const data = await res.json();
      setResults(data); setActiveReport(data.report);
    } catch {}
  };

  // ── Delete history run ────────────────────────────────────────────────
  const deleteHistoryRun = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this history run and its CSV file?')) return;
    try {
      await fetch(`${BASE_URL}/api/logs/history/${id}`, { method: 'DELETE' });
      loadHistory();
      if (results?.runId === id) setResults(null);
    } catch { setError('Failed to delete history run'); }
  };

  // ── Delete all history ────────────────────────────────────────────────
  const deleteAllHistory = async () => {
    if (!window.confirm(`Delete all ${history.length} history runs and their CSV files? This cannot be undone.`)) return;
    setDeletingHistory(true);
    try {
      await fetch(`${BASE_URL}/api/logs/history`, { method: 'DELETE' });
      loadHistory();
      setResults(null);
    } catch { setError('Failed to delete history'); }
    finally { setDeletingHistory(false); }
  };

  // ── Delete selected log files ─────────────────────────────────────────
  const deleteSelectedLogFiles = async () => {
    if (selectedLogFilesToDelete.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedLogFilesToDelete.length} log file(s) from the server? This cannot be undone.`)) return;
    setDeletingFiles(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/logs/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedLogFilesToDelete }),
      });
      const data = await res.json();
      setSelectedLogFilesToDelete([]);
      setDeleteMode(false);
      loadLogFiles();
      if (data.failed?.length > 0) {
        setError(`Could not delete: ${data.failed.map(f => f.name).join(', ')}`);
      }
    } catch { setError('Failed to delete log files'); }
    finally { setDeletingFiles(false); }
  };

  const filteredRows = (results?.rows || []).filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const fmtDate = d => {
    try { return new Date(d).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return d; }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <h1>IIS Log Analyzer</h1>
          <div className="page-header-sub">Parse and analyze IIS server logs from W3SVC2</div>
        </div>
        {scheduleInfo && (
          <div className="stat-chip">
            <div className="stat-chip-label">Next Auto-Run</div>
            <div className="stat-chip-value" style={{ fontSize: 14 }}>{scheduleInfo.nextRun}</div>
          </div>
        )}
      </div>

      <div className="la-layout">

        {/* ── LEFT SIDEBAR ── */}
        <div className="la-sidebar">

          {/* Report type */}
          <div className="la-card">
            <div className="la-card-head">Report Type</div>
            <div className="la-card-body">
              {REPORT_TYPES.map(r => (
                <button key={r.key}
                  className={`la-report-btn ${activeReport === r.key ? 'active' : ''}`}
                  onClick={() => { setActiveReport(r.key); setResults(null); }}>
                  <span className="la-report-icon">{r.icon}</span>
                  <div>
                    <div className="la-report-label">{r.label}</div>
                    <div className="la-report-desc">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Query options */}
          <div className="la-card">
            <div className="la-card-head">Query Options</div>
            <div className="la-card-body">
              <div className="la-field">
                <label className="la-label">Min Hits Threshold</label>
                <input type="number" className="la-input" value={minHits}
                  onChange={e => setMinHits(Number(e.target.value))} min={1} />
                <small className="la-hint">Only show results with more than this many hits</small>
              </div>
              <div className="la-field">
                <label className="la-label">Exclude IP</label>
                <input type="text" className="la-input" value={excludeIp}
                  onChange={e => setExcludeIp(e.target.value)} placeholder="e.g. 147.0.242.114" />
              </div>
              <button className="la-run-btn" onClick={runQuery} disabled={running || selectedFiles.length === 0}>
                {running ? <><div className="la-spinner" /> Running…</> : <>▶ Run Query ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})</>}
              </button>
            </div>
          </div>

          {/* Log file picker */}
          <div className="la-card">
            <div className="la-card-head">
              Log Files
              <span className="od-count-badge" style={{ marginLeft: 8 }}>{selectedFiles.length}/{logFiles.length}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {!deleteMode ? (
                  <>
                    <button className="la-select-all-btn" onClick={toggleSelectAll}>
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                    <button className="la-select-all-btn" style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => { setDeleteMode(true); setSelectedLogFilesToDelete([]); }}>
                      🗑 Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button className="la-select-all-btn"
                      onClick={() => setSelectedLogFilesToDelete(logFiles.map(f => f.name))}>
                      All
                    </button>
                    <button className="la-select-all-btn" style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={deleteSelectedLogFiles}
                      disabled={deletingFiles || selectedLogFilesToDelete.length === 0}>
                      {deletingFiles ? '…' : `🗑 ${selectedLogFilesToDelete.length}`}
                    </button>
                    <button className="la-select-all-btn" onClick={() => { setDeleteMode(false); setSelectedLogFilesToDelete([]); }}>
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
            {deleteMode && selectedLogFilesToDelete.length > 0 && (
              <div style={{ padding: '8px 14px', background: '#fee2e2', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                ⚠️ {selectedLogFilesToDelete.length} file{selectedLogFilesToDelete.length !== 1 ? 's' : ''} selected for permanent deletion
              </div>
            )}
            <div className="la-card-body" style={{ padding: 0, maxHeight: 280, overflowY: 'auto' }}>
              {loadingFiles ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Loading files…</div>
              ) : logFiles.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No log files found</div>
              ) : (
                logFiles.map(f => (
                  <label key={f.name} className={`la-file-item ${deleteMode && selectedLogFilesToDelete.includes(f.name) ? 'delete-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={deleteMode ? selectedLogFilesToDelete.includes(f.name) : selectedFiles.includes(f.name)}
                      onChange={() => deleteMode ? toggleDeleteFileSelect(f.name) : toggleFile(f.name)}
                      style={{ accentColor: deleteMode ? '#dc2626' : 'var(--accent)' }}
                    />
                    <div className="la-file-info">
                      <span className="la-file-name" style={{ color: deleteMode && selectedLogFilesToDelete.includes(f.name) ? '#dc2626' : undefined }}>
                        {f.name}
                      </span>
                      <span className="la-file-meta">{f.size} · {f.date}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* History */}
          <div className="la-card">
            <div className="la-card-head">
              Run History
              <span className="od-count-badge" style={{ marginLeft: 8 }}>{history.length}</span>
              {history.length > 0 && (
                <button
                  className="la-select-all-btn"
                  style={{ marginLeft: 'auto', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={deleteAllHistory}
                  disabled={deletingHistory}
                >
                  {deletingHistory ? '…' : '🗑 Clear All'}
                </button>
              )}
            </div>
            <div className="la-card-body" style={{ padding: 0 }}>
              {loadingHistory ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
              ) : history.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No runs yet</div>
              ) : (
                history.slice(0, 15).map(h => (
                  <div key={h.id} className="la-history-item" onClick={() => loadHistoryResult(h.id)}>
                    <div className="la-history-report">
                      {REPORT_TYPES.find(r => r.key === h.report)?.icon}{' '}
                      {REPORT_TYPES.find(r => r.key === h.report)?.label}
                    </div>
                    <div className="la-history-meta">
                      <span>{fmtDate(h.run_at)}</span>
                      <span className="la-history-rows">{h.row_count} rows</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="la-dl-btn"
                        onClick={e => { e.stopPropagation(); downloadCsv(h.id); }}>
                        ⬇ CSV
                      </button>
                      <button className="la-dl-btn"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={e => deleteHistoryRun(e, h.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT: Results ── */}
        <div className="la-results">
          {error && <div className="la-error">{error}</div>}

          {running && (
            <div className="la-running">
              <div className="la-spinner-lg" />
              <div>Running LogParser on {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}…</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                This may take 10–60 seconds depending on file sizes
              </div>
            </div>
          )}

          {!running && !results && !error && (
            <div className="la-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <strong>Select files and click Run Query</strong>
              <p>{selectedFiles.length === 0
                ? 'No files selected — check at least one log file on the left.'
                : `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected and ready to analyze.`}
              </p>
            </div>
          )}

          {!running && results && (
            <>
              <div className="la-results-head">
                <div>
                  <div className="la-results-title">
                    {REPORT_TYPES.find(r => r.key === results.report)?.icon}{' '}
                    {REPORT_TYPES.find(r => r.key === results.report)?.label}
                  </div>
                  <div className="la-results-meta">
                    {results.rowCount} rows · {fmtDate(results.ranAt)} · threshold: {results.minHits}+ hits
                    {results.fileCount && ` · ${results.fileCount} file${results.fileCount !== 1 ? 's' : ''}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" className="la-input" style={{ width: 200 }}
                    placeholder="Search results…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} />
                  <button className="la-dl-btn-lg" onClick={() => downloadCsv(results.runId)}>
                    ⬇ Export CSV
                  </button>
                </div>
              </div>

              <div className="la-table-wrap">
                <table className="la-table">
                  <thead>
                    <tr>{results.columns?.map(col => <th key={col}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, i) => (
                      <tr key={i}>
                        {results.columns?.map(col => (
                          <td key={col}>
                            {col === 'hits'     ? <span className="la-hits-badge">{row[col]}</span>
                            : col === 'clientip' ? <span className="la-ip">{row[col]}</span>
                            : <span className="la-cell-text">{row[col]}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRows.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No results match your search.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
