import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/shared/SharedComponents';
import { Modal } from '../components/shared/Modal';

import { Info, CheckCircle } from 'lucide-react';

export const StockCountPage: React.FC = () => {
  const store = useStore();
  const [branchF, setBranchF] = useState(store.getMunozBranchId());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState('Physical count correction');

  const lots = useMemo(() => store.lots.filter((l) => l.branchId === branchF), [store.lots, branchF]);

  const setCount = (lotId: string, val: number) => setCounts((p) => ({ ...p, [lotId]: val }));
  const getCount = (lotId: string) => counts[lotId];
  const diff = (lotId: string, onHand: number) => { const c = getCount(lotId); return c !== undefined ? c - onHand : undefined; };

  const doResolve = () => {
    if (!resolveId) return;
    const lot = store.lots.find((l) => l.id === resolveId);
    if (!lot) return;
    const d = diff(resolveId, lot.onHand);
    if (d !== undefined && d !== 0) store.adjustStock(resolveId, d, resolveAction);
    setResolveId(null);
  };

  return (
    <div>
      <PageHeader title="Stock Count / Reconciliation" subtitle="Compare physical count vs system records" />
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 text-[13px] text-primary-800 flex items-start gap-2">
        <Info size={15} className="shrink-0 mt-0.5" /> Enter the physical count for each lot. Differences may be caused by sold-not-yet-released items (reserved stock still on shelf).
      </div>
      <div className="flex items-center gap-3 mb-4">
        <select className="vl-input !w-auto" value={branchF} onChange={(e) => setBranchF(e.target.value)}>{store.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <span className="text-[12px] text-slate-400">{lots.length} lots</span>
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <table className="vl-table">
          <thead><tr><th>Product</th><th>Lot #</th><th>Shelf</th><th className="text-right">System</th><th className="text-right">Reserved</th><th className="text-right">Physical Count</th><th className="text-right">Diff</th><th>Actions</th></tr></thead>
          <tbody>
            {lots.map((lot) => {
              const p = store.getProductById(lot.productId);
              const d = diff(lot.id, lot.onHand);
              return <tr key={lot.id} className={d !== undefined && d !== 0 ? (d > 0 ? 'bg-success-50' : 'bg-danger-50') : ''}>
                <td className="text-[12px]"><div className="font-medium">{p?.name}</div><div className="text-[11px] text-slate-400 font-mono">{p?.sku}</div></td>
                <td className="font-mono text-[11px]">{lot.lotNumber}</td>
                <td className="text-[11px] text-slate-500">{lot.shelfLocation}</td>
                <td className="text-right">{lot.onHand}</td>
                <td className="text-right">{lot.reserved > 0 ? <span className="text-warning-600 font-medium">{lot.reserved}</span> : '0'}</td>
                <td className="text-right"><input type="number" className="vl-input !w-[80px] !py-1 !text-right inline-block" value={getCount(lot.id) ?? ''} onChange={(e) => setCount(lot.id, parseInt(e.target.value) || 0)} placeholder="—" /></td>
                <td className={`text-right font-bold ${d !== undefined ? (d > 0 ? 'text-success-600' : d < 0 ? 'text-danger-600' : '') : 'text-slate-300'}`}>{d !== undefined ? (d > 0 ? `+${d}` : d === 0 ? '✓' : d) : '—'}</td>
                <td>{d !== undefined && d !== 0 && <button className="btn btn-sm btn-primary" onClick={() => setResolveId(lot.id)}><CheckCircle size={13} /> Resolve</button>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {resolveId && <Modal isOpen={!!resolveId} title="Resolve Discrepancy" onClose={() => setResolveId(null)} width="400px">
        <div className="space-y-3 text-[13px]">
          <div className="bg-slate-50 p-3 rounded">
            <div className="text-[12px]"><strong>{store.getProductById(store.lots.find((l) => l.id === resolveId)?.productId || '')?.name}</strong></div>
            <div className="text-[11px] text-slate-500">Difference: <strong className={diff(resolveId, store.lots.find((l) => l.id === resolveId)?.onHand || 0)! > 0 ? 'text-success-600' : 'text-danger-600'}>{diff(resolveId, store.lots.find((l) => l.id === resolveId)?.onHand || 0)}</strong></div>
          </div>
          <div><label className="text-[11px] font-medium text-slate-500">Resolution</label><select className="vl-input" value={resolveAction} onChange={(e) => setResolveAction(e.target.value)}><option>Physical count correction</option><option>Found sold-not-released item</option><option>Wrong lot assignment</option><option>Damaged / missing</option><option>Manual correction</option></select></div>
          <button className="btn btn-primary w-full" onClick={doResolve}>Apply Adjustment</button>
        </div>
      </Modal>}
    </div>
  );
};
