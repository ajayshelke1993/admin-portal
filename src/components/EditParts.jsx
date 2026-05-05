import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/EditParts.css';

import {
  AvailableModal,
  DisplayPublicModal,
  DisplayRealtimeModal,
  DisplayBuyModal,
  ShowPriceCartModal,
  CallForPriceModal,
  AllowReturnsModal,
  VendorDropModal,
  AvailableInhouseModal,
  WeightModal,
} from './EditPartsModals';

const BASE_URL = import.meta.env.VITE_API_URL;

function EditParts() {
  const { partNo, vendorid } = useParams();
  const navigate = useNavigate();
  const [partData, setPartData]     = useState(null);
  const [activeTab, setActiveTab]   = useState('product');
  const [loading, setLoading]       = useState(true);
  const [tabData, setTabData]       = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [openModal, setOpenModal]   = useState(null);

  // ── Auto-update qty from realtime ──────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'realtime' || !tabData || tabData.error) return;
    const { src: activeSrc, suppliers = [] } = tabData;
    const activeSupplier = suppliers.find(s => s.src === activeSrc);
    if (!activeSupplier || activeSupplier.error) return;
    const newQty     = activeSupplier.total ?? 0;
    const currentQty = partData?.qty;
    if (Number(newQty) === Number(currentQty)) return;
    fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/update-qty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: newQty }),
    })
      .then(r => r.json())
      .then(d => { if (d.success) setPartData(prev => ({ ...prev, qty: newQty })); })
      .catch(err => console.error('Qty auto-update failed:', err));
  }, [tabData]);

  // ── Fetch product / tab data ───────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'product') {
      setLoading(true);
      fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/product`)
        .then(r => r.json())
        .then(d => { setPartData(d); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setTabLoading(true);
      setTabData(null);
      let query = '';
      if (activeTab === 'technote' && partData)
        query = `?eid=${partData.etilize_flag ?? ''}&ecat=${partData.etilize_cat ?? ''}`;
      else if (activeTab === 'realtime' && partData)
        query = `?src=${partData.sourceid?.toLowerCase() ?? ''}`;
      fetch(`${BASE_URL}/api/parts/${vendorid}/${partNo}/${activeTab}${query}`)
        .then(r => r.json())
        .then(d => { setTabData(d); setTabLoading(false); })
        .catch(err => { console.error(err); setTabLoading(false); });
    }
  }, [activeTab, vendorid, partNo]);

  const handleTabChange = key => { setTabData(null); setActiveTab(key); };
  const isYesVal = val => val === 'y' || val === 'Y' || val === 1 || val === '1' || val === true;
  const patchField = (field, value) => setPartData(prev => ({ ...prev, [field]: value }));
  const closeModal = () => setOpenModal(null);

  if (loading) return (
    <div className="portal-page">
      <div className="od-loading"><div className="od-spinner" /><p>Loading part data…</p></div>
    </div>
  );
  if (!partData) return (
    <div className="portal-page">
      <div className="empty-state"><div className="empty-state-icon">🔍</div><strong>Part not found</strong></div>
    </div>
  );

  const fmtDate = d => {
    try {
      return new Date(d).toLocaleString('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch { return '—'; }
  };

  const isTruck = partData.ship_method1?.toLowerCase() === 'truck';

  const getShippingGround = () => {
    if (isTruck) return 'Trucking';
    const fs = Number(partData.free_ship);
    if (fs === 0) return `$${partData.cost_ground}`;
    if (fs === 1) return 'FREE';
    if (fs === 2) return '$3.95';
    if (fs === 6) return '$6.99';
    return `$${partData.cost_ground}`;
  };

  const tabs = [
    { key: 'product',  label: 'Product Details' },
    { key: 'technote', label: 'Technote' },
    { key: 'price',    label: 'Price Shopper' },
    { key: 'realtime', label: 'Realtime' },
    { key: 'disti',    label: 'Disti Information' },
  ];

  const EditableVal = ({ children, modal }) => (
    <span className="ep-editable-val" title="Click to edit" onClick={() => setOpenModal(modal)}>
      {children}
      <span className="ep-edit-pencil">✏️</span>
    </span>
  );

  const renderTabContent = () => {
    switch (activeTab) {

      case 'product':
        return (
          <div className="ep-product-grid">
            {/* LEFT COLUMN */}
            <div className="ep-col">

              <div className="ep-section-card">
                <table className="ep-table">
                  <tbody>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Vendor:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}><span className="ep-vendor-display">{partData.vendor}</span></td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Description:</td>
                      <td className="ep-td-val ep-td-center ep-link-blue" colSpan={3}>{partData.description}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Title Tag:</td>
                      <td className="ep-td-val ep-td-center ep-link-blue" colSpan={3}>{partData.title}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Dist Desc.:</td>
                      <td className="ep-td-val ep-td-center ep-text-upper" colSpan={3}>{partData.dist_desc}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Category Main:</td>
                      <td className="ep-td-val ep-td-center ep-link-blue" colSpan={3}>{partData.Cat1Name}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Category Sub 1:</td>
                      <td className="ep-td-val ep-td-center ep-link-blue" colSpan={3}>{partData.Cat2Name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Category Sub 2:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}>{partData.Cat3Name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Category Sub 3:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}>{partData.Cat4Name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Category Sub 4:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}>{partData.Cat5Name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">your-site Desc:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}><a href="#" className="ep-link-blue">view main spec description</a></td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Date Inserted:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}>{fmtDate(partData.insert_date)}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Last Updated:</td>
                      <td className="ep-td-val ep-td-center" colSpan={3}>{fmtDate(partData.last_update)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="ep-section-card">
                <div className="ep-section-head">Price</div>
                <table className="ep-table ep-table--4col">
                  <tbody>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Price:</td>
                      <td className="ep-td-val ep-td-accent">${partData.bmap ?? partData.price}</td>
                      <td className="ep-td-label ep-td-shade">Cost:</td>
                      <td className="ep-td-val">${partData.cost}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Search Price:</td>
                      <td className="ep-td-val ep-td-accent">${partData.price_search ?? partData.price}</td>
                      <td className="ep-td-label ep-td-shade">MSRP:</td>
                      <td className="ep-td-val">${partData.msrp}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">United Price:</td>
                      <td className="ep-td-val ep-td-accent">${partData.price_united ?? partData.price}</td>
                      <td className="ep-td-label ep-td-shade">Cost United:</td>
                      <td className="ep-td-val">{partData.us_cost_united ?? '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">MAP Price:</td>
                      <td className="ep-td-val"><a href="#" className="ep-link-blue">add map</a></td>
                      <td className="ep-td-label ep-td-shade"></td>
                      <td className="ep-td-val"><a href="#" className="ep-link-blue">Price Archive</a></td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Rebate Amount:</td>
                      <td className="ep-td-val ep-td-accent">
                        {partData.net_rebate > 0 ? `$${partData.net_rebate}` : <a href="#" className="ep-link-blue">add rebate</a>}
                      </td>
                      <td className="ep-td-label ep-td-shade">Exp. Date:</td>
                      <td className="ep-td-val">{partData.rebate_exp || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="ep-section-card">
                <div className="ep-section-head">Shipping</div>
                <table className="ep-table ep-table--4col">
                  <tbody>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Ground:</td>
                      <td className="ep-td-val">
                        {Number(partData.free_ship) === 1 ? <span className="ep-free-badge">FREE</span> : getShippingGround()}
                      </td>
                      <td className="ep-td-label ep-td-shade">Ground Search:</td>
                      <td className="ep-td-val">
                        {Number(partData.freeshipping2) === 1 ? <span className="ep-free-badge">FREE</span>
                          : isTruck ? 'Trucking'
                          : Number(partData.freeshipping2) === 2 ? '$3.95'
                          : Number(partData.freeshipping2) === 6 ? '$6.99'
                          : `$${partData.cost_ground}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Two-Day:</td>
                      <td className="ep-td-val">{isTruck ? 'Trucking' : `$${partData.cost_twoday}`}</td>
                      <td className="ep-td-label ep-td-shade">Truck:</td>
                      <td className="ep-td-val">{isTruck ? `Trucking $${partData.ship_price}` : '—'}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Standard 1 Day:</td>
                      <td className="ep-td-val">
                        {isTruck ? 'Trucking' : partData.sourceid !== 'DH' ? `$${partData.cost_oneday_saver}` : '—'}
                      </td>
                      <td className="ep-td-label ep-td-shade">Free Shipping:</td>
                      <td className="ep-td-val">
                        {Number(partData.free_ship) === 1 ? <span className="ep-free-badge">FREE</span>
                          : Number(partData.free_ship) === 0 ? 'NOT FREE'
                          : `$${partData.ship_price} ${partData.ship_method1}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Priority:</td>
                      <td className="ep-td-val">{isTruck ? 'Trucking' : `$${partData.cost_oneday}`}</td>
                      <td className="ep-td-label ep-td-shade">Free Search Shipping:</td>
                      <td className="ep-td-val">
                        {Number(partData.freeshipping2) === 1 ? <span className="ep-free-badge">FREE</span> : 'NOT FREE'}
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">U.S. Mail Priority:<br /><small>(AA,AE,AP only)</small></td>
                      <td className="ep-td-val">
                        {isTruck ? 'Trucking'
                          : Number(partData.weight) > 5
                            ? `$${((parseInt(partData.cost_oneday) + parseInt(partData.cost_twoday)) / 3).toFixed(2)}`
                            : `$${((parseInt(partData.cost_oneday_saver) + parseInt(partData.cost_twoday)) / 2).toFixed(2)}`}
                      </td>
                      <td className="ep-td-label ep-td-shade">Notify Customer</td>
                      <td className="ep-td-val">
                        <a href={`/email_alert?pid=${partData.productid}&part_no=${partNo}&vid=${vendorid}`} className="ep-link-blue">Click here</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Fedex Int. Economy:<br /><small>(Canada only)</small></td>
                      <td className="ep-td-val">
                        {isTruck ? 'Trucking' : `$${(parseFloat(partData.cost_twoday || 0) + 15).toFixed(2)}`}
                      </td>
                      <td className="ep-td-label ep-td-shade"></td>
                      <td className="ep-td-val"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>{/* end left col */}

            {/* RIGHT COLUMN */}
            <div className="ep-col">

              <div className="ep-image-card">
                <img
                  src={partData.product_image
                    ? `https://your-site.com${partData.product_image}`
                    : 'https://www.your-site.com/mscs_images/pics/noimage.png'}
                  alt="Product"
                  className="ep-product-img"
                />
              </div>

              <div className="ep-section-card">
                <table className="ep-table ep-table--4col">
                  <tbody>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Vendor Part #:</td>
                      <td className="ep-td-val ep-td-mono">{partNo}</td>
                      <td className="ep-td-label ep-td-shade">Supplier Part #:</td>
                      <td className="ep-td-val ep-td-mono">{partData.supplierpartno}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Original Part #:</td>
                      <td className="ep-td-val ep-td-mono">{partData.ovendorpartnu}</td>
                      <td className="ep-td-label ep-td-shade">Supplier:</td>
                      <td className="ep-td-val ep-td-mono">{partData.sourceid}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">UPC:</td>
                      <td className="ep-td-val ep-td-mono">{partData.upc}</td>
                      <td className="ep-td-label ep-td-shade">your-site ID:</td>
                      <td className="ep-td-val ep-td-mono">{partData.productid}</td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Total Purchased<br />past 90 days</td>
                      <td className="ep-td-val">{partData.total_best ?? 0}</td>
                      <td className="ep-td-label ep-td-shade">Total Clicks:</td>
                      <td className="ep-td-val">{partData.total_clicks ?? '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="ep-section-card">
                <div className="ep-section-head" style={{ justifyContent: 'space-between' }}>
                  <span>Product Info</span>
                  <small style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>✏️ click a value to edit</small>
                </div>
                <table className="ep-table ep-table--4col">
                  <tbody>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Qty:</td>
                      <td className="ep-td-val">{partData.qty ?? '—'}</td>
                      <td className="ep-td-label ep-td-shade">Available:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="available"><YesNo val={partData.available} /></EditableVal>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Weight:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="weight"><span className="ep-td-warn">{partData.weight}</span></EditableVal>
                      </td>
                      <td className="ep-td-label ep-td-shade">Condition:</td>
                      <td className="ep-td-val">
                        <YesNo val={isYesVal(partData.condition) ? 'y' : 'n'} text={isYesVal(partData.condition) ? 'New' : 'Refurbished'} />
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Display Public:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="displaypublic"><YesNo val={partData.displaypublic} /></EditableVal>
                      </td>
                      <td className="ep-td-label ep-td-shade">Display Realtime:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="displayrealtime"><YesNo val={partData.displayrealtime} /></EditableVal>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Show Price Cart Only:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="displaycartonlyprice"><YesNo val={partData.displaycartonlyprice} /></EditableVal>
                      </td>
                      <td className="ep-td-label ep-td-shade">Call For Price:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="callforprice"><YesNo val={partData.callforprice} /></EditableVal>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Display Buy Button:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="displaybuy"><YesNo val={partData.displaybuy} /></EditableVal>
                      </td>
                      <td className="ep-td-label ep-td-shade">CS Available:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="csavailable"><YesNo val={partData.csavailable} /></EditableVal>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Pre-Order:</td>
                      <td className="ep-td-val">
                        <a href="#" className="ep-link-blue">{partData.preorder_id ? 'view' : 'add'}</a>
                      </td>
                      <td className="ep-td-label ep-td-shade">Vendor Drop:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="dropship"><YesNo val={partData.dropship} /></EditableVal>
                      </td>
                    </tr>
                    <tr>
                      <td className="ep-td-label ep-td-shade">Allow Returns:</td>
                      <td className="ep-td-val">
                        <EditableVal modal="allow_returns"><YesNo val={partData.allow_returns} /></EditableVal>
                      </td>
                      <td className="ep-td-label ep-td-shade">Release Date:</td>
                      <td className="ep-td-val">{partData.release_date ? fmtDate(partData.release_date) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>{/* end right col */}
          </div>
        );

      case 'price': {
        if (tabLoading) return <div className="ep-tab-placeholder"><div className="od-spinner" /></div>;
        if (!tabData) return <div className="ep-tab-placeholder">No price data found.</div>;
        const grouped = {};
        Object.keys(tabData).forEach(key => {
          const [prefix, ...rest] = key.split('_');
          const field = rest.join('_');
          if (!grouped[prefix]) grouped[prefix] = { vendor: prefix };
          grouped[prefix][field] = tabData[key];
        });
        const rows = Object.values(grouped).filter(item => item.part_no != null);
        const lowestCost = Math.min(...rows.map(r => r.cost || Infinity));
        return (
          <div className="ep-price-card">
            <div className="ep-price-header">
              <span>Price Shopper</span>
              <span className="od-count-badge">{rows.length} vendors</span>
            </div>
            <div className="ep-price-table-wrap">
              <table className="ep-price-table">
                <thead><tr><th>Vendor</th><th>Part No</th><th>Status</th><th style={{textAlign:'right'}}>Cost</th><th style={{textAlign:'right'}}>Qty</th></tr></thead>
                <tbody>
                  {rows.map((row, i) => {
                    const isMatch  = partData?.sourceid?.toString().toLowerCase() === row.vendor?.toString().toLowerCase();
                    const isLowest = row.cost === lowestCost;
                    return (
                      <tr key={i} className={`ep-price-row${isLowest?' lowest':isMatch?' match':''}`}>
                        <td><span className="ep-vendor-name">{row.vendor?.toUpperCase()}</span></td>
                        <td><span className="ep-mono">{row.part_no?.trim()}</span></td>
                        <td>
                          {isLowest && <span className="ep-badge ep-badge-blue">Low Cost</span>}
                          {isMatch && !isLowest && <span className="ep-badge ep-badge-green">Your Supplier</span>}
                        </td>
                        <td style={{textAlign:'right'}}>
                          <span className={`ep-cost${isLowest?' ep-cost-low':isMatch?' ep-cost-match':''}`}>
                            {row.cost ? `${row.cost.toFixed(2)}` : '—'}
                          </span>
                        </td>
                        <td style={{textAlign:'right'}}>
                          <span className={row.qty > 0 ? 'ep-qty-ok' : 'ep-qty-none'}>{row.qty ?? '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'technote': {
        if (tabLoading) return <div className="ep-tab-placeholder"><div className="od-spinner" /></div>;
        if (!tabData) return <div className="ep-tab-placeholder"><div className="od-spinner" /></div>;
        if (!Array.isArray(tabData) || tabData.length === 0) return (
          <div className="ep-tab-placeholder"><div className="empty-state-icon">📋</div><strong>No Etilize data found</strong></div>
        );
        const techGroups = tabData.reduce((acc, row) => {
          const key = row.headerid;
          if (!acc[key]) acc[key] = { headername: row.headername, attributes: {} };
          if (!acc[key].attributes[row.attributeid])
            acc[key].attributes[row.attributeid] = { attributename: row.attributename, values: [] };
          acc[key].attributes[row.attributeid].values.push(row.displayvalue);
          return acc;
        }, {});
        return (
          <div className="ep-technote">
            {Object.values(techGroups).map((group, gi) => (
              <div className="ep-section-card" key={gi}>
                <div className="ep-section-head"><span>📋</span>{group.headername}</div>
                <div className="ep-section-body">
                  {Object.values(group.attributes).map((attr, ai) => (
                    attr.attributename?.toUpperCase() === 'MARKETING INFORMATION' ? (
                      <div key={ai} className="ep-technote-marketing">
                        <span dangerouslySetInnerHTML={{ __html: attr.values.join('<br/>').replace(/<li>/gi, "<li style='list-style-position:inside;'>") }} />
                      </div>
                    ) : (
                      <div className="ep-row" key={ai}>
                        <span className="ep-row-label">{attr.attributename}</span>
                        <span className="ep-row-value" dangerouslySetInnerHTML={{ __html: attr.values.join('<br/>').replace(/<li>/gi, "<li style='list-style-position:inside;'>") }} />
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'realtime': {
        if (tabLoading) return <div className="ep-tab-placeholder"><div className="od-spinner" /></div>;
        if (!tabData) return <div className="ep-tab-placeholder"><div className="empty-state-icon">📡</div><strong>No realtime data</strong></div>;
        if (tabData.error) return <div className="ep-tab-placeholder"><strong>Error loading realtime data</strong></div>;
        const { src: activeSrc, suppliers = [] } = tabData;
        return (
          <div className="ep-realtime">
            {suppliers.length === 0 && (
              <div className="ep-tab-placeholder"><div className="empty-state-icon">📡</div><strong>No supplier data available</strong></div>
            )}
            {suppliers.map((supplier, si) => (
              <div className="ep-section-card" key={si}>
                <div className="ep-section-head" style={{ justifyContent: 'space-between' }}>
                  <span>🏭 {supplier.name} Warehouse</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeSrc === supplier.src && (
                      <span className="ep-badge" style={{ background: 'var(--accent)', color: '#fff' }}>✓ Active Supplier</span>
                    )}
                    {supplier.error
                      ? <span className="ep-badge" style={{ background: 'var(--danger)', color: '#fff' }}>Error</span>
                      : <span className="ep-badge" style={{
                          background: activeSrc === supplier.src ? '#b9ea54' : 'var(--surface-3)',
                          color: activeSrc === supplier.src ? '#1a1a1a' : 'inherit',
                          fontWeight: activeSrc === supplier.src ? 700 : 400,
                        }}>Stock: {supplier.total ?? 0} Available</span>
                    }
                  </div>
                </div>
                <div className="ep-section-body" style={{ padding: 0 }}>
                  {supplier.error ? (
                    <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>Could not retrieve data.</div>
                  ) : supplier.warehouses.length === 0 ? (
                    <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>No warehouse data returned.</div>
                  ) : (
                    <table className="ep-realtime-table">
                      <thead><tr><th>Warehouse</th><th>Qty</th><th>On Order</th><th>ETA Date</th></tr></thead>
                      <tbody>
                        {supplier.warehouses.map((w, wi) => (
                          <tr key={wi}><td>{w.location}</td><td>{w.qty}</td><td>{w.onOrder}</td><td>{w.eta}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              * ETA dates are vendor-provided and may be subject to change.
            </p>
          </div>
        );
      }

      case 'disti':
        return (
          <div className="ep-tab-placeholder">
            <div className="empty-state-icon">🚧</div>
            <strong>Disti Information</strong>
            <p>Content coming soon.</p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="portal-page">
      <div className="page-header">
        <div>
          <button className="od-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <h1 style={{ marginTop: 12 }}>
            Edit Part&nbsp;
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{partNo}</span>
          </h1>
          <div className="page-header-sub">
            {partData.vendor} · {partData.description?.substring(0, 80)}{partData.description?.length > 80 ? '…' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="stat-chip"><div className="stat-chip-label">Qty</div><div className="stat-chip-value accent">{partData.qty ?? '—'}</div></div>
          <div className="stat-chip"><div className="stat-chip-label">Price</div><div className="stat-chip-value">${partData.bmap ?? partData.price}</div></div>
          <div className="stat-chip"><div className="stat-chip-label">Cost</div><div className="stat-chip-value">${partData.cost}</div></div>
          <div className="stat-chip"><div className="stat-chip-label">MAP</div><div className="stat-chip-value">{partData.bmap != null ? `$${partData.bmap}` : '—'}</div></div>
        </div>
      </div>

      <div className="ep-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`ep-tab${activeTab === tab.key ? ' active' : ''}`} onClick={() => handleTabChange(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ep-content">{renderTabContent()}</div>

      {/* ── Modals — outside ep-content so they sit over everything ── */}
      {openModal === 'available' && (
        <AvailableModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.available} availId={partData.avail_id}
          onClose={closeModal} onSaved={val => { patchField('available', val); closeModal(); }} />
      )}
      {openModal === 'displaypublic' && (
        <DisplayPublicModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.displaypublic} availId={partData.displaypublic_id}
          onClose={closeModal} onSaved={val => { patchField('displaypublic', val); closeModal(); }} />
      )}
      {openModal === 'displayrealtime' && (
        <DisplayRealtimeModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.displayrealtime} availId={partData.displayreal_id}
          onClose={closeModal} onSaved={val => { patchField('displayrealtime', val); closeModal(); }} />
      )}
      {openModal === 'displaybuy' && (
        <DisplayBuyModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.displaybuy} availId={partData.displaybuy_id}
          onClose={closeModal} onSaved={val => { patchField('displaybuy', val); closeModal(); }} />
      )}
      {openModal === 'displaycartonlyprice' && (
        <ShowPriceCartModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.displaycartonlyprice} availId={partData.displaycartonlyprice_id}
          onClose={closeModal} onSaved={val => { patchField('displaycartonlyprice', val); closeModal(); }} />
      )}
      {openModal === 'callforprice' && (
        <CallForPriceModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.callforprice} availId={partData.call_id}
          onClose={closeModal} onSaved={val => { patchField('callforprice', val); closeModal(); }} />
      )}
      {openModal === 'allow_returns' && (
        <AllowReturnsModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.allow_returns}
          onClose={closeModal} onSaved={val => { patchField('allow_returns', val); closeModal(); }} />
      )}
      {openModal === 'dropship' && (
        <VendorDropModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.dropship} availId={partData.avail_id}
          onClose={closeModal} onSaved={val => { patchField('dropship', val); closeModal(); }} />
      )}
      {openModal === 'csavailable' && (
        <AvailableInhouseModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.csavailable} availId={partData.csavailable_id}
          onClose={closeModal} onSaved={val => { patchField('csavailable', val); closeModal(); }} />
      )}
      {openModal === 'weight' && (
        <WeightModal partNo={partNo} vendorid={vendorid}
          currentVal={partData.weight}
          onClose={closeModal} onSaved={val => { patchField('weight', val); closeModal(); }} />
      )}
    </div>
  );
}

const YesNo = ({ val, text }) => {
  const isYes = val === 'y' || val === 'Y' || val === 1 || val === '1' || val === true;
  return (
    <span className={isYes ? 'ep-yn-yes' : 'ep-yn-no'}>
      {text ?? (isYes ? 'Yes' : 'No')}
    </span>
  );
};

export default EditParts;
