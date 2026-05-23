import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useStore } from '../../store/useStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export const Layout: React.FC = () => {
  const { toasts, removeToast } = useStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen transition-all duration-200">
        <Topbar />
        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => {
            const Icon = toastIcons[t.type];
            return (
              <div key={t.id} className={`toast toast-${t.type}`}>
                <Icon size={16} />
                <span>{t.message}</span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="ml-2 hover:opacity-70 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
