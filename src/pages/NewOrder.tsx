import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader, formatCurrency } from '../components/shared/SharedComponents';

import { formatPHT, orderTypeLabels, paymentMethodLabels, nowPHT, getAvailable } from '../types';
import type { PaymentMethod, OrderType, PaymentStatus, SaleItem } from '../types';
import { Search, Plus, Trash2, AlertTriangle, ChevronRight, Printer, X } from 'lucide-react';
import { generateId } from '../data/mockData';

type CartItem = { id: string; productId: string; productName: string; sku: string; unit: string; lotId: string; lotNumber: string; expiryDate: string; quantity: number; unitPrice: number; totalPrice: number; fefoRank: number; fefoOverride: boolean; fefoOverrideReason: string; shelfLocation: string };
type Stage = 'order' | 'picklist' | 'pinkslip';

export const NewOrder: React.FC = () => {
  const store = useStore();
  const munoz = store.getMunozBranchId();
  const [stage, setStage] = useState<Stage>('order');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('walk_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [refNumber, setRefNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');
  const [createdSale, setCreatedSale] = useState<ReturnType<typeof store.createSale> | null>(null);

  // Product search
  const [prodSearch, setProdSearch] = useState('');
  const [selProduct, setSelProduct] = useState<string | null>(null);
  const [selLotId, setSelLotId] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [fefoOverrideReason, setFefoOverrideReason] = useState('');

  const filteredProds = useMemo(() => {
    if (!prodSearch || prodSearch.length < 2) return [];
    const s = prodSearch.toLowerCase();
    return store.products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)).slice(0, 8);
  }, [prodSearch, store.products]);

  const fefoLots = useMemo(() => {
    if (!selProduct) return [];
    return store.getFEFOLots(selProduct, munoz);
  }, [selProduct, store, munoz]);

  const selProd = selProduct ? store.getProductById(selProduct) : null;
  const selLot = fefoLots.find((l) => l.id === selLotId);
  const fefoRank = selLot ? fefoLots.indexOf(selLot) + 1 : 0;
  const isOverride = fefoRank > 1;

  const subtotal = cart.reduce((s, c) => s + c.totalPrice, 0);
  const total = subtotal - discount;
  const change = Math.max(0, amountPaid - total);
  const balance = Math.max(0, total - amountPaid);
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);

  const addToCart = () => {
    if (!selProd || !selLot || selQty < 1) return;
    const avail = getAvailable(selLot) - cart.filter((c) => c.lotId === selLot.id).reduce((s, c) => s + c.quantity, 0);
    if (selQty > avail) { store.addToast(`Only ${avail} available in this lot`, 'error'); return; }
    setCart((p) => [...p, { id: generateId(), productId: selProd.id, productName: selProd.name, sku: selProd.sku, unit: selProd.unit, lotId: selLot.id, lotNumber: selLot.lotNumber, expiryDate: selLot.expiryDate, quantity: selQty, unitPrice: selProd.unitPrice, totalPrice: selQty * selProd.unitPrice, fefoRank, fefoOverride: isOverride, fefoOverrideReason: isOverride ? fefoOverrideReason : '', shelfLocation: selLot.shelfLocation || '' }]);
    setProdSearch(''); setSelProduct(null); setSelLotId(''); setSelQty(1); setFefoOverrideReason('');
  };

  const removeFromCart = (id: string) => setCart((p) => p.filter((c) => c.id !== id));

  const confirmOrder = () => {
    if (cart.length === 0) { store.addToast('Cart is empty', 'error'); return; }
    const isCOD = orderType === 'cod';
    const items: SaleItem[] = cart.map((c) => ({ id: generateId(), productId: c.productId, lotId: c.lotId, lotNumber: c.lotNumber, expiryDate: c.expiryDate, quantity: c.quantity, unitPrice: c.unitPrice, totalPrice: c.totalPrice, status: 'reserved' as const, fefoRank: c.fefoRank, fefoOverride: c.fefoOverride, fefoOverrideReason: c.fefoOverrideReason, shelfLocation: c.shelfLocation }));
    const sale = store.createSale({ branchId: munoz, dateTime: nowPHT(), customerName: customerName || undefined, customerPhone: customerPhone || undefined, customerAddress: customerAddress || undefined, orderType, paymentMethod: isCOD ? 'cod' : paymentMethod, paymentStatus: isCOD ? 'unpaid' : paymentStatus, deliveryStatus: isCOD ? 'for_delivery' : orderType === 'delivery' ? 'for_delivery' : 'for_pickup', totalAmount: total, discount, subtotal, amountPaid: isCOD ? 0 : amountPaid, change: isCOD ? 0 : change, balance: isCOD ? total : balance, isCOD, referenceNumber: refNumber || undefined, createdBy: store.currentUser.id, items, notes: '', status: 'confirmed' });
    setCreatedSale(sale);
    setStage('picklist');
  };

  const confirmPickList = () => {
    if (!createdSale) return;
    if (preparedBy) store.markSalePrepared(createdSale.id, preparedBy, checkedBy);
    setStage('pinkslip');
  };

  const resetOrder = () => {
    setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerAddress('');
    setOrderType('walk_in'); setPaymentMethod('cash'); setPaymentStatus('paid');
    setRefNumber(''); setDiscount(0); setAmountPaid(0); setPreparedBy(''); setCheckedBy('');
    setCreatedSale(null); setStage('order');
  };

  const needsRef = ['gcash', 'online_banking', 'cheque', 'credit_card'].includes(paymentMethod);

  // ===== STAGE 1: ORDER FORM =====
  if (stage === 'order') return (
    <div>
      <PageHeader title="New Order / POS" subtitle="Muñoz - Main Branch" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Order details */}
        <div className="space-y-3">
          <div className="vl-card">
            <div className="vl-card-header mb-2">Order Details</div>
            <div className="space-y-2">
              <div><label className="text-[11px] font-medium text-slate-500">Customer Name</label><input className="vl-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in (optional)" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-medium text-slate-500">Order Type</label>
                  <select className="vl-input" value={orderType} onChange={(e) => { setOrderType(e.target.value as OrderType); if (e.target.value === 'cod') { setPaymentMethod('cod'); setPaymentStatus('unpaid'); } }}>
                    {Object.entries(orderTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><label className="text-[11px] font-medium text-slate-500">Payment</label>
                  <select className="vl-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} disabled={orderType === 'cod'}>
                    {Object.entries(paymentMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
              </div>
              {needsRef && <div><label className="text-[11px] font-medium text-slate-500">Reference #</label><input className="vl-input" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="Transaction reference" /></div>}
              {(orderType === 'delivery' || orderType === 'cod') && <div><label className="text-[11px] font-medium text-slate-500">Delivery Address</label><input className="vl-input" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></div>}
            </div>
          </div>
          <div className="vl-card">
            <div className="vl-card-header mb-2">Payment</div>
            <div className="space-y-2">
              <select className="vl-input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} disabled={orderType === 'cod'}>
                <option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-medium text-slate-500">Amount Paid</label><input type="number" className="vl-input" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} /></div>
                <div><label className="text-[11px] font-medium text-slate-500">Discount</label><input type="number" className="vl-input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Product search + Cart */}
        <div className="lg:col-span-2 space-y-3">
          <div className="vl-card">
            <div className="vl-card-header mb-2">Add Items (FEFO Auto-Selection)</div>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="vl-input !pl-8" placeholder="Search product / SKU..." value={prodSearch} onChange={(e) => { setProdSearch(e.target.value); setSelProduct(null); }} />
              </div>
            </div>
            {filteredProds.length > 0 && !selProduct && (
              <div className="border border-slate-200 rounded-md max-h-[160px] overflow-y-auto mb-2">
                {filteredProds.map((p) => <div key={p.id} className="px-3 py-1.5 text-[12px] cursor-pointer hover:bg-primary-50 flex justify-between" onClick={() => { setSelProduct(p.id); setProdSearch(p.name); const fl = store.getFEFOLots(p.id, munoz); if (fl.length > 0) setSelLotId(fl[0].id); }}><span className="font-medium">{p.name}</span><span className="text-slate-400 font-mono">{p.sku} · ₱{p.unitPrice}</span></div>)}
              </div>
            )}
            {selProduct && fefoLots.length > 0 && (
              <div className="bg-slate-50 rounded-md p-3 mb-2 text-[12px]">
                <div className="font-medium text-slate-700 mb-1">{selProd?.name} — Select Lot (FEFO)</div>
                <div className="space-y-1 mb-2">
                  {fefoLots.map((lot, i) => {
                    const avail = getAvailable(lot);
                    return (<label key={lot.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${selLotId === lot.id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-100'}`}>
                      <input type="radio" name="lot" checked={selLotId === lot.id} onChange={() => setSelLotId(lot.id)} />
                      <span className={`fefo-rank ${i === 0 ? 'fefo-1' : i === 1 ? 'fefo-2' : 'fefo-n'}`}>#{i + 1}</span>
                      <span className="font-mono">{lot.lotNumber}</span>
                      <span>Exp: {lot.expiryDate.substring(0, 10)}</span>
                      <span>Avail: <strong>{avail}</strong></span>
                      <span className="text-slate-400">{lot.shelfLocation}</span>
                    </label>);
                  })}
                </div>
                {isOverride && <div className="bg-warning-50 border border-warning-200 rounded p-2 mb-2 text-warning-800 flex items-start gap-1"><AlertTriangle size={13} className="shrink-0 mt-0.5" /> Earlier expiry lot exists. Picking this lot may break FEFO.
                  <input className="vl-input !text-[11px] !py-1 ml-2 flex-1" placeholder="Override reason..." value={fefoOverrideReason} onChange={(e) => setFefoOverrideReason(e.target.value)} /></div>}
                <div className="flex items-center gap-2">
                  <input type="number" className="vl-input !w-[80px]" min={1} value={selQty} onChange={(e) => setSelQty(Math.max(1, parseInt(e.target.value) || 1))} />
                  <button className="btn btn-primary btn-sm" onClick={addToCart} disabled={!selLotId || (isOverride && !fefoOverrideReason)}><Plus size={13} /> Add to Cart</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelProduct(null); setProdSearch(''); }}><X size={13} /></button>
                </div>
              </div>
            )}
            {selProduct && fefoLots.length === 0 && <div className="text-[12px] text-danger-600 p-2">No available lots at Muñoz for this product.</div>}
          </div>

          {/* Cart */}
          <div className="vl-card p-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Cart — {cart.length} item(s), {totalQty} qty</span>
            </div>
            <table className="vl-table">
              <thead><tr><th>#</th><th>Product</th><th>Lot / Exp</th><th>Shelf</th><th>FEFO</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {cart.map((c, i) => (
                  <tr key={c.id} className={c.fefoOverride ? 'bg-warning-50' : ''}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td><div className="font-medium text-[12px]">{c.productName}</div><div className="text-[11px] text-slate-400 font-mono">{c.sku} · {c.unit}</div></td>
                    <td className="font-mono text-[11px]"><div>{c.lotNumber}</div><div className="text-slate-400">{c.expiryDate.substring(0, 10)}</div></td>
                    <td className="text-[11px] text-slate-500">{c.shelfLocation}</td>
                    <td><span className={`fefo-rank ${c.fefoRank === 1 ? 'fefo-1' : c.fefoRank === 2 ? 'fefo-2' : 'fefo-n'}`}>#{c.fefoRank}</span></td>
                    <td className="text-right font-bold">{c.quantity}</td>
                    <td className="text-right text-[12px]">{formatCurrency(c.unitPrice)}</td>
                    <td className="text-right font-medium">{formatCurrency(c.totalPrice)}</td>
                    <td><button className="btn btn-sm btn-ghost text-danger-500" onClick={() => removeFromCart(c.id)}><Trash2 size={13} /></button></td>
                  </tr>
                ))}
                {cart.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-400">Add products to start an order</td></tr>}
              </tbody>
            </table>
            {cart.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-[13px]">
                <div className="flex justify-between"><span>Subtotal ({cart.length} items, {totalQty} qty)</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-danger-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between font-bold text-[15px] mt-1 pt-1 border-t border-slate-200"><span>Total</span><span>{formatCurrency(total)}</span></div>
                {amountPaid > 0 && <div className="flex justify-between text-[12px] text-slate-500"><span>Paid</span><span>{formatCurrency(amountPaid)}</span></div>}
                {change > 0 && <div className="flex justify-between text-success-600 text-[12px]"><span>Change</span><span>{formatCurrency(change)}</span></div>}
                {balance > 0 && <div className="flex justify-between text-danger-600 text-[12px]"><span>Balance Due</span><span>{formatCurrency(balance)}</span></div>}
                <button className="btn btn-primary w-full mt-3" onClick={confirmOrder}>Confirm Order → View FEFO Pick List <ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ===== STAGE 2: FEFO PICK LIST =====
  if (stage === 'picklist') return (
    <div>
      <PageHeader title="FEFO Pick List" subtitle={`Order ${createdSale?.saleNumber} — Verify before releasing`} />
      {cart.some((c) => c.fefoOverride) && <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4 text-[13px] text-warning-800 flex items-start gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" /> Some items were picked from a later lot. FEFO override reasons are noted below.</div>}
      <div className="vl-card p-0 overflow-hidden mb-4">
        <table className="vl-table">
          <thead><tr><th>FEFO</th><th>Product</th><th>SKU</th><th className="text-right">Qty to Pick</th><th>Lot #</th><th>Expiry</th><th>Shelf / Location</th><th>Status</th></tr></thead>
          <tbody>
            {cart.map((c) => (
              <tr key={c.id} className={c.fefoOverride ? 'bg-warning-50' : ''}>
                <td><span className={`fefo-rank ${c.fefoRank === 1 ? 'fefo-1' : 'fefo-n'}`}>#{c.fefoRank}</span></td>
                <td className="font-medium">{c.productName}</td>
                <td className="font-mono text-[12px] text-slate-500">{c.sku}</td>
                <td className="text-right font-bold">{c.quantity}</td>
                <td className="font-mono text-[12px]">{c.lotNumber}</td>
                <td className="text-[12px]">{c.expiryDate.substring(0, 10)}</td>
                <td className="text-[12px] text-slate-500">{c.shelfLocation}</td>
                <td>{c.fefoOverride ? <span className="badge badge-warning">Later Lot</span> : <span className="badge badge-pick-first">Pick First</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="vl-card">
        <div className="vl-card-header mb-2">Physical Pick Confirmation</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-[11px] font-medium text-slate-500">Prepared by</label><input className="vl-input" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Staff name" /></div>
          <div><label className="text-[11px] font-medium text-slate-500">Checked by</label><input className="vl-input" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Checker name" /></div>
        </div>
        <div className="flex gap-2"><button className="btn btn-outline" onClick={() => setStage('order')}>← Back to Order</button><button className="btn btn-primary" onClick={confirmPickList}>Confirm & Generate Pink Slip <ChevronRight size={14} /></button></div>
      </div>
    </div>
  );

  // ===== STAGE 3: PINK SLIP =====
  const sale = createdSale!;
  return (
    <div>
      <PageHeader title="Pink Slip Preview" subtitle={`Order ${sale.saleNumber}`} actions={<div className="flex gap-2">
        <button className="btn btn-outline btn-sm" onClick={() => setStage('picklist')}>← Back</button>
        <button className="btn btn-outline btn-sm" onClick={() => store.addToast('Printing pink slip...', 'success')}><Printer size={14} /> Print</button>
        <button className="btn btn-primary btn-sm" onClick={resetOrder}>New Order</button>
      </div>} />
      <div className="pink-slip">
        <div className="pink-slip-header">
          <div className="company-name">Vitalife Pharma & Medical Supply Inc.</div>
          <div className="company-sub">Muñoz - Main Branch</div>
        </div>
        <div className="pink-slip-meta">
          <div className="meta-left">
            <div>Order #: <strong>{sale.saleNumber}</strong></div>
            {sale.customerName && <div>Customer: {sale.customerName}</div>}
            <div>Type: {orderTypeLabels[sale.orderType]}</div>
            <div>Payment: {paymentMethodLabels[sale.paymentMethod]} ({sale.paymentStatus})</div>
          </div>
          <div className="meta-right">
            <div>{formatPHT(sale.dateTime)}</div>
            {sale.referenceNumber && <div>Ref: {sale.referenceNumber}</div>}
            {sale.isCOD && <div><strong>*** COD ***</strong></div>}
          </div>
        </div>
        <table className="pink-slip-table">
          <thead><tr><th>QTY</th><th>UNIT</th><th>ITEM</th><th>LOT #</th><th>EXPIRY</th><th className="text-right">PRICE</th><th className="text-right">AMOUNT</th></tr></thead>
          <tbody>
            {cart.map((c, i) => <tr key={i}><td>{c.quantity}</td><td>{c.unit}</td><td>{c.productName}</td><td>{c.lotNumber}</td><td>{c.expiryDate.substring(0, 7)}</td><td className="text-right">{c.unitPrice.toFixed(2)}</td><td className="text-right">{c.totalPrice.toFixed(2)}</td></tr>)}
          </tbody>
        </table>
        <div className="pink-slip-totals">
          <div className="total-row"><span>Line Items: {cart.length}</span><span>Total Qty: {totalQty}</span></div>
          <div className="total-row"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="total-row"><span>Discount</span><span>-{discount.toFixed(2)}</span></div>}
          <div className="total-row grand-total"><span>TOTAL</span><span>PHP {total.toFixed(2)}</span></div>
          {sale.amountPaid > 0 && <div className="total-row"><span>Amount Paid</span><span>{sale.amountPaid.toFixed(2)}</span></div>}
          {change > 0 && <div className="total-row"><span>Change</span><span>{change.toFixed(2)}</span></div>}
          {sale.balance > 0 && <div className="total-row"><span><strong>BALANCE DUE</strong></span><span><strong>{sale.balance.toFixed(2)}</strong></span></div>}
        </div>
        <div className="pink-slip-footer">
          <div className="pink-slip-sigs">
            <div><div className="pink-slip-sig-line">Prepared by: {preparedBy || '____________'}</div></div>
            <div><div className="pink-slip-sig-line">Checked by: {checkedBy || '____________'}</div></div>
            <div><div className="pink-slip-sig-line">Released by: ____________</div></div>
            <div><div className="pink-slip-sig-line">Received by (Customer)</div></div>
          </div>
          <div className="pink-slip-return-note">Returns accepted within 15 days with original receipt. No cash refund.</div>
        </div>
      </div>
    </div>
  );
};
