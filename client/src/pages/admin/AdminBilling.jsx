import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Users, Check, X, Trash2 } from 'lucide-react';
import api from '../../config/api';

const AdminBilling = () => {
    const [plans, setPlans] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        currency: 'USD',
        features: ['', '', '', ''],
        status: 'active'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansRes, usersRes] = await Promise.all([
                api.get('/plans'),
                api.get('/users')
            ]);
            setPlans(plansRes.data);
            setUsers(usersRes.data.filter(u => u.role !== 'admin'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, price: Number(formData.price) };
            if (editingId) {
                await api.put(`/plans/${editingId}`, payload);
            } else {
                await api.post('/plans', payload);
            }
            fetchData();
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error al guardar plan');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este plan?')) {
            try {
                await api.delete(`/plans/${id}`);
                fetchData();
            } catch (error) {
                alert('Error al eliminar');
            }
        }
    };

    const handleUserPlanChange = async (userId, newPlanId) => {
        try {
            await api.put(`/users/${userId}`, { planId: newPlanId });
            setUsers(users.map(u => u.id === userId ? { ...u, planId: newPlanId } : u));
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el plan del usuario');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', currency: 'USD', features: ['', '', '', ''], status: 'active' });
        setEditingId(null);
    };

    const handleEdit = (plan) => {
        setFormData({
            ...plan,
            features: plan.features.length < 4 ? [...plan.features, '', '', ''].slice(0, 4) : plan.features
        });
        setEditingId(plan.id);
        setShowModal(true);
    };

    // Calculate subscribers per plan (Mock logic: Assuming users have a 'planId' or we just distribute them for demo)
    // Since users don't strictly have planId in the previous mock, let's just count all active users for 'Profesional' for demo purposes
    // or better, let's match by plan name if user has 'plan' field? 
    // Actually, let's just show '0' if no real link, or fake it for UI demo.
    // Real logic: const baseCount = users.filter(u => u.planId === plan.id).length

    return (
        <div className="page active">
            <div className="section-header mb-3">
                <div className="section-title flex items-center gap-2">
                    <CreditCard size={20} className="text-[var(--purple)]" />
                    Gestión de Planes
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    <Plus size={16} /> Crear Plan
                </button>
            </div>
            
            <p className="text-sm font-medium opacity-80 mb-4" style={{ color: 'inherit' }}>Crea y administra los planes de suscripción para tus usuarios.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {plans.map(plan => (
                    <div key={plan.id} className="card">
                        <div className="card-body">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-wide">{plan.name}</h3>
                                    <p className="text-2xl font-bold text-[var(--purple)] mt-1">${plan.price} <span className="text-sm font-normal text-[var(--muted)]">/mes</span></p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(plan)} className="action-btn edit" title="Editar">
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="action-btn del" title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {plan.features.map((feat, i) => (
                                    feat && (
                                        <div key={i} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                            <Check size={14} className="text-[var(--success)] shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Users size={14} />
                                    <span>{users.filter(u => u.planId === plan.id).length} Suscriptores</span>
                                </div>
                                <span className={`badge ${plan.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                    {plan.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Suscriptores Recientes</div>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Plan</th>
                                <th>Estado</th>
                                <th>Fecha Inicio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="fw-8">{user.username}</td>
                                    <td>
                                        <select 
                                            value={user.planId || ''} 
                                            onChange={(e) => handleUserPlanChange(user.id, e.target.value ? Number(e.target.value) : null)}
                                            className="border border-[var(--glass-border)] rounded px-2 py-1 bg-white/50 dark:bg-slate-800/50 text-sm outline-none cursor-pointer"
                                        >
                                            <option value="">Sin Plan</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                            {user.isActive ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.startDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editingId ? 'Editar Plan' : 'Nuevo Plan'}</div>
                            <button className="btn btn-ghost px-2" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="field">
                                    <label>Nombre del Plan</label>
                                    <input type="text" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="field">
                                        <label>Precio</label>
                                        <input type="number" required
                                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Moneda</label>
                                        <select
                                            value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Características (Top 4)</label>
                                    <div className="space-y-2">
                                        {formData.features.map((feat, i) => (
                                            <div className="field" key={i}>
                                                <input type="text" placeholder={`Característica ${i + 1}`}
                                                    value={feat} onChange={e => {
                                                        const newFeats = [...formData.features];
                                                        newFeats[i] = e.target.value;
                                                        setFormData({ ...formData, features: newFeats });
                                                    }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-footer mt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Guardar Plan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBilling;
