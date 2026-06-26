import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import {
  Bell, Settings as SettingsIcon, Sliders, CheckCircle, AlertTriangle, Palette, User, Save, Eye, EyeOff
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
    { id: 'profile', label: 'Mi Perfil', icon: User },
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
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)]">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[var(--glass-border)] flex flex-col p-4 shrink-0">
          <div className="hidden lg:block mb-6 pt-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <SettingsIcon className="text-[var(--purple)]" size={24} /> Configuración
            </h1>
          </div>
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--purple)] text-white shadow-md'
                    : 'text-[var(--ink)] bg-[var(--glass-light)] hover:bg-[var(--glass-mid)] border border-[var(--glass-border)]'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-semibold">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {status.message && (
              <div className={`alert-banner mb-6 ${status.type === 'success' ? '!bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]' : 'alert-danger'}`}>
                <div className="flex items-center gap-2">
                  {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{status.message}</span>
                </div>
              </div>
            )}

            {activeTab === 'profile' && <ProfileTab showStatus={showStatus} />}
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

const ProfileTab = ({ showStatus }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Send the data, omit password if empty
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      
      const res = await api.put(`/users/${user.id}`, payload);
      updateUser(res.data);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
      showStatus('success', 'Perfil actualizado exitosamente');
    } catch (error) {
      showStatus('error', error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title text-lg">Información Personal</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-grid-2">
            <div className="field">
              <label>Nombre</label>
              <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            </div>
            <div className="field">
              <label>Apellido</label>
              <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </div>
            <div className="field">
              <label>Correo Electrónico</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Nombre de Usuario</label>
              <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Nueva Clave <small className="text-[var(--muted)] font-normal ml-1">(Opcional)</small></label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Dejar vacío para mantener" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
      <span className="font-semibold group-hover:text-[var(--purple)] transition-colors">{label}</span>
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
  const { themeColor, changeThemeColor } = useTheme();
  const [sys, setSys] = useState(null);
  useEffect(() => { api.get('/settings/system').then(r => setSys(r.data)).catch(() => { }); }, []);

  const save = () => {
    api.patch('/settings/system', { ...sys, themeColor });
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

          <div className="w-full h-px bg-[var(--glass-border)] my-4"></div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Palette size={18} className="text-[var(--purple)]" /> Color Principal
            </h3>
            <div className="flex flex-wrap gap-4 mt-2">
              {THEMES.map(t => (
                <button
                  key={t.name}
                  onClick={() => changeThemeColor(t.color)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${themeColor === t.color ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-base)] dark:ring-offset-slate-900 ring-[var(--purple)]' : ''}`}
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                >
                  {themeColor === t.color && <CheckCircle size={20} color="white" />}
                </button>
              ))}
            </div>
            <p className="text-sm text-[var(--muted)] mt-3">Selecciona el color de acento principal de la aplicación.</p>
          </div>

          <div className="pt-4">
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
