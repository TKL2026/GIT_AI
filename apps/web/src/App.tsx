import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './admin/AdminAuthContext';
import { AdminLayout } from './admin/AdminLayout';
import { AdminProtectedRoute } from './admin/AdminProtectedRoute';
import { AdminAuditLogsPage } from './admin/pages/AdminAuditLogsPage';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminOrganizationDetailPage } from './admin/pages/AdminOrganizationDetailPage';
import { AdminOrganizationsPage } from './admin/pages/AdminOrganizationsPage';
import { AdminPaymentsPage } from './admin/pages/AdminPaymentsPage';
import { AdminSubscriptionsPage } from './admin/pages/AdminSubscriptionsPage';
import { AdminSystemPage } from './admin/pages/AdminSystemPage';
import { AdminUsersPage } from './admin/pages/AdminUsersPage';
import { AuthProvider } from './auth/AuthContext';
import { BILLING_ROLES, FINANCE_ROLES } from './auth/roles';
import { AppLayout } from './layout/AppLayout';
import { AboutPage } from './pages/AboutPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { BillingPage } from './pages/billing/BillingPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CommercialPage } from './pages/commercial/CommercialPage';
import { CopilotPage } from './pages/copilot/CopilotPage';
import { DashboardPage } from './pages/DashboardPage';
import { DemoLoginPage } from './pages/DemoLoginPage';
import { FinancePage } from './pages/finance/FinancePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { ActivityStepPage } from './pages/onboarding/ActivityStepPage';
import { CompanyStepPage } from './pages/onboarding/CompanyStepPage';
import { ProductsStepPage } from './pages/onboarding/ProductsStepPage';
import { ReviewStepPage } from './pages/onboarding/ReviewStepPage';
import { TeamStepPage } from './pages/onboarding/TeamStepPage';
import { WelcomePage } from './pages/onboarding/WelcomePage';
import { ContactPage } from './pages/legal/ContactPage';
import { LegalNoticePage } from './pages/legal/LegalNoticePage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { ActualitesPage } from './marketing/pages/ActualitesPage';
import { CopiloteIaPage } from './marketing/pages/CopiloteIaPage';
import { FonctionnalitesPage } from './marketing/pages/FonctionnalitesPage';
import { GestionEntreprisePage } from './marketing/pages/GestionEntreprisePage';
import { GestionStockPage } from './marketing/pages/GestionStockPage';
import { WhatsAppPage } from './marketing/pages/WhatsAppPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { PurchaseOrderDetailPage } from './pages/purchases/PurchaseOrderDetailPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { PricingPage } from './pages/PricingPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SaleDetailPage } from './pages/sales/SaleDetailPage';
import { SalesPage } from './pages/sales/SalesPage';
import { StockPage } from './pages/stock/StockPage';
import { SubscriptionExpiredPage } from './pages/SubscriptionExpiredPage';
import { UsersPage } from './pages/UsersPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { HomeRoute } from './routes/HomeRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleGuard } from './routes/RoleGuard';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<DemoLoginPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/legal" element={<LegalNoticePage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* /a-propos est l'URL SEO canonique (cohérente avec les autres routes
            publiques en français) ; /about reste fonctionnelle mais redirige
            pour éviter un doublon de contenu indexable. */}
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/about" element={<Navigate to="/a-propos" replace />} />
        <Route path="/fonctionnalites" element={<FonctionnalitesPage />} />
        <Route path="/gestion-stock" element={<GestionStockPage />} />
        <Route path="/gestion-entreprise" element={<GestionEntreprisePage />} />
        <Route path="/copilote-ia" element={<CopiloteIaPage />} />
        <Route path="/whatsapp" element={<WhatsAppPage />} />
        <Route path="/actualites" element={<ActualitesPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Assistant d'inscription : authentifié dès l'écran Compte, mais
            sans le chrome applicatif (AppLayout) — l'utilisateur n'est pas
            encore "dans" l'application. */}
        <Route element={<ProtectedRoute>{<Outlet />}</ProtectedRoute>}>
          <Route path="/onboarding/company" element={<CompanyStepPage />} />
          <Route path="/onboarding/activity" element={<ActivityStepPage />} />
          <Route path="/onboarding/products" element={<ProductsStepPage />} />
          <Route path="/onboarding/team" element={<TeamStepPage />} />
          <Route path="/onboarding/review" element={<ReviewStepPage />} />
          <Route path="/onboarding/welcome" element={<WelcomePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/commercial" element={<CommercialPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/:id" element={<PurchaseOrderDetailPage />} />
          <Route
            path="/finance"
            element={
              <RoleGuard roles={FINANCE_ROLES}>
                <FinancePage />
              </RoleGuard>
            }
          />
          <Route
            path="/copilot"
            element={
              <RoleGuard roles={FINANCE_ROLES}>
                <CopilotPage />
              </RoleGuard>
            }
          />
          <Route path="/users" element={<UsersPage />} />
          <Route
            path="/billing"
            element={
              <RoleGuard roles={BILLING_ROLES}>
                <BillingPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* Back-office plateforme — identité PLATFORM_ADMIN entièrement
            distincte des comptes d'organisation (AdminAuthProvider séparé,
            jamais AuthProvider/ProtectedRoute ci-dessus). */}
        <Route element={<AdminAuthProvider>{<Outlet />}</AdminAuthProvider>}>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
            <Route path="/admin/organizations/:id" element={<AdminOrganizationDetailPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/system" element={<AdminSystemPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </AuthProvider>
  );
}
