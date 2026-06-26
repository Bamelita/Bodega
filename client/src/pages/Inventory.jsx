import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Plus, Search, Edit, Trash2, Save, UploadCloud, FileSpreadsheet, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import api from '../config/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';

const Inventory = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Read search from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('');
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const s = qParams.get('search');
    if (s !== null) {
      setSearch(s);
    }
  }, [location.search]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    expirationDate: '',
    photoData: null,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter(p =>
      (!categoryFilter || (p.category || '') === categoryFilter)
    );
    if (!q) return base;
    return base.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [products, search, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (e) {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openNew = () => {
    setForm({
      id: null,
      name: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      expirationDate: '',
      photoData: null,
    });
    setShowForm(true);
  };
  const openEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name,
      category: p.category || '',
      price: p.price,
      cost: p.cost ?? '',
      stock: p.stock,
      minStock: p.minStock ?? '',
      expirationDate: p.expirationDate || '',
      photoData: p.photoData || null,
    });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setForm(prev => ({ ...prev, photoData: prev.photoData })); // keep state
  };
  const onFilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, photoData: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  const submitForm = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      stock: Number(form.stock || 0),
      minStock: Number(form.minStock || 0),
      expirationDate: form.expirationDate || '',
      photoData: form.photoData || null,
    };
    try {
      if (form.id) {
        const res = await api.put(`/products/${form.id}`, payload);
        setProducts(prev => prev.map(p => p.id === form.id ? res.data : p));
        toast.success('Producto actualizado');
      } else {
        const res = await api.post('/products', payload);
        setProducts(prev => [res.data, ...prev]);
        toast.success('Producto creado');
      }
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error guardando producto';
      toast.error(msg);
    }
  };

  const deleteProduct = async (p) => {
    try {
      await api.delete(`/products/${p.id}`);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      toast.success('Producto eliminado');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error eliminando producto';
      toast.error(msg);
    }
  };

  const confirmDelete = (p) => {
    setConfirmDialog({
      title: 'Eliminar producto',
      desc: `¿Estás seguro que deseas eliminar "${p.name}"?`,
      onConfirm: () => {
        deleteProduct(p);
        setConfirmDialog(null);
      }
    });
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error exportando productos');
    }
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result.toString();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines.shift();
        const cols = header.split(',').map(c => c.replace(/^"+|"+$/g, ''));
        const idx = Object.fromEntries(cols.map((c, i) => [c, i]));
        const items = lines.map(l => {
          // naive CSV parsing; supports quoted values without embedded commas
          const parts = l.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const val = (k) => {
            const raw = parts[idx[k]] ?? '';
            return raw.replace(/^"+|"+$/g, '');
          };
          return {
            name: val('name'),
            category: val('category'),
            price: Number(val('price') || 0),
            cost: Number(val('cost') || 0),
            stock: Number(val('stock') || 0),
            minStock: Number(val('minStock') || 0),
            expirationDate: val('expirationDate') || '',
          };
        });
        const res = await api.post('/products/import', { products: items });
        setProducts(prev => [...res.data.created, ...prev]);
        toast.success(`Importados ${res.data.created.length} productos`);
        e.target.value = '';
      } catch {
        toast.error('Error importando CSV');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title">Inventario</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openNew} className="btn btn-primary">
            <Plus size={16} /> Nuevo Producto
          </button>
          <label className="btn btn-ghost cursor-pointer">
            <UploadCloud size={16} /> Importar
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
          </label>
          <button onClick={exportCSV} className="btn btn-ghost">
            <FileSpreadsheet size={16} /> Exportar
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full bg-[var(--glass-light)] px-3 py-1.5 rounded border border-[var(--glass-border)]">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              placeholder="Buscar por nombre o categoría"
              className="bg-transparent border-none outline-none text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-[var(--glass-light)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-sm outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <TableSkeleton columns={7} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="td-product">
                        <div className="td-product-icon">
                          <Package size={18} className="text-[var(--purple)]" />
                        </div>
                        <div>
                          <div className="td-name">{p.name}</div>
                          <div className="td-sku">ID: {String(p.id).padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`mono fw-8 ${p.stock <= p.minStock ? 'text-danger' : ''}`}>{p.stock}</span>
                        {p.stock <= p.minStock && <span className="badge badge-low">Bajo</span>}
                      </div>
                      <div className="stock-bar-wrap">
                        <div className="stock-bar">
                          <div className="stock-fill bg-[var(--purple)]" style={{ width: `${Math.min(100, (p.stock / Math.max(1, p.minStock)) * 50)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">${Number(p.price).toFixed(2)}</td>
                    <td className="mono">${Number(p.cost).toFixed(2)}</td>
                    <td>{p.expirationDate || '-'}</td>
                    <td>
                      <div className="td-actions">
                        <button onClick={() => openEdit(p)} className="action-btn edit" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => confirmDelete(p)} className="action-btn del" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-[var(--muted)]">No se encontraron productos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="overlay show" onClick={closeForm}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button type="button" onClick={closeForm} className="modal-close">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitForm} className="space-y-4">
                <div className="field">
                  <label>Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label>Categoría</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="field">
                    <label>Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.cost}
                      onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Stock mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="field">
                    <label>Caducidad</label>
                    <input
                      type="date"
                      value={form.expirationDate}
                      onChange={(e) => setForm(f => ({ ...f, expirationDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Foto del producto</label>
                  <input type="file" accept="image/*" onChange={onFilePhoto} className="text-sm" />
                  {form.photoData && (
                    <img src={form.photoData} alt="preview" className="mt-2 w-20 h-20 object-cover rounded shadow-sm border border-[var(--glass-border)]" />
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeForm} className="btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

export default Inventory;
