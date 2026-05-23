// ===== CORE TYPES FOR VITALIFE PHARMACY STOCK SYSTEM =====

export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: 'sales' | 'warehouse';
};

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: string; // e.g. "BX 100s", "BTL 60s", "PC"
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  description?: string;
};

export type Lot = {
  id: string;
  productId: string;
  lotNumber: string;
  expiryDate: string;
  branchId: string;
  onHand: number;
  reserved: number;
  damaged: number;
  inTransit: number;
  shelfLocation?: string; // e.g. "A1-03", "W2-R5"
};

export function getAvailable(lot: Lot): number {
  return lot.onHand - lot.reserved;
}

export type PaymentMethod = 'cash' | 'gcash' | 'online_banking' | 'cheque' | 'credit_card' | 'cod';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type OrderType = 'walk_in' | 'bulk_order' | 'cod' | 'delivery' | 'pickup';
export type DeliveryStatus = 'for_pickup' | 'for_delivery' | 'delivered' | 'cancelled';
export type SaleStatus = 'draft' | 'confirmed' | 'partially_released' | 'released' | 'cancelled';
export type SaleItemStatus = 'reserved' | 'released' | 'cancelled';

export type Sale = {
  id: string;
  saleNumber: string;
  branchId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  dateTime: string; // ISO string in PHT
  items: SaleItem[];
  status: SaleStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  totalAmount: number;
  discount: number;
  subtotal: number;
  amountPaid: number;
  change: number;
  balance: number;
  referenceNumber?: string; // for online banking / GCash / cheque / card
  isCOD: boolean;
  preparedBy?: string;
  checkedBy?: string;
  releasedBy?: string;
  notes?: string;
  createdBy: string;
};

export type SaleItem = {
  id: string;
  productId: string;
  lotId: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: SaleItemStatus;
  fefoRank: number; // 1 = earliest expiry lot
  fefoOverride?: boolean;
  fefoOverrideReason?: string;
  shelfLocation?: string;
  releasedAt?: string;
  releasedBy?: string;
  pickedQuantity?: number;
  pickedBy?: string;
  checkedBy?: string;
};

export type TransferStatus = 'draft' | 'sent' | 'in_transit' | 'received' | 'cancelled';

export type StockTransfer = {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  dateTime: string;
  items: TransferItem[];
  status: TransferStatus;
  notes?: string;
  createdBy: string;
  receivedBy?: string;
  receivedAt?: string;
};

export type TransferItem = {
  id: string;
  productId: string;
  lotId: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
};

export type StockMovementType =
  | 'purchase_received' | 'sale_reserved' | 'sale_released' | 'sale_cancelled'
  | 'adjustment_in' | 'adjustment_out' | 'transfer_out' | 'transfer_in'
  | 'damaged' | 'expired' | 'reconciliation';

export type StockMovement = {
  id: string;
  productId: string;
  lotId: string;
  branchId: string;
  type: StockMovementType;
  quantity: number;
  referenceId?: string;
  referenceNumber?: string;
  dateTime: string;
  notes?: string;
  createdBy: string;
};

export type UserRole = 'admin' | 'manager' | 'staff';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  branchId: string;
};

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

export type BranchFilter = 'all' | string;

// Labels
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash', gcash: 'GCash', online_banking: 'Online Banking',
  cheque: 'Cheque', credit_card: 'Credit Card', cod: 'Cash on Delivery',
};
export const orderTypeLabels: Record<OrderType, string> = {
  walk_in: 'Walk-in', bulk_order: 'Bulk Order', cod: 'COD',
  delivery: 'Delivery', pickup: 'Pickup',
};
export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  for_pickup: 'For Pickup', for_delivery: 'For Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

// PHT formatting
export function formatPHT(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  }) + ' PHT';
}

export function formatPHTShort(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

export function nowPHT(): string {
  return new Date().toISOString();
}
