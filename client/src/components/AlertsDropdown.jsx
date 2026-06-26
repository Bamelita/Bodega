import React, { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import { Bell, AlertTriangle, User, Package, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AlertsDropdown = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'admin') return;
    fetchAlerts();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const [productsRes] = await Promise.all([
        api.get('/products').catch(() => ({ data: [] }))
      ]);

      const newAlerts = [];

      productsRes.data.forEach(p => {
        if (p.stock === 0) {
          newAlerts.push({
            id: `prod-${p.id}-out`,
            type: 'danger',
            icon: AlertTriangle,
            title: 'Sin Stock',
            message: `El producto "${p.name}" se ha agotado.`
          });
        } else if (p.stock <= 5) {
          newAlerts.push({
            id: `prod-${p.id}-low`,
            type: 'warning',
            icon: Package,
            title: 'Stock Bajo',
            message: `Quedan ${p.stock} unidades de "${p.name}".`
          });
        }
      });

      setAlerts(newAlerts);
      
      if (newAlerts.length > 0 && !sessionStorage.getItem('alertsViewedThisSession')) {
        setHasUnread(true);
      }
    } catch (error) {
      console.error('Error fetching alerts', error);
    }
  };

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setHasUnread(false);
      sessionStorage.setItem('alertsViewedThisSession', 'true');
    }
  };

  if (user?.role === 'admin') return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`icon-pill ${hasUnread ? 'notif-dot' : ''}`} 
        onClick={toggleDropdown} 
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        Alertas
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-2xl shadow-xl z-[999] overflow-hidden"
             style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center">
            <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
              <Bell size={18} className="text-[var(--purple)]" />
              Notificaciones
            </h3>
            {alerts.length > 0 && (
              <span className="text-xs bg-[var(--purple)] text-white px-2 py-0.5 rounded-full font-bold">
                {alerts.length}
              </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center text-[var(--muted)]">
                <CheckCircle size={32} className="mb-2 opacity-50 text-[var(--success)]" />
                <p className="font-semibold text-sm">Todo al día</p>
                <p className="text-xs">No hay alertas pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--glass-border)]">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-4 hover:bg-[var(--glass-mid)] transition-colors flex gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${alert.type === 'danger' ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : 'bg-[var(--warning-bg)] text-[var(--warning)]'}`}>
                      <alert.icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)]">{alert.title}</h4>
                      <p className="text-xs text-[var(--muted)] mt-1">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsDropdown;
