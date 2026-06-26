import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, PlusCircle, Trash2, Edit2, Save, AlertTriangle } from 'lucide-react';
import api from '../config/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [singleSale, setSingleSale] = useState({ productId: '', quantity: 1 });
  const [batchItems, setBatchItems] = useState([{ productId: '', quantity: 1 }]);

  const productById = useMemo(
    () => Object.fromEntries(products.map(p => [p.id, p])),
    [products]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/products'),
        api.get('/movements'),
      ]);
      setProducts(pRes.data);
      setMovements(mRes.data);
    } catch (e) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const payload = { productId: Number(singleSale.productId), quantity: Number(singleSale.quantity) };
      const res = await api.post('/sales/single', payload);
      setMovements(prev => [res.data.movement, ...prev]);
      setProducts(prev => prev.map(p => p.id === res.data.product.id ? res.data.product : p));
      setSingleSale({ productId: '', quantity: 1 });
      toast.success('Venta registrada');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error registrando venta';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const validItems = batchItems
        .filter(i => i.productId && i.quantity > 0)
        .map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity) }));
      if (validItems.length === 0) {
        toast.warning('Agrega al menos un item válido');
        setLoading(false);
        return;
      }
      const res = await api.post('/sales/batch', { items: validItems });
      // update products by refetch to keep stocks accurate
      await fetchData();
      setBatchItems([{ productId: '', quantity: 1 }]);
      toast.success(`Ventas registradas: ${res.data.movements.length}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error registrando ventas múltiples';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const addBatchRow = () => {
    setBatchItems(prev => [...prev, { productId: '', quantity: 1 }]);
  };
  const removeBatchRow = (idx) => {
    setBatchItems(prev => prev.filter((_, i) => i !== idx));
  };
  const updateBatchRow = (idx, patch) => {
    setBatchItems(prev => prev.map((row, i) => i === idx ? { ...row, ...patch } : row));
  };

  const [editingId, setEditingId] = useState(null);
  const [editingQty, setEditingQty] = useState(1);
  const startEdit = (mv) => {
    setEditingId(mv.id);
    setEditingQty(mv.quantity);
  };
  const saveEdit = async (mv) => {
    try {
      const res = await api.put(`/movements/${mv.id}`, { quantity: Number(editingQty) });
      setMovements(prev => prev.map(m => m.id === mv.id ? res.data.movement : m));
      // update related product stock
      setProducts(prev => prev.map(p => p.id === res.data.product.id ? res.data.product : p));
      setEditingId(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error actualizando movimiento';
      toast.error(msg);
    }
  };
  const deleteMovement = async (mv) => {
    try {
      const res = await api.delete(`/movements/${mv.id}`);
      setMovements(prev => prev.filter(m => m.id !== mv.id));
      // update product after revert
      const updated = res.data.product;
      if (updated) {
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      }
      toast.success('Movimiento eliminado');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error eliminando movimiento';
      toast.error(msg);
    }
  };

  const confirmDelete = (mv) => {
    setConfirmDialog({
      title: 'Eliminar movimiento',
      desc: `¿Estás seguro de que deseas eliminar este movimiento?`,
      onConfirm: () => {
        deleteMovement(mv);
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title">Punto de Venta</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><ShoppingCart size={18} /> Venta individual</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="field">
                <label>Producto</label>
                <select
                  value={singleSale.productId}
                  onChange={(e) => setSingleSale(s => ({ ...s, productId: e.target.value }))}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={singleSale.quantity}
                  onChange={(e) => setSingleSale(s => ({ ...s, quantity: e.target.value }))}
                />
                {singleSale.productId && productById[singleSale.productId] && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Disponible: {productById[singleSale.productId].stock}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full justify-center"
                disabled={loading}
              >
                Registrar venta
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><PlusCircle size={18} /> Ventas múltiples</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              {batchItems.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="field flex-[2]">
                    <label>Producto</label>
                    <select
                      value={row.productId}
                      onChange={(e) => updateBatchRow(idx, { productId: e.target.value })}
                    >
                      <option value="">Selecciona</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field flex-1">
                    <label>Cant.</label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateBatchRow(idx, { quantity: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBatchRow(idx)}
                    className="btn btn-ghost px-2 text-[var(--danger)] hover:text-[var(--danger)] hover:bg-red-500/10 h-[38px] mb-[2px]"
                    title="Eliminar fila"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={addBatchRow}
                  className="btn btn-ghost"
                >
                  Agregar fila
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 justify-center"
                  disabled={loading}
                >
                  Registrar ventas
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Movimientos</div>
        </div>
        {loading ? (
          <TableSkeleton columns={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(mv => (
                  <tr key={mv.id}>
                    <td className="mono text-[var(--muted)]">{mv.id}</td>
                    <td>
                      <span className={`badge ${mv.type === 'OUT' ? 'badge-out' : 'badge-in'}`}>
                        {mv.type === 'OUT' ? 'VENTA' : 'ENTRADA'}
                      </span>
                    </td>
                    <td className="fw-8">{mv.productName}</td>
                    <td>
                      {editingId === mv.id ? (
                        <input
                          type="number"
                          min={1}
                          value={editingQty}
                          onChange={(e) => setEditingQty(e.target.value)}
                          className="w-20 rounded bg-[var(--glass-white)] border border-[var(--glass-border)] px-2 py-1 outline-none"
                        />
                      ) : (
                        <span className="mono fw-8">{mv.quantity}</span>
                      )}
                    </td>
                    <td>{new Date(mv.date).toLocaleString()}</td>
                    <td>
                      <div className="td-actions">
                        {editingId === mv.id ? (
                          <button onClick={() => saveEdit(mv)} className="action-btn text-[var(--success)] hover:bg-[var(--success)]/10">
                            <Save size={14} />
                          </button>
                        ) : (
                          <button onClick={() => startEdit(mv)} className="action-btn edit">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => confirmDelete(mv)} className="action-btn del">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-[var(--muted)]">No hay movimientos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="overlay show">
          <div className="modal confirm-modal">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-[var(--danger-bg)] flex items-center justify-center text-[var(--danger)]">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h3 className="confirm-title">{confirmDialog.title}</h3>
            <p className="confirm-desc">{confirmDialog.desc}</p>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDialog.onConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
