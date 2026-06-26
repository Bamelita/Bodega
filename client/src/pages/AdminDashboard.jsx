import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Users, UserPlus, Search, Edit, Trash2, Save, X, AlertTriangle, Bell, Eye, EyeOff } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // userId pending confirmation
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    firstName: '',
    lastName: '',
    cedula: '',
    phone: '',
    email: '',
    cutoffDate: '',
    planId: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // Filter out admin users so they don't show in the dashboard
      const filteredUsers = res.data.filter(u => u.role !== 'admin');
      setUsers(filteredUsers);
      checkNotifications(filteredUsers);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans', error);
    }
  };

  const checkNotifications = (usersData) => {
    const today = new Date();
    const alerts = [];
    usersData.forEach(user => {
      if (user.cutoffDate) {
        const cutoff = new Date(user.cutoffDate);
        const diffTime = cutoff - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 5) {
          alerts.push({
            id: user.id,
            message: `El usuario ${user.firstName} ${user.lastName} tiene corte en ${diffDays} días.`
          });
        }
      }
    });
    setNotifications(alerts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.post('/users', formData);
        toast.success('Usuario creado correctamente');
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      ...user,
      password: '',
      planId: user.planId || ''
    });
    setEditingId(user.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteUser = async () => {
    try {
      await api.delete(`/users/${confirmDelete}`);
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    } finally {
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user',
      firstName: '',
      lastName: '',
      cedula: '',
      phone: '',
      email: '',
      cutoffDate: '',
      planId: ''
    });
    setEditingId(null);
  };

  return (
    <div className="page active">

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="overlay show" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                <Trash2 size={16} /> Eliminar Usuario
              </h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--ink2)', fontSize: '0.9rem' }}>
                ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '1rem 1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={confirmDeleteUser}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Area */}
      {notifications.length > 0 && (
        <div className="mb-3 space-y-2">
          {notifications.map((note, index) => (
            <div key={index} className="alert-banner alert-warning">
              <AlertTriangle size={15} />
              <span>{note.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-header mb-2">
        <div className="section-title">Gestión de Usuarios <small>{users.length} registros</small></div>
      </div>

      {/* Embedded Form */}
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">
            {editingId ? <><Edit size={16} /> Editar Usuario</> : <><UserPlus size={16} /> Nuevo Usuario</>}
          </div>
          {editingId && (
            <button onClick={resetForm} className="btn btn-ghost btn-sm">
              <X size={14} /> Cancelar
            </button>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid-3">
              <div className="field">
                <label>Usuario</label>
                <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="field">
                <label>Clave {editingId && <small className="text-[var(--muted)] font-normal ml-1">(Opcional)</small>}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required={!editingId} 
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
              <div className="field">
                <label>Nombre</label>
                <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="field">
                <label>Apellido</label>
                <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="field">
                <label>Cédula</label>
                <input type="text" required value={formData.cedula} onChange={e => setFormData({ ...formData, cedula: e.target.value })} />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Fecha de Corte</label>
                <input type="date" value={formData.cutoffDate} onChange={e => setFormData({ ...formData, cutoffDate: e.target.value })} />
              </div>
              <div className="field">
                <label>Plan de Suscripción</label>
                <select
                    value={formData.planId || ''}
                    onChange={e => setFormData({ ...formData, planId: e.target.value ? Number(e.target.value) : null })}
                >
                    <option value="">Sin Plan (Gratuito)</option>
                    {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - ${p.price}/mes</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4" style={{ marginTop: '1rem' }}>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-ghost" style={{ marginRight: '10px' }}>Cancelar</button>
              )}
              <button type="submit" className="btn btn-primary">
                <Save size={14} />
                {editingId ? 'Actualizar Usuario' : 'Guardar Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Contacto</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="td-product">
                      <div className="td-product-icon">{(user.username || '?')[0].toUpperCase()}</div>
                      <div>
                        <div className="td-name">{user.username}</div>
                        <div className="td-sku uppercase">{user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="td-name">{user.firstName} {user.lastName}</div>
                    <div className="td-sku">{user.cedula}</div>
                  </td>
                  <td>
                    <div className="td-name">{user.email || '—'}</div>
                    <div className="td-sku">{user.phone || '—'}</div>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-[var(--ink)]">
                      {user.planId && plans.find(p => p.id === user.planId) 
                        ? plans.find(p => p.id === user.planId).name 
                        : 'Sin Plan'}
                    </div>
                    <div className="td-sku">
                      {user.planId && plans.find(p => p.id === user.planId) 
                        ? `$${plans.find(p => p.id === user.planId).price}/mes` 
                        : 'Gratis'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {user.isActive ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button onClick={() => handleEdit(user)} className="action-btn edit" title="Editar">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="action-btn del" title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
