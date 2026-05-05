import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { Shield, Smartphone, Monitor, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminSecurity = () => {
    const [pass, setPass] = useState({ current: '', new: '', confirm: '' });
    const [sessions, setSessions] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('me');
    const [currentUser, setCurrentUser] = useState(null);

    const showStatus = (type, msg) => {
        setStatus({ type, message: msg });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    useEffect(() => {
        // Fetch sessions
        api.get('/settings/sessions')
            .then(res => setSessions(res.data || []))
            .catch(() => { });

        // Fetch users for dropdown
        api.get('/users')
            .then(res => setUsers(res.data || []))
            .catch(err => console.error(err));

        // Get current user info from local storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    const changePassword = async (e) => {
        e.preventDefault();
        if (pass.new !== pass.confirm) return showStatus('error', 'Las contraseñas no coinciden');

        // If changing OWN password, might want to verify current password (mock/real API support needed)
        // If changing OTHER user's password (Admin override), usually don't need current password.

        const targetId = selectedUserId === 'me' ? currentUser?.id : Number(selectedUserId);

        if (!targetId) return showStatus('error', 'Usuario no identificado');

        try {
            await api.put(`/users/${targetId}`, { password: pass.new });
            showStatus('success', 'Contraseña actualizada correctamente');
            setPass({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error(error);
            showStatus('error', 'Error al actualizar contraseña');
        }
    };

    const inputStyle = "w-full border dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
    const buttonStyle = "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]";

    return (
        <div className="page active">
            <div className="section-header mb-3">
                <div className="section-title flex items-center gap-2">
                    <Shield className="text-[var(--purple)]" size={20} /> Seguridad
                </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">Protege tu cuenta y gestiona tus sesiones activas.</p>

            {status.message && (
                <div className={`alert-banner mb-6 ${status.type === 'success' ? '!bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]' : 'alert-danger'}`}>
                    <div className="flex items-center gap-2">
                        {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span>{status.message}</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Change Password */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Cambiar Contraseña</div>
                    </div>
                    <div className="card-body p-6">
                        <form onSubmit={changePassword} className="space-y-4 max-w-md">
                            <div className="field">
                                <label>Usuario</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="me">Mi Cuenta ({currentUser?.username})</option>
                                    <optgroup label="Otros Usuarios">
                                        {users.filter(u => u.id !== currentUser?.id).map(u => (
                                            <option key={u.id} value={u.id}>{u.username} - {u.firstName} {u.lastName}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {selectedUserId === 'me' && (
                                <div className="field">
                                    <input type="password" placeholder="Contraseña actual (Opcional en Demo)" value={pass.current} onChange={e => setPass({ ...pass, current: e.target.value })} />
                                </div>
                            )}

                            <div className="field">
                                <input type="password" placeholder="Nueva contraseña" required value={pass.new} onChange={e => setPass({ ...pass, new: e.target.value })} />
                            </div>
                            <div className="field">
                                <input type="password" placeholder="Confirmar nueva contraseña" required value={pass.confirm} onChange={e => setPass({ ...pass, confirm: e.target.value })} />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="btn btn-primary">Actualizar Contraseña</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 2FA Preview */}
                <div className="card">
                    <div className="card-body p-6 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-lg">Verificación en dos pasos (2FA)</h3>
                            <p className="text-sm text-[var(--muted)] mt-1">Añade una capa extra de seguridad a tu cuenta.</p>
                        </div>
                        <button className="btn btn-ghost border border-[var(--glass-border)]">Configurar</button>
                    </div>
                </div>

                {/* Active Sessions */}
                <div className="card">
                    <div className="card-header flex justify-between items-center">
                        <div className="card-title">Sesiones Activas</div>
                        <button className="text-[var(--danger)] text-sm hover:underline bg-transparent border-0 cursor-pointer">Cerrar todas las sesiones</button>
                    </div>
                    <div className="card-body p-6 space-y-2">
                        {sessions.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-white)]">
                                <div className="flex items-center gap-3">
                                    {s.device.includes('iPhone') || s.device.includes('Mobile') ? <Smartphone size={20} className="text-[var(--muted)]" /> : <Monitor size={20} className="text-[var(--muted)]" />}
                                    <div>
                                        <p className="font-medium">{s.device}</p>
                                        <p className="text-xs text-[var(--muted)]">{s.ip} • {s.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {s.current ? <span className="badge badge-active">Actual</span> : <span className="text-xs text-[var(--muted)]">Activo: {new Date(s.lastActive).toLocaleDateString()}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSecurity;
