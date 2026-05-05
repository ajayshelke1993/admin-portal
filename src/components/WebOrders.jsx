import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles/Globals.css';
import './styles/WebOrders.css';
import PaymentMiniChart from './PaymentMiniChart';

const BASE_URL = import.meta.env.VITE_API_URL;

const WebOrders = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, setOrders]         = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom]     = useState(today.toISOString().split('T')[0]);
  const [dateTo, setDateTo]         = useState(today.toISOString().split('T')[0]);
  const [showDeleted, setShowDeleted] = useState(localStorage.getItem('showDeleted') === 'true');
  const [showRemoved, setShowRemoved] = useState(localStorage.getItem('showRemoved') === 'true');
  const [allOrdersMode, setAllOrdersMode]       = useState(false);
  const [savedShowDeleted, setSavedShowDeleted] = useState(false);
  const [customerIdFilter, setCustomerIdFilter] = useState(''); // actual customer ID being searched
  const [loading, setLoading] = useState(false);

  const scrollToTop    = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  useEffect(() => { localStorage.setItem('showDeleted', showDeleted); }, [showDeleted]);
  useEffect(() => { localStorage.setItem('showRemoved', showRemoved); }, [showRemoved]);

  // Normal date-range fetch
  useEffect(() => {
    if (allOrdersMode) return; // skip — customer mode has its own fetch
    const timer = setTimeout(() => { fetchOrders(); }, 200);
    return () => clearTimeout(timer);
  }, [dateFrom, dateTo, showDeleted, allOrdersMode]);

  const fetchOrders = async (customerId = '') => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/web-orders`, {
        dateFrom,
        dateTo,
        showDeleted: customerId ? true : showDeleted, // always show deleted for customer search
        customerId,
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching web orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByCustomer = (e, customerId) => {
    e.stopPropagation();
    e.preventDefault();
    setSavedShowDeleted(showDeleted);
    setCustomerIdFilter(customerId);
    setSearchTerm(customerId);
    setAllOrdersMode(true);
    setShowDeleted(true);
    fetchOrders(customerId); // fetch immediately with customer ID
  };

  const clearCustomerFilter = () => {
    setSearchTerm('');
    setCustomerIdFilter('');
    setAllOrdersMode(false);
    setShowDeleted(savedShowDeleted);
    // re-fetch with date range
    setTimeout(() => fetchOrders(''), 0);
  };

  const groupOrdersByNumber = (orders) =>
    orders.reduce((acc, order) => {
      const { order_number } = order;
      if (!acc[order_number]) acc[order_number] = [];
      acc[order_number].push(order);
      return acc;
    }, {});

  const filterOrders = () =>
    orders.filter(order => {
      if (!searchTerm) return true;
      return (
        order.Customer_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number.toString().includes(searchTerm) ||
        (order.referral && order.referral.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      );
      // NOTE: no date filtering here — backend handles it
    });

  const filteredOrders  = filterOrders();
  const groupedOrders   = groupOrdersByNumber(filteredOrders);
  const totalPrice      = filteredOrders.reduce((t, o) => t + o.Qty * o.Unit_Price, 0).toFixed(2);
  const totalOrders     = Object.keys(groupedOrders).length;

  return (
    <>
      <div className="portal-page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Web Orders</h1>
            <div className="page-header-sub">Review and manage incoming online orders</div>
          </div>
        </div>

        {/* Stat chips */}
        <div className="stat-row">
          <div className="stat-chip">
            <div className="stat-chip-label">Total Orders</div>
            <div className="stat-chip-value accent">{loading ? '…' : totalOrders}</div>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-label">Total Revenue</div>
            <div className="stat-chip-value">${Number(totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Customer filter banner — OUTSIDE toolbar */}
        {allOrdersMode && customerIdFilter && (
          <div style={{
            background: 'var(--accent-light)',
            border: '1.5px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <span>
              📋 All orders for customer{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{customerIdFilter}</strong>
              {' — '}<strong>{totalOrders}</strong> order{totalOrders !== 1 ? 's' : ''} found
              {loading && ' (loading…)'}
            </span>
            <button
              onClick={clearCustomerFilter}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '4px 12px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✕ Back to Today's Orders
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="portal-input"
              placeholder="Search by Customer ID or Order #"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="date-group">
            <input
              type="date" className="portal-input no-icon" style={{ width: 150 }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); }}
            />
            <span className="date-sep">→</span>
            <input
              type="date" className="portal-input no-icon" style={{ width: 150 }}
              value={dateTo}
              onChange={e => {
                const v = e.target.value;
                if (v < dateFrom) setDateFrom(v);
                setDateTo(v);
              }}
            />
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <span className="toggle-switch">
                <input type="checkbox" checked={showRemoved} onChange={e => setShowRemoved(e.target.checked)} />
                <span className="toggle-track" />
              </span>
              Hide Images
            </label>
            <label className="toggle-label">
              <span className="toggle-switch">
                <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
                <span className="toggle-track" />
              </span>
              Show Deleted
            </label>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div className="od-spinner" style={{ margin: '0 auto 12px' }} />
            Loading orders…
          </div>
        )}

        {/* Orders list */}
        {!loading && totalOrders === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <strong>No orders found</strong>
            <p>Try adjusting your date range or search term.</p>
          </div>
        ) : !loading && (
          <div className="orders-list">
            {Object.keys(groupedOrders).map(orderNumber => {
              const group = groupedOrders[orderNumber];
              const isDeleted = group.some(o => o.delete_fraud === true || o.delete_fraud === 'Y');
              const totalOrderPrice = group.reduce((a, o) => a + o.Qty * o.Unit_Price, 0).toFixed(2);

              return (
                <Link
                  to={`/order-details/${orderNumber}`}
                  className={`order-card${isDeleted ? ' deleted' : ''}`}
                  key={orderNumber}
                >
                  {/* Card head */}
                  <div className="order-card-head">
                    <span className="referral-badge">{group[0].referral?.trim().slice(0, 50)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(new Date(group[0].Date).setHours(new Date(group[0].Date).getHours() + 4)).toLocaleString()}
                      </span>
                      {isDeleted && <span className="deleted-pill">Deleted</span>}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="order-card-body">

                    {/* Left: meta — shown ONCE per order */}
                    <div className="order-meta">
                      <Link
                        to={`/order-details/${orderNumber}`}
                        className="order-num"
                        onClick={e => e.stopPropagation()}
                      >
                        #{orderNumber}
                      </Link>
                      <p>
                        <strong>Customer Id:</strong>{' '}
                        <button
                          onClick={e => searchByCustomer(e, group[0].Customer_No)}
                          style={{
                            background: 'none', border: 'none',
                            color: 'var(--accent)', fontWeight: 700,
                            cursor: 'pointer', padding: 0,
                            fontSize: 'inherit', textDecoration: 'underline',
                          }}
                        >
                          {group[0].Customer_No}
                        </button>
                      </p>
                      <p><strong>Payment:</strong> {group[0].payment_method}</p>
                      <p><strong>Sales Rep:</strong> {group[0].sales_person}</p>
                    </div>

                    {/* Middle: products */}
                    <div>
                      {group.map(order => (
                        <div className="product-row" key={order.id}>
                          {!showRemoved && (
                            <Link
                              to={`/parts/${order.vendorid}/${order.part_no}/images`}
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'inline-block', position: 'relative' }}
                              title="Manage images"
                            >
                              <img
                                src={
                                  order.product_image &&
                                  order.product_image !== 'thumb' &&
                                  order.product_image !== ''
                                    ? `https://your-site.com${order.product_image}`
                                    : 'https://www.your-site.com/mscs_images/pics/noimage.png'
                                }
                                alt={order.product}
                                className="product-img"
                                style={{ cursor: 'pointer' }}
                                onError={e => { e.target.src = 'https://www.your-site.com/mscs_images/pics/noimage.png'; }}
                              />
                              <span style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'rgba(0,0,0,0.55)', color: '#fff',
                                fontSize: 9, fontWeight: 700, textAlign: 'center',
                                padding: '2px 0', borderRadius: '0 0 4px 4px',
                                opacity: 0, transition: 'opacity .15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0}
                              >🖼️ edit</span>
                            </Link>
                          )}
                          <div>
                            <a
                              href={`https://your-site.com/pn/${order.part_no}/${order.vendorid}`}
                              className="product-name"
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                            >
                              {order.product.length > 55 ? `${order.product.substring(0, 55)}…` : order.product}
                            </a>
                            <div className="qty-cost">
                              <strong>Qty:</strong> {order.Qty} &nbsp;·&nbsp; <strong>Unit:</strong> ${order.Unit_Price}
                            </div>
                            <p style={{ fontSize: 'smaller' }}>
                              Part#:{' '}
                              <Link
                                to={`/editparts/${order.part_no}/${order.vendorid}`}
                                className="part-link"
                                onClick={e => e.stopPropagation()}
                              >
                                {order.part_no}
                              </Link>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: total */}
                    <div className="total-box">
                      <div className="total-box-label">Order Total</div>
                      <div className="total-box-value">
                        ${Number(totalOrderPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && totalOrders > 0 && (
          <div style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{totalOrders}</strong> order{totalOrders !== 1 ? 's' : ''}
          </div>
        )}

        <PaymentMiniChart orders={filteredOrders} />
      </div>

      {/* Scroll buttons */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
        <button onClick={scrollToTop} title="Back to top"
          style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', transition: 'border-color .15s, color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
        </button>
        <button onClick={scrollToBottom} title="Go to bottom"
          style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', transition: 'border-color .15s, color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      </div>
    </>
  );
};

export default WebOrders;
