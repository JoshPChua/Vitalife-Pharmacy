import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, StatCard } from '../components/shared/SharedComponents';
import { getAvailable } from '../types';
import { Eye, Search, AlertTriangle, Info } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export const FEFOMonitoring: React.FC = () => {
  const store = useStore();
  const [branchF, setBranchF] = useState(store.getMunozBranchId());
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [expiryDays, setExpiryDays] = useState(0);
  const now = new Date();

  const rankedLots = useMemo(() => {
    const groups: Record<string, typeof store.lots> = {};
    store.lots.forEach((l) => {
      const key = `${l.productId}-${l.branchId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    const result: Array<{ lot: typeof store.lots[0]; rank: number; daysLeft: number }> = [];
    Object.values(groups).forEach((g) => {
      g.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      g.forEach((lot, i) => {
        const daysLeft = differenceInDays(new Date(lot.expiryDate), now);
        result.push({ lot, rank: i + 1, daysLeft });
      });
    });
    return result;
  }, [store.lots, now]);

  const filtered = useMemo(() => {
    return rankedLots.filter(({ lot, rank, daysLeft }) => {
      if (branchF && lot.branchId !== branchF) return false;
      if (search) { const p = store.getProductById(lot.productId); const s = search.toLowerCase(); if (!p?.name.toLowerCase().includes(s) && !p?.sku.toLowerCase().includes(s)) return false; }
      if (expiryDays > 0 && daysLeft > expiryDays) return false;
      const avail = getAvailable(lot);
      if (statusF === 'pick_first' && !(rank === 1 && avail > 0)) return false;
      if (statusF === 'expiring' && daysLeft > 90) return false;
      if (statusF === 'reserved' && lot.reserved === 0) return false;
      if (statusF === 'later' && rank <= 1) return false;
      if (statusF === 'expired' && daysLeft >= 0) return false;
      return true;
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [rankedLots, branchF, search, statusF, expiryDays, store]);

  const pickFirstCount = rankedLots.filter(({ lot, rank }) => rank === 1 && getAvailable(lot) > 0 && (!branchF || lot.branchId === branchF)).length;
  const exp30 = rankedLots.filter(({ lot, daysLeft }) => daysLeft >= 0 && daysLeft <= 30 && (!branchF || lot.branchId === branchF)).length;
  const reservedCount = rankedLots.filter(({ lot }) => lot.reserved > 0 && (!branchF || lot.branchId === branchF)).length;

  const getStatusBadge = (rank: number, daysLeft: number, lot: typeof store.lots[0]) => {
    if (daysLeft < 0) return { l: 'Expired', b: 'badge-danger' };
    if (daysLeft <= 90 && rank === 1) return { l: 'Pick First', b: 'badge-pick-first' };
    if (daysLeft <= 90) return { l: 'Expiring', b: 'badge-warning' };
    if (lot.reserved > 0) return { l: 'Reserved', b: 'badge-reserved' };
    if (rank === 1) return { l: 'Pick First', b: 'badge-pick-first' };
    if (rank > 1) return { l: 'Later Lot', b: 'badge-later-lot' };
    return { l: 'OK', b: 'badge-ok' };
  };

  return (
    <div>
      <PageHeader title="FEFO Monitoring" subtitle="First Expiry, First Out — Physical stock picking guide" />
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 text-[13px] text-primary-800 flex items-start gap-2">
        <Info size={15} className="shrink-0 mt-0.5" />
        <div><strong>FEFO = First Expiry, First Out.</strong> Always pick the lot with the earliest expiry date first. Green <span className="fefo-rank fefo-1 mx-1">#1</span> badges indicate lots that should be picked before any others.</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Active Lots" value={filtered.length} color="default" />
        <StatCard label="Pick First (#1)" value={pickFirstCount} color="green" icon={<Eye size={18} />} />
        <StatCard label="Expiring ≤30d" value={exp30} color="red" icon={<AlertTriangle size={18} />} />
        <StatCard label="Reserved" value={reservedCount} color="yellow" />
      </div>
      <div className="vl-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="vl-input !pl-8" placeholder="Product / SKU..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="vl-input !w-auto" value={branchF} onChange={(e) => setBranchF(e.target.value)}><option value="">All</option>{store.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select className="vl-input !w-auto" value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All Status</option><option value="pick_first">Pick First</option><option value="expiring">Expiring Soon</option><option value="reserved">Reserved</option><option value="later">Later Lot</option><option value="expired">Expired</option></select>
          <select className="vl-input !w-auto" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))}><option value={0}>All Expiry</option><option value={30}>≤30 days</option><option value={60}>≤60 days</option><option value={90}>≤90 days</option><option value={180}>≤180 days</option></select>
        </div>
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <table className="vl-table">
          <thead><tr><th>FEFO</th><th>Product</th><th>SKU</th><th>Lot #</th><th>Branch</th><th>Shelf</th><th>Expiry</th><th className="text-right">Days</th><th className="text-right">Avail</th><th className="text-right">Reserved</th><th className="text-right">On Hand</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.slice(0, 100).map(({ lot, rank, daysLeft }) => {
              const p = store.getProductById(lot.productId);
              const avail = getAvailable(lot);
              const st = getStatusBadge(rank, daysLeft, lot);
              const br = store.getBranchById(lot.branchId);
              return (
                <tr key={lot.id} style={rank === 1 ? { borderLeft: '3px solid #22c55e' } : undefined}>
                  <td><span className={`fefo-rank ${rank === 1 ? 'fefo-1' : rank === 2 ? 'fefo-2' : rank === 3 ? 'fefo-3' : 'fefo-n'}`}>#{rank}</span></td>
                  <td className="font-medium text-[12px]">{p?.name}</td>
                  <td className="font-mono text-[11px] text-slate-500">{p?.sku}</td>
                  <td className="font-mono text-[11px]">{lot.lotNumber}</td>
                  <td className="text-[11px]">{br?.name.split(' -')[0]}</td>
                  <td className="text-[11px] text-slate-500">{lot.shelfLocation}</td>
                  <td className={`text-[12px] font-medium ${daysLeft < 0 ? 'text-danger-600' : daysLeft <= 90 ? 'text-warning-600' : 'text-slate-600'}`}>{lot.expiryDate.substring(0, 10)}</td>
                  <td className={`text-right text-[12px] font-medium ${daysLeft < 0 ? 'text-danger-600' : daysLeft <= 30 ? 'text-danger-600' : daysLeft <= 90 ? 'text-warning-600' : ''}`}>{daysLeft}d</td>
                  <td className="text-right font-bold text-success-600">{avail}</td>
                  <td className="text-right">{lot.reserved > 0 ? <span className="text-warning-600 font-medium">{lot.reserved}</span> : <span className="text-slate-300">0</span>}</td>
                  <td className="text-right">{lot.onHand}</td>
                  <td><span className={`badge ${st.b}`}>{st.l}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
