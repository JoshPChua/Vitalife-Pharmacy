import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/shared/SharedComponents';
import { Modal } from '../components/shared/Modal';
import { formatPHTShort } from '../types';
import { ArrowRight, Eye, CheckCircle, Truck } from 'lucide-react';

const statusBadge: Record<string, string> = { draft: 'badge-neutral', sent: 'badge-info', in_transit: 'badge-warning', received: 'badge-ok', cancelled: 'badge-danger' };
const nextStatus: Record<string, string> = { draft: 'sent', sent: 'in_transit', in_transit: 'received' };
const nextLabel: Record<string, string> = { draft: 'Mark as Sent', sent: 'Mark In Transit', in_transit: 'Mark Received' };

export const BranchTransfers: React.FC = () => {
  const store = useStore();
  const [viewId, setViewId] = useState<string | null>(null);
  const transfers = [...store.stockTransfers].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const viewT = viewId ? store.stockTransfers.find((t) => t.id === viewId) : null;

  return (
    <div>
      <PageHeader title="Branch Transfers" subtitle="Pagataan Warehouse → Muñoz Main Branch" />
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 text-[13px] text-primary-800 flex items-start gap-2">
        <Truck size={15} className="shrink-0 mt-0.5" /> Stock flows from <strong>Pagataan (Warehouse)</strong> to <strong>Muñoz (Sales)</strong>. Each transfer goes through: Draft → Sent → In Transit → Received.
      </div>
      <div className="vl-card p-0 overflow-hidden">
        <table className="vl-table">
          <thead><tr><th>Transfer #</th><th>Date</th><th>From</th><th>To</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {transfers.map((t) => {
              const from = store.getBranchById(t.fromBranchId);
              const to = store.getBranchById(t.toBranchId);
              const totalQty = t.items.reduce((s, i) => s + i.quantity, 0);
              return <tr key={t.id}>
                <td className="font-mono text-[12px] font-medium text-primary-600">{t.transferNumber}</td>
                <td className="text-[12px] whitespace-nowrap">{formatPHTShort(t.dateTime)}</td>
                <td className="text-[12px]">{from?.name.split(' -')[0]}</td>
                <td className="text-[12px]">{to?.name.split(' -')[0]}</td>
                <td className="text-[12px]">{t.items.length} items ({totalQty} qty)</td>
                <td><span className={`badge ${statusBadge[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                <td><div className="flex gap-1">
                  <button className="btn btn-sm btn-ghost" onClick={() => setViewId(t.id)}><Eye size={13} /> View</button>
                  {nextStatus[t.status] && <button className="btn btn-sm btn-primary" onClick={() => store.updateTransferStatus(t.id, nextStatus[t.status] as any)}>
                    {t.status === 'in_transit' ? <CheckCircle size={13} /> : <ArrowRight size={13} />} {nextLabel[t.status]}
                  </button>}
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {viewT && <Modal isOpen={!!viewT} title={`Transfer ${viewT.transferNumber}`} onClose={() => setViewId(null)} width="550px">
        <div className="space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div><strong>From:</strong> {store.getBranchById(viewT.fromBranchId)?.name}</div>
            <div><strong>To:</strong> {store.getBranchById(viewT.toBranchId)?.name}</div>
            <div><strong>Date:</strong> {formatPHTShort(viewT.dateTime)}</div>
            <div><strong>Status:</strong> <span className={`badge ${statusBadge[viewT.status]}`}>{viewT.status.replace('_', ' ')}</span></div>
          </div>
          <table className="vl-table">
            <thead><tr><th>Product</th><th>Lot #</th><th>Expiry</th><th className="text-right">Qty</th></tr></thead>
            <tbody>
              {viewT.items.map((i) => {
                const p = store.getProductById(i.productId);
                return <tr key={i.id}><td className="text-[12px]">{p?.name}<div className="text-[11px] text-slate-400 font-mono">{p?.sku}</div></td><td className="font-mono text-[11px]">{i.lotNumber}</td><td className="text-[12px]">{i.expiryDate.substring(0, 10)}</td><td className="text-right font-bold">{i.quantity}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Modal>}
    </div>
  );
};
