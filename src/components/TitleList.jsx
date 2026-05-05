import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/TitleList.css';
import SignOutButton from './SignOutButton';
import { useAuth } from '../context/AuthContext';

const TitleList = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const NAV_ITEMS = [
    { label: 'Home', to: '/home', icon: '⌂' },
    {
      label: 'Web Orders', icon: '🛒', submenu: [
        { label: 'All Web Orders',  to: '/web-orders' },
        { label: 'Fraud IPs',       to: '/fraud-ips', icon: '🛡️' },
      ]
    },
    { label: 'Update Parts',          to: '/update-parts',          icon: '✏️',  adminOnly: false },
    { label: 'Log Analyzer',          to: '/log-analyzer',          icon: '📋',  adminOnly: true  },
    { label: 'SEO',                   to: '/vendor-seo',            icon: '🔍',  adminOnly: false },
    { label: 'Blogs',                 to: '/blog-admin',            icon: '📝',  adminOnly: true },
    { label: 'Banners',               to: '/banners',               icon: '🖼',  adminOnly: false  },
    { label: 'Customer Comments',     to: '/customer-comments',     icon: '💬',  adminOnly: false  },
    { label: 'Reports',               to: '/reports',               icon: '📋',  adminOnly: true  },
  ].filter(item => !item.adminOnly || isAdmin);

  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState('Web Orders');

  const toggleSubmenu = (label) =>
    setOpenSubmenu(prev => prev === label ? null : label);

  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <>
      {mobileOpen && (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <button className="sb-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <span /><span /><span />
      </button>

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>

        <div className="sb-logo">
          {!collapsed && (
            <a href="https://ajayshelke.onrender.com/">
              <img src="/ajay.png" alt="your-site-logo" className="sb-logo-img" />
              
            </a>
          )}
          {collapsed && <span className="sb-logo-icon">CS</span>}
        </div>

        <div className="sb-divider" />

        <button className="sb-theme-btn" onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {darkMode ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              {!collapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
              {!collapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>

        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            item.submenu ? (
              <div key={item.label}>
                <button
                  className={`sb-item sb-parent${openSubmenu === item.label ? ' open' : ''}`}
                  onClick={() => toggleSubmenu(item.label)}
                  title={collapsed ? item.label : ''}>
                  <span className="sb-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="sb-label">{item.label}</span>
                      <svg className={`sb-chevron${openSubmenu === item.label ? ' rotated' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </>
                  )}
                </button>
                {!collapsed && openSubmenu === item.label && (
                  <div className="sb-submenu">
                    {item.submenu.map(sub => (
                      <NavLink key={sub.to} to={sub.to}
                        className={({ isActive }) => `sb-subitem${isActive ? ' active' : ''}`}
                        onClick={() => setMobileOpen(false)}>
                        <span className="sb-sub-dot" />
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : ''}
                onClick={() => setMobileOpen(false)}>
                <span className="sb-icon">{item.icon}</span>
                {!collapsed && <span className="sb-label">{item.label}</span>}
              </NavLink>
            )
          ))}
        </nav>

        <div className="sb-bottom">
          <div className="sb-divider" style={{ margin: '0 12px 8px' }} />
          <SignOutButton />
        </div>

        <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
};

export default TitleList;