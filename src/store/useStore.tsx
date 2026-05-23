import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Branch, Category, Product, User, Lot, Sale, SaleItem, StockTransfer, StockMovement, Toast, BranchFilter, TransferStatus } from '../types';
import { branches as mockBranches, categories as mockCategories, products as mockProducts, users as mockUsers, lots as mockLots, sales as mockSales, stockTransfers as mockTransfers, stockMovements as mockMovements, generateId } from '../data/mockData';
import { nowPHT } from '../types';

interface StoreContextType {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  users: User[];
  lots: Lot[];
  sales: Sale[];
  stockTransfers: StockTransfer[];
  stockMovements: StockMovement[];
  currentUser: User;
  selectedBranchId: BranchFilter;
  toasts: Toast[];
  isOnline: boolean;
  offlineQueueCount: number;
  lastSyncedAt: string;
  setSelectedBranch: (branchId: BranchFilter) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  toggleOnline: () => void;
  createSale: (sale: Omit<Sale, 'id' | 'saleNumber'>) => Sale;
  markItemReleased: (saleId: string, itemId: string, releasedBy?: string) => void;
  markAllReleased: (saleId: string) => void;
  cancelSaleItem: (saleId: string, itemId: string) => void;
  markSalePrepared: (saleId: string, preparedBy: string, checkedBy: string) => void;
  createTransfer: (transfer: Omit<StockTransfer, 'id' | 'transferNumber'>) => StockTransfer;
  updateTransferStatus: (transferId: string, status: TransferStatus) => void;
  adjustStock: (lotId: string, adjustment: number, reason: string) => void;
  getProductById: (id: string) => Product | undefined;
  getLotsByProduct: (productId: string, branchId?: string) => Lot[];
  getCategoryById: (id: string) => Category | undefined;
  getBranchById: (id: string) => Branch | undefined;
  getUserById: (id: string) => User | undefined;
  getSoldNotReleasedItems: () => Array<{ sale: Sale; item: SaleItem; product: Product; lot: Lot; ageDays: number }>;
  getLowStockLots: (branchId?: string) => Lot[];
  getExpiringLots: (days: number, branchId?: string) => Lot[];
  getTodaysSales: (branchId?: string) => Sale[];
  getDailySalesTotal: (branchId?: string) => number;
  getFEFOLots: (productId: string, branchId: string) => Lot[];
  getMunozBranchId: () => string;
  getPagataanBranchId: () => string;
}

const StoreContext = createContext<StoreContextType | null>(null);

let saleCounter = 100;
let transferCounter = 100;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [branches] = useState<Branch[]>(mockBranches);
  const [categories] = useState<Category[]>(mockCategories);
  const [products] = useState<Product[]>(mockProducts);
  const [users] = useState<User[]>(mockUsers);
  const [lots, setLots] = useState<Lot[]>(mockLots);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(mockTransfers);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(mockMovements);
  const [currentUser] = useState<User>(mockUsers[2]); // John Reyes at Munoz
  const [selectedBranchId, setSelectedBranchId] = useState<BranchFilter>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount] = useState(3);
  const [lastSyncedAt] = useState('2026-05-23T22:45:00+08:00');

  const getMunozBranchId = () => 'branch-munoz';
  const getPagataanBranchId = () => 'branch-pagataan';

  const setSelectedBranch = (branchId: BranchFilter) => setSelectedBranchId(branchId);

  const addToast = (message: string, type: Toast['type']) => {
    const id = generateId();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));
  const toggleOnline = () => setIsOnline((p) => !p);

  const createSale = (saleData: Omit<Sale, 'id' | 'saleNumber'>): Sale => {
    saleCounter++;
    const saleNumber = `SL-2026-${String(saleCounter).padStart(4, '0')}`;
    const saleId = generateId();
    const sale: Sale = { ...saleData, id: saleId, saleNumber };
    setSales((p) => [...p, sale]);
    sale.items.forEach((item) => {
      if (item.status === 'reserved') {
        setLots((p) => p.map((l) => l.id === item.lotId ? { ...l, reserved: l.reserved + item.quantity } : l));
        const mov: StockMovement = { id: generateId(), lotId: item.lotId, productId: item.productId, branchId: sale.branchId, type: 'sale_reserved', quantity: item.quantity, dateTime: nowPHT(), referenceId: saleId, referenceNumber: saleNumber, createdBy: sale.createdBy, notes: `Reserved for ${saleNumber}` };
        setStockMovements((p) => [...p, mov]);
      }
    });
    addToast(`Order ${saleNumber} created`, 'success');
    return sale;
  };

  const markItemReleased = (saleId: string, itemId: string, releasedBy?: string) => {
    const sale = sales.find((s) => s.id === saleId);
    const item = sale?.items.find((i) => i.id === itemId);
    if (!sale || !item) return;
    const releaser = releasedBy || currentUser.name;
    setSales((p) => p.map((s) => {
      if (s.id !== saleId) return s;
      const updatedItems = s.items.map((i) => i.id === itemId ? { ...i, status: 'released' as const, releasedAt: nowPHT(), releasedBy: releaser } : i);
      const allDone = updatedItems.every((i) => i.status === 'released' || i.status === 'cancelled');
      return { ...s, items: updatedItems, status: allDone ? 'released' as const : 'partially_released' as const };
    }));
    setLots((p) => p.map((l) => l.id === item.lotId ? { ...l, reserved: l.reserved - item.quantity, onHand: l.onHand - item.quantity } : l));
    const mov: StockMovement = { id: generateId(), lotId: item.lotId, productId: item.productId, branchId: sale.branchId, type: 'sale_released', quantity: item.quantity, dateTime: nowPHT(), referenceId: sale.id, referenceNumber: sale.saleNumber, createdBy: currentUser.id, notes: `Released by ${releaser}` };
    setStockMovements((p) => [...p, mov]);
    addToast('Item physically released from shelf', 'success');
  };

  const markAllReleased = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    sale.items.filter((i) => i.status === 'reserved').forEach((i) => markItemReleased(saleId, i.id));
  };

  const cancelSaleItem = (saleId: string, itemId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    const item = sale?.items.find((i) => i.id === itemId);
    if (!sale || !item) return;
    setSales((p) => p.map((s) => s.id !== saleId ? s : { ...s, items: s.items.map((i) => i.id === itemId ? { ...i, status: 'cancelled' as const } : i) }));
    setLots((p) => p.map((l) => l.id === item.lotId ? { ...l, reserved: l.reserved - item.quantity } : l));
    const mov: StockMovement = { id: generateId(), lotId: item.lotId, productId: item.productId, branchId: sale.branchId, type: 'sale_cancelled', quantity: item.quantity, dateTime: nowPHT(), referenceId: sale.id, referenceNumber: sale.saleNumber, createdBy: currentUser.id, notes: `Cancelled — returned to available` };
    setStockMovements((p) => [...p, mov]);
    addToast('Item returned to available stock', 'info');
  };

  const markSalePrepared = (saleId: string, preparedBy: string, checkedBy: string) => {
    setSales((p) => p.map((s) => s.id === saleId ? { ...s, preparedBy, checkedBy } : s));
    addToast('Order marked as prepared', 'success');
  };

  const createTransfer = (data: Omit<StockTransfer, 'id' | 'transferNumber'>): StockTransfer => {
    transferCounter++;
    const transfer: StockTransfer = { ...data, id: generateId(), transferNumber: `TR-2026-${String(transferCounter).padStart(4, '0')}` };
    setStockTransfers((p) => [...p, transfer]);
    addToast(`Transfer ${transfer.transferNumber} created`, 'success');
    return transfer;
  };

  const updateTransferStatus = (transferId: string, status: TransferStatus) => {
    const transfer = stockTransfers.find((t) => t.id === transferId);
    if (!transfer) return;
    setStockTransfers((p) => p.map((t) => t.id === transferId ? { ...t, status, ...(status === 'received' ? { receivedBy: currentUser.id, receivedAt: nowPHT() } : {}) } : t));
    if (status === 'in_transit') {
      transfer.items.forEach((item) => {
        setLots((p) => p.map((l) => l.id === item.lotId && l.branchId === transfer.fromBranchId ? { ...l, onHand: l.onHand - item.quantity } : l));
        setStockMovements((p) => [...p, { id: generateId(), lotId: item.lotId, productId: item.productId, branchId: transfer.fromBranchId, type: 'transfer_out', quantity: item.quantity, dateTime: nowPHT(), referenceId: transfer.id, referenceNumber: transfer.transferNumber, createdBy: currentUser.id, notes: `Sent to ${getBranchById(transfer.toBranchId)?.name}` }]);
      });
    } else if (status === 'received') {
      transfer.items.forEach((item) => {
        setLots((p) => p.map((l) => l.id === item.lotId && l.branchId === transfer.toBranchId ? { ...l, onHand: l.onHand + item.quantity, inTransit: Math.max(0, l.inTransit - item.quantity) } : l));
        setStockMovements((p) => [...p, { id: generateId(), lotId: item.lotId, productId: item.productId, branchId: transfer.toBranchId, type: 'transfer_in', quantity: item.quantity, dateTime: nowPHT(), referenceId: transfer.id, referenceNumber: transfer.transferNumber, createdBy: currentUser.id, notes: `Received from ${getBranchById(transfer.fromBranchId)?.name}` }]);
      });
    }
    addToast(`Transfer updated to ${status.replace('_', ' ')}`, 'success');
  };

  const adjustStock = (lotId: string, adjustment: number, reason: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;
    setLots((p) => p.map((l) => l.id === lotId ? { ...l, onHand: l.onHand + adjustment } : l));
    setStockMovements((p) => [...p, { id: generateId(), lotId, productId: lot.productId, branchId: lot.branchId, type: adjustment > 0 ? 'adjustment_in' : 'adjustment_out', quantity: adjustment, dateTime: nowPHT(), createdBy: currentUser.id, notes: reason }]);
    addToast(`Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`, 'success');
  };

  const getProductById = (id: string) => products.find((p) => p.id === id);
  const getLotsByProduct = (productId: string, branchId?: string) => lots.filter((l) => l.productId === productId && (!branchId || l.branchId === branchId));
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getBranchById = (id: string) => branches.find((b) => b.id === id);
  const getUserById = (id: string) => users.find((u) => u.id === id);

  // FEFO: return lots sorted by expiry (earliest first) with available > 0
  const getFEFOLots = (productId: string, branchId: string) => {
    return lots
      .filter((l) => l.productId === productId && l.branchId === branchId && (l.onHand - l.reserved) > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  };

  const getSoldNotReleasedItems = () => {
    const results: Array<{ sale: Sale; item: SaleItem; product: Product; lot: Lot; ageDays: number }> = [];
    sales.forEach((sale) => {
      if (sale.status === 'cancelled' || sale.status === 'draft') return;
      sale.items.filter((i) => i.status === 'reserved').forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const lot = lots.find((l) => l.id === item.lotId);
        if (product && lot) {
          const ageDays = Math.floor((Date.now() - new Date(sale.dateTime).getTime()) / 86400000);
          results.push({ sale, item, product, lot, ageDays });
        }
      });
    });
    return results;
  };

  const getLowStockLots = (branchId?: string) => lots.filter((l) => {
    if (branchId && l.branchId !== branchId) return false;
    const p = products.find((pr) => pr.id === l.productId);
    return p ? l.onHand - l.reserved < p.reorderLevel : false;
  });

  const getExpiringLots = (days: number, branchId?: string) => {
    const cutoff = new Date(Date.now() + days * 86400000);
    const now = new Date();
    return lots.filter((l) => {
      if (branchId && l.branchId !== branchId) return false;
      const exp = new Date(l.expiryDate);
      return exp <= cutoff && exp >= now;
    });
  };

  const getTodaysSales = (branchId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter((s) => s.dateTime.split('T')[0] === today && (!branchId || s.branchId === branchId) && s.status !== 'cancelled' && s.status !== 'draft');
  };

  const getDailySalesTotal = (branchId?: string) => getTodaysSales(branchId).reduce((t, s) => t + s.totalAmount, 0);

  const value: StoreContextType = {
    branches, categories, products, users, lots, sales, stockTransfers, stockMovements,
    currentUser, selectedBranchId, toasts, isOnline, offlineQueueCount, lastSyncedAt,
    setSelectedBranch, addToast, removeToast, toggleOnline, createSale,
    markItemReleased, markAllReleased, cancelSaleItem, markSalePrepared,
    createTransfer, updateTransferStatus, adjustStock,
    getProductById, getLotsByProduct, getCategoryById, getBranchById, getUserById,
    getSoldNotReleasedItems, getLowStockLots, getExpiringLots, getTodaysSales, getDailySalesTotal,
    getFEFOLots, getMunozBranchId, getPagataanBranchId,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
