// ─────────────────────────────────────────────────────────────────────
// Mock API — used when VITE_API_URL is not set or for GitHub Pages demo
// Import this instead of fetch() calls for a no-server demo
// ─────────────────────────────────────────────────────────────────────

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const ORDERS = Array.from({ length: 30 }, (_, i) => ({
  order_number:     `1000${String(i+1).padStart(6,'0')}-${100000+i}`,
  date_time:        new Date(Date.now() - i * 3600000 * 8).toISOString(),
  Billing_first:    ['James','Sarah','Mike','Emily','Robert','Linda'][i%6],
  billing_last:     ['Smith','Johnson','Williams','Brown','Jones','Davis'][i%6],
  billing_email:    `customer${i+1}@example.com`,
  billing_phone:    `555-${String(1000+i).slice(-4)}`,
  billing_city:     ['New York','Los Angeles','Chicago','Houston','Phoenix'][i%5],
  billing_state:    ['NY','CA','IL','TX','AZ'][i%5],
  billing_zip:      String(10000+i*7),
  billing_street:   `${100+i} Main Street`,
  shipping_first:   ['James','Sarah','Mike','Emily','Robert','Linda'][i%6],
  shipping_last:    ['Smith','Johnson','Williams','Brown','Jones','Davis'][i%6],
  shipping_city:    ['New York','Los Angeles','Chicago','Houston','Phoenix'][i%5],
  shipping_state:   ['NY','CA','IL','TX','AZ'][i%5],
  shipping_zip:     String(10000+i*7),
  shipping_street:  `${100+i} Main Street`,
  shipping_phone:   `555-${String(1000+i).slice(-4)}`,
  shipping_method:  ['GG','TD','OS','TR'][i%4],
  payment_method:   ['Credit Card','PayPal','Net Terms','CreditKey'][i%4],
  transaction_type: ['C','P','N','CK'][i%4],
  total_price:      (Math.random()*2000+50).toFixed(2),
  total_shipping:   (Math.random()*30+5).toFixed(2),
  tax_amount:       (Math.random()*100).toFixed(2),
  HOST_IP:          `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.1.${Math.floor(Math.random()*255)}`,
  credit_fraud:     `riskScore = <b><font color=red>${(Math.random()*100).toFixed(2)}\n</font></b>countryMatch = Yes\ncountryCode = US`,
  sales_person:     ['Jordan','Alex','Taylor','Morgan'][i%4],
  Customer_No:      String(10000+i),
  Qty:              Math.floor(Math.random()*5)+1,
  Unit_Price:       (Math.random()*500+20).toFixed(2),
  referral:         ['https://www.google.com','https://www.Your-site.com','Direct'][i%3],
  agree_policy:     1,
}));

export const mockApi = {
  login: async ({ username, password }) => {
    await delay();
    const users = [
      { username:'admin', password:'admin123', name_short:'Admin', admin:1, active:1 },
      { username:'staff', password:'staff123', name_short:'Staff', admin:0, active:1 },
    ];
    const user = users.find(u => u.username===username && u.password===password);
    if (!user) throw new Error('Invalid credentials');
    return { success:true, user:{ admin:user.admin, name_short:user.name_short, user_id:1, active:1 } };
  },

  getOrders: async () => { await delay(); return ORDERS; },

  getOrder: async (id) => {
    await delay();
    return ORDERS.find(o => o.order_number === id) || ORDERS[0];
  },

  getOrderItems: async () => { await delay(); return [
    { vendor_part_no:'DEMO-001', vendorid:100, description:'Cisco Switch 24-Port', QTY:2, PRICE:449.99, DISCOUNT:0, shipping_total:9.99, shipping_method:'GG', supplierpartno:'CS-001', cost_when_placed:289.99, qty_when_placed:15 },
    { vendor_part_no:'DEMO-002', vendorid:100, description:'HP ProBook Laptop',    QTY:1, PRICE:899.99, DISCOUNT:5, shipping_total:0,    shipping_method:'GG', supplierpartno:'HP-002', cost_when_placed:599.99, qty_when_placed:8  },
  ]; },

  getParts: async ({ part, manufacturer } = {}) => {
    await delay();
    const parts = Array.from({ length:50 }, (_,i) => ({
      vendor_part_no: `PART-${String(i+1).padStart(4,'0')}`,
      vendorid: 100+(i%10),
      vendor: ['Cisco','HP','Dell','Lenovo','Samsung','Apple','Sony','LG','Asus','Acer'][i%10],
      imagethumb: null,
      bmap: i%5===0 ? (200+i*3).toFixed(2) : null,
      price: (50+i*9).toFixed(2),
    }));
    let result = parts;
    if (part)         result = result.filter(p => p.vendor_part_no.toLowerCase().includes(part.toLowerCase()));
    if (manufacturer) result = result.filter(p => p.vendor.toUpperCase().startsWith(manufacturer.toUpperCase()));
    return result.slice(0,30);
  },

  getComments: async () => { await delay(); return [
    { id:1, date_written:new Date(Date.now()-86400000*3).toISOString(), header:'Excellent Service!', written_text:'Your-site delivered my order faster than expected. Great prices and excellent customer service!', name:'John Smith',  email_user:'john@example.com', active:true,  left_nav:true  },
    { id:2, date_written:new Date(Date.now()-86400000*7).toISOString(), header:'Great Prices',       written_text:'Found the best prices on networking equipment here. Staff was very helpful.',                name:'Sarah Lee',   email_user:'sarah@example.com',active:true,  left_nav:false },
    { id:3, date_written:new Date(Date.now()-86400000*1).toISOString(), header:'Pending Review',     written_text:'Good products overall but support was a bit slow to respond.',                               name:'Anonymous',   email_user:'',                 active:false, left_nav:false },
  ]; },

  getBanners: async () => { await delay(); return [
    { banner_id:1, filename:'', description:'CISCO NETWORKING',  url:'https://www.Your-site.com', target_window:0, active:'Y', active_extra:'N', company:'COM', keywords:['cisco','networking'], categories:['Network Equipment'] },
    { banner_id:2, filename:'', description:'HP PRINTERS',       url:'https://www.Your-site.com', target_window:1, active:'N', active_extra:'Y', company:'COM', keywords:['hp','printer'],       categories:['Printers']         },
  ]; },

  getBlogs: async () => { await delay(); return [
    { id:1, title:'New Cisco Products 2026',  slug:'cisco-2026',   status:'published', author:'Admin', created_at:new Date(Date.now()-86400000*5).toISOString()  },
    { id:2, title:'HP Enterprise Server Guide', slug:'hp-servers', status:'published', author:'Admin', created_at:new Date(Date.now()-86400000*10).toISOString() },
    { id:3, title:'Dell Workstation Guide',   slug:'dell-ws',      status:'draft',     author:'Staff', created_at:new Date(Date.now()-86400000*2).toISOString()  },
  ]; },

  getReportsKpi: async () => { await delay(); return {
    sql_total:48, sql_succeeded:44, sql_failed:4,
    sql_dev_total:32, sql_dev_succeeded:30, sql_dev_failed:2,
    live_total:924531, backup_total:918200, total_diff:6331,
  }; },

  getSqlJobsToday:    async () => { await delay(); return [{ name:'Succeeded',value:44 },{ name:'Failed',value:4 },{ name:'Running',value:0 }]; },
  getSqlJobsTodayDev: async () => { await delay(); return [{ name:'Succeeded',value:30 },{ name:'Failed',value:2 },{ name:'Running',value:0 }]; },

  getSqlJobsHistory: async () => {
    await delay();
    return Array.from({ length:30 }, (_,i) => {
      const d = new Date(Date.now()-(29-i)*86400000);
      return { day:d.toISOString().split('T')[0], total_runs:Math.floor(Math.random()*20+30), failed:Math.floor(Math.random()*5) };
    });
  },

  getSourceComparison: async () => { await delay(); return [
    { sourceid:'IM', live:280000, backup:275000, diff:5000,  pct:'101.8' },
    { sourceid:'DH', live:195000, backup:193000, diff:2000,  pct:'101.0' },
    { sourceid:'SN', live:150000, backup:148000, diff:2000,  pct:'101.4' },
    { sourceid:'US', live: 85000, backup: 87000, diff:-2000, pct:'97.7'  },
  ]; },

  getFraudIps: async () => { await delay(); return [
    { fraud_id:1, ip:'192.168.1.100', secondtime:'N', user_delete:'Admin', date_time:new Date().toISOString() },
    { fraud_id:2, ip:'10.0.0.55',     secondtime:'Y', user_delete:'Staff', date_time:new Date(Date.now()-86400000).toISOString() },
  ]; },

  checkFraudIp: async (ip) => {
    await delay(200);
    const list = ['192.168.1.100','10.0.0.55'];
    const inList = list.includes(ip);
    return {
      record: inList ? { fraud_id:1, ip, secondtime:'N', user_delete:'Admin', date_time:new Date().toISOString() } : null,
      history: inList ? [{ CART_ID:'DEMO-001', order_number:'1000000001-100001', TIME_IN:new Date().toISOString(), total_price:299.99, delete_fraud:'N' }] : [],
    };
  },
};

export default mockApi;
