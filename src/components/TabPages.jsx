import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/globals.css';
// import './styles/TabPages.css';

const SECTION_META = {
  groupAll: { label: 'Products & Categories', icon: '📦' },
  group1:   { label: 'Holiday Tab',           icon: '🎉' },
  group2:   { label: 'Games Release Dates',   icon: '🎮' },
};

const CHOICE_HEADING = {
  '1': 'Products',
  '2': 'Estore',
  '3': 'Home',
};

const TabPages = () => {
  const navigate = useNavigate();
  const [tabGroups, setTabGroups] = useState({ groupAll: [], group1: [], group2: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('http://10.1.1.26:5000/api/tab-pages')
      .then(response => { setTabGroups(response.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const totalTabs = Object.values(tabGroups).reduce((a, g) => a + g.length, 0);
  const highlightCount = Object.values(tabGroups)
    .flat()
    .filter(t => t.call === 'y').length;

  const renderGroup = (groupArray, groupKey) => {
    const filtered = search
      ? groupArray.filter(t => t.tab_name?.toLowerCase().includes(search.toLowerCase()))
      : groupArray;

    if (!filtered.length) return null;

    const groupedByChoice = filtered.reduce((acc, tab) => {
      if (!acc[tab.choice]) acc[tab.choice] = [];
      acc[tab.choice].push(tab);
      return acc;
    }, {});

    const meta = SECTION_META[groupKey] || { label: groupKey, icon: '📋' };

    return (
      <div className="tp-section" key={groupKey}>
        {/* Section header */}
        <div className="tp-section-head">
          <span className="tp-section-icon">{meta.icon}</span>
          <span className="tp-section-label">{meta.label}</span>
          <span className="od-count-badge">{filtered.length}</span>
        </div>

        {Object.keys(groupedByChoice).sort().map(choice => (
          <div key={choice} className="tp-choice-block">
            <div className="tp-choice-label">
              {CHOICE_HEADING[choice] || `Choice ${choice}`}
            </div>
            <div className="tp-grid">
              {groupedByChoice[choice].map(tab => (
                <div
                  key={`${tab.tab_id}-${tab.tab_name}`}
                  className={`tp-card${tab.call === 'y' ? ' highlight' : ''}`}
                  onClick={() => navigate(`/tab-pages/${tab.tab_id}`)}
                  title={tab.tab_name}
                >
                  {tab.call === 'y' && <span className="tp-alert-dot" />}
                  <span className="tp-card-name">{tab.tab_name}</span>
                  <span className="tp-card-id">#{tab.tab_id}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="portal-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Tab Pages</h1>
          <div className="page-header-sub">Manage storefront tab pages and categories</div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="stat-row">
        <div className="stat-chip">
          <div className="stat-chip-label">Total Tabs</div>
          <div className="stat-chip-value accent">{totalTabs}</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-label">Needs Attention</div>
          <div className="stat-chip-value" style={{ color: 'var(--danger)' }}>{highlightCount}</div>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="portal-input"
            placeholder="Search tab pages…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="od-loading">
          <div className="od-spinner" />
          <p>Loading tab pages…</p>
        </div>
      ) : (
        <div className="tp-sections">
          {Object.keys(tabGroups).map(key => renderGroup(tabGroups[key], key))}
        </div>
      )}
    </div>
  );
};

export default TabPages;
