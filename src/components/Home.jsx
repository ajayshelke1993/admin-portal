import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/Home.css';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;
const QUICK_LINKS = [
  { label: 'Web Orders',     to: '/web-orders',       icon: '🛒', desc: 'View & manage incoming orders' },
  { label: 'Update Parts',   to: '/update-parts',     icon: '✏️', desc: 'Edit product part details' },
  { label: 'Distribution Mapping',  to: '/distribution-mapping',  icon: '🗺️', adminOnly: false  },
  { label: 'Blogs',          to: '/blog-admin',       icon: '📝', desc: 'Manage Blogs' },
  { label: 'SEO',                   to: '/vendor-seo',            icon: '🔍',  adminOnly: false },
  { label: 'Customer Comments',     to: '/customer-comments',     icon: '💬',  adminOnly: false  },
  { label: 'Tab Pages',      to: '/tab-pages',        icon: '📑', desc: 'Manage storefront tabs' },
  { label: 'Order Tracking', to: '/order-tracking',   icon: '📍', desc: 'Track shipment status' },
];

const Home = () => {
  const { userName } = useAuth();

  const navigate = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [time, setTime]                 = useState(new Date());
  const [recentFilter, setRecentFilter] = useState('active'); // 'active' | 'deleted' | 'today'

  // Declare today & tomorrow ONCE before useEffect
 const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// Local ISO string helper — avoids UTC timezone shift
const toLocalISO = (date) => {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().split('.')[0];
};

  useEffect(() => {
    axios.post(`${BASE_URL}/api/web-orders`, {
      dateFrom: toLocalISO(today),
  dateTo:   toLocalISO(tomorrow),
      showDeleted: true,
    })
      .then(response => { setOrders(response.data); setLoading(false); })
      .catch(error   => { console.error('Error fetching web orders:', error); setLoading(false); });
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Derived stats ──
const deletedToday = orders.filter(o => o.delete_fraud === true || o.delete_fraud === 'Y');
const activeToday  = orders.filter(o => o.delete_fraud !== true && o.delete_fraud !== 'Y');

const uniqueOrders  = [...new Set(orders.map(o => o.order_number))];
const uniqueToday   = [...new Set(activeToday.map(o => o.order_number))];
const uniqueDeleted = [...new Set(deletedToday.map(o => o.order_number))];

const totalRevToday = activeToday
  .reduce((sum, o) => sum + (o.Qty * o.Unit_Price), 0)
  .toFixed(2);

  // ── Recent orders filtered by selected stat chip ──
const filteredForRecent = orders.filter(o => {
  const isDeleted = o.delete_fraud === true || o.delete_fraud === 'Y';
  if (recentFilter === 'deleted') return isDeleted;
  if (recentFilter === 'today')   return !isDeleted; // ← simplified, API already filtered by today
  return !isDeleted;
});

  const recentOrders = Object.entries(
    filteredForRecent.reduce((acc, o) => {
      if (!acc[o.order_number]) acc[o.order_number] = o;
      return acc;
    }, {})
  ).slice(0, 5);

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="portal-page home-page">

      {/* ── Hero banner ── */}
      <div className="home-hero">
        <div className="home-hero-left">
          <div className="home-greeting">{greeting()}{userName ? `, ${userName}` : ''} 👋</div>
          <h1 className="home-title">Website Admin Portal</h1>
          <p className="home-sub">Here's what's happening with your store today.</p>
        </div>
        <div className="home-clock">
          <div className="home-clock-time">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="home-clock-date">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="home-stats">

        {/* Orders Today — clickable, filters recent list */}
        <div
          className={`home-stat-card accent${recentFilter === 'today' ? ' stat-active' : ''}`}
          style={{ cursor: 'pointer' }}
          // onClick={() => setRecentFilter(recentFilter === 'today' ? 'active' : 'today')}
          onClick={()=> navigate(`/web-orders`) }
          title="Click to filter recent orders"
        >
          <div className="home-stat-icon">🛒</div>
          <div>
            <div className="home-stat-label" >Orders Today</div>
            <div className="home-stat-value">{loading ? '…' : uniqueToday.length}</div>
          </div>
          {/* <div className="home-stat-click-hint">click to filter</div> */}
        </div>

        {/* Revenue Today — not clickable */}
        <div className="home-stat-card green">
          <div className="home-stat-icon">💵</div>
          <div>
            <div className="home-stat-label">Revenue Today</div>
            <div className="home-stat-value">
              ${loading ? '…' : Number(totalRevToday).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Deleted Orders — clickable, filters recent list */}
        <div
          className={`home-stat-card warning${recentFilter === 'deleted' ? ' stat-active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setRecentFilter(recentFilter === 'deleted' ? 'active' : 'deleted')}
          title="Click to filter recent orders"
        >
          <div className="home-stat-icon">⚠️</div>
          <div>
            <div className="home-stat-label">Deleted Orders</div>
            <div className="home-stat-value">{loading ? '…' : uniqueDeleted.length}</div>
          </div>
          <div className="home-stat-click-hint">click to filter</div>
        </div>

        {/* Total Orders — not clickable */}
        <div className="home-stat-card neutral">
          <div className="home-stat-icon">📦</div>
          <div>
            <div className="home-stat-label">Total Orders</div>
            <div className="home-stat-value">{loading ? '…' : uniqueOrders.length}</div>
          </div>
        </div>

      </div>

      {/* ── Main grid ── */}
      <div className="home-grid">

        {/* Quick links */}
        <div className="home-card">
          <div className="home-card-head">
            <span>⚡</span> Quick Access
          </div>
          <div className="home-card-body">
            <div className="home-quick-grid">
              {QUICK_LINKS.map(link => (
                <button
                  key={link.to}
                  className="home-quick-btn"
                  onClick={() => navigate(link.to)}
                >
                  <span className="home-quick-icon">{link.icon}</span>
                  <span className="home-quick-label">{link.label}</span>
                  <span className="home-quick-desc">{link.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="home-card">
          <div className="home-card-head">
            <span>🕐</span>
            Recent Orders
            {recentFilter === 'deleted' && (
              <span className="home-pill red" style={{ marginLeft: 8 }}>Deleted</span>
            )}
            {recentFilter === 'today' && (
              <span className="home-pill green" style={{ marginLeft: 8 }}>Today</span>
            )}
            {recentFilter !== 'active' && (
              <button
                className="home-view-all"
                style={{ marginLeft: 0 }}
                onClick={() => setRecentFilter('active')}
              >
                ✕ Clear
              </button>
            )}
            <button className="home-view-all" onClick={() => navigate('/web-orders')}>
              View all →
            </button>
          </div>

          <div className="home-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="od-loading" style={{ padding: '32px' }}>
                <div className="od-spinner" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <div className="empty-state-icon">📭</div>
                <strong>No orders found</strong>
              </div>
            ) : (
              <div className="home-order-list">
                {recentOrders.map(([orderNum, order]) => {
                  const isDeleted = order.delete_fraud === true || order.delete_fraud === 'Y';
                  const total = orders
                    .filter(o => o.order_number === order.order_number)
                    .reduce((s, o) => s + o.Qty * o.Unit_Price, 0)
                    .toFixed(2);
                  return (
                    <div
                      key={orderNum}
                      className={`home-order-row${isDeleted ? ' flagged' : ''}`}
                      onClick={() => navigate(`/order-details/${orderNum}`)}
                    >
                      <div className="home-order-info">
                        <span className="home-order-num">#{orderNum}</span>
                        <span className="home-order-customer">{order.Customer_No}</span>
                      </div>
                      <div className="home-order-right">
                        <span className="home-order-total">
                          ${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {isDeleted
                          ? <span className="home-pill red">Deleted</span>
                          : <span className="home-pill green">Active</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;