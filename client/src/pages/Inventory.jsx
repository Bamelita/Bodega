import React, { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, Save, UploadCloud, FileSpreadsheet, Image as ImageIcon, X } from 'lucide-react';
import api from '../config/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
      setMessage('Error cargando productos');
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
    setMessage('');
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
        setMessage('Producto actualizado');
      } else {
        const res = await api.post('/products', payload);
        setProducts(prev => [res.data, ...prev]);
        setMessage('Producto creado');
      }
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error guardando producto';
      setMessage(msg);
    }
  };

  const deleteProduct = async (p) => {
    if (!confirm('¿Eliminar producto?')) return;
    try {
      await api.delete(`/products/${p.id}`);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      setMessage('Producto eliminado');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error eliminando producto';
      setMessage(msg);
    }
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
      setMessage('Error exportando productos');
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
        setMessage(`Importados ${res.data.created.length} productos`);
        e.target.value = '';
      } catch {
        setMessage('Error importando CSV');
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

      {message && <div className="alert-banner alert-warning mb-3">{message}</div>}

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

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Stock</th>
                <th>Caducidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.photoData ? (
                      <img src={p.photoData} alt={p.name} className="w-10 h-10 object-cover rounded shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 bg-[var(--glass-light)] rounded flex items-center justify-center text-[var(--muted)]">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="fw-8">{p.name}</td>
                  <td>{p.category || '-'}</td>
                  <td className="mono fw-8">${p.price?.toFixed(2)}</td>
                  <td className="mono">${(p.cost ?? 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.stock <= (p.minStock || 0) ? 'badge-out' : 'badge-low'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.expirationDate || '-'}</td>
                  <td>
                    <div className="td-actions">
                      <button onClick={() => openEdit(p)} className="action-btn edit" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteProduct(p)} className="action-btn del" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-[var(--muted)]">No se encontraron productos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-lg w-full animate-fade-in border-none shadow-2xl">
            <div className="card-header">
              <h2 className="card-title text-lg">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={closeForm} className="text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="card-body">
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
    </div>
  );
};

export default Inventory;
