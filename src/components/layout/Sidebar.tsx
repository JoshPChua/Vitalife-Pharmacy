import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { LayoutDashboard, Package, BookOpen, ShoppingCart, Clock, FileText, ClipboardList, ArrowLeftRight, BarChart3, Settings, Wifi, WifiOff, Eye } from 'lucide-react';

const navItems = [
  { to: '/',                   label: 'Dashboard',            icon: LayoutDashboard },
  { to: '/new-order',          label: 'New Order / POS',      icon: ShoppingCart },
  { to: '/sold-not-released',  label: 'Sold Not Released',    icon: Clock },
  { to: '/fefo-monitoring',    label: 'FEFO Monitoring',      icon: Eye },
  { to: '/inventory',          label: 'Inventory',            icon: Package },
  { to: '/movement-ledger',    label: 'Movement Ledger',      icon: BookOpen },
  { to: '/daily-report',       label: 'Daily Report',         icon: FileText },
  { to: '/stock-count',        label: 'Stock Count',          icon: ClipboardList },
  { to: '/transfers',          label: 'Transfers',            icon: ArrowLeftRight },
  { to: '/reports',            label: 'Reports',              icon: BarChart3 },
  { to: '/settings',           label: 'Settings',             icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { isOnline, getSoldNotReleasedItems } = useStore();
  const snrCount = getSoldNotReleasedItems().length;

  return (
    <aside className="w-[220px] h-screen bg-sidebar text-white flex flex-col shrink-0 no-print">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="text-[13px] font-bold tracking-wide text-white leading-tight">VITALIFE</div>
        <div className="text-[9px] text-slate-400 tracking-widest uppercase">Pharma & Medical Supply</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] mb-0.5 transition-colors ${isActive ? 'bg-sidebar-active text-white font-medium' : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'}`}>
            <item.icon size={15} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/sold-not-released' && snrCount > 0 && (
              <span className="bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{snrCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Connection status */}
      <div className="px-3 py-3 border-t border-slate-700">
        <div className={`flex items-center gap-2 text-[11px] ${isOnline ? 'text-success-400' : 'text-danger-400'}`}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isOnline ? 'Online — Synced' : 'Offline Mode'}</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Muñoz - Main Branch</div>
      </div>
    </aside>
  );
};
