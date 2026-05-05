import express from 'express';
import cors    from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: 'admin',  password: 'admin123',  name_short: 'Admin',  admin: 1, active: 1 },
    { username: 'staff',  password: 'staff123',  name_short: 'Staff',  admin: 0, active: 1 },
  ];
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, user: { admin: user.admin, name_short: user.name_short, user_id: 1, active: user.active } });
});

// ── Web Orders ────────────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  { part_no: 'C9200L-48P-4G-E', vendorid: 101, product: 'Cisco Catalyst 9200L 48-Port PoE Switch' },
  { part_no: 'J9773A',          vendorid: 102, product: 'HP Aruba 2530-24G-PoEP Switch' },
  { part_no: 'EX2300-48P',      vendorid: 103, product: 'Juniper Networks EX2300 48-Port PoE Switch' },
  { part_no: 'XS708T-100NES',   vendorid: 104, product: 'NETGEAR ProSAFE 8-Port 10G Switch' },
  { part_no: 'WS-C3650-48FS-E', vendorid: 101, product: 'Cisco Catalyst 3650 48-Port Full PoE Switch' },
  { part_no: 'J9727A',          vendorid: 102, product: 'HP Aruba 2920-48G PoEP Switch' },
];

const ORDERS = Array.from({ length: 40 }, (_, i) => {
  const prod = DEMO_PRODUCTS[i % DEMO_PRODUCTS.length];
  const dt   = new Date(Date.now() - i * 3600000 * 8).toISOString();
  return {
    order_number:     `1000${String(i+1).padStart(6,'0')}-${100000 + i}`,
    date_time:        dt,
    Date:             dt,
    Billing_first:    ['James','Sarah','Mike','Emily','Robert','Linda'][i%6],
    billing_last:     ['Smith','Johnson','Williams','Brown','Jones','Davis'][i%6],
    billing_email:    `customer${i+1}@example.com`,
    billing_phone:    `555-${String(1000+i).slice(-4)}`,
    billing_city:     ['New York','Los Angeles','Chicago','Houston','Phoenix'][i%5],
    billing_state:    ['NY','CA','IL','TX','AZ'][i%5],
    billing_zip:      String(10000 + i*7),
    billing_street:   `${100+i} Main Street`,
    shipping_first:   ['James','Sarah','Mike','Emily','Robert','Linda'][i%6],
    shipping_last:    ['Smith','Johnson','Williams','Brown','Jones','Davis'][i%6],
    shipping_city:    ['New York','Los Angeles','Chicago','Houston','Phoenix'][i%5],
    shipping_state:   ['NY','CA','IL','TX','AZ'][i%5],
    shipping_zip:     String(10000 + i*7),
    shipping_street:  `${100+i} Main Street`,
    shipping_phone:   `555-${String(1000+i).slice(-4)}`,
    shipping_method:  ['GG','TD','OS','TR'][i%4],
    payment_method:   ['Credit Card','PayPal','Net Terms','CreditKey'][i%4],
    transaction_type: ['C','P','N','CK'][i%4],
    total_price:      (Math.random() * 2000 + 50).toFixed(2),
    total_shipping:   (Math.random() * 30 + 5).toFixed(2),
    tax_amount:       (Math.random() * 100).toFixed(2),
    HOST_IP:          `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    credit_fraud:     `riskScore = <b><font color=red>${(Math.random()*100).toFixed(2)}\n</font></b>countryMatch = Yes\ncountryCode = US`,
    sales_person:     ['Jordan','Alex','Taylor','Morgan'][i%4],
    Customer_No:      String(10000 + i),
    Qty:              Math.floor(Math.random()*5)+1,
    Unit_Price:       (Math.random()*500+20).toFixed(2),
    referral:         ['https://www.google.com','https://www.your-site.com','https://www.bing.com','Direct'][i%4],
    agree_policy:     1,
    delete_fraud:     i % 15 === 0 ? 'Y' : 'N',
    part_no:          prod.part_no,
    vendorid:         prod.vendorid,
    product:          prod.product,
    product_image:    '',
  };
});

app.post('/api/web-orders', (req, res) => {
  const { dateFrom, dateTo, showDeleted, customerId } = req.body;
  let orders = [...ORDERS];

  if (customerId) {
    orders = orders.filter(o => String(o.Customer_No) === String(customerId));
  } else if (dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    orders = orders.filter(o => {
      const d = new Date(o.Date);
      return d >= from && d <= to;
    });
  }

  if (!showDeleted) orders = orders.filter(o => o.delete_fraud !== 'Y');
  res.json(orders);
});

app.get('/api/web-orders/:orderId', (req, res) => {
  const order = ORDERS.find(o => o.order_number === req.params.orderId) || ORDERS[0];
  res.json({ ...order, c_card: '4111111111111111', c_type: 'Visa', eci: '05', cavv: 'DEMO', xid: 'DEMO' });
});

app.get('/api/order-items/:orderId', (req, res) => {
  res.json([
    { vendor_part_no: 'DEMO-PART-001', vendorid: 100, description: 'Demo Product One', QTY: 2, PRICE: 149.99, DISCOUNT: 0, shipping_total: 9.99, shipping_method: 'GG', supplierpartno: 'SUP001', cost_when_placed: 89.99, qty_when_placed: 15 },
    { vendor_part_no: 'DEMO-PART-002', vendorid: 100, description: 'Demo Product Two', QTY: 1, PRICE: 299.99, DISCOUNT: 5, shipping_total: 14.99, shipping_method: 'GG', supplierpartno: 'SUP002', cost_when_placed: 189.99, qty_when_placed: 8 },
  ]);
});

app.get('/api/order-tracking/:orderId', (req, res) => res.json([]));

app.get('/api/web-orders/sales-reps', (req, res) => {
  res.json([{ sales_person: 'Jordan' },{ sales_person: 'Alex' },{ sales_person: 'Taylor' },{ sales_person: 'Morgan' }]);
});

// ── Fraud IPs ─────────────────────────────────────────────────────────
const FRAUD_IPS = [
  { fraud_id: 1, ip: '192.168.1.100', secondtime: 'N', user_delete: 'Admin', date_time: new Date().toISOString() },
  { fraud_id: 2, ip: '10.0.0.55',     secondtime: 'Y', user_delete: 'Staff', date_time: new Date(Date.now()-86400000).toISOString() },
  { fraud_id: 3, ip: '172.16.0.200',  secondtime: 'N', user_delete: 'Admin', date_time: new Date(Date.now()-172800000).toISOString() },
];

app.get('/api/fraud-ip/check', (req, res) => {
  const { ip } = req.query;
  const record = FRAUD_IPS.find(f => f.ip === ip) || null;
  res.json({ record, history: record ? [
    { CART_ID: 'DEMO-001', order_number: '1000000001-100001', TIME_IN: new Date().toISOString(), total_price: 299.99, delete_fraud: 'N' }
  ] : [] });
});

app.post('/api/fraud-ip/add', (req, res) => {
  const { ip } = req.body;
  FRAUD_IPS.push({ fraud_id: FRAUD_IPS.length+1, ip, secondtime: 'N', user_delete: 'Admin', date_time: new Date().toISOString() });
  res.json({ success: true });
});

app.delete('/api/fraud-ip/delete', (req, res) => {
  const { fraud_id } = req.body;
  const idx = FRAUD_IPS.findIndex(f => f.fraud_id === fraud_id);
  if (idx !== -1) FRAUD_IPS.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/fraud-ip/second-offense', (req, res) => {
  const f = FRAUD_IPS.find(f => f.fraud_id === req.body.fraud_id);
  if (f) f.secondtime = 'Y';
  res.json({ success: true });
});

app.get('/api/fraud-ip/attempts', (req, res) => {
  res.json([
    { host_ip: '192.168.1.100', Year: 2026, Month: 4, AttemptCount: 15, FirstSeen: new Date(Date.now()-86400000*5).toISOString(), LastSeen: new Date().toISOString() },
    { host_ip: '10.0.0.55',     Year: 2026, Month: 4, AttemptCount: 8,  FirstSeen: new Date(Date.now()-86400000*3).toISOString(), LastSeen: new Date(Date.now()-86400000).toISOString() },
    { host_ip: '172.16.0.200',  Year: 2026, Month: 3, AttemptCount: 22, FirstSeen: new Date(Date.now()-86400000*10).toISOString(), LastSeen: new Date(Date.now()-86400000*2).toISOString() },
  ]);
});

// ── Parts ─────────────────────────────────────────────────────────────
const PARTS = Array.from({ length: 50 }, (_, i) => ({
  vendor_part_no: `PART-${String(i+1).padStart(4,'0')}`,
  vendorid:       100 + (i % 10),
  vendor:         ['Cisco','HP','Dell','Lenovo','Samsung','Apple','Sony','LG','Asus','Acer'][i%10],
  imagethumb:     null,
  bmap:           i % 5 === 0 ? (Math.random()*500+100).toFixed(2) : null,
  price:          (Math.random()*500+50).toFixed(2),
  price_search:   (Math.random()*500+50).toFixed(2),
  price_united:   (Math.random()*500+50).toFixed(2),
  cost:           (Math.random()*200+20).toFixed(2),
  available:      i%7===0 ? 'n' : 'y',
  displaypublic:  1,
  qty:            Math.floor(Math.random()*100),
  description:    `Demo Product ${i+1} - Professional Grade Equipment`,
}));

app.get('/api/parts', (req, res) => {
  const { part, manufacturer } = req.query;
  let parts = [...PARTS];
  if (part)         parts = parts.filter(p => p.vendor_part_no.toLowerCase().includes(part.toLowerCase()));
  if (manufacturer) parts = parts.filter(p => p.vendor.toUpperCase().startsWith(manufacturer.toUpperCase()));
  res.json(parts.slice(0, 30));
});

// ── Blogs ─────────────────────────────────────────────────────────────
const BLOGS = [
  { id: 1, title: 'New Cisco Networking Products 2026', slug: 'cisco-networking-2026', status: 'published', author: 'Admin', created_at: new Date(Date.now()-86400000*5).toISOString(), content: '<p>Exciting new Cisco products have arrived...</p>' },
  { id: 2, title: 'HP Enterprise Server Guide',         slug: 'hp-enterprise-servers', status: 'published', author: 'Admin', created_at: new Date(Date.now()-86400000*10).toISOString(), content: '<p>Complete guide to HP enterprise servers...</p>' },
  { id: 3, title: 'Dell Workstation Comparison',        slug: 'dell-workstations',     status: 'draft',     author: 'Staff', created_at: new Date(Date.now()-86400000*2).toISOString(),  content: '<p>Draft post comparing Dell workstations...</p>' },
];

app.get('/api/blog/posts',         (req, res) => res.json(BLOGS));
app.get('/api/blog/posts/:id',     (req, res) => res.json(BLOGS.find(b => b.id === parseInt(req.params.id)) || BLOGS[0]));
app.post('/api/blog/posts',        (req, res) => { BLOGS.push({ id: BLOGS.length+1, ...req.body, created_at: new Date().toISOString() }); res.json({ success: true }); });
app.put('/api/blog/posts/:id',     (req, res) => res.json({ success: true }));
app.delete('/api/blog/posts/:id',  (req, res) => res.json({ success: true }));

// ── Banners ───────────────────────────────────────────────────────────
const BANNERS = [
  { banner_id: 1, filename: 'demo1.jpg', description: 'CISCO, NETWORKING', url: 'https://www.your-site.com', target_window: 0, active: 'Y', active_extra: 'N', company: 'COM', keywords: ['cisco','networking','switch'], categories: ['Network Equipment'] },
  { banner_id: 2, filename: 'demo2.jpg', description: 'HP, PRINTERS',      url: 'https://www.your-site.com', target_window: 1, active: 'N', active_extra: 'Y', company: 'COM', keywords: ['hp','printer'],            categories: ['Printers'] },
  { banner_id: 3, filename: 'demo3.jpg', description: 'DELL SERVERS',      url: '',                           target_window: 0, active: 'Y', active_extra: 'Y', company: 'COM', keywords: ['dell','server'],            categories: ['Servers'] },
];

app.get('/api/banners',                          (req, res) => res.json(BANNERS));
app.post('/api/banners/:id/modify',              (req, res) => res.json({ success: true }));
app.get('/api/banners/:id/keywords',             (req, res) => { const b = BANNERS.find(x => x.banner_id === parseInt(req.params.id)); res.json((b?.keywords||[]).map(k=>({keyword:k}))); });
app.post('/api/banners/:id/keywords',            (req, res) => res.json({ success: true }));
app.get('/api/banners/:id/categories',           (req, res) => res.json([]));
app.get('/api/banners/categories-list',          (req, res) => res.json([{ etilize_cat: 1, Name: 'Network Equipment' },{ etilize_cat: 2, Name: 'Printers' },{ etilize_cat: 3, Name: 'Servers' }]));
app.post('/api/banners/:id/categories',          (req, res) => res.json({ success: true }));
app.post('/api/banners/add',                     (req, res) => res.json({ success: true, bannerId: 99, filename: '99.jpg' }));
app.delete('/api/banners/delete',                (req, res) => res.json({ success: true }));

// ── Customer Comments ─────────────────────────────────────────────────
const COMMENTS = [
  { id: 1, date_written: new Date(Date.now()-86400000*3).toISOString(),  header: 'Excellent Service!',    written_text: 'your-site delivered my order faster than expected. Great prices and excellent customer service. Will definitely order again!', name: 'John Smith',  email_user: 'john@example.com', active: true,  left_nav: true  },
  { id: 2, date_written: new Date(Date.now()-86400000*7).toISOString(),  header: 'Great Prices',          written_text: 'Found the best prices on networking equipment here. The staff was very helpful in selecting the right products for our office.',   name: 'Sarah Lee',   email_user: 'sarah@example.com',active: true,  left_nav: false },
  { id: 3, date_written: new Date(Date.now()-86400000*14).toISOString(), header: 'Fast Shipping',         written_text: 'Ordered on Monday and received by Wednesday. Packaging was excellent and product was exactly as described.',                        name: 'Mike Brown',  email_user: '',                 active: true,  left_nav: true  },
  { id: 4, date_written: new Date(Date.now()-86400000*1).toISOString(),  header: 'Good but slow support', written_text: 'Products are good quality but support took a while to respond. Overall happy with the purchase.',                                   name: 'Anonymous',   email_user: '',                 active: false, left_nav: false },
];

app.get('/api/comments',         (req, res) => res.json(COMMENTS));
app.get('/api/comments/pending', (req, res) => res.json(COMMENTS.filter(c => !c.active)));
app.get('/api/comments/:id',     (req, res) => res.json(COMMENTS.find(c => c.id === parseInt(req.params.id)) || COMMENTS[0]));
app.post('/api/comments',        (req, res) => { COMMENTS.push({ id: COMMENTS.length+1, ...req.body, date_written: new Date().toISOString() }); res.json({ success: true }); });
app.post('/api/comments/:id',    (req, res) => res.json({ success: true }));
app.delete('/api/comments/delete',(req, res) => res.json({ success: true }));

// ── Reports ───────────────────────────────────────────────────────────
app.get('/api/reports/kpi', (req, res) => {
  res.json({
    sql_total: 48, sql_succeeded: 44, sql_failed: 4,
    sql_dev_total: 32, sql_dev_succeeded: 30, sql_dev_failed: 2,
    live_total: 924531, backup_total: 918200, total_diff: 6331,
    by_source: [
      { sourceid: 'Distributor-1', live: 280000, backup: 275000, diff: 5000 },
      { sourceid: 'Distributor-2', live: 195000, backup: 193000, diff: 2000 },
      { sourceid: 'Distributor-3', live: 150000, backup: 148000, diff: 2000 },
      { sourceid: 'Distributor-4', live: 120000, backup: 118000, diff: 2000 },
      { sourceid: 'Distributor-5', live:  90000, backup:  90000, diff:    0 },
    ],
  });
});

app.get('/api/reports/sql-jobs-today', (req, res) => res.json([
  { name: 'Succeeded', value: 44 },
  { name: 'Failed',    value: 4  },
  { name: 'Running',   value: 0  },
]));

app.get('/api/reports/sql-jobs-today-dev', (req, res) => res.json([
  { name: 'Succeeded', value: 30 },
  { name: 'Failed',    value: 2  },
  { name: 'Running',   value: 0  },
]));

const genHistory = (days) => Array.from({ length: days }, (_, i) => {
  const d = new Date(Date.now() - (days-1-i) * 86400000);
  return { day: d.toISOString().split('T')[0], total_runs: Math.floor(Math.random()*20+30), failed: Math.floor(Math.random()*5) };
});

app.get('/api/reports/sql-jobs-history',     (req, res) => res.json(genHistory(30)));
app.get('/api/reports/sql-jobs-history-dev', (req, res) => res.json(genHistory(30)));

app.get('/api/reports/sql-jobs-recent', (req, res) => res.json([
  { name: 'Import_Distributor_files',        run_time: '00:12', status: 'success' },
  { name: 'Import_products_from_files',     run_time: '00:45', status: 'success' },
  { name: 'update_Markedup',      run_time: '00:33', status: 'failed'  },
  { name: 'Update_Pricing',         run_time: '00:08', status: 'success' },
  { name: 'Update_Live',      run_time: '00:02', status: 'success' },
  { name: 'Send_Order_Emails',  run_time: '01:15', status: 'success' },
  { name: 'backup_products',     run_time: '00:28', status: 'failed'  },
]));

app.get('/api/reports/sql-jobs-recent-dev', (req, res) => res.json([
   { name: 'import_feeds',           run_time: '01:02', run_status: 0, run_date: new Date().toISOString() },
  { name: 'reindex_live_site',           run_time: '00:12', run_status: 1, run_date: new Date().toISOString() },
  { name: 'update_dev_database',       run_time: '00:35', run_status: 1, run_date: new Date().toISOString() },
  { name: 'cleanup_temp_tables',    run_time: '00:05', run_status: 1, run_date: new Date().toISOString() },
]));

app.get('/api/reports/source-comparison', (req, res) => res.json([
  { sourceid: 'Distributor-1', live: 280000, backup: 275000, diff: 5000,  pct: '101.8' },
  { sourceid: 'Distributor-2', live: 195000, backup: 193000, diff: 2000,  pct: '101.0' },
  { sourceid: 'Distributor-3', live: 150000, backup: 148000, diff: 2000,  pct: '101.4' },
  { sourceid: 'Distributor-4', live: 120000, backup: 118000, diff: 2000,  pct: '101.7' },
  { sourceid: 'Distributor-5', live:  90000, backup:  90000, diff: 0,     pct: '100.0' },
  { sourceid: 'Distributor-6', live:  85000, backup:  87000, diff: -2000, pct: '97.7'  },
]));

// ── Log Analyzer ──────────────────────────────────────────────────────
app.get('/api/logs/files', (req, res) => res.json([
  { name: 'u_ex260428.log', size: '45.2 MB', date: new Date().toISOString() },
  { name: 'u_ex260427.log', size: '42.1 MB', date: new Date(Date.now()-86400000).toISOString() },
  { name: 'u_ex260426.log', size: '38.9 MB', date: new Date(Date.now()-86400000*2).toISOString() },
  { name: 'u_ex260425.log', size: '41.5 MB', date: new Date(Date.now()-86400000*3).toISOString() },
  { name: 'u_ex260424.log', size: '39.2 MB', date: new Date(Date.now()-86400000*4).toISOString() },
]));

app.post('/api/logs/run', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      report:  req.body.report || 'ip_hits',
      rows: [
        { clientip: '192.168.1.100', hits: 1523, useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        { clientip: '10.0.0.55',     hits: 892,  useragent: 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
        { clientip: '172.16.0.200',  hits: 445,  useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        { clientip: '8.8.8.8',       hits: 234,  useragent: 'curl/7.88.1' },
        { clientip: '1.1.1.1',       hits: 189,  useragent: 'Python-urllib/3.11' },
      ],
      columns: ['clientip','hits','useragent'],
    });
  }, 1500);
});

app.delete('/api/logs/delete', (req, res) => res.json({ success: true }));

// ── Home / Dashboard ──────────────────────────────────────────────────
app.get('/api/dashboard/stats', (req, res) => res.json({
  orders_today:   12,
  orders_week:    87,
  revenue_today:  8432.50,
  revenue_week:   62841.20,
  fraud_blocked:  3,
  parts_total:    924531,
}));

// ── Serve React build ─────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Your-site Admin Portal — DEMO SERVER`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`\n📋 Demo credentials:`);
  console.log(`   Admin: admin / admin123`);
  console.log(`   Staff: staff / staff123\n`);
});
