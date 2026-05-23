import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader, formatCurrency } from '../components/shared/SharedComponents';
import { getAvailable, formatPHTShort } from '../types';
import { ArrowLeft, Info } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const nav = useNavigate();
  const store = useStore();
  const product = store.getProductById(productId || '');
  const category = product ? store.getCategoryById(product.categoryId) : undefined;
  const lots = store.getLotsByProduct(productId || '');
  const movements = store.stockMovements.filter((m) => m.productId === productId).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const now = new Date();

  const totals = useMemo(() => {
    const byBranch: Record<string, { onHand: number; reserved: number; avail: number }> = {};
    lots.forEach((l) => {
      if (!byBranch[l.branchId]) byBranch[l.branchId] = { onHand: 0, reserved: 0, avail: 0 };
      byBranch[l.branchId].onHand += l.onHand;
      byBranch[l.branchId].reserved += l.reserved;
      byBranch[l.branchId].avail += getAvailable(l);
    });
    return byBranch;
  }, [lots]);

  const totalOnHand = lots.reduce((s, l) => s + l.onHand, 0);
  const totalReserved = lots.reduce((s, l) => s + l.reserved, 0);
  const totalAvail = totalOnHand - totalReserved;

  if (!product) return <div className="p-8 text-center text-slate-400">Product not found</div>;

  return (
    <div>
      <PageHeader title={product.name} subtitle={`${product.sku} · ${category?.name} · ${product.unit}`} actions={<button className="btn btn-outline btn-sm" onClick={() => nav('/inventory')}><ArrowLeft size={14} /> Back</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="vl-card"><div className="vl-card-header">Unit Price</div><div className="vl-card-value">{formatCurrency(product.unitPrice)}</div><div className="vl-card-sub">Cost: {formatCurrency(product.costPrice)}</div></div>
        <div className="vl-card"><div className="vl-card-header">Reorder Level</div><div className="vl-card-value">{product.reorderLevel}</div></div>
        <div className="vl-card border-l-4 border-l-primary-500">
          <div className="vl-card-header">Stock Accountability</div>
          <div className="flex items-center gap-2 text-[20px] font-bold mt-1">
            <span>{totalOnHand}</span><span className="text-slate-300">−</span><span className="text-warning-600">{totalReserved}</span><span className="text-slate-300">=</span><span className="text-success-600">{totalAvail}</span>
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500 mt-1"><span>On Hand</span><span>Reserved</span><span>Available</span></div>
        </div>
      </div>

      {/* Branch summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {Object.entries(totals).map(([bid, t]) => {
          const br = store.getBranchById(bid);
          return <div key={bid} className="vl-card"><div className="vl-card-header">{br?.name}</div><div className="grid grid-cols-3 gap-2 mt-2 text-center"><div><div className="text-[18px] font-bold">{t.onHand}</div><div className="text-[10px] text-slate-500">On Hand</div></div><div><div className="text-[18px] font-bold text-warning-600">{t.reserved}</div><div className="text-[10px] text-slate-500">Reserved</div></div><div><div className="text-[18px] font-bold text-success-600">{t.avail}</div><div className="text-[10px] text-slate-500">Available</div></div></div></div>;
        })}
      </div>

      {/* Lot table */}
      <div className="vl-card p-0 overflow-hidden mb-5">
        <div className="px-4 py-2 border-b border-slate-100"><span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Lot Breakdown</span></div>
        <table className="vl-table">
          <thead><tr><th>Lot #</th><th>Branch</th><th>Shelf</th><th>Expiry</th><th className="text-right">On Hand</th><th className="text-right">Reserved</th><th className="text-right">Available</th><th>Status</th></tr></thead>
          <tbody>
            {lots.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map((l) => {
              const d = differenceInDays(new Date(l.expiryDate), now);
              const avail = getAvailable(l);
              return <tr key={l.id}>
                <td className="font-mono text-[12px]">{l.lotNumber}</td>
                <td className="text-[11px]">{store.getBranchById(l.branchId)?.name.split(' -')[0]}</td>
                <td className="text-[11px] text-slate-500">{l.shelfLocation}</td>
                <td className={`text-[12px] ${d < 0 ? 'text-danger-600' : d <= 90 ? 'text-warning-600' : ''}`}>{l.expiryDate.substring(0, 10)}</td>
                <td className="text-right">{l.onHand}</td>
                <td className="text-right">{l.reserved > 0 ? <span className="text-warning-600">{l.reserved}</span> : '0'}</td>
                <td className={`text-right font-bold ${avail < product.reorderLevel ? 'text-danger-600' : ''}`}>{avail}</td>
                <td>{d < 0 ? <span className="badge badge-danger">Expired</span> : d <= 90 ? <span className="badge badge-warning">Expiring</span> : l.reserved > 0 ? <span className="badge badge-reserved">Reserved</span> : <span className="badge badge-ok">OK</span>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Movements */}
      <div className="vl-card p-0 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2"><Info size={14} className="text-slate-400" /><span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Movement History</span></div>
        <table className="vl-table">
          <thead><tr><th>Date/Time</th><th>Type</th><th>Lot</th><th className="text-right">Qty</th><th>Reference</th><th>Notes</th></tr></thead>
          <tbody>
            {movements.slice(0, 20).map((m) => <tr key={m.id}>
              <td className="text-[12px] whitespace-nowrap">{formatPHTShort(m.dateTime)}</td>
              <td><span className={`badge ${m.type.includes('received') || m.type.includes('_in') ? 'badge-ok' : m.type.includes('released') ? 'badge-info' : m.type.includes('reserved') ? 'badge-reserved' : m.type.includes('cancelled') ? 'badge-neutral' : 'badge-warning'}`}>{m.type.replace(/_/g, ' ')}</span></td>
              <td className="font-mono text-[11px]">{store.lots.find((l) => l.id === m.lotId)?.lotNumber}</td>
              <td className={`text-right font-bold ${m.quantity > 0 ? 'text-success-600' : 'text-danger-600'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
              <td className="font-mono text-[11px] text-primary-600">{m.referenceNumber}</td>
              <td className="text-[11px] text-slate-500 max-w-[200px] truncate">{m.notes}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
