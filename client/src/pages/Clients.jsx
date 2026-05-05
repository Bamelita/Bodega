import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, Search, X } from 'lucide-react';
import api from '../config/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    firstName: '',
    lastName: '',
    cedula: '',
    phone: '',
    debtEnabled: false,
    parts: '',
    installmentAmount: '',
    frequency: '',
    orderEnabled: false,
    product: '',
    payInAdvance: false,
    advanceAmount: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.cedula || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setClients(res.data);
    } catch {
      setMessage('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openNew = () => {
    setForm({
      id: null,
      firstName: '',
      lastName: '',
      cedula: '',
      phone: '',
      debtEnabled: false,
      parts: '',
      installmentAmount: '',
      frequency: '',
      orderEnabled: false,
      product: '',
      payInAdvance: false,
      advanceAmount: '',
      notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      id: c.id,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      cedula: c.cedula || '',
      phone: c.phone || '',
      debtEnabled: !!c.debt?.enabled,
      parts: c.debt?.parts ?? '',
      installmentAmount: c.debt?.installmentAmount ?? '',
      frequency: c.debt?.frequency ?? '',
      orderEnabled: !!c.specialOrder?.enabled,
      product: c.specialOrder?.product ?? '',
      payInAdvance: !!c.specialOrder?.payInAdvance,
      advanceAmount: c.specialOrder?.advanceAmount ?? '',
      notes: c.specialOrder?.notes ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const submitForm = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit
    setMessage('');
    setLoading(true); // Start loading
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      cedula: form.cedula,
      phone: form.phone,
      debt: {
        enabled: form.debtEnabled,
        parts: Number(form.parts || 0),
        installmentAmount: Number(form.installmentAmount || 0),
        frequency: form.debtEnabled ? form.frequency || null : null,
      },
      specialOrder: {
        enabled: form.orderEnabled,
        product: form.orderEnabled ? form.product || '' : '',
        payInAdvance: form.orderEnabled ? !!form.payInAdvance : false,
        advanceAmount: form.orderEnabled ? Number(form.advanceAmount || 0) : 0,
        notes: form.orderEnabled ? form.notes || '' : '',
      }
    };
    try {
      if (form.id) {
        const res = await api.put(`/customers/${form.id}`, payload);
        setClients(prev => prev.map(c => c.id === form.id ? res.data : c));
        setMessage('Cliente actualizado');
      } else {
        const res = await api.post('/customers', payload);
        setClients(prev => [res.data, ...prev]);
        setMessage('Cliente creado');
      }
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error guardando cliente';
      setMessage(msg);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const deleteClient = async (c) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await api.delete(`/customers/${c.id}`);
      setClients(prev => prev.filter(x => x.id !== c.id));
      setMessage('Cliente eliminado');
    } catch {
      setMessage('Error eliminando cliente');
    }
  };

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title">Clientes</div>
        <button onClick={openNew} className="btn btn-primary">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {message && <div className="alert-banner alert-warning mb-3">{message}</div>}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2 flex-1 w-full max-w-md bg-[var(--glass-light)] px-3 py-1.5 rounded border border-[var(--glass-border)]">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              placeholder="Buscar por nombre, cédula o teléfono"
              className="bg-transparent border-none outline-none text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Deuda</th>
                <th>Encargo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="fw-8">{c.firstName} {c.lastName}</td>
                  <td>{c.cedula || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    {c.debt?.enabled && c.debt.parts > 0 ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="badge badge-out">
                          {c.debt.parts} cuotas de ${Number(c.debt.installmentAmount || 0).toFixed(2)}
                        </span>
                        <span className="text-[0.65rem] text-[var(--muted)] uppercase">{c.debt.frequency}</span>
                      </div>
                    ) : (
                      <span className="badge badge-low">Sin deuda</span>
                    )}
                  </td>
                  <td>
                    {c.specialOrder?.enabled ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="fw-8 text-sm">{c.specialOrder.product}</span>
                        <span className="badge badge-venta">
                          {c.specialOrder.payInAdvance ? `Anticipo $${Number(c.specialOrder.advanceAmount || 0).toFixed(2)}` : 'Pago al llegar'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted)] text-sm">Sin encargo</span>
                    )}
                  </td>
                  <td>
                    <div className="td-actions">
                      <button onClick={() => openEdit(c)} className="action-btn edit" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteClient(c)} className="action-btn del" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[var(--muted)]">No se encontraron clientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full animate-fade-in border-none shadow-2xl my-8">
            <div className="card-header">
              <h2 className="card-title text-lg">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={submitForm} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label>Nombre</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Apellido</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label>Cédula</label>
                    <input
                      value={form.cedula}
                      onChange={(e) => setForm(f => ({ ...f, cedula: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Teléfono</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="bg-[var(--glass-light)] rounded-lg border border-[var(--glass-border)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Deuda</div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.debtEnabled}
                        onChange={(e) => setForm(f => ({ ...f, debtEnabled: e.target.checked }))}
                        className="rounded"
                      />
                      Activar
                    </label>
                  </div>
                  {form.debtEnabled && (
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      <div className="field col-span-1">
                        <label>Partes</label>
                        <input
                          type="number"
                          min="1"
                          value={form.parts}
                          onChange={(e) => setForm(f => ({ ...f, parts: e.target.value }))}
                        />
                      </div>
                      <div className="field col-span-1">
                        <label>Monto cuota</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.installmentAmount}
                          onChange={(e) => setForm(f => ({ ...f, installmentAmount: e.target.value }))}
                        />
                      </div>
                      <div className="field col-span-2">
                        <label>Frecuencia</label>
                        <select
                          value={form.frequency}
                          onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value }))}
                        >
                          <option value="">Selecciona</option>
                          <option value="semanal">Semanal</option>
                          <option value="quincenal">Quincenal</option>
                          <option value="mensual">Mensual</option>
                        </select>
                      </div>
                      <div className="col-span-4 text-sm font-medium text-[var(--purple)]">
                        Total estimado: ${((Number(form.parts || 0) * Number(form.installmentAmount || 0)) || 0).toFixed(2)}
                      </div>
                      <div className="col-span-4">
                        <DebtSchedulePreview parts={Number(form.parts || 0)} frequency={form.frequency} baseDate={new Date()} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--glass-light)] rounded-lg border border-[var(--glass-border)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Encargo</div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.orderEnabled}
                        onChange={(e) => setForm(f => ({ ...f, orderEnabled: e.target.checked }))}
                        className="rounded"
                      />
                      Activar
                    </label>
                  </div>
                  {form.orderEnabled && (
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      <div className="field col-span-2">
                        <label>Producto solicitado</label>
                        <input
                          value={form.product}
                          onChange={(e) => setForm(f => ({ ...f, product: e.target.value }))}
                        />
                      </div>
                      <div className="field col-span-1">
                        <label>Pago adelantado</label>
                        <select
                          value={form.payInAdvance ? 'si' : 'no'}
                          onChange={(e) => setForm(f => ({ ...f, payInAdvance: e.target.value === 'si' }))}
                        >
                          <option value="no">No</option>
                          <option value="si">Sí</option>
                        </select>
                      </div>
                      <div className="field col-span-1">
                        <label>Anticipo</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.advanceAmount}
                          onChange={(e) => setForm(f => ({ ...f, advanceAmount: e.target.value }))}
                        />
                      </div>
                      <div className="field col-span-4">
                        <label>Notas</label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                          rows={3}
                          className="w-full bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-md outline-none px-3 py-2 text-[var(--ink)] dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeForm} className="btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary">
                    <Save size={16} /> {loading ? 'Guardando...' : 'Guardar'}
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

export default Clients;

function DebtSchedulePreview({ parts, frequency, baseDate }) {
  if (!parts || !frequency) return <div className="text-xs text-slate-500">Configura partes y frecuencia para ver vencimientos</div>;
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const addMonths = (d, n) => {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  };
  const dueDates = [];
  for (let i = 1; i <= Math.min(parts, 6); i++) {
    let date;
    if (frequency === 'semanal') date = addDays(baseDate, 7 * i);
    else if (frequency === 'quincenal') date = addDays(baseDate, 14 * i);
    else date = addMonths(baseDate, i);
    dueDates.push(date.toLocaleDateString());
  }
  return (
    <div className="text-xs text-slate-600 dark:text-slate-300">
      Próximos vencimientos: {dueDates.join(' · ')}
    </div>
  );
}
