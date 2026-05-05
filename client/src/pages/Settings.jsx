import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell, Settings as SettingsIcon, Sliders, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Settings = () => {
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('notifications');
  const [status, setStatus] = useState({ type: '', message: '' });

  // Initialize tab from URL query param if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location]);

  const tabs = [
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'system', label: 'Sistema', icon: SettingsIcon },
    { id: 'limits', label: 'Límites', icon: Sliders },
  ];

  const showStatus = (type, msg) => {
    setStatus({ type, message: msg });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  return (
    <div className="page active" style={{ padding: 0 }}>
      <div className="flex h-[calc(100vh-60px)]">
        {/* Sidebar Tabs */}
        <div className="w-20 lg:w-64 border-r border-[var(--glass-border)] flex flex-col p-4">
          <div className="hidden lg:block mb-6 pt-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <SettingsIcon className="text-[var(--purple)]" size={24} /> Configuración
            </h1>
          </div>
          <nav className="flex-1 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--purple)] text-white shadow-md'
                    : 'text-[var(--muted)] hover:bg-[var(--glass-white)]'
                }`}
              >
                <tab.icon size={20} />
                <span className="hidden lg:block font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {status.message && (
              <div className={`alert-banner mb-6 ${status.type === 'success' ? '!bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]' : 'alert-danger'}`}>
                <div className="flex items-center gap-2">
                  {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{status.message}</span>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && <NotificationsTab showStatus={showStatus} />}
            {activeTab === 'system' && <SystemTab showStatus={showStatus} />}
            {activeTab === 'limits' && <LimitsTab showStatus={showStatus} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (Tabs) ---

const NotificationsTab = ({ showStatus }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get('/settings/notifications').then(res => setConfig(res.data)).catch(() => { });
  }, []);

  const toggle = (section, key) => {
    if (!config) return;
    const newConfig = { ...config, [section]: { ...config[section], [key]: !config[section][key] } };
    setConfig(newConfig);
    api.patch('/settings/notifications', newConfig);
    showStatus('success', 'Preferencias actualizadas');
  };

  if (!config) return <div>Cargando...</div>;

  const NotificationSwitch = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--glass-white)] cursor-pointer transition-colors group">
      <span className="font-medium group-hover:text-[var(--purple)] transition-colors">{label}</span>
      <div className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--purple)]"></div>
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Preferencias de Notificación</h2>

      <div className="card">
        <div className="card-body p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Para el Administrador</h3>
            <div className="space-y-1">
              <NotificationSwitch
                checked={config.admin?.userExpiring || false}
                onChange={() => toggle('admin', 'userExpiring')}
                label="Avisar cuando un usuario está por vencer"
              />
              <NotificationSwitch
                checked={config.admin?.userSuspended || false}
                onChange={() => toggle('admin', 'userSuspended')}
                label="Avisar cuando un usuario es suspendido autom."
              />
            </div>
          </div>

          <div className="w-full h-px bg-[var(--glass-border)]"></div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Para el Usuario</h3>
            <div className="space-y-1">
              <NotificationSwitch
                checked={config.user?.closeCutoff || false}
                onChange={() => toggle('user', 'closeCutoff')}
                label="Enviar recordatorio cerca de fecha de corte"
              />
              <NotificationSwitch
                checked={config.user?.suspended || false}
                onChange={() => toggle('user', 'suspended')}
                label="Notificar al ser suspendido"
              />
            </div>
          </div>

          <div className="w-full h-px bg-[var(--glass-border)]"></div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Canales de Envío</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotificationSwitch
                checked={config.channels?.system || false}
                onChange={() => toggle('channels', 'system')}
                label="Panel de Sistema"
              />
              <NotificationSwitch
                checked={config.channels?.email || false}
                onChange={() => toggle('channels', 'email')}
                label="Correo Electrónico"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemTab = ({ showStatus }) => {
  const [sys, setSys] = useState(null);
  useEffect(() => { api.get('/settings/system').then(r => setSys(r.data)).catch(() => { }); }, []);

  const save = () => {
    api.patch('/settings/system', sys);
    showStatus('success', 'Configuración de sistema guardada');
  };

  if (!sys) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Sistema</h2>
      <div className="card">
        <div className="card-body p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label>Formato de Fecha</label>
              <select value={sys.dateFormat} onChange={e => setSys({ ...sys, dateFormat: e.target.value })}>
                <option value="DD/MM/YYYY">DD/MM/YYYY (27/01/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (01/27/2026)</option>
              </select>
            </div>
            <div className="field">
              <label>Zona Horaria</label>
              <select value={sys.timezone} onChange={e => setSys({ ...sys, timezone: e.target.value })}>
                <option value="America/Caracas">America/Caracas</option>
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button onClick={save} className="btn btn-primary">Guardar Configuración</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LimitsTab = ({ showStatus }) => {
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    api.get('/settings/system').then(r => setLimits(r.data.limits || { maxProducts: 500, maxClients: 100 })).catch(() => { });
  }, []);

  const handleChange = (key, value) => {
    setLimits(prev => ({ ...prev, [key]: Number(value) }));
  };

  const save = () => {
    api.patch('/settings/system', { limits });
    showStatus('success', 'Límites actualizados correctamente');
  };

  if (!limits) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Límites y Cuotas</h2>
      <div className="card">
        <div className="card-body p-6 space-y-8">
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold">Productos por Usuario</label>
              <span className="text-[var(--purple)] font-bold">{limits.maxProducts}</span>
            </div>
            <input
              type="range" min="100" max="2000" step="50"
              value={limits.maxProducts}
              onChange={e => handleChange('maxProducts', e.target.value)}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--purple)]"
            />
            <p className="text-xs text-[var(--muted)] mt-1">Límite para planes básicos.</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-semibold">Clientes por Usuario</label>
              <span className="text-[var(--purple)] font-bold">{limits.maxClients}</span>
            </div>
            <input
              type="range" min="50" max="1000" step="10"
              value={limits.maxClients}
              onChange={e => handleChange('maxClients', e.target.value)}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--purple)]"
            />
          </div>
          <div className="pt-2">
            <button onClick={save} className="btn btn-primary">Guardar Límites</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
