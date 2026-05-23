import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/shared/SharedComponents';
import { Modal } from '../components/shared/Modal';
import { getAvailable } from '../types';
import { differenceInDays } from 'date-fns';
import { Search, Eye, Edit, X } from 'lucide-react';

export const Inventory: React.FC = () => {
  const store = useStore();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [branchF, setBranchF] = useState('');
  const [catF, setCatF] = useState('');
  const [toggle, setToggle] = useState('');
  const [page, setPage] = useState(0);
  const [adjLot, setAdjLot] = useState<typeof store.lots[0] | null>(null);
  const [adjAmt, setAdjAmt] = useState(0);
  const [adjReason, setAdjReason] = useState('Physical count correction');
  const now = new Date();
  const PER = 25;

  // Compute FEFO ranks
  const fefoRanks = useMemo(() => {
    const groups: Record<string, string[]> = {};
    store.lots.forEach((l) => {
      const key = `${l.productId}-${l.branchId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(l.id);
    });
    const ranks: Record<string, number> = {};
    Object.values(groups).forEach((ids) => {
      const sorted = ids.sort((a, b) => new Date(store.lots.find((l) => l.id === a)!.expiryDate).getTime() - new Date(store.lots.find((l) => l.id === b)!.expiryDate).getTime());
      sorted.forEach((id, i) => { ranks[id] = i + 1; });
    });
    return ranks;
  }, [store.lots]);

  const filtered = useMemo(() => {
    return store.lots.filter((lot) => {
      const p = store.getProductById(lot.productId);
      if (!p) return false;
      if (branchF && lot.branchId !== branchF) return false;
      if (catF && p.categoryId !== catF) return false;
      if (search) { const s = search.toLowerCase(); if (!p.name.toLowerCase().includes(s) && !p.sku.toLowerCase().includes(s) && !lot.lotNumber.toLowerCase().includes(s)) return false; }
      const avail = getAvailable(lot);
      if (toggle === 'low' && avail >= p.reorderLevel) return false;
      if (toggle === 'expiring') { const d = differenceInDays(new Date(lot.expiryDate), now); if (d > 90 || d < 0) return false; }
      if (toggle === 'reserved' && lot.reserved === 0) return false;
      return true;
    });
  }, [store, search, branchF, catF, toggle, now]);

  const paged = filtered.slice(page * PER, (page + 1) * PER);
  const totalPages = Math.ceil(filtered.length / PER);

  const doAdjust = () => {
    if (adjLot && adjAmt !== 0) { store.adjustStock(adjLot.id, adjAmt, adjReason); setAdjLot(null); setAdjAmt(0); }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`${filtered.length} lots across ${store.branches.length} locations`} />
      <div className="vl-card mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="vl-input !pl-8" placeholder="Product, SKU, lot #..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div>
          <select className="vl-input !w-auto" value={branchF} onChange={(e) => { setBranchF(e.target.value); setPage(0); }}><option value="">All Locations</option>{store.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select className="vl-input !w-auto" value={catF} onChange={(e) => { setCatF(e.target.value); setPage(0); }}><option value="">All Categories</option>{store.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {['low', 'expiring', 'reserved'].map((t) => <button key={t} className={`btn btn-sm ${toggle === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setToggle(toggle === t ? '' : t); setPage(0); }}>{t === 'low' ? 'Low Stock' : t === 'expiring' ? 'Expiring' : 'Reserved'}</button>)}
          {(search || branchF || catF || toggle) && <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setBranchF(''); setCatF(''); setToggle(''); setPage(0); }}><X size={13} /> Clear</button>}
        </div>
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="vl-table">
            <thead><tr><th>SKU</th><th>Product</th><th>Branch</th><th>Lot #</th><th>Shelf</th><th>Expiry</th><th>FEFO</th><th className="text-right">On Hand</th><th className="text-right">Rsrvd</th><th className="text-right">Avail</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {paged.map((lot) => {
                const p = store.getProductById(lot.productId)!;
                const avail = getAvailable(lot);
                const daysLeft = differenceInDays(new Date(lot.expiryDate), now);
                const rank = fefoRanks[lot.id] || 0;
                const br = store.getBranchById(lot.branchId);
                let statusBadge = { l: 'OK', b: 'badge-ok' };
                if (daysLeft < 0) statusBadge = { l: 'Expired', b: 'badge-danger' };
                else if (daysLeft <= 90) statusBadge = { l: 'Expiring', b: 'badge-warning' };
                else if (avail < p.reorderLevel) statusBadge = { l: 'Low', b: 'badge-danger' };
                else if (lot.reserved > 0) statusBadge = { l: 'Reserved', b: 'badge-reserved' };
                return (
                  <tr key={lot.id}>
                    <td className="font-mono text-[11px] text-slate-500">{p.sku}</td>
                    <td className="font-medium text-[12px] max-w-[150px] truncate">{p.name}</td>
                    <td className="text-[11px]">{br?.name.split(' -')[0]}</td>
                    <td className="font-mono text-[11px]">{lot.lotNumber}</td>
                    <td className="text-[11px] text-slate-500">{lot.shelfLocation}</td>
                    <td className={`text-[12px] ${daysLeft < 0 ? 'text-danger-600 font-medium' : daysLeft <= 90 ? 'text-warning-600' : ''}`}>{lot.expiryDate.substring(0, 10)}</td>
                    <td><span className={`fefo-rank ${rank === 1 ? 'fefo-1' : rank === 2 ? 'fefo-2' : 'fefo-n'}`}>#{rank}</span></td>
                    <td className="text-right">{lot.onHand}</td>
                    <td className="text-right">{lot.reserved > 0 ? <span className="text-warning-600 font-medium">{lot.reserved}</span> : <span className="text-slate-300">0</span>}</td>
                    <td className={`text-right font-bold ${avail < p.reorderLevel ? 'text-danger-600' : ''}`}>{avail}</td>
                    <td><span className={`badge ${statusBadge.b}`}>{statusBadge.l}</span></td>
                    <td><div className="flex gap-1"><button className="btn btn-sm btn-ghost" onClick={() => nav(`/inventory/${p.id}`)} title="View"><Eye size={13} /></button><button className="btn btn-sm btn-ghost" onClick={() => { setAdjLot(lot); setAdjAmt(0); }} title="Adjust"><Edit size={13} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 text-[12px]"><span className="text-slate-500">Page {page + 1} of {totalPages} ({filtered.length} lots)</span><div className="flex gap-1"><button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button><button className="btn btn-sm btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button></div></div>}
      </div>
      {adjLot && <Modal isOpen={!!adjLot} title="Adjust Stock" onClose={() => setAdjLot(null)} width="420px">
        <div className="space-y-3 text-[13px]">
          <div className="bg-slate-50 p-3 rounded text-[12px]"><strong>{store.getProductById(adjLot.productId)?.name}</strong><div className="text-slate-500">{adjLot.lotNumber} · {adjLot.shelfLocation} · On Hand: {adjLot.onHand}</div></div>
          <div><label className="text-[11px] font-medium text-slate-500">Adjustment (+/-)</label><input type="number" className="vl-input" value={adjAmt} onChange={(e) => setAdjAmt(parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-[11px] font-medium text-slate-500">Reason</label><select className="vl-input" value={adjReason} onChange={(e) => setAdjReason(e.target.value)}><option>Physical count correction</option><option>Damaged goods</option><option>Expired removal</option><option>Received delivery</option><option>Other</option></select></div>
          <button className="btn btn-primary w-full" disabled={adjAmt === 0} onClick={doAdjust}>Confirm Adjustment</button>
        </div>
      </Modal>}
    </div>
  );
};
