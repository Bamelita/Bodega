import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Printer, RefreshCw } from 'lucide-react';
import api from '../config/api';

const Reports = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [range, setRange] = useState({ from: '', to: '' });
  const [interval, setIntervalVal] = useState('mensual'); // Changed to mensual to prevent overflow on load
  const [autoReload, setAutoReload] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedChart, setExpandedChart] = useState(null);

  const fetchData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        api.get('/movements'),
        api.get('/products'),
      ]);
      setMovements(mRes.data);
      setProducts(pRes.data);
    } catch {
      setMessage('Error cargando datos de reportes');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let id;
    if (autoReload) {
      id = setInterval(fetchData, 30000);
    }
    return () => id && clearInterval(id);
  }, [autoReload]);

  const productById = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

  const filteredMovements = useMemo(() => {
    if (!range.from && !range.to) return movements;
    const from = range.from ? new Date(range.from) : null;
    const to = range.to ? new Date(range.to) : null;
    return movements.filter(m => {
      const d = new Date(m.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [movements, range]);

  const computeRevenueCost = (ms) => {
    let revenue = 0;
    let cost = 0;
    let units = 0;
    for (const m of ms) {
      const prod = productById[m.productId];
      if (!prod) continue;
      if (m.type === 'OUT') {
        revenue += (prod.price || 0) * m.quantity;
        // costo aproximado si no existe; se podría almacenar explícito en producto
        const c = typeof prod.cost === 'number' ? prod.cost : (prod.price || 0) * 0.6;
        cost += c * m.quantity;
        units += m.quantity;
      } else if (m.type === 'IN') {
        const c = typeof prod.cost === 'number' ? prod.cost : (prod.price || 0) * 0.6;
        cost += c * m.quantity;
      }
    }
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) : 0;
    return { revenue, cost, profit, margin, units };
  };

  const buckets = useMemo(() => {
    const ms = filteredMovements.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const makeKey = (d) => {
      const dt = new Date(d);
      if (interval === 'diario') return dt.toISOString().slice(0, 10);
      if (interval === 'semanal') {
        const day = dt.getDay(); // 0 dom
        const mondayOffset = (day + 6) % 7;
        const monday = new Date(dt); monday.setDate(dt.getDate() - mondayOffset);
        return `Semana ${monday.toISOString().slice(0, 10)}`;
      }
      if (interval === 'quincenal') {
        const month = dt.getMonth() + 1, year = dt.getFullYear();
        const half = dt.getDate() <= 15 ? 'H1' : 'H2';
        return `${year}-${String(month).padStart(2, '0')} ${half}`;
      }
      if (interval === 'mensual') {
        const month = dt.getMonth() + 1, year = dt.getFullYear();
        return `${year}-${String(month).padStart(2, '0')}`;
      }
      const year = new Date(d).getFullYear();
      return `${year}`;
    };
    const map = new Map();
    for (const m of ms) {
      const key = makeKey(m.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    const out = [];
    for (const [key, arr] of map.entries()) {
      const stats = computeRevenueCost(arr);
      out.push({ key, ...stats });
    }
    out.sort((a, b) => a.key.localeCompare(b.key));
    return out;
  }, [filteredMovements, interval, products]);

  const totals = useMemo(() => computeRevenueCost(filteredMovements), [filteredMovements, products]);
  const chartBuckets = useMemo(() => buckets.slice(-30), [buckets]); // Limit to 30 points for readability

  const distribution = useMemo(() => {
    const prodSales = {};
    const catSales = {};
    for (const m of filteredMovements) {
      if (m.type === 'OUT') {
        const prod = productById[m.productId];
        if (!prod) continue;
        const rev = (prod.price || 0) * m.quantity;
        
        prodSales[prod.name] = (prodSales[prod.name] || 0) + rev;
        const cat = prod.category || 'Sin categoría';
        catSales[cat] = (catSales[cat] || 0) + rev;
      }
    }

    const sortAndTake = (obj, take = 5) => {
      const arr = Object.entries(obj).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
      if (arr.length > take) {
        const others = arr.slice(take).reduce((sum, a) => sum + a.value, 0);
        return [...arr.slice(0, take), { label: 'Otros', value: others }];
      }
      return arr;
    };

    return {
      products: sortAndTake(prodSales, 5),
      categories: sortAndTake(catSales, 5)
    };
  }, [filteredMovements, productById]);

  const exportCSV = () => {
    const header = ['Periodo', 'Ventas', 'Costos', 'Ganancias', 'Margen', 'Unidades'];
    const rows = buckets.map(b => [b.key, b.revenue.toFixed(2), b.cost.toFixed(2), b.profit.toFixed(2), (b.margin * 100).toFixed(1) + '%', b.units]);
    const all = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([all], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    window.print();
  };

  return (
    <div className="page active">
      <div className="section-header mb-3">
        <div className="section-title">Reportes</div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={16} /> Actualizar
          </button>
          <label className="btn btn-ghost cursor-pointer text-sm font-normal">
            <input type="checkbox" checked={autoReload} onChange={(e) => setAutoReload(e.target.checked)} className="mr-2" />
            Auto (30s)
          </label>
          <button onClick={exportCSV} className="btn btn-primary">
            <Download size={16} /> Exportar
          </button>
          <button onClick={printPDF} className="btn btn-ghost">
            <Printer size={16} /> PDF
          </button>
        </div>
      </div>

      {message && <div className="alert-banner alert-warning mb-3">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card">
          <div className="card-header pb-2">
            <div className="card-title text-sm">Rango de fechas</div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={range.from} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))}
                className="bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-lg outline-none px-3 py-2 text-sm w-full transition-all focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-light)]" />
              <input type="date" value={range.to} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))}
                className="bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-lg outline-none px-3 py-2 text-sm w-full transition-all focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-light)]" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header pb-2">
            <div className="card-title text-sm">Intervalo</div>
          </div>
          <div className="card-body">
            <select value={interval} onChange={(e) => setIntervalVal(e.target.value)}
              className="w-full bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-lg outline-none px-3 py-2 text-sm transition-all focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-light)]">
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>
        <div className="card">
          <div className="card-header pb-2">
            <div className="card-title text-sm">KPIs</div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-2">
              <Kpi label="Ventas" value={`$${totals.revenue.toFixed(2)}`} />
              <Kpi label="Ganancias" value={`$${totals.profit.toFixed(2)}`} />
              <Kpi label="Unidades" value={totals.units} />
              <Kpi label="Margen" value={`${(totals.margin * 100).toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* TENDENCIAS ROW */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Tendencias Principales</div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => setExpandedChart('ventas')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <ChartArea title="Ventas Brutas" data={chartBuckets.map(b => ({ x: b.key, y: b.revenue }))} color="var(--purple)" />
            </div>
            <div onClick={() => setExpandedChart('ganancias')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <ChartArea title="Ganancias Netas" data={chartBuckets.map(b => ({ x: b.key, y: b.profit }))} color="var(--success)" />
            </div>
          </div>
        </div>
      </div>

      {/* DISTRIBUCIÓN ROW */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Distribución de Ventas</div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => setExpandedChart('productos')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <ChartDonut title="Top Productos (Ingresos)" data={distribution.products} colors={['var(--purple)', 'var(--pink)', 'var(--info)', 'var(--success)', 'var(--warning)', '#64748b']} />
            </div>
            {/* Removed the Categorias Donut to simplify layout as requested */}
            <div className="bg-[var(--glass-light)] rounded-xl border border-[var(--glass-border)] flex items-center justify-center p-6 text-center text-sm text-[var(--muted)]">
              <div>
                <p className="font-semibold text-[var(--ink)] mb-1">Análisis Simplificado</p>
                <p>Se ha priorizado el gráfico de los productos más vendidos para una lectura más rápida.</p>
                <button onClick={() => setExpandedChart('productos')} className="btn btn-ghost btn-sm mt-3">Ver detalles del Top</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Reporte detallado</div>
        </div>
        <div className="table-wrap max-h-[400px] overflow-y-auto">
          <table>
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th>Periodo</th>
                <th>Ventas</th>
                <th>Costos</th>
                <th>Ganancias</th>
                <th>Margen</th>
                <th>Unidades</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map(b => (
                <tr key={b.key}>
                  <td className="fw-8 text-[var(--purple)]">{b.key}</td>
                  <td className="mono">${b.revenue.toFixed(2)}</td>
                  <td className="mono">${b.cost.toFixed(2)}</td>
                  <td className="mono text-[var(--success)]">${b.profit.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${b.margin >= 0.3 ? 'badge-low' : b.margin < 0 ? 'badge-out' : 'badge-venta'}`}>
                      {(b.margin * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="mono">{b.units}</td>
                </tr>
              ))}
              {buckets.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[var(--muted)]">No hay datos en el periodo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPANDED CHART MODAL */}
      <div className={`overlay ${expandedChart ? 'show' : ''}`} onClick={() => setExpandedChart(null)}>
        <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              {expandedChart === 'ventas' && 'Ventas brutas'}
              {expandedChart === 'ganancias' && 'Ganancias netas'}
              {expandedChart === 'unidades' && 'Unidades vendidas'}
              {expandedChart === 'margen' && 'Margen de beneficio (%)'}
              {expandedChart === 'productos' && 'Top Productos (Ingresos)'}
            </h3>
            <button className="modal-close" onClick={() => setExpandedChart(null)}>✕</button>
          </div>
          <div className="modal-body">
            {expandedChart === 'ventas' && <ChartArea title="" data={chartBuckets.map(b => ({ x: b.key, y: b.revenue }))} color="var(--purple)" expanded={true} />}
            {expandedChart === 'ganancias' && <ChartArea title="" data={chartBuckets.map(b => ({ x: b.key, y: b.profit }))} color="var(--success)" expanded={true} />}
            {expandedChart === 'unidades' && <ChartBars title="" data={chartBuckets.map(b => ({ x: b.key, y: b.units }))} color="var(--info)" expanded={true} />}
            {expandedChart === 'margen' && <ChartLine title="" data={chartBuckets.map(b => ({ x: b.key, y: Math.round(b.margin * 100) }))} color="var(--warning)" expanded={true} />}
            {expandedChart === 'productos' && <ChartDonut title="" data={distribution.products} colors={['var(--purple)', 'var(--pink)', 'var(--info)', 'var(--success)', 'var(--warning)', '#64748b']} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

function Kpi({ label, value }) {
  return (
    <div className="stat-card !p-2 !mb-0 !rounded-lg">
      <div className="stat-label text-[10px] mb-0">{label}</div>
      <div className="stat-value text-base">{value}</div>
    </div>
  );
}

function ChartArea({ title, data, color }) {
  const vbW = 100, vbH = 60, pad = 8;
  const xs = data.map(d => d.x), ys = data.map(d => d.y);
  const maxY = Math.max(1, ...ys);
  const stepX = (vbW - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = vbH - pad - (d.y / maxY) * (vbH - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const fillPath = `${path} L ${pad + (data.length - 1) * stepX},${vbH - pad} L ${pad},${vbH - pad} Z`;
  return (
    <div className="bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-xl p-3 shadow-sm">
      <div className="text-xs font-bold text-[var(--ink)] mb-2 uppercase tracking-wide">{title}</div>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-32 md:h-28" role="img" aria-label={title}>
        <title>{title}</title>
        <rect x={pad} y={pad} width={vbW - pad * 2} height={vbH - pad * 2} fill="none" stroke="currentColor" opacity="0.1" />
        <path d={fillPath} fill={`${color}`} opacity="0.15" />
        <path d={path} stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill={color} />
        ))}
      </svg>
      <div className="mt-2 text-[10px] font-bold text-[var(--muted)] truncate text-center">
        {xs.length > 1 ? `${xs[0]} … ${xs[xs.length - 1]}` : (xs[0] || '-')}
      </div>
    </div>
  );
}

function ChartLine({ title, data, color }) {
  return <ChartArea title={title} data={data} color={color} />;
}

function ChartBars({ title, data, color }) {
  const vbW = 100, vbH = 60, pad = 8;
  const ys = data.map(d => d.y);
  const maxY = Math.max(1, ...ys);
  const barW = (vbW - pad * 2) / Math.max(1, data.length);
  return (
    <div className="bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-xl p-3 shadow-sm">
      <div className="text-xs font-bold text-[var(--ink)] mb-2 uppercase tracking-wide">{title}</div>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-32 md:h-28" role="img" aria-label={title}>
        <title>{title}</title>
        <rect x={pad} y={pad} width={vbW - pad * 2} height={vbH - pad * 2} fill="none" stroke="currentColor" opacity="0.1" />
        {data.map((d, i) => {
          const h = (d.y / maxY) * (vbH - pad * 2);
          const x = pad + i * barW + 0.8;
          const y = vbH - pad - h;
          return <rect key={i} x={x} y={y} width={barW - 1.6} height={h} fill={color} rx="1" opacity="0.85" />;
        })}
      </svg>
      <div className="mt-2 text-[10px] font-bold text-[var(--muted)] truncate text-center">
        {data.length > 1 ? `${data[0].x} … ${data[data.length - 1].x}` : (data[0]?.x || '-')}
      </div>
    </div>
  );
}

function ChartDonut({ title, data, colors }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const arcs = data.map((slice, i) => {
    if (total === 0) return null;
    const startPercent = cumulative / total;
    const percent = slice.value / total;
    cumulative += slice.value;
    const endPercent = cumulative / total;

    if (percent === 1) {
      return <circle key={i} cx="0" cy="0" r="1" fill="none" stroke={colors[i % colors.length]} strokeWidth="0.6" />;
    }

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`
    ].join(' ');

    return (
      <path key={i} d={pathData} fill="none" stroke={colors[i % colors.length]} strokeWidth="0.6" strokeLinecap="round" />
    );
  });

  return (
    <div className="bg-[var(--glass-white)] border border-[var(--glass-border)] rounded-xl p-4 shadow-sm h-full flex flex-col">
      <div className="text-sm font-bold text-[var(--ink)] mb-4">{title}</div>
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="w-36 h-36 relative shrink-0">
          {total === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)]">Sin datos</div>
          ) : (
            <>
              <svg viewBox="-1.5 -1.5 3 3" className="w-full h-full transform -rotate-90">
                {arcs}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-[var(--ink)]">${total >= 1000 ? (total/1000).toFixed(1)+'k' : total.toFixed(0)}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1 w-full">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-[var(--glass-light)] px-3 py-1.5 rounded-lg border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></span>
                <span className="truncate text-[var(--ink2)] font-semibold" title={d.label}>{d.label}</span>
              </div>
              <span className="font-mono font-bold text-[var(--ink)] shrink-0 ml-2">${d.value.toFixed(2)}</span>
            </div>
          ))}
          {data.length === 0 && <p className="text-center text-xs text-[var(--muted)]">No hay información en el periodo</p>}
        </div>
      </div>
    </div>
  );
}
