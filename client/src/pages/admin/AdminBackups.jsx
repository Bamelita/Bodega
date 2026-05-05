import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { Database, Download, RefreshCw, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminBackups = () => {
    const [backups, setBackups] = useState([]);
    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const showStatus = (type, msg) => {
        setStatus({ type, message: msg });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    const fetchBackups = () => {
        api.get('/backups').then(res => setBackups(res.data || [])).catch(() => { });
    };

    useEffect(() => { fetchBackups(); }, []);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await api.post('/backups/create');
            fetchBackups();
            showStatus('success', 'Respaldo creado correctamente');
        } catch {
            showStatus('error', 'Error creando respaldo');
        } finally {
            setCreating(false);
        }
    };

    const buttonStyle = "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
    const inputStyle = "w-full border dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title flex items-center gap-2">
          <Database size={20} className="text-[var(--purple)]" />
          Respaldos del Sistema
        </div>
        <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
          <Database size={16} /> {creating ? 'Creando...' : 'Crear Respaldo'}
        </button>
      </div>

      <p className="text-[var(--muted)] text-sm mb-4">Crea, restaura y gestiona las copias de seguridad de la base de datos.</p>

      {status.message && (
        <div className={`alert-banner mb-3 ${status.type === 'success' ? '!bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]' : 'alert-danger'}`}>
          <div className="flex items-center gap-2">
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{status.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card lg:col-span-2">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Fecha</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.id}>
                    <td className="fw-8">{b.name}</td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="td-actions justify-end">
                        <button className="action-btn text-[var(--purple)] hover:bg-[var(--purple)]/10" title="Descargar"><Download size={14} /></button>
                        <button className="action-btn text-[var(--success)] hover:bg-[var(--success)]/10" title="Restaurar"><RefreshCw size={14} /></button>
                        <button className="action-btn del" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-[var(--muted)]">No hay respaldos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header pb-2">
              <div className="card-title text-sm flex items-center gap-2"><Clock size={16} /> Automatización</div>
            </div>
            <div className="card-body">
              <p className="text-xs text-[var(--muted)] mb-2">Frecuencia de respaldos automáticos.</p>
              <select className="w-full bg-[var(--glass-white)] border border-[var(--glass-border)] rounded outline-none px-2 py-1.5 text-sm">
                <option value="">Desactivado</option>
                <option value="daily">Diario (3:00 AM)</option>
                <option value="weekly">Semanal (Domingos)</option>
              </select>
            </div>
          </div>
          <div className="card">
            <div className="card-header pb-2">
              <div className="card-title text-sm flex items-center gap-2"><Trash2 size={16} /> Retención</div>
            </div>
            <div className="card-body">
              <p className="text-xs text-[var(--muted)] mb-2">Eliminar copias antiguas.</p>
              <select className="w-full bg-[var(--glass-white)] border border-[var(--glass-border)] rounded outline-none px-2 py-1.5 text-sm">
                <option value="7">Mantener últimos 7 días</option>
                <option value="30">Mantener últimos 30 días</option>
                <option value="90">Mantener últimos 90 días</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBackups;
