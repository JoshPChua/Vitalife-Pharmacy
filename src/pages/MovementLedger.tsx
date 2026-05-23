import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/shared/SharedComponents';
import { formatPHTShort } from '../types';
import { BookOpen, Search, Download, X } from 'lucide-react';

const mtLabel: Record<string, string> = { purchase_received: 'Purchase Received', sale_reserved: 'Sale Reserved', sale_released: 'Sale Released', sale_cancelled: 'Sale Cancelled', adjustment_in: 'Adjustment In', adjustment_out: 'Adjustment Out', transfer_out: 'Transfer Out', transfer_in: 'Transfer In', damaged: 'Damaged', expired: 'Expired', reconciliation: 'Reconciliation' };
const mtBadge: Record<string, string> = { purchase_received: 'badge-ok', sale_reserved: 'badge-reserved', sale_released: 'badge-info', sale_cancelled: 'badge-neutral', adjustment_in: 'badge-ok', adjustment_out: 'badge-warning', transfer_out: 'badge-info', transfer_in: 'badge-ok', damaged: 'badge-danger', expired: 'badge-danger', reconciliation: 'badge-warning' };

export const MovementLedger: React.FC = () => {
  const store = useStore();
  const [search, setSearch] = useState('');
  const [branchF, setBranchF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [page, setPage] = useState(0);
  const PER = 30;

  const filtered = useMemo(() => {
    return [...store.stockMovements].filter((m) => {
      if (branchF && m.branchId !== branchF) return false;
      if (typeF && m.type !== typeF) return false;
      if (search) {
        const s = search.toLowerCase();
        const p = store.getProductById(m.productId);
        const lot = store.lots.find((l) => l.id === m.lotId);
        if (!p?.name.toLowerCase().includes(s) && !p?.sku.toLowerCase().includes(s) && !(m.referenceNumber || '').toLowerCase().includes(s) && !lot?.lotNumber.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [store, search, branchF, typeF]);

  const paged = filtered.slice(page * PER, (page + 1) * PER);
  const totalPages = Math.ceil(filtered.length / PER);

  return (
    <div>
      <PageHeader title="Movement Ledger" subtitle="Complete audit trail of all stock movements" actions={<button className="btn btn-sm btn-outline" onClick={() => store.addToast('Exported', 'success')}><Download size={14} /> Export</button>} />
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 text-[13px] text-primary-800 flex items-start gap-2">
        <BookOpen size={15} className="shrink-0 mt-0.5" /> Every stock change creates an immutable ledger entry. Current stock values are derived from this movement history.
      </div>
      <div className="vl-card mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="vl-input !pl-8" placeholder="Product, SKU, lot, reference..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div>
          <select className="vl-input !w-auto" value={branchF} onChange={(e) => { setBranchF(e.target.value); setPage(0); }}><option value="">All Branches</option>{store.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select className="vl-input !w-auto" value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(0); }}><option value="">All Types</option>{Object.entries(mtLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {(search || branchF || typeF) && <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setBranchF(''); setTypeF(''); setPage(0); }}><X size={13} /> Clear</button>}
        </div>
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <table className="vl-table">
          <thead><tr><th>Date/Time</th><th>Type</th><th>Product</th><th>SKU</th><th>Lot #</th><th>Branch</th><th className="text-right">Qty</th><th>Reference</th><th>Notes</th></tr></thead>
          <tbody>
            {paged.map((m) => {
              const p = store.getProductById(m.productId);
              const lot = store.lots.find((l) => l.id === m.lotId);
              const br = store.getBranchById(m.branchId);
              return <tr key={m.id}>
                <td className="text-[12px] whitespace-nowrap">{formatPHTShort(m.dateTime)}</td>
                <td><span className={`badge ${mtBadge[m.type] || 'badge-neutral'}`}>{mtLabel[m.type] || m.type}</span></td>
                <td className="font-medium text-[12px] max-w-[140px] truncate">{p?.name}</td>
                <td className="font-mono text-[11px] text-slate-500">{p?.sku}</td>
                <td className="font-mono text-[11px]">{lot?.lotNumber}</td>
                <td className="text-[11px]">{br?.name.split(' -')[0]}</td>
                <td className={`text-right font-bold ${m.quantity > 0 ? 'text-success-600' : 'text-danger-600'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                <td className="font-mono text-[11px] text-primary-600">{m.referenceNumber}</td>
                <td className="text-[11px] text-slate-500 max-w-[180px] truncate">{m.notes}</td>
              </tr>;
            })}
            {paged.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-400">No movements found</td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 text-[12px]"><span className="text-slate-500">Page {page + 1} of {totalPages}</span><div className="flex gap-1"><button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button><button className="btn btn-sm btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button></div></div>}
      </div>
    </div>
  );
};
