import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, StatCard } from '../components/shared/SharedComponents';
import { formatPHTShort, orderTypeLabels } from '../types';
import { Clock, CheckCircle, Printer, XCircle, Search, AlertTriangle } from 'lucide-react';

export const SoldNotReleased: React.FC = () => {
  const store = useStore();
  const [search, setSearch] = useState('');

  const allItems = store.getSoldNotReleasedItems();
  const filtered = useMemo(() => allItems.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.product.name.toLowerCase().includes(s) || r.product.sku.toLowerCase().includes(s) || r.sale.saleNumber.toLowerCase().includes(s);
  }), [allItems, search]);

  const sameDay = filtered.filter((r) => r.ageDays === 0).length;
  const oneToThree = filtered.filter((r) => r.ageDays >= 1 && r.ageDays <= 3).length;
  const overdue = filtered.filter((r) => r.ageDays > 3).length;

  return (
    <div>
      <PageHeader title="Sold Not Yet Released" subtitle="Items sold/paid but still physically on the shelf — awaiting pickup or release" />
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4 text-[13px] text-warning-800 flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>These items have been <strong>deducted from available stock</strong> but are <strong>still physically on the shelf</strong>. Release them to avoid shelf-count discrepancies.</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Unreleased" value={filtered.length} sub="items" color="yellow" icon={<Clock size={18} />} />
        <StatCard label="Same Day" value={sameDay} color="green" />
        <StatCard label="1-3 Days" value={oneToThree} color="yellow" />
        <StatCard label="Overdue (>3d)" value={overdue} color="red" icon={<AlertTriangle size={18} />} />
      </div>
      <div className="vl-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="vl-input !pl-8" placeholder="Search order #, product, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {filtered.length > 0 && <button className="btn btn-sm btn-success" onClick={() => { const ids = new Set(filtered.map((r) => r.sale.id)); ids.forEach((sid) => store.markAllReleased(sid)); }}><CheckCircle size={14} /> Release All ({filtered.length})</button>}
        </div>
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <table className="vl-table">
          <thead><tr><th>Order #</th><th>Date/Time</th><th>Customer</th><th>Type</th><th>Product</th><th>Lot # / Shelf</th><th className="text-right">Qty</th><th>Payment</th><th>Age</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const ageBadge = r.ageDays === 0 ? { l: 'Today', b: 'badge-ok' } : r.ageDays <= 3 ? { l: `${r.ageDays}d`, b: 'badge-warning' } : { l: `${r.ageDays}d`, b: 'badge-danger' };
              return (
                <tr key={`${r.sale.id}-${r.item.id}`}>
                  <td className="font-mono text-[12px] font-medium text-primary-600">{r.sale.saleNumber}</td>
                  <td className="text-[12px] whitespace-nowrap">{formatPHTShort(r.sale.dateTime)}</td>
                  <td className="text-[13px]">{r.sale.customerName || <span className="text-slate-400">Walk-in</span>}</td>
                  <td><span className={`badge ${r.sale.orderType === 'bulk_order' ? 'badge-info' : r.sale.orderType === 'cod' ? 'badge-warning' : 'badge-neutral'}`}>{orderTypeLabels[r.sale.orderType]}</span></td>
                  <td><div className="font-medium text-[12px]">{r.product.name}</div><div className="text-[11px] text-slate-400 font-mono">{r.product.sku}</div></td>
                  <td className="font-mono text-[11px]"><div>{r.item.lotNumber}</div><div className="text-slate-400">{r.item.shelfLocation || r.lot.shelfLocation}</div></td>
                  <td className="text-right font-bold">{r.item.quantity}</td>
                  <td><span className={`badge ${r.sale.paymentStatus === 'paid' ? 'badge-ok' : r.sale.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{r.sale.paymentStatus}</span></td>
                  <td><span className={`badge ${ageBadge.b}`}>{ageBadge.l}</span></td>
                  <td><div className="flex items-center gap-1">
                    <button className="btn btn-sm btn-success" onClick={() => store.markItemReleased(r.sale.id, r.item.id)}><CheckCircle size={13} /> Release</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => store.addToast('Pick slip sent to printer', 'success')}><Printer size={13} /></button>
                    <button className="btn btn-sm btn-ghost text-danger-500" onClick={() => store.cancelSaleItem(r.sale.id, r.item.id)}><XCircle size={13} /></button>
                  </div></td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-8 text-slate-400">All sold items have been physically released ✓</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
