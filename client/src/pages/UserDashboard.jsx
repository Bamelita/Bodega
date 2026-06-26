import React, { useState, useEffect } from 'react';
import api from '../config/api';
import {
  Package, AlertTriangle, Clock, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, UserPlus, CreditCard, ChevronRight,
  ClipboardList, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [data, setData] = useState({
    products: [],
    movements: [],
    customers: [],
    orders: [],
    history: [],
    activity: []
  });
  const [loading, setLoading] = useState(true);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prod, mov, cust] = await Promise.all([
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/movements').catch(() => ({ data: [] })),
        api.get('/customers').catch(() => ({ data: [] }))
      ]);

      const productsData = prod.data || [];
      const movementsData = mov.data || [];
      const customersData = cust.data || [];

      // Calculate history (last 7 days of sales)
      const historyMap = {};
      const productById = Object.fromEntries(productsData.map(p => [p.id, p]));
      
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
        historyMap[dateStr] = 0;
      }
      
      movementsData.forEach(m => {
        if(m.type === 'OUT') {
           const md = new Date(m.date);
           const today = new Date();
           const diffDays = Math.floor((today - md) / (1000 * 60 * 60 * 24));
           if(diffDays >= 0 && diffDays < 7) {
              const dayStr = md.toLocaleDateString('es-ES', { weekday: 'short' });
              const prod = productById[m.productId];
              const rev = (prod?.price || 0) * m.quantity;
              if (historyMap[dayStr] !== undefined) {
                 historyMap[dayStr] += rev;
              }
           }
        }
      });
      const history = Object.keys(historyMap).map(k => ({ date: k, sales: Math.round(historyMap[k]) }));

      // Calculate activity from movements
      const activity = movementsData
        .sort((a,b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(m => ({
          type: m.type === 'OUT' ? 'SALE' : 'WARNING',
          message: m.type === 'OUT' ? `Venta de ${m.quantity}x ${m.productName}` : `Entrada de ${m.quantity}x ${m.productName}`,
          user: m.userId ? `Operador ${m.userId}` : 'Sistema',
          ts: m.date
        }));

      // Calculate orders from customers
      const orders = customersData
        .filter(c => c.specialOrder?.enabled)
        .map(c => ({
          id: c.id,
          client: c.firstName + ' ' + c.lastName,
          product: c.specialOrder.product,
          status: 'pending'
        }));

      setData({
        products: productsData,
        movements: movementsData,
        customers: customersData,
        orders,
        history,
        activity
      });
    } catch (error) {
      console.error('Error dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  // KPIs — all calculated from real data
  const todayStr = new Date().toDateString();

  const totalSalesToday = data.movements
    .filter(m => m.type === 'OUT' && new Date(m.date).toDateString() === todayStr)
    .reduce((acc, m) => {
      const prod = data.products.find(p => p.id === m.productId);
      return acc + (prod?.price || 0) * m.quantity;
    }, 0);

  // Top product by total units sold (all time)
  const salesByProduct = {};
  data.movements.filter(m => m.type === 'OUT').forEach(m => {
    salesByProduct[m.productName] = (salesByProduct[m.productName] || 0) + m.quantity;
  });
  const topProductEntry = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];
  const topProductName  = topProductEntry ? topProductEntry[0] : (data.products[0]?.name || '—');
  const topProductUnits = topProductEntry ? topProductEntry[1] : 0;

  const pendingPayments = data.customers.reduce((acc, c) => acc + (c.debt?.currentDebt || 0), 0);
  const debtClients = data.customers.filter(c => c.debt?.currentDebt > 0).length;

  // Smart Alerts
  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const criticalStock = data.products.filter(p => p.stock === 0);
  const pendingOrders = data.orders.filter(o => o.status === 'pending');
  const overdueClients = data.customers.filter(c => c.debt?.daysOverdue > 7);

  // Quick Chart (CSS Bar Chart)
  const maxSales = Math.max(...data.history.map(h => h.sales), 1);

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando panel de control...</div>;

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title">
          Panel de Control <small>Resumen operativo de tu negocio</small>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/user/sales" className="btn btn-primary">
            <DollarSign size={14} /> Nueva Venta
          </Link>
          <Link to="/user/inventory" className="btn btn-ghost">
            <Package size={14} /> Producto
          </Link>
          <Link to="/user/clients" className="btn btn-ghost">
            <UserPlus size={14} /> Cliente
          </Link>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card green">
          <div className="stat-icon"><DollarSign /></div>
          <div className="stat-label">Ventas del Día</div>
          <div className="stat-value">${totalSalesToday.toFixed(2)}</div>
          <div className="stat-sub flex items-center gap-1 text-success">
            {totalSalesToday > 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
            {totalSalesToday > 0 ? 'Ventas registradas hoy' : 'Sin ventas hoy'}
          </div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon"><Package /></div>
          <div className="stat-label">Top Producto</div>
          <div className="stat-value truncate" style={{fontSize: '1.4rem'}}>{topProductName}</div>
          <div className="stat-sub">{topProductUnits} unidades vendidas</div>
        </div>
        <div className="stat-card peach">
          <div className="stat-icon"><CreditCard /></div>
          <div className="stat-label">Por Cobrar</div>
          <div className="stat-value">${pendingPayments}</div>
          <div className="stat-sub text-warning">{debtClients} clientes con deuda</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><ClipboardList /></div>
          <div className="stat-label">Encargos</div>
          <div className="stat-value">{pendingOrders.length}</div>
          <div className="stat-sub text-purple">Ver pendientes</div>
        </div>
      </div>

      {/* 2. Smart Alerts Area */}
      {(lowStock.length > 0 || overdueClients.length > 0 || criticalStock.length > 0) && (
        <div className="mb-3">
          <div 
            className="alert-banner alert-danger cursor-pointer flex justify-between items-center" 
            onClick={() => setShowAlertsModal(true)}
            style={{ margin: 0 }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} />
              <span><strong>Atención:</strong> Tienes {lowStock.length + overdueClients.length + criticalStock.length} alertas pendientes (Stock y Deudas).</span>
            </div>
            <button className="btn btn-sm btn-ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>Ver todas</button>
          </div>
        </div>
      )}

      {/* ALERTS MODAL */}
      <div className={`overlay ${showAlertsModal ? 'show' : ''}`} onClick={() => setShowAlertsModal(false)}>
        <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Alertas del Sistema</h3>
            <button className="modal-close" onClick={() => setShowAlertsModal(false)}>✕</button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {criticalStock.map(p => (
              <div key={`c-${p.id}`} className="alert-banner alert-danger">
                <AlertTriangle size={15} />
                <span><strong>Sin Stock:</strong> El producto {p.name} se ha agotado.</span>
              </div>
            ))}
            {overdueClients.map(c => (
              <div key={`o-${c.id}`} className="alert-banner alert-warning">
                <Clock size={15} />
                <span><strong>Deuda Vencida:</strong> {c.firstName} debe ${c.debt.currentDebt} ({c.debt.daysOverdue} días).</span>
              </div>
            ))}
            {lowStock.map(p => (
              <div key={`l-${p.id}`} className="alert-banner alert-warning">
                <AlertTriangle size={15} />
                <span><strong>Stock Bajo:</strong> Quedan {p.stock} unidades de {p.name}.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-row-1">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp /> Ventas (Últimos 7 días)</div>
          </div>
          <div className="card-body h-48 flex items-end gap-3 justify-between">
            {data.history.map((day, i) => {
              const heightPct = (day.sales / maxSales) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                  <div className="relative w-full rounded-t-lg h-full overflow-hidden flex items-end" style={{background: 'var(--glass-light)'}}>
                    <div
                      style={{ height: `${heightPct}%`, background: 'linear-gradient(to top, var(--purple), var(--pink))' }}
                      className="w-full opacity-80 group-hover:opacity-100 transition-all rounded-t-lg relative"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--ink)] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        ${day.sales}
                      </div>
                    </div>
                  </div>
                  <span className="text-[0.65rem] text-[var(--muted)] font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><Activity /> Actividad Reciente</div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {data.activity.slice(0, 5).map((log, i) => (
                <div key={i} className="audit-item">
                  <div className="audit-dot">
                    {log.type === 'SALE' ? <DollarSign size={14} className="text-success" /> :
                     log.type === 'PAYMENT' ? <CreditCard size={14} className="text-info" /> :
                     <AlertTriangle size={14} className="text-warning" />}
                  </div>
                  <div className="audit-info">
                    <div className="audit-action">{log.message}</div>
                    <div className="audit-meta flex justify-between">
                      <span>{log.user}</span>
                      <span>{new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-row-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><CreditCard /> Cuentas por Cobrar</div>
            <Link to="/user/clients" className="text-xs text-[var(--purple)] font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.filter(c => c.debt?.currentDebt > 0).slice(0, 5).map(c => {
                  const startDate = c.debt?.startDate || new Date().toISOString(); // Fallback to now if missing
                  const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
                  return (
                  <tr key={c.id}>
                    <td>{c.firstName} {c.lastName}</td>
                    <td className="mono fw-8">${c.debt.currentDebt}</td>
                    <td>
                      <span className={`badge ${days > 7 ? 'badge-out' : 'badge-low'}`}>
                        {days} {days === 1 ? 'día' : 'días'}
                      </span>
                    </td>
                  </tr>
                )})}
                {data.customers.filter(c => c.debt?.currentDebt > 0).length === 0 && (
                  <tr><td colSpan="3" className="text-center text-[var(--muted)] py-4">No hay deudas pendientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><ClipboardList /> Encargos</div>
            <button className="text-xs text-[var(--purple)] font-medium hover:underline">Gestionar</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Detalle</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.client}</td>
                    <td className="truncate max-w-[150px]">{o.product}</td>
                    <td>
                      <span className="badge badge-venta">Pendiente</span>
                    </td>
                  </tr>
                ))}
                {pendingOrders.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-[var(--muted)] py-4">No hay encargos activos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
