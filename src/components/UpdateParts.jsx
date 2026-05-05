import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/UpdateParts.css';
import SearchInput from './SearchInput';

const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const numbers  = [...'1234567890'];

const BASE_URL = import.meta.env.VITE_API_URL;

const UpdateParts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [parts, setParts]                   = useState([]);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    setLoading(true);
    let query = '?';
    if (searchTerm)     query += `part=${searchTerm}&`;
    if (selectedLetter) query += `manufacturer=${selectedLetter}&`;

    axios.get(`${BASE_URL}/api/parts${query}`)
      .then(response => { setParts(response.data); setLoading(false); })
      .catch(error   => { console.error('Error fetching parts:', error); setLoading(false); });
  }, [searchTerm, selectedLetter]);

  const handleLetterClick = (val) => {
    setSelectedLetter(prev => prev === val ? '' : val);
  };

  return (
    <div className="portal-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Update Parts</h1>
          <div className="page-header-sub">Search and edit product parts by number or manufacturer</div>
        </div>
        {parts.length > 0 && (
          <div className="stat-chip" style={{ minWidth: 120, padding: '10px 16px' }}>
            <div className="stat-chip-label">Results</div>
            <div className="stat-chip-value accent">{parts.length}</div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>

        {/* Search input */}
        <SearchInput
          storageKey="search_parts"
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by part number…"
          sanitize={v => v.replace(/[^a-zA-Z0-9]/g, '')}
        />

        {/* Filter row */}
        <div className="up-filter-row">
          <span className="up-filter-label">Filter by Manufacturer</span>
          <div className="up-filter-btns">
            <div className="up-filter-group">
              {numbers.map(n => (
                <button key={n}
                  className={`up-filter-btn${selectedLetter === n ? ' active' : ''}`}
                  onClick={() => handleLetterClick(n)}>
                  {n}
                </button>
              ))}
            </div>
            <div className="up-filter-sep" />
            <div className="up-filter-group">
              {alphabet.map(l => (
                <button key={l}
                  className={`up-filter-btn${selectedLetter === l ? ' active' : ''}`}
                  onClick={() => handleLetterClick(l)}>
                  {l}
                </button>
              ))}
            </div>
            {selectedLetter && (
              <button className="up-clear-btn" onClick={() => setSelectedLetter('')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div className="od-loading">
          <div className="od-spinner" />
          <p>Loading parts…</p>
        </div>
      ) : parts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔩</div>
          <strong>No parts found</strong>
          <p>Try a different search term or manufacturer filter.</p>
        </div>
      ) : (
        <div className="up-table-wrap">
          <table className="up-table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Vendor ID</th>
                <th>Manufacturer</th>
                <th>Images</th>
                <th>MAP</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={index} className="up-row">
                  <td>
                    <span className="up-part-no" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/editparts/${part.vendor_part_no}/${part.vendorid}`)}>
                      {part.vendor_part_no}
                    </span>
                  </td>
                  <td><span className="up-vendor-id">{part.vendorid}</span></td>
                  <td><span className="up-manufacturer">{part.vendor}</span></td>
                  <td>
                    <span className="up-manufacturer">
                      <img style={{ width: '70px', height: '70px' }}
                        src={(part.imagethumb && part.imagethumb !== 'thumb')
                          ? `https://magipik.com/_next/image?url=https%3A%2F%2Fmedia.magipik.com%2Fsample%2Fdata%2Fpreview%2Fopen-cardboard-boxes-illustration-set-with-isometric-style-and-realistic-shading-749014.png&w=1920&q=78`
                          : `https://magipik.com/_next/image?url=https%3A%2F%2Fmedia.magipik.com%2Fsample%2Fdata%2Fpreview%2Fopen-cardboard-boxes-illustration-set-with-isometric-style-and-realistic-shading-749014.png&w=1920&q=78`} />
                    </span>
                  </td>
                  <td><span className="up-manufacturer">{part.bmap ? part.price : '-'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="up-edit-btn"
                      onClick={() => navigate(`/editparts/${part.vendor_part_no}/${part.vendorid}`)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UpdateParts;
