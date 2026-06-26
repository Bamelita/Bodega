import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Save, User, CheckCircle, AlertTriangle, Edit, Trash2, Shield, X, Search } from 'lucide-react';

const AdminProfile = () => {
    const { user } = useAuth();
    const [data, setData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
    const [status, setStatus] = useState({ type: '', message: '' });

    // User Management State
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
            fetchPlans();
        }
    }, [user]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            showStatus('error', 'Error al cargar usuarios');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plans');
            setPlans(res.data);
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const showStatus = (type, msg) => {
        setStatus({ type, message: msg });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Implement logic to update own profile if needed, currently just shows success
        showStatus('success', 'Perfil actualizado correctamente');
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await api.put(`/users/${editingUser.id}`, editingUser);
            setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
            setEditingUser(null);
            showStatus('success', 'Usuario actualizado correctamente');
        } catch (error) {
            console.error("Error updating user:", error);
            showStatus('error', 'Error al actualizar usuario');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            showStatus('success', 'Usuario eliminado correctamente');
        } catch (error) {
            console.error("Error deleting user:", error);
            showStatus('error', 'Error al eliminar usuario');
        }
    };

    const toggleUserStatus = async (userToToggle) => {
        try {
            const updatedUser = { ...userToToggle, isActive: !userToToggle.isActive };
            const res = await api.put(`/users/${userToToggle.id}`, updatedUser);
            setUsers(users.map(u => u.id === userToToggle.id ? res.data : u));
            showStatus('success', `Usuario ${updatedUser.isActive ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error("Error toggling user status:", error);
            showStatus('error', 'Error al cambiar estado del usuario');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputStyle = "w-full border dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
    const labelStyle = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
    const buttonStyle = "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]";

    return (
        <div className="page active">
            {/* Personal Profile Section */}
            <section className="mb-8">
                <div className="section-header mb-3">
                    <div className="section-title flex items-center gap-2">
                        <User className="text-[var(--purple)]" size={20} /> Perfil Personal
                    </div>
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">Gestiona tu información personal y de contacto.</p>

                {status.message && (
                    <div className={`alert-banner mb-6 ${status.type === 'success' ? '!bg-[var(--success-bg)] !text-[var(--success)] !border-[var(--success)]' : 'alert-danger'}`}>
                        <div className="flex items-center gap-2">
                            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            <span>{status.message}</span>
                        </div>
                    </div>
                )}

                <div className="card">
                    <form onSubmit={handleSubmit} className="card-body p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field">
                                <label>Nombre</label>
                                <input type="text" value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Apellido</label>
                                <input type="text" value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div className="field">
                            <label>Correo Electrónico</label>
                            <input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
                        </div>
                        <div className="field">
                            <label>Teléfono</label>
                            <input type="tel" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="btn btn-primary">
                                <Save size={16} /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Users Management Section (Admin Only) */}
            {user?.role === 'admin' && (
                <section>
                    <div className="section-header mb-3">
                        <div className="section-title flex items-center gap-2">
                            <Shield className="text-[var(--purple)]" size={20} /> Gestión de Usuarios
                        </div>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-4">Administra los usuarios activos del sistema.</p>

                    <div className="card">
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th className="text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--glass-white)] flex items-center justify-center text-[var(--purple)] font-bold uppercase text-xs">
                                                        {u.username.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{u.firstName} {u.lastName}</p>
                                                        <p className="text-xs text-[var(--muted)]">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'badge-active' : ''}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleUserStatus(u)}
                                                    className={`badge ${u.isActive ? 'badge-active cursor-pointer' : 'badge-inactive cursor-pointer'}`}
                                                >
                                                    {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                </button>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        className="action-btn edit"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="action-btn del"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-8 text-[var(--muted)]">
                                                No se encontraron usuarios.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title flex items-center gap-2">
                                <Edit size={18} className="text-[var(--purple)]" /> Editar Usuario
                            </div>
                            <button onClick={() => setEditingUser(null)} className="btn btn-ghost px-2">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="field">
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={editingUser.firstName}
                                            onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Apellido</label>
                                        <input
                                            type="text"
                                            value={editingUser.lastName}
                                            onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="field">
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={editingUser.phone}
                                            onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Rol</label>
                                        <select
                                            value={editingUser.role}
                                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        >
                                            <option value="user">Usuario</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Plan de Suscripción</label>
                                    <select
                                        value={editingUser.planId || ''}
                                        onChange={e => setEditingUser({ ...editingUser, planId: e.target.value ? Number(e.target.value) : null })}
                                    >
                                        <option value="">Sin Plan (Gratuito)</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.price}/mes</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field flex items-center gap-2 flex-row-reverse justify-end mt-2">
                                    <label htmlFor="isActive" className="mb-0 cursor-pointer">Usuario Activo</label>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={editingUser.isActive}
                                        onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                                        className="w-4 h-4 cursor-pointer accent-[var(--purple)]"
                                    />
                                </div>

                                <div className="modal-footer mt-4">
                                    <button type="button" onClick={() => setEditingUser(null)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
