import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/useStore';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { ProductDetail } from './pages/ProductDetail';
import { MovementLedger } from './pages/MovementLedger';
import { NewOrder } from './pages/NewOrder';
import { SoldNotReleased } from './pages/SoldNotReleased';
import { DailyReport } from './pages/DailyReport';
import { StockCountPage } from './pages/StockCount';
import { BranchTransfers } from './pages/BranchTransfers';
import { FEFOMonitoring } from './pages/FEFOMonitoring';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/:productId" element={<ProductDetail />} />
            <Route path="/movement-ledger" element={<MovementLedger />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/sold-not-released" element={<SoldNotReleased />} />
            <Route path="/daily-report" element={<DailyReport />} />
            <Route path="/stock-count" element={<StockCountPage />} />
            <Route path="/transfers" element={<BranchTransfers />} />
            <Route path="/fefo-monitoring" element={<FEFOMonitoring />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
