import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import './App.css';

import Login from './components/Login';
import Home from './components/Home';
import WebOrders from './components/WebOrders';
import UpdateParts from './components/UpdateParts';
import TabPages from './components/TabPages';
import EditParts from './components/EditParts';
import BlogAdmin from './components/BlogAdmin';
import BannerAdmin from './components/BannerAdmin';
import CustomerComments from './components/CustomerComments';
import FraudIPs from './components/FraudIPs';
import LogAnalyzer from './components/LogAnalyzer';
import OperationsReport from './components/OperationsReport';
import TitleList from './components/TitleList';
import ProductImages from './components/ProductImages';

const ComingSoon = ({ name }) => (
  <div style={{ padding: 64, textAlign: 'center', color: '#9CA3AF' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>{name}</h2>
    <p style={{ marginTop: 8 }}>This page is coming soon.</p>
  </div>
);

const AuthNavigateBridge = () => {
  const navigate = useNavigate();
  const { navigateRef } = useAuth();
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AuthNavigateBridge />
      <div className="app-container">
        {isAuthenticated && <TitleList />}
        <div className={`content${isAuthenticated ? ' authenticated' : ''}`}>
          <Routes>
            <Route path="/login"                          element={<Login />} />
            <Route path="/home"                           element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/web-orders"                     element={<ProtectedRoute><WebOrders /></ProtectedRoute>} />
            <Route path="/order-details/:orderId"         element={<ProtectedRoute><ComingSoon name="Order Details" /></ProtectedRoute>} />
            <Route path="/fraud-ips"                      element={<ProtectedRoute><FraudIPs /></ProtectedRoute>} />
            <Route path="/order-problems"                 element={<ProtectedRoute><ComingSoon name="Order Problems" /></ProtectedRoute>} />
            <Route path="/OrderProblemsDetails/:orderId"  element={<ProtectedRoute><ComingSoon name="Order Problem Details" /></ProtectedRoute>} />
            <Route path="/tax-terms"                      element={<ProtectedRoute><ComingSoon name="Tax Terms" /></ProtectedRoute>} />
            <Route path="/distribution-mapping"           element={<ProtectedRoute><ComingSoon name="Distribution Mapping" /></ProtectedRoute>} />
            <Route path="/vendor-mapping"                 element={<ProtectedRoute><ComingSoon name="Vendor Mapping" /></ProtectedRoute>} />
            <Route path="/vendor-mapping/:src"            element={<ProtectedRoute><ComingSoon name="Vendor Mapping" /></ProtectedRoute>} />
            <Route path="/update-parts"                   element={<ProtectedRoute><UpdateParts /></ProtectedRoute>} />
            <Route path="/acumatica"                      element={<ProtectedRoute><ComingSoon name="Acumatica Orders" /></ProtectedRoute>} />
            <Route path="/editparts/:partNo/:vendorid"    element={<ProtectedRoute><EditParts /></ProtectedRoute>} />
            <Route path="/parts/:vendorid/:partNo/images" element={<ProtectedRoute><ProductImages /></ProtectedRoute>} />
            <Route path="/so-accounts"                    element={<ProtectedRoute><ComingSoon name="SO Accounts" /></ProtectedRoute>} />
            <Route path="/rebate-center"                  element={<ProtectedRoute><ComingSoon name="Rebate Center" /></ProtectedRoute>} />
            <Route path="/tab-pages/:tabId"               element={<ProtectedRoute><ComingSoon name="Tab Items" /></ProtectedRoute>} />
            <Route path="/tab-pages"                      element={<ProtectedRoute><TabPages /></ProtectedRoute>} />
            <Route path="/banners"                        element={<ProtectedRoute><BannerAdmin /></ProtectedRoute>} />
            <Route path="/configurator"                   element={<ProtectedRoute><ComingSoon name="Configurator" /></ProtectedRoute>} />
            <Route path="/customer-comments"              element={<ProtectedRoute><CustomerComments /></ProtectedRoute>} />
            <Route path="/email-blast-list"               element={<ProtectedRoute><ComingSoon name="Email Blast List" /></ProtectedRoute>} />
            <Route path="/comp-price"                     element={<ProtectedRoute><ComingSoon name="Comp Price" /></ProtectedRoute>} />
            <Route path="/order-tracking"                 element={<ProtectedRoute><ComingSoon name="Order Tracking" /></ProtectedRoute>} />
            <Route path="/questions"                      element={<ProtectedRoute><ComingSoon name="Q&A" /></ProtectedRoute>} />
            <Route path="/site-reviews"                   element={<ProtectedRoute><ComingSoon name="Site Reviews" /></ProtectedRoute>} />
            <Route path="/company-to-do-list"             element={<ProtectedRoute><ComingSoon name="Company To-Do List" /></ProtectedRoute>} />
            <Route path="/blog-admin"                     element={<ProtectedRoute><BlogAdmin /></ProtectedRoute>} />
            <Route path="/log-analyzer"                   element={<ProtectedRoute><LogAnalyzer /></ProtectedRoute>} />
            <Route path="/rma-inquiries"                  element={<ProtectedRoute><ComingSoon name="RMA Inquiries" /></ProtectedRoute>} />
            <Route path="/rma-inquiries/:email"           element={<ProtectedRoute><ComingSoon name="RMA Detail" /></ProtectedRoute>} />
            <Route path="/vendor-seo"                     element={<ProtectedRoute><ComingSoon name="Vendor SEO" /></ProtectedRoute>} />
            <Route path="/category-seo"                   element={<ProtectedRoute><ComingSoon name="Category SEO" /></ProtectedRoute>} />
            <Route path="/vendor-banner-seo/:vendorId"    element={<ProtectedRoute><ComingSoon name="Vendor Banner SEO" /></ProtectedRoute>} />
            <Route path="/reports"                        element={<ProtectedRoute><OperationsReport /></ProtectedRoute>} />
            <Route path="*"                               element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
