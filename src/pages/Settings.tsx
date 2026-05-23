import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/shared/SharedComponents';
import { formatPHTShort } from '../types';
import { Building2, Users, Tag, Database, Wifi, WifiOff, RefreshCw, Clock, Upload, Download } from 'lucide-react';

type Tab = 'sync' | 'branches' | 'users' | 'categories' | 'reorder' | 'backup';

export const SettingsPage: React.FC = () => {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('sync');
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'sync', label: 'Sync & Offline', icon: Wifi },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'backup', label: 'Backup & Export', icon: Database },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" />
      <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">{tabs.map((t) => <button key={t.id} className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md transition-colors ${tab === t.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setTab(t.id)}><t.icon size={14} />{t.label}</button>)}</div>

      {tab === 'sync' && <div className="vl-card space-y-4">
        <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${store.isOnline ? 'bg-success-500' : 'bg-danger-500'}`} /><div><div className="font-medium text-[14px]">{store.isOnline ? 'Online — Connected' : 'Offline Mode'}</div><div className="text-[12px] text-slate-400">Last synced: {formatPHTShort(store.lastSyncedAt)}</div></div><button className="btn btn-sm btn-outline ml-auto" onClick={store.toggleOnline}>{store.isOnline ? <><WifiOff size={13} /> Go Offline</> : <><Wifi size={13} /> Go Online</>}</button></div>
        <div className="grid grid-cols-3 gap-3"><div className="bg-slate-50 p-3 rounded text-center"><Clock size={16} className="mx-auto text-slate-400 mb-1" /><div className="text-[18px] font-bold">{store.offlineQueueCount}</div><div className="text-[11px] text-slate-500">Queued Transactions</div></div><div className="bg-slate-50 p-3 rounded text-center"><RefreshCw size={16} className="mx-auto text-slate-400 mb-1" /><div className="text-[18px] font-bold">Auto</div><div className="text-[11px] text-slate-500">Sync Mode</div></div><div className="bg-slate-50 p-3 rounded text-center"><Database size={16} className="mx-auto text-slate-400 mb-1" /><div className="text-[18px] font-bold">SQLite</div><div className="text-[11px] text-slate-500">Local Cache</div></div></div>
      </div>}

      {tab === 'branches' && <div className="vl-card p-0 overflow-hidden"><table className="vl-table"><thead><tr><th>Branch</th><th>Type</th><th>Address</th><th>Phone</th><th>Role</th></tr></thead><tbody>
        {store.branches.map((b) => <tr key={b.id}><td className="font-medium">{b.name}</td><td><span className={`badge ${b.type === 'sales' ? 'badge-ok' : 'badge-info'}`}>{b.type === 'sales' ? 'Sales Branch' : 'Warehouse'}</span></td><td className="text-[12px] text-slate-500">{b.address}</td><td className="text-[12px]">{b.phone}</td><td className="text-[12px] text-slate-500">{b.type === 'sales' ? 'POS, Sales, Release' : 'Warehouse, Purchasing, Management'}</td></tr>)}
      </tbody></table></div>}

      {tab === 'users' && <div className="vl-card p-0 overflow-hidden"><table className="vl-table"><thead><tr><th>Name</th><th>Role</th><th>Branch</th></tr></thead><tbody>
        {store.users.map((u) => <tr key={u.id}><td className="font-medium">{u.name}</td><td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'manager' ? 'badge-warning' : 'badge-neutral'}`}>{u.role}</span></td><td className="text-[12px]">{store.getBranchById(u.branchId)?.name}</td></tr>)}
      </tbody></table></div>}

      {tab === 'categories' && <div className="vl-card p-0 overflow-hidden"><table className="vl-table"><thead><tr><th>#</th><th>Category</th><th className="text-right">Products</th></tr></thead><tbody>
        {store.categories.map((c, i) => <tr key={c.id}><td className="text-slate-400">{i + 1}</td><td className="font-medium">{c.name}</td><td className="text-right">{store.products.filter((p) => p.categoryId === c.id).length}</td></tr>)}
      </tbody></table></div>}

      {tab === 'backup' && <div className="vl-card space-y-3">
        <div className="flex gap-2"><button className="btn btn-outline" onClick={() => store.addToast('Database exported', 'success')}><Download size={14} /> Export Full Database</button><button className="btn btn-outline" onClick={() => store.addToast('Data imported', 'success')}><Upload size={14} /> Import Data</button></div>
        <div className="text-[12px] text-slate-400">Production: Supabase PostgreSQL with Drizzle ORM. Local: SQLite/IndexedDB cache via Electron.</div>
      </div>}
    </div>
  );
};
