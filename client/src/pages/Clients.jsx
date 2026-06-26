import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, Search, X, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../config/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ customerId: null, amount: '', note: '' });
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [completeOrderData, setCompleteOrderData] = useState({ active: false, paidInFull: true, pendingAmount: '' });

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
      toast.error('Error cargando clientes');
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
        toast.success('Cliente actualizado');
      } else {
        const res = await api.post('/customers', payload);
        setClients(prev => [res.data, ...prev]);
        toast.success('Cliente creado');
      }
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error guardando cliente';
      toast.error(msg);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const deleteClient = async (c) => {
    try {
      await api.delete(`/customers/${c.id}`);
      setClients(prev => prev.filter(x => x.id !== c.id));
      toast.success('Cliente eliminado');
    } catch {
      toast.error('Error eliminando cliente');
    }
  };

  const confirmDelete = (c) => {
    setConfirmDialog({
      title: 'Eliminar cliente',
      desc: `¿Estás seguro de que deseas eliminar a "${c.firstName} ${c.lastName}"?`,
      onConfirm: () => {
        deleteClient(c);
        setConfirmDialog(null);
      }
    });
  };

  const openPayment = (c) => {
    setSelectedCustomerForPayment(c);
    setPaymentForm({ customerId: c.id, amount: '', note: '' });
    setCompleteOrderData({ active: false, paidInFull: true, pendingAmount: '' });
    setShowPaymentModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/customers/${paymentForm.customerId}/payments`, {
        amount: paymentForm.amount,
        note: paymentForm.note
      });
      setClients(prev => prev.map(c => c.id === paymentForm.customerId ? res.data : c));
      toast.success('Abono registrado correctamente');
      setShowPaymentModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error registrando abono');
    } finally {
      setLoading(false);
    }
  };

  const submitCompleteOrder = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/customers/${selectedCustomerForPayment.id}/complete-order`, {
        paidInFull: completeOrderData.paidInFull,
        pendingAmount: completeOrderData.pendingAmount
      });
      setClients(prev => prev.map(c => c.id === selectedCustomerForPayment.id ? res.data : c));
      toast.success('Encargo completado exitosamente');
      setSelectedCustomerForPayment(res.data);
      setCompleteOrderData({ active: false, paidInFull: true, pendingAmount: '' });
      if (!res.data.specialOrder?.enabled && !res.data.debt?.enabled) {
         setShowPaymentModal(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error completando encargo');
    } finally {
      setLoading(false);
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

        {loading ? (
          <TableSkeleton columns={6} />
        ) : (
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
                          <span className="text-[0.8rem] font-bold text-[var(--danger)]">
                            Deuda: ${Number(c.debt.currentDebt !== undefined ? c.debt.currentDebt : (c.debt.parts * c.debt.installmentAmount) || 0).toFixed(2)} / ${Number(c.debt.totalDebt !== undefined ? c.debt.totalDebt : (c.debt.parts * c.debt.installmentAmount) || 0).toFixed(2)}
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
                        {(c.debt?.enabled || c.specialOrder?.enabled) && (
                          <button onClick={() => openPayment(c)} className="action-btn text-green-600 hover:bg-green-100" title="Información y Pagos">
                            <DollarSign size={14} />
                          </button>
                        )}
                        <button onClick={() => openEdit(c)} className="action-btn edit" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => confirmDelete(c)} className="action-btn del" title="Eliminar">
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
        )}
      </div>

      {showForm && (
        <div className="overlay show" onClick={() => setShowForm(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="modal-close">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
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

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="overlay show" onClick={() => setConfirmDialog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2 text-[var(--danger)]">
                <AlertTriangle size={20} />
                {confirmDialog.title}
              </h2>
            </div>
            <div className="modal-body py-4">
              <p className="text-[var(--ink)] text-sm">{confirmDialog.desc}</p>
              <div className="flex gap-2 justify-end mt-6">
                <button className="btn btn-ghost" onClick={() => setConfirmDialog(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={confirmDialog.onConfirm}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCustomerForPayment && (
        <div className="overlay show" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                <DollarSign size={20} className="text-[var(--success)]" />
                Información y Pagos
              </h2>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="modal-close">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body py-4">
              <p className="text-sm mb-4">
                Cliente: <strong>{selectedCustomerForPayment.firstName} {selectedCustomerForPayment.lastName}</strong>
              </p>

              {selectedCustomerForPayment.specialOrder?.enabled && (
                <div className="mb-4 p-3 bg-[var(--glass-light)] rounded border border-[var(--glass-border)]">
                  <h3 className="text-sm font-bold text-[var(--ink)] mb-1">Detalles del Encargo</h3>
                  <p className="text-xs">Producto: <strong>{selectedCustomerForPayment.specialOrder.product}</strong></p>
                  {selectedCustomerForPayment.specialOrder.payInAdvance && (
                    <p className="text-xs">Anticipo: <strong>${Number(selectedCustomerForPayment.specialOrder.advanceAmount || 0).toFixed(2)}</strong></p>
                  )}
                  {selectedCustomerForPayment.specialOrder.notes && (
                    <p className="text-xs italic text-[var(--muted)] mt-1">"{selectedCustomerForPayment.specialOrder.notes}"</p>
                  )}

                  {!completeOrderData.active ? (
                    <button type="button" className="btn btn-primary btn-sm mt-3 w-full text-xs" onClick={() => setCompleteOrderData({ active: true, paidInFull: true, pendingAmount: '' })}>
                      Marcar como Completado
                    </button>
                  ) : (
                    <form onSubmit={submitCompleteOrder} className="mt-4 pt-3 border-t border-[var(--glass-border)]">
                      <div className="field">
                        <label className="text-xs">¿Pagó el total restante?</label>
                        <select
                          className="text-sm p-1.5"
                          value={completeOrderData.paidInFull ? 'si' : 'no'}
                          onChange={e => setCompleteOrderData({ ...completeOrderData, paidInFull: e.target.value === 'si' })}
                        >
                          <option value="si">Sí, pagó todo</option>
                          <option value="no">No, quedó debiendo</option>
                        </select>
                      </div>
                      
                      {!completeOrderData.paidInFull && (
                        <div className="field mt-2">
                          <label className="text-xs">Monto pendiente a deber</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="text-sm p-1.5"
                            value={completeOrderData.pendingAmount}
                            onChange={e => setCompleteOrderData({ ...completeOrderData, pendingAmount: e.target.value })}
                            required
                          />
                          <p className="text-[0.65rem] text-[var(--danger)] mt-1">Este monto se sumará a su deuda actual.</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <button type="button" className="btn btn-ghost btn-sm flex-1 text-xs" onClick={() => setCompleteOrderData({ active: false, paidInFull: true, pendingAmount: '' })}>Cancelar</button>
                        <button type="submit" className="btn btn-primary btn-sm flex-1 text-xs" disabled={loading}>Confirmar</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {selectedCustomerForPayment.debt?.enabled ? (
                <>
                  <p className="text-sm mb-4">
                    Deuda Actual: <strong className="text-[var(--danger)]">
                      ${Number(selectedCustomerForPayment.debt.currentDebt !== undefined ? selectedCustomerForPayment.debt.currentDebt : (selectedCustomerForPayment.debt.parts * selectedCustomerForPayment.debt.installmentAmount) || 0).toFixed(2)}
                    </strong>
                  </p>
                  <form onSubmit={submitPayment} className="space-y-4">
                    <div className="field">
                      <label>Monto a Abonar</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCustomerForPayment.debt.currentDebt !== undefined ? selectedCustomerForPayment.debt.currentDebt : (selectedCustomerForPayment.debt.parts * selectedCustomerForPayment.debt.installmentAmount) || 0}
                        value={paymentForm.amount}
                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Nota / Comprobante (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. Transferencia Banesco #1234"
                        value={paymentForm.note}
                        onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cerrar</button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>Registrar Pago</button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cerrar</button>
                </div>
              )}

              {selectedCustomerForPayment.debt?.payments?.length > 0 && (
                <div className="mt-6 border-t border-[var(--glass-border)] pt-4">
                  <h3 className="text-sm font-bold mb-2">Historial de Pagos</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCustomerForPayment.debt.payments.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-[var(--glass-light)] rounded">
                        <div>
                          <span className="block font-semibold">${Number(p.amount).toFixed(2)}</span>
                          <span className="text-[var(--muted)]">{new Date(p.date).toLocaleDateString()} {new Date(p.date).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-[var(--muted)] text-right max-w-[120px] truncate" title={p.note}>{p.note || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
