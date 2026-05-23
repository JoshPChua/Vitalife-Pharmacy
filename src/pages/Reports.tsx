import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, formatCurrency, StatCard } from '../components/shared/SharedComponents';
import { formatPHTShort, orderTypeLabels, paymentMethodLabels, getAvailable } from '../types';
import { Printer, Download, FileText, Package, Clock, AlertTriangle, ArrowLeftRight, CreditCard, Eye, TrendingDown } from 'lucide-react';

const reportTypes = [
  { id: 'munoz_sales', label: 'Muñoz Sales', icon: FileText, desc: 'Daily sales from Muñoz' },
  { id: 'bulk_orders', label: 'Bulk Orders', icon: Package, desc: 'Bulk order list' },
  { id: 'cod_orders', label: 'COD Orders', icon: CreditCard, desc: 'Cash on delivery pending' },
  { id: 'payment_summary', label: 'Payment Summary', icon: CreditCard, desc: 'By payment method' },
  { id: 'sold_not_released', label: 'Sold Not Released', icon: Clock, desc: 'Items on shelf' },
  { id: 'fefo', label: 'FEFO Compliance', icon: Eye, desc: 'Override tracking' },
  { id: 'lot_expiry', label: 'Lot Expiry', icon: AlertTriangle, desc: 'Expiry date report' },
  { id: 'valuation', label: 'Inventory Valuation', icon: TrendingDown, desc: 'Stock value report' },
  { id: 'low_stock', label: 'Low Stock', icon: AlertTriangle, desc: 'Below reorder level' },
  { id: 'branch_compare', label: 'Branch Comparison', icon: ArrowLeftRight, desc: 'Muñoz vs Pagataan' },
];

export const Reports: React.FC = () => {
  const store = useStore();
  const [active, setActive] = useState('munoz_sales');
  const munoz = store.getMunozBranchId();

  const content = useMemo(() => {
    switch (active) {
      case 'munoz_sales': return store.sales.filter((s) => s.branchId === munoz && s.status !== 'draft').sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      case 'bulk_orders': return store.sales.filter((s) => s.orderType === 'bulk_order' && s.status !== 'draft');
      case 'cod_orders': return store.sales.filter((s) => s.isCOD);
      default: return [];
    }
  }, [active, store.sales, munoz]);

  const paymentSummary = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    store.sales.filter((s) => s.branchId === munoz && s.status !== 'draft').forEach((s) => { const k = s.paymentMethod; if (!map[k]) map[k] = { count: 0, total: 0 }; map[k].count++; map[k].total += s.totalAmount; });
    return Object.entries(map);
  }, [store.sales, munoz]);

  const branchCompare = useMemo(() => {
    const map: Record<string, { sku: string; name: string; mOnHand: number; mAvail: number; pOnHand: number; pAvail: number }> = {};
    store.lots.forEach((l) => {
      const p = store.getProductById(l.productId);
      if (!p) return;
      if (!map[p.id]) map[p.id] = { sku: p.sku, name: p.name, mOnHand: 0, mAvail: 0, pOnHand: 0, pAvail: 0 };
      const a = getAvailable(l);
      if (l.branchId === munoz) { map[p.id].mOnHand += l.onHand; map[p.id].mAvail += a; }
      else { map[p.id].pOnHand += l.onHand; map[p.id].pAvail += a; }
    });
    return Object.values(map);
  }, [store.lots, munoz, store]);

  const renderTable = () => {
    if (active === 'munoz_sales' || active === 'bulk_orders' || active === 'cod_orders') {
      const sales = content as typeof store.sales;
      return <table className="vl-table"><thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Type</th><th>Payment</th><th>Status</th><th className="text-right">Amount</th>{active === 'cod_orders' && <th className="text-right">Balance</th>}</tr></thead><tbody>
        {sales.map((s) => <tr key={s.id}><td className="font-mono text-[12px] text-primary-600">{s.saleNumber}</td><td className="text-[12px]">{formatPHTShort(s.dateTime)}</td><td>{s.customerName || 'Walk-in'}</td><td><span className="badge badge-neutral">{orderTypeLabels[s.orderType]}</span></td><td><span className="badge badge-neutral">{paymentMethodLabels[s.paymentMethod]}</span></td><td><span className={`badge ${s.paymentStatus === 'paid' ? 'badge-ok' : s.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{s.paymentStatus}</span></td><td className="text-right font-bold">{formatCurrency(s.totalAmount)}</td>{active === 'cod_orders' && <td className="text-right font-bold text-danger-600">{formatCurrency(s.balance)}</td>}</tr>)}
        {sales.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-slate-400">No data</td></tr>}
      </tbody></table>;
    }
    if (active === 'payment_summary') return <table className="vl-table"><thead><tr><th>Method</th><th className="text-right">Orders</th><th className="text-right">Total</th></tr></thead><tbody>{paymentSummary.map(([k, v]) => <tr key={k}><td>{paymentMethodLabels[k as keyof typeof paymentMethodLabels]}</td><td className="text-right">{v.count}</td><td className="text-right font-bold">{formatCurrency(v.total)}</td></tr>)}</tbody></table>;
    if (active === 'sold_not_released') { const items = store.getSoldNotReleasedItems(); return <table className="vl-table"><thead><tr><th>Order #</th><th>Product</th><th>Lot</th><th className="text-right">Qty</th><th>Age</th></tr></thead><tbody>{items.map((r, i) => <tr key={i}><td className="font-mono text-[12px] text-primary-600">{r.sale.saleNumber}</td><td className="text-[12px]">{r.product.name}</td><td className="font-mono text-[11px]">{r.item.lotNumber}</td><td className="text-right font-bold">{r.item.quantity}</td><td><span className={`badge ${r.ageDays <= 0 ? 'badge-ok' : r.ageDays <= 3 ? 'badge-warning' : 'badge-danger'}`}>{r.ageDays}d</span></td></tr>)}{items.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-400">All clear</td></tr>}</tbody></table>; }
    if (active === 'fefo') { const overrides = store.sales.flatMap((s) => s.items.filter((i) => i.fefoOverride).map((i) => ({ sale: s, item: i, product: store.getProductById(i.productId) }))); return <table className="vl-table"><thead><tr><th>Order #</th><th>Product</th><th>Lot</th><th>FEFO#</th><th>Reason</th></tr></thead><tbody>{overrides.map((r, i) => <tr key={i}><td className="font-mono text-[12px] text-primary-600">{r.sale.saleNumber}</td><td className="text-[12px]">{r.product?.name}</td><td className="font-mono text-[11px]">{r.item.lotNumber}</td><td><span className="fefo-rank fefo-n">#{r.item.fefoRank}</span></td><td className="text-[12px] text-slate-500">{r.item.fefoOverrideReason || '—'}</td></tr>)}{overrides.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-400 text-success-600">100% FEFO compliant ✓</td></tr>}</tbody></table>; }
    if (active === 'lot_expiry') { const sorted = [...store.lots].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); return <table className="vl-table"><thead><tr><th>Product</th><th>Lot</th><th>Branch</th><th>Shelf</th><th>Expiry</th><th className="text-right">On Hand</th><th className="text-right">Avail</th></tr></thead><tbody>{sorted.slice(0, 50).map((l) => { const p = store.getProductById(l.productId); const d = Math.floor((new Date(l.expiryDate).getTime() - Date.now()) / 86400000); return <tr key={l.id}><td className="text-[12px]">{p?.name}</td><td className="font-mono text-[11px]">{l.lotNumber}</td><td className="text-[11px]">{store.getBranchById(l.branchId)?.name.split(' -')[0]}</td><td className="text-[11px] text-slate-500">{l.shelfLocation}</td><td className={`text-[12px] ${d < 0 ? 'text-danger-600' : d <= 90 ? 'text-warning-600' : ''}`}>{l.expiryDate.substring(0, 10)} ({d}d)</td><td className="text-right">{l.onHand}</td><td className="text-right font-bold">{getAvailable(l)}</td></tr>; })}</tbody></table>; }
    if (active === 'valuation') { const totalCost = store.lots.reduce((s, l) => { const p = store.getProductById(l.productId); return s + (p ? l.onHand * p.costPrice : 0); }, 0); const totalRetail = store.lots.reduce((s, l) => { const p = store.getProductById(l.productId); return s + (p ? l.onHand * p.unitPrice : 0); }, 0); return <div><div className="grid grid-cols-3 gap-3 mb-4"><StatCard label="Total Cost Value" value={formatCurrency(totalCost)} color="blue" /><StatCard label="Total Retail Value" value={formatCurrency(totalRetail)} color="green" /><StatCard label="Potential Margin" value={formatCurrency(totalRetail - totalCost)} color="yellow" /></div></div>; }
    if (active === 'low_stock') { const low = store.getLowStockLots(); return <table className="vl-table"><thead><tr><th>Product</th><th>Lot</th><th>Branch</th><th className="text-right">Available</th><th className="text-right">Reorder</th></tr></thead><tbody>{low.map((l) => { const p = store.getProductById(l.productId)!; return <tr key={l.id}><td className="text-[12px]">{p.name}</td><td className="font-mono text-[11px]">{l.lotNumber}</td><td className="text-[11px]">{store.getBranchById(l.branchId)?.name.split(' -')[0]}</td><td className="text-right font-bold text-danger-600">{getAvailable(l)}</td><td className="text-right text-slate-500">{p.reorderLevel}</td></tr>; })}{low.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-400">All stock above reorder levels</td></tr>}</tbody></table>; }
    if (active === 'branch_compare') return <table className="vl-table"><thead><tr><th>SKU</th><th>Product</th><th className="text-right">Muñoz OH</th><th className="text-right">Muñoz Avail</th><th className="text-right">Pagataan OH</th><th className="text-right">Pagataan Avail</th></tr></thead><tbody>{branchCompare.map((r) => <tr key={r.sku}><td className="font-mono text-[11px]">{r.sku}</td><td className="text-[12px]">{r.name}</td><td className="text-right">{r.mOnHand}</td><td className="text-right font-bold">{r.mAvail}</td><td className="text-right">{r.pOnHand}</td><td className="text-right font-bold">{r.pAvail}</td></tr>)}</tbody></table>;
    return null;
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Muñoz Sales · Warehouse · FEFO Compliance" actions={<div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={() => store.addToast('Printing...', 'success')}><Printer size={14} /> Print</button>
        <button className="btn btn-sm btn-outline" onClick={() => store.addToast('Exported', 'success')}><Download size={14} /> Export</button>
      </div>} />
      <div className="grid grid-cols-[220px_1fr] gap-4">
        <div className="space-y-1">
          {reportTypes.map((r) => <button key={r.id} className={`w-full text-left px-3 py-2 rounded-md text-[12px] flex items-center gap-2 transition-colors ${active === r.id ? 'bg-primary-50 text-primary-700 border border-primary-200 font-medium' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setActive(r.id)}>
            <r.icon size={14} className="shrink-0" /><div><div>{r.label}</div><div className="text-[10px] text-slate-400">{r.desc}</div></div>
          </button>)}
        </div>
        <div className="vl-card p-0 overflow-hidden">{renderTable()}</div>
      </div>
    </div>
  );
};
