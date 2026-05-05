import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './layouts/Layout';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Sales = lazy(() => import('./pages/Sales'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity'));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling'));
const AdminBackups = lazy(() => import('./pages/admin/AdminBackups'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const App = () => {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            {/* Public Route */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected Routes */}
                            <Route element={<Layout />}>
                                <Route path="/" element={<Navigate to="/admin" replace />} />

                                {/* Admin Routes */}
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/settings" element={<Settings />} />
                                <Route path="/admin/profile" element={<AdminProfile />} />
                                <Route path="/admin/security" element={<AdminSecurity />} />
                                <Route path="/admin/billing" element={<AdminBilling />} />
                                <Route path="/admin/backups" element={<AdminBackups />} />
                                <Route path="/admin/audit" element={<AdminAudit />} />
                                <Route path="/admin/support" element={<AdminSupport />} />

                                {/* User Routes (if applicable) */}
                                <Route path="/user" element={<UserDashboard />} />
                                <Route path="/user/inventory" element={<Inventory />} />
                                <Route path="/user/sales" element={<Sales />} />
                                <Route path="/user/clients" element={<Clients />} />
                                <Route path="/user/reports" element={<Reports />} />
                                <Route path="/user/backups" element={<AdminBackups />} />
                            </Route>

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
};

export default App;
