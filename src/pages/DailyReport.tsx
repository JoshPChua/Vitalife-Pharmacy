import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, formatCurrency, StatCard } from '../components/shared/SharedComponents';
import { formatPHTShort, orderTypeLabels, paymentMethodLabels, deliveryStatusLabels } from '../types';
import { Calendar, Printer, Download, AlertTriangle } from 'lucide-react';

export const DailyReport: React.FC = () => {
  const store = useStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = React.useState(today);
  const munoz = store.getMunozBranchId();

  const daySales = useMemo(() => store.sales.filter((s) => s.dateTime.split('T')[0] === date && s.branchId === munoz && s.status !== 'draft'), [store.sales, date, munoz]);

  const gross = daySales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalItems = daySales.reduce((s, sale) => s + sale.items.length, 0);
  const totalQty = daySales.reduce((s, sale) => s + sale.items.reduce((q, i) => q + i.quantity, 0), 0);
  const reserved = daySales.reduce((s, sale) => s + sale.items.filter((i) => i.status === 'reserved').length, 0);
  const released = daySales.reduce((s, sale) => s + sale.items.filter((i) => i.status === 'released').length, 0);
  const cancelled = daySales.reduce((s, sale) => s + sale.items.filter((i) => i.status === 'cancelled').length, 0);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    daySales.forEach((s) => { const k = s.paymentMethod; if (!map[k]) map[k] = { count: 0, total: 0 }; map[k].count++; map[k].total += s.totalAmount; });
    return Object.entries(map);
  }, [daySales]);

  const unreleased = daySales.flatMap((s) => s.items.filter((i) => i.status === 'reserved').map((i) => ({ sale: s, item: i, product: store.getProductById(i.productId) })));

  return (
    <div>
      <PageHeader title="Daily Sales Report" subtitle="Muñoz - Main Branch" actions={<div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={() => store.addToast('Printing report...', 'success')}><Printer size={14} /> Print</button>
        <button className="btn btn-sm btn-outline" onClick={() => store.addToast('CSV exported', 'success')}><Download size={14} /> Export</button>
      </div>} />
      <div className="flex items-center gap-3 mb-4">
        <Calendar size={15} className="text-slate-400" />
        <input type="date" className="vl-input !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        <span className="text-[12px] text-slate-400">{daySales.length} order(s)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatCard label="Gross Sales" value={formatCurrency(gross)} color="blue" />
        <StatCard label="Line Items" value={totalItems} sub={`${totalQty} qty`} />
        <StatCard label="Reserved" value={reserved} sub="on shelf" color="yellow" />
        <StatCard label="Released" value={released} color="green" />
        <StatCard label="Cancelled" value={cancelled} color="red" />
        <StatCard label="Orders" value={daySales.length} />
      </div>

      {/* Orders table */}
      <div className="vl-card p-0 overflow-hidden mb-4">
        <div className="px-4 py-2 border-b border-slate-100"><span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Order Summary</span></div>
        <table className="vl-table">
          <thead><tr><th>Order #</th><th>Time</th><th>Customer</th><th>Type</th><th>Payment</th><th>Status</th><th>Delivery</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {daySales.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-[12px] font-medium text-primary-600">{s.saleNumber}</td>
                <td className="text-[12px] whitespace-nowrap">{formatPHTShort(s.dateTime)}</td>
                <td>{s.customerName || <span className="text-slate-400">Walk-in</span>}</td>
                <td><span className={`badge ${s.orderType === 'bulk_order' ? 'badge-info' : s.orderType === 'cod' ? 'badge-warning' : 'badge-neutral'}`}>{orderTypeLabels[s.orderType]}</span></td>
                <td><span className="badge badge-neutral">{paymentMethodLabels[s.paymentMethod]}</span></td>
                <td><span className={`badge ${s.paymentStatus === 'paid' ? 'badge-ok' : s.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{s.paymentStatus}</span></td>
                <td><span className="badge badge-neutral">{deliveryStatusLabels[s.deliveryStatus]}</span></td>
                <td className="text-right font-bold">{formatCurrency(s.totalAmount)}</td>
              </tr>
            ))}
            {daySales.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-slate-400">No sales on this date</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment breakdown */}
        <div className="vl-card">
          <div className="vl-card-header mb-2">Payment Method Summary</div>
          <table className="vl-table">
            <thead><tr><th>Method</th><th className="text-right">Orders</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {paymentBreakdown.map(([k, v]) => <tr key={k}><td>{paymentMethodLabels[k as keyof typeof paymentMethodLabels] || k}</td><td className="text-right">{v.count}</td><td className="text-right font-bold">{formatCurrency(v.total)}</td></tr>)}
              {paymentBreakdown.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-slate-400">—</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Unreleased */}
        {unreleased.length > 0 && <div className="vl-card">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-warning-500" /><span className="vl-card-header !mb-0">Unreleased Items ({unreleased.length})</span></div>
          <table className="vl-table">
            <thead><tr><th>Product</th><th>Lot #</th><th className="text-right">Qty</th><th>Order #</th></tr></thead>
            <tbody>
              {unreleased.map((r, i) => <tr key={i}><td className="text-[12px]">{r.product?.name}</td><td className="font-mono text-[11px]">{r.item.lotNumber}</td><td className="text-right font-bold">{r.item.quantity}</td><td className="font-mono text-[12px] text-primary-600">{r.sale.saleNumber}</td></tr>)}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
};
