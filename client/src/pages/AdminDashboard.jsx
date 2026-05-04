import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { Users, UserPlus, Search, Edit, Trash2, Save, X, AlertTriangle, Bell } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed showModal state
  const { darkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    firstName: '',
    lastName: '',
    cedula: '',
    phone: '',
    email: '',
    paymentMethod: 'Efectivo',
    paymentAmount: 0,
    startDate: '',
    cutoffDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      checkNotifications(res.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
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
      } else {
        await api.post('/users', formData);
      }

      // Removed setShowModal(false)
      fetchUsers();
      resetForm();
    } catch (error) {
      alert('Error al guardar usuario');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      ...user,
      password: '' // Don't show password, require new one only if changing
    });
    setEditingId(user.id);
    // Removed setShowModal(true)
    // Scroll to top to show form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert('Error al eliminar usuario');
      }
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
      paymentMethod: 'Efectivo',
      paymentAmount: 0,
      startDate: '',
      cutoffDate: ''
    });
    setEditingId(null);
  };

  return (
    <div className="page active">

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
                <label>Contraseña {editingId && '(Dejar vacío para mantener)'}</label>
                <input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
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
                <label>Monto Mensual</label>
                <input type="number" value={formData.paymentAmount ?? ''} onChange={e => setFormData({ ...formData, paymentAmount: e.target.value === '' ? '' : Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Fecha de Corte</label>
                <input type="date" value={formData.cutoffDate} onChange={e => setFormData({ ...formData, cutoffDate: e.target.value })} />
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
                    <div className="mono fw-8">${user.paymentAmount}</div>
                    <div className="td-sku">Corte: {user.cutoffDate ? new Date(user.cutoffDate).toLocaleDateString() : '-'}</div>
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
