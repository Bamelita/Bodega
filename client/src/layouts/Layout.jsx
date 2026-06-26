import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import BrandIcon from '../components/BrandIcon';
import AlertsDropdown from '../components/AlertsDropdown';
import AiAssistant from '../components/AiAssistant';

const Layout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [globalSearch, setGlobalSearch] = useState('');

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebarCollapsed', nextState.toString());
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading || (typeof loading === 'undefined' && !user)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--purple)]"></div>
      </div>
    );
  }
  if (!user && !loading) return <Navigate to="/login" />;

  const isActive = (path) => location.pathname === path;

  // We map the route names to what is displayed in the topbar
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/admin':           return 'Panel de Administración';
      case '/admin/settings':  return 'Configuración';
      case '/admin/profile':   return 'Mi Perfil';
      case '/admin/security':  return 'Seguridad';
      case '/admin/billing':   return 'Planes y Facturación';
      case '/admin/backups':   return 'Copias de Seguridad';
      case '/admin/audit':     return 'Auditoría';
      case '/admin/support':   return 'Soporte';
      case '/user':            return 'Panel de Control';
      case '/user/inventory':  return 'Inventario';
      case '/user/sales':      return 'Ventas';
      case '/user/clients':    return 'Clientes';
      case '/user/reports':    return 'Reportes';
      case '/user/backups':    return 'Copias de Seguridad';
      default: return 'Invexis';
    }
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/user/inventory?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="flex items-center justify-between">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="flex gap-2">
              <button className="mobile-close-btn hidden lg:flex hover:bg-[var(--glass-white)] p-1 rounded-md transition-colors" onClick={toggleCollapse} title="Colapsar/Expandir Menú">
                <Menu size={20} className="text-[var(--ink)]" />
              </button>
              <button className="mobile-close-btn lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-[var(--muted)]" />
              </button>
            </div>
          </div>
          <div className="brand-name">Invexis</div>
          <div className="brand-sub">Gestión de Inventario</div>
        </div>

        <div className="nav">
          {user?.role === 'admin' ? (
            <>
              <div className="nav-section-label">Administración</div>
              <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                Control de Usuarios
              </Link>
              <Link to="/admin/billing" className={`nav-item ${isActive('/admin/billing') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Planes y Facturación
              </Link>
              <Link to="/admin/support" className={`nav-item ${isActive('/admin/support') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Reportes / Soporte
              </Link>
              <Link to="/admin/backups" className={`nav-item ${isActive('/admin/backups') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Copias de Seguridad
              </Link>
              <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Configuración
              </Link>
            </>
          ) : (
            <>
              <div className="nav-section-label">Principal</div>
              <Link to="/user" className={`nav-item ${isActive('/user') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                Dashboard
              </Link>
              <Link to="/user/inventory" className={`nav-item ${isActive('/user/inventory') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                Inventario
              </Link>
              <Link to="/user/sales" className={`nav-item ${isActive('/user/sales') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                Ventas
              </Link>
              <Link to="/user/clients" className={`nav-item ${isActive('/user/clients') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                Clientes
              </Link>
              <Link to="/user/reports" className={`nav-item ${isActive('/user/reports') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Reportes
              </Link>
              <Link to="/user/support" className={`nav-item ${isActive('/user/support') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Soporte
              </Link>
              <Link to="/user/backups" className={`nav-item ${isActive('/user/backups') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Copias de Seguridad
              </Link>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => {}}>
            <div className="user-av">{(user?.username?.[0] || 'A').toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.username || 'Admin'}</div>
              <div className="user-role">{user?.role || 'Administrador'}</div>
            </div>
            <button className="logout-btn" onClick={(e) => { e.stopPropagation(); logout(); }} title="Salir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <div className={`main ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="topbar">
          <button className="mobile-menu-btn lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-[var(--ink)]" />
          </button>
          
          {user?.role !== 'admin' && (
            <form className="search-wrap hidden md:flex" onSubmit={handleGlobalSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input 
                type="text" 
                placeholder="Buscar en inventario..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </form>
          )}

          <div className="topbar-title">{getPageTitle()}</div>
          <div className="topbar-actions">
            <div className="icon-pill" onClick={toggleTheme} style={{ cursor: 'pointer' }} title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}>
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              )}
            </div>
            <AlertsDropdown />
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
      <AiAssistant />
    </>
  );
};

export default Layout;
