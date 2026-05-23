import React from 'react';
import { useStore } from '../../store/useStore';
import { Wifi, WifiOff, RefreshCw, User } from 'lucide-react';
import { formatPHTShort } from '../../types';

export const Topbar: React.FC = () => {
  const store = useStore();
  return (
    <header className="h-[48px] bg-topbar border-b border-slate-200 flex items-center justify-between px-4 shrink-0 no-print">
      <div className="flex items-center gap-3">
        <select className="vl-input !w-auto !py-1 !text-[12px]" value={store.selectedBranchId} onChange={(e) => store.setSelectedBranch(e.target.value)}>
          <option value="all">All Locations</option>
          {store.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-4 text-[12px]">
        <button className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${store.isOnline ? 'text-success-600 hover:bg-success-50' : 'text-danger-600 hover:bg-danger-50'}`} onClick={store.toggleOnline}>
          {store.isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{store.isOnline ? 'Online' : 'Offline'}</span>
          {!store.isOnline && store.offlineQueueCount > 0 && <span className="bg-danger-100 text-danger-700 text-[10px] px-1.5 rounded-full font-bold">{store.offlineQueueCount}</span>}
        </button>
        {store.isOnline && <span className="text-slate-400 flex items-center gap-1"><RefreshCw size={11} /> {formatPHTShort(store.lastSyncedAt)}</span>}
        <div className="flex items-center gap-1.5 text-slate-600"><User size={13} /> {store.currentUser.name}</div>
      </div>
    </header>
  );
};
