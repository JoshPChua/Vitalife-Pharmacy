# Vitalife Pharmacy Stock Accountability System

> Cloud-Based + Desktop App Hybrid — Pharmacy inventory, sales, and stock release tracking

---

## 🎯 What Problem Does This Solve?

Vitalife Pharmacy operates 2 branches using manual workflows (Excel, paper records, FoxPro-era software, and AnyDesk for remote coordination). A critical recurring issue:

**Items are sold and paid for, but the physical boxes remain on the shelf.**

The daily sales report deducts these items from stock, but the shelf still shows them — causing growing discrepancies between system numbers and physical counts. Staff lose trust in the system, managers waste hours reconciling, and stock accuracy deteriorates.

### The Core Concept: Sold Not Yet Released

This system introduces a **two-step stock accountability model**:

1. **Sale Confirmed** → Stock moves from "Available" to "Reserved (Sold, Still on Shelf)"
2. **Physically Released** → Stock is removed from "On Hand" when items are actually handed out

This means:
- **On Hand** = physical quantity expected in branch
- **Reserved** = already sold/paid, but still physically on the shelf
- **Available** = On Hand − Reserved (what can actually be sold to new customers)
- **Released** = physically removed from shelf (the sale is complete)

### Ledger-Based Inventory

Stock is **not modified by direct quantity edits**. Every change creates an immutable movement entry:

| Movement Type | Description |
|---|---|
| Purchase Received | New stock from supplier |
| Sale Reserved | Sold but still on shelf |
| Sale Released | Physically handed to customer |
| Sale Cancelled | Returned to available stock |
| Transfer Out | Shipped to another branch |
| Transfer In | Received from another branch |
| Adjustment In/Out | Manual corrections |
| Damaged / Expired | Write-offs |
| Reconciliation | Stock count corrections |

Current stock values are **derived from the sum of all movements** — providing a complete audit trail.

### FEFO (First Expiry, First Out)

When creating a sale, the system automatically suggests lots with the **earliest expiry date first**, reducing waste from expired stock.

---

## 🚀 How to Run the Prototype

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser (default: http://localhost:5173)
```

### Requirements
- Node.js 18+
- npm 9+

---

## 📱 Screens

| # | Screen | Description |
|---|---|---|
| 1 | **Dashboard** | Sales, stock alerts, low stock, expiring, sold-not-released, offline queue |
| 2 | **Inventory** | Lot-based table with filters, adjust stock, view detail |
| 3 | **Movement Ledger** | All inventory events — the audit trail |
| 4 | **New Sale** | POS-like form with FEFO, payment status, release slip |
| 5 | **Sold Not Yet Released** | Key screen — items sold but still on shelf |
| 6 | **Daily Sales Report** | Sales vs released reconciliation |
| 7 | **Stock Count** | Physical count vs system, resolve discrepancies |
| 8 | **Branch Transfers** | Draft → Sent → In Transit → Received |
| 9 | **Reports** | 8 report types: sales, valuation, low stock, expiring, etc. |
| 10 | **Settings** | Sync/offline management, branches, users, print, backup |

---

## 🏗️ Recommended Production Architecture

### Why Cloud-Based + Desktop App Hybrid?

Pharmacy staff are accustomed to traditional Windows desktop software. The system should feel like a serious business application — fast, local, reliable — while leveraging cloud infrastructure for multi-branch sync, backups, and remote monitoring.

### Production Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **Next.js App Router** | React framework with SSR/SSG, API routes |
| Desktop Wrapper | **Electron** | Native Windows desktop app with system tray, printing, barcode scanner |
| UI Components | **shadcn/ui + Tailwind CSS** | Consistent, accessible, production-grade UI |
| Backend | **Supabase** | PostgreSQL database, auth, real-time subscriptions, storage |
| ORM | **Drizzle ORM** | Type-safe, lightweight SQL access |
| Offline Cache | **SQLite (via better-sqlite3)** or **IndexedDB** | Local data persistence inside Electron |
| Type Safety | **TypeScript** | End-to-end type safety |
| Auth | **Supabase Auth** | Email/password, role-based access (admin, manager, staff) |

### Offline Sync Strategy

1. **Local-first**: All reads come from local SQLite cache
2. **Write-through**: Writes go to local DB immediately, then queue for cloud sync
3. **Background sync**: When online, queued transactions push to Supabase
4. **Conflict resolution**: Last-write-wins for simple fields; manager review for stock conflicts
5. **Heartbeat**: Connection status checked every 30 seconds

### Security & Compliance

- Role-based access control (RBAC)
- Audit logs on all stock movements (immutable)
- Daily automated backups to Supabase storage
- Data encryption in transit (HTTPS) and at rest

---

## 📋 Implementation Phases

### Phase 1: Clickable Prototype ← **Current**
- [x] React + TypeScript + Vite + Tailwind
- [x] All 10 screens with mock data
- [x] Clickable workflows (sale → reserve → release)
- [x] Ledger-based stock model
- [x] FEFO lot selection
- [x] Offline/sync UI prototyped

### Phase 2: Functional Local MVP
- [ ] SQLite local persistence (replace in-memory state)
- [ ] Barcode input support
- [ ] Receipt and release slip printing (thermal printer)
- [ ] Product and lot CRUD
- [ ] User login screen

### Phase 3: Cloud Backend
- [ ] Supabase PostgreSQL schema (Drizzle migrations)
- [ ] Auth integration (Supabase Auth)
- [ ] Real-time sync between branches
- [ ] Server-side validation and business rules
- [ ] Role-based access enforcement

### Phase 4: Desktop Packaging
- [ ] Electron wrapper
- [ ] System tray + auto-start
- [ ] Native printing (ESC/POS for thermal)
- [ ] Barcode scanner (HID input)
- [ ] Auto-update (electron-updater)

### Phase 5: Offline & Sync
- [ ] SQLite write-ahead queue
- [ ] Background sync worker
- [ ] Conflict detection and manager review
- [ ] Offline indicators with queue management
- [ ] Connection recovery and retry logic

### Phase 6: Production Hardening
- [ ] Comprehensive audit logs
- [ ] Daily automated backups
- [ ] PDF report generation
- [ ] Email alerts (low stock, expiring, sync failures)
- [ ] Performance monitoring
- [ ] Deployment pipeline (CI/CD)

---

## 📦 Current Prototype Tech

- **React 19** + TypeScript
- **Vite 6** (dev server & bundler)
- **Tailwind CSS v4** (utility-first styling)
- **React Router v6** (client-side routing)
- **Recharts** (dashboard charts)
- **Lucide React** (icon library)
- **date-fns** (date formatting)
- In-memory mock data (no backend)

---

## 📄 License

Proprietary — Vitalife Pharmacy internal use only.
