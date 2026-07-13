import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AppLayout } from './layout/AppLayout';
import { CommercialPage } from './pages/commercial/CommercialPage';
import { CopilotPage } from './pages/copilot/CopilotPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancePage } from './pages/finance/FinancePage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { SalesPage } from './pages/sales/SalesPage';
import { StockPage } from './pages/stock/StockPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/commercial" element={<CommercialPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/copilot" element={<CopilotPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
