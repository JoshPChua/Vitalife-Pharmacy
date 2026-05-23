import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader, formatCurrency, StatCard } from '../components/shared/SharedComponents';
import { formatPHTShort, orderTypeLabels } from '../types';
import { ShoppingCart, Clock, Package, ArrowLeftRight, AlertTriangle, Eye, Truck } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const store = useStore();
  const nav = useNavigate();
  const munoz = store.getMunozBranchId();

  const todaySales = store.getTodaysSales(munoz);
  const todayTotal = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);
  const bulkToday = todaySales.filter((s) => s.orderType === 'bulk_order').length;
  const codPending = store.sales.filter((s) => s.isCOD && s.balance > 0 && s.status !== 'cancelled');
  const snrItems = store.getSoldNotReleasedItems();
  const expiringLots = store.getExpiringLots(90);
  const lowStock = store.getLowStockLots(munoz);
  const pendingTransfers = store.stockTransfers.filter((t) => ['draft', 'sent', 'in_transit'].includes(t.status));
  const pagataanStock = store.lots.filter((l) => l.branchId === 'branch-pagataan').reduce((s, l) => s + l.onHand, 0);

  const recentSales = [...store.sales].filter((s) => s.branchId === munoz && s.status !== 'draft').sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).slice(0, 10);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Muñoz - Main Branch · Overview" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
        <StatCard label="Today's Sales" value={formatCurrency(todayTotal)} sub={`${todaySales.length} order(s)`} color="blue" icon={<ShoppingCart size={18} />} onClick={() => nav('/daily-report')} />
        <StatCard label="Bulk Orders Today" value={bulkToday} color="default" onClick={() => nav('/reports')} />
        <StatCard label="COD Pending" value={codPending.length} sub={codPending.length > 0 ? `₱${codPending.reduce((s, c) => s + c.balance, 0).toLocaleString()} balance` : ''} color="yellow" onClick={() => nav('/reports')} />
        <StatCard label="Sold Not Released" value={snrItems.length} sub="on shelf" color="red" icon={<Clock size={18} />} onClick={() => nav('/sold-not-released')} />
        <StatCard label="FEFO Pick First" value={expiringLots.filter((l) => l.branchId === munoz).length} sub="expiring lots" color="yellow" icon={<Eye size={18} />} onClick={() => nav('/fefo-monitoring')} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Low Stock (Muñoz)" value={lowStock.length} color={lowStock.length > 0 ? 'red' : 'green'} onClick={() => nav('/inventory')} />
        <StatCard label="Expiring Soon" value={expiringLots.length} sub="within 90 days" color="yellow" icon={<AlertTriangle size={18} />} onClick={() => nav('/fefo-monitoring')} />
        <StatCard label="Pagataan Warehouse" value={pagataanStock.toLocaleString()} sub="units total" color="default" icon={<Package size={18} />} onClick={() => nav('/inventory')} />
        <StatCard label="Pending Transfers" value={pendingTransfers.length} sub="Pagataan → Muñoz" color="blue" icon={<Truck size={18} />} onClick={() => nav('/transfers')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <div className="vl-card">
          <div className="vl-card-header mb-3">Actionable Alerts</div>
          <div className="space-y-2 text-[13px]">
            {snrItems.length > 0 && <div className="flex items-center gap-2 p-2 bg-danger-50 rounded cursor-pointer hover:bg-danger-100" onClick={() => nav('/sold-not-released')}><Clock size={14} className="text-danger-500" /> <strong>{snrItems.length}</strong> items sold but not yet released from shelf</div>}
            {codPending.length > 0 && <div className="flex items-center gap-2 p-2 bg-warning-50 rounded cursor-pointer hover:bg-warning-100" onClick={() => nav('/reports')}><ShoppingCart size={14} className="text-warning-500" /> <strong>{codPending.length}</strong> COD orders awaiting payment (₱{codPending.reduce((s, c) => s + c.balance, 0).toLocaleString()})</div>}
            {pendingTransfers.length > 0 && <div className="flex items-center gap-2 p-2 bg-primary-50 rounded cursor-pointer hover:bg-primary-100" onClick={() => nav('/transfers')}><ArrowLeftRight size={14} className="text-primary-500" /> <strong>{pendingTransfers.length}</strong> transfers pending from Pagataan</div>}
            {lowStock.length > 0 && <div className="flex items-center gap-2 p-2 bg-danger-50 rounded cursor-pointer hover:bg-danger-100" onClick={() => nav('/inventory')}><AlertTriangle size={14} className="text-danger-500" /> <strong>{lowStock.length}</strong> lots below reorder level at Muñoz</div>}
            {snrItems.length === 0 && codPending.length === 0 && pendingTransfers.length === 0 && lowStock.length === 0 && <div className="text-slate-400 py-4 text-center">No alerts — all clear ✓</div>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="vl-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Recent Orders — Muñoz</span></div>
          <table className="vl-table">
            <thead><tr><th>Order #</th><th>Date/Time</th><th>Customer</th><th>Type</th><th>Payment</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-[12px] font-medium text-primary-600">{s.saleNumber}</td>
                  <td className="text-[12px] whitespace-nowrap">{formatPHTShort(s.dateTime)}</td>
                  <td className="text-[13px]">{s.customerName || <span className="text-slate-400">Walk-in</span>}</td>
                  <td><span className={`badge ${s.orderType === 'bulk_order' ? 'badge-info' : s.orderType === 'cod' ? 'badge-warning' : 'badge-neutral'}`}>{orderTypeLabels[s.orderType]}</span></td>
                  <td><span className={`badge ${s.paymentStatus === 'paid' ? 'badge-ok' : s.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{s.paymentStatus}</span></td>
                  <td className="text-right font-bold">{formatCurrency(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
