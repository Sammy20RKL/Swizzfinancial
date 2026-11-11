import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RequireAdmin } from "./components/ProtectedRoute";

import Invcategory from "./pages/Inventory/Category/Invcategory";
import InvUom from "./pages/Inventory/UnitOfMeasure/InvUom";
import Invitem from "./pages/Inventory/Items/Invitem";
import InvJournal from "./pages/Inventory/Journals/InvJournal";
import InvTransactions from "./pages/Inventory/Transcations/InvTransactions";
import ChartOfAccounts from "./pages/Finance/COA/ChartsOfAccount";

import Settings from "./pages/Settings";
import Leaves from "./pages/Payroll/Leave";
import Login from "./pages/Auth/Login";
import Procureone from "./pages/Procurement/procureone";
import Procuretwo from "./pages/Procurement/procuretwo";
import Payroll from "./pages/Payroll/Payroll.jsx";
import Employees from "./pages/Payroll/Employees";
import Departments from "./pages/Payroll/Departments";
import Procument from "./pages/Procurement/Procument";
import Finance from "./pages/Finance/Finance";

import AccountsSetup from "./pages/Payroll/Accounts/AccountsSetup.jsx";

import FixedAssetsSetup from "./pages/FixedAssets/FixedAssetsSetup.jsx";
import FixCategory from "./pages/FixedAssets/Category/fixCategory.jsx";
import Location from "./pages/FixedAssets/Location/Location.jsx";
import FixUnitOfMeasure from "./pages/FixedAssets/UnitOfMeasure/fixUnitOfMeasure.jsx";

import InvLocation from "./pages/Inventory/locations/InvLocation";
import InventoryDashboard from "./pages/Inventory/InventoryDashboard.jsx";
import ProVendors from "./pages/Procurement/Vendors/ProVendors.jsx";
import ProRequisitions from "./pages/Procurement/Requisitions/ProRequisitions.jsx";
import PurchaseOrder from "./pages/Procurement/PurchaseOrder/PurchaseOrder.jsx";
import BankLinkages from "./pages/Finance/Setup/Bank/BankLinkages.jsx";
import AccountConfiguration from "./pages/Finance/Setup/AccountConfiguration/AccountConfiguration.jsx";

import PayrollSetup from "./pages/Payroll/PayrollSetup/PayrollSetup.jsx";
import StatutorySetup from "./pages/Payroll/Statutory setup/StatutorySetup.jsx";
import EmployeeSetup from "./pages/Payroll/EmployeeSetup/EmployeeSetup.jsx";

import StoreRequisitions from "./pages/Procurement/StoreRequisitions/StoreRequisitions.jsx";
import SalesCreditMemo from "./pages/Finance/AccountsReceivable/SalesCreditMemo/SalesCreditMemo.jsx";
import Setup from "./pages/Finance/Setup/Setup.jsx";
import AccountPayable from "./pages/Finance/AccountPayable/AccountPayable.jsx";
import AccountsReceivable from "./pages/Finance/AccountsReceivable/AccountsReceivable.jsx";
import PaymentVoucher from "./pages/Finance/PaymentVoucher/PaymentVoucher.jsx";
import RequestForQuotation from "./pages/Procurement/RFQ/RequestForQuotation.jsx";
import ProjectsWithBudgets from "./pages/Procurement/ProjectsWithBudgets/ProjectsWithBudgets.jsx";
import QuotationSubmission from "./pages/Procurement/Quotation/QuotationSubmission.jsx";
import Quotations from "./pages/Procurement/Quotation/Quotations.jsx";
import BidAnalysis from "./pages/Procurement/Biding/BidAnalysis.jsx";

import PostingJournal from "./pages/Finance/postjournal/PostingJournal.jsx";
import SalesInvoice from "./pages/Finance/AccountsReceivable/Salesinvoice/salesInvoice.jsx";
import DocumentAttach from "./pages/Procurement/Document/index.jsx";
import VendorComparison from "./pages/Procurement/VendorComparison/index.jsx";
import Membership from "./pages/Membership/index.jsx";
import Members from "./pages/Membership/Members/index.jsx";
import CustomersAccount from "./pages/Membership/CustomerAccounts/index.jsx";
import Employers from "./pages/Membership/Employers/index.jsx";
import CustomersAccounts from "./pages/Membership/CustomerAccounts/index.jsx";
import Companies from "./pages/Membership/companies/index.jsx";
import Branches from "./pages/Membership/branches/index.jsx";
import Division from "./pages/Membership/Division/index.jsx";
import Zones from "./pages/Membership/Zones/index.jsx";
import Stations from "./pages/Membership/Stations/index.jsx";
import Administrative from "./pages/Membership/Administrative/index.jsx";
import Products from "./pages/Membership/Products/index.jsx";
import Loaning from "./pages/Loaning/index.jsx";
import LoanProducts from "./pages/Loaning/LoanProducts/index.jsx";
import LoanApplication from "./pages/Loaning/LoanApplication/index.jsx";
import MemberReceipting from "./pages/Finance/MemberReceipting/index.jsx";
import LoanSector from "./pages/Loaning/LoanSector/index.jsx";
import LoanSubSector from "./pages/Loaning/LoanSubSector/index.jsx";
import LoanCalculator from "./pages/Loaning/LoanCalculator/index.jsx";
import LoanReports from "./pages/Reports/LoanReports/index.jsx";
import Creditbatches from "./pages/Finance/Creditbatches/index.jsx";
import InterAccountTransfer from "./pages/Finance/InterAccountTransfer/index.jsx";

import FinanceReports from "./pages/Reports/FinanceReports/index.jsx";
import Insurance from "./pages/Membership/Insurance/index.jsx";
import MemberExit from "./pages/Membership/MemberExit/index.jsx";
import MemberGuarantorReplacement from "./pages/Membership/MemberGuarantorReplacement/index.jsx";
import GenerateSasraForm from "./pages/Reports/GenerateSasraForm/index.jsx";
import MemberStatement from "./pages/Reports/MemberStatement/index.jsx";
import Reports from "./pages/Reports/index.jsx";
import LoanRegister from "./pages/Loaning/LoanRegister/index.jsx";
import Roles from "./pages/UserManagement/Roles/Roles.jsx";
import Users from "./pages/UserManagement/Users/index.jsx";

// Import Member Payout component (folder name has a space)
import MemberPayout from "./pages/Finance/Member Payout/MemberPayout";

// ✨ NEW IMPORT: Online Loan Applications
import OnlineLoanApplications from "./pages/Loaning/OnlineLoans/OnlineLoanApplications";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login route WITHOUT Layout */}
          <Route path="/login" element={<Login />} />

          {/* All other routes WITH Layout, guarded by authentication */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >

            <Route path="department" element={<Departments />} />
            <Route path="leave" element={<Leaves />} />

            {/* FixedAssets */}
            <Route path="FixedAssets" element={<FixedAssetsSetup />} />
            <Route path="FixedAssets/Category" element={<FixCategory />} />
            <Route path="FixedAssets/Location" element={<Location />} />
            <Route path="FixedAssets/FixedAssetCard" element={<FixedAssetsSetup />} />

            {/* Procurement */}
            <Route path="Procurement" element={<Procument />} />
            <Route path="Procurement/Vendors" element={<ProVendors />} />
            <Route path="Procurement/requisitions" element={<ProRequisitions />} />
            <Route path="Procurement/StoreRequisitions" element={<StoreRequisitions />} />
            <Route path="Procurement/PurchaseOrder" element={<PurchaseOrder />} />
            <Route path="Procurement/SubmitQuotation" element={<QuotationSubmission />} />
            <Route path="Procurement/Quotation" element={<Quotations />} />
            <Route path="Procurement/RFQ" element={<RequestForQuotation />} />
            <Route path="Procurement/ProjectsWithBudgets" element={<ProjectsWithBudgets />} />
            <Route path="Procurement/Biding" element={<BidAnalysis />} />
            <Route path="Procurement/Document" element={<DocumentAttach />} />
            <Route path="Procurement/comparison" element={<VendorComparison />} />

            {/* Finance */}
            <Route path="Finance" element={<Finance />} />
            <Route path="Finance/ChartsOfAccount" element={<ChartOfAccounts />} />
            <Route path="Finance/PostingJournal" element={<PostingJournal />} />
            <Route path="Finance/BanksSetup" element={<BankLinkages />} />
            <Route path="Finance/AccountConfiguration" element={<AccountConfiguration />} />
            <Route path="Finance/salesInvoice" element={<SalesInvoice />} />
            <Route path="Finance/salesCreditMemo" element={<SalesCreditMemo />} />
            <Route path="Finance/Setup" element={<Setup />} />
            <Route path="Finance/PaymentVoucher" element={<PaymentVoucher />} />
            <Route path="GeneralLedger/reports" element={<h1>GL Reports</h1>} />
            <Route path="Finance/MemberReceipting" element={<MemberReceipting />} />
            <Route path="Finance/AccountsPayable" element={<AccountPayable />} />
            <Route path="Finance/AccountsReceivable" element={<AccountsReceivable />} />
            <Route path="Finance/Creditbatches" element={<Creditbatches />} />
            <Route path="Finance/InterAccountTransfer" element={<InterAccountTransfer />} />
            <Route path="Finance/MemberPayout" element={<MemberPayout />} />
            <Route path="AccountsPayable/reports" element={<h1>AP Reports</h1>} />
            <Route path="AccountsPayable/settings" element={<h1>AP Settings</h1>} />
            <Route path="AccountsReceivable" element={<h1>Accounts Receivable</h1>} />
            <Route path="BudgetingForecasting" element={<h1>Budgeting & Forecasting</h1>} />
            <Route path="BankReconciliation" element={<h1>Bank Reconciliation</h1>} />
            <Route path="FinancialReporting" element={<h1>Financial Reporting</h1>} />

            {/* Payroll Account Setup */}
            <Route path="Payroll/Accounts" element={<AccountsSetup />} />
            <Route path="Payroll" element={<Payroll />} />
            <Route path="Payroll/payrollsetup" element={<PayrollSetup />} />
            <Route path="Payroll/statutorysetup" element={<StatutorySetup />} />
            <Route path="Payroll/Employees" element={<EmployeeSetup />} />

            {/* Inventory */}
            <Route path="Inventory" element={<InventoryDashboard />} />
            <Route path="Inventory/Inventory" element={<InventoryDashboard />} />
            <Route path="Inventory/invcategories" element={<Invcategory />} />
            <Route path="Inventory/Invlocations" element={<InvLocation />} />
            <Route path="Inventory/invUnitOfMeasure" element={<InvUom />} />
            <Route path="Inventory/InvItems" element={<Invitem />} />
            <Route path="Inventory/InvJournals" element={<InvJournal />} />
            <Route path="Inventory/InvTransactions" element={<InvTransactions />} />
            <Route path="Inventory/StockReceipts" element={<h1>Stock Receipts</h1>} />
            <Route path="Inventory/StockIssues" element={<h1>Stock Issues</h1>} />
            <Route path="Inventory/TransfersbetweenWarehouses" element={<h1>Transfers between Warehouses</h1>} />
            <Route path="Inventory/StockAdjustments" element={<h1>Stock Adjustments</h1>} />
            <Route path="Inventory/StockReportingAndAlerts" element={<h1>Stock Reporting & Alerts</h1>} />

            {/* Membership */}
            <Route path="Membership" element={<Membership />} />
            <Route path="Membership/companies" element={<Companies />} />
            <Route path="Membership/branches" element={<Branches />} />
            <Route path="Membership/Division" element={<Division />} />
            <Route path="Membership/Zones" element={<Zones />} />
            <Route path="Membership/Stations" element={<Stations />} />
            <Route path="Membership/Employers" element={<Employers />} />
            <Route path="Membership/Administrative" element={<Administrative />} />
            <Route path="Membership/Products" element={<Products />} />
            <Route path="Membership/Members" element={<Members />} />
            <Route path="Membership/customersAccount" element={<CustomersAccounts />} />
            <Route path="Membership/Insurance" element={<Insurance />} />
            <Route path="Membership/MemberExit" element={<MemberExit />} />
            <Route path="Membership/MemberGuarantorReplacement" element={<MemberGuarantorReplacement />} />

            {/* Loaning */}
            <Route path="Loaning" element={<Loaning />} />
            <Route path="Loaning/LoanProducts" element={<LoanProducts />} />
            <Route path="Loaning/LoanApplication" element={<LoanApplication />} />
            <Route path="Loaning/LoanSector" element={<LoanSector />} />
            <Route path="Loaning/LoanSubSector" element={<LoanSubSector />} />
            <Route path="Loaning/LoanCalculator" element={<LoanCalculator />} />
            <Route path="Loaning/LoanRegister" element={<LoanRegister />} />

            {/* ✨ NEW ROUTE: Online Loan Applications */}
            <Route path="Loaning/OnlineLoans/OnlineLoanApplications" element={<OnlineLoanApplications />} />

            {/* Reports */}
            <Route path="Reports" element={<Reports />} />
            <Route path="Reports/LoanReports" element={<LoanReports />} />
            <Route path="Reports/FinancialReports" element={<FinanceReports />} />
            <Route path="Reports/GenerateSasraForm" element={<GenerateSasraForm />} />
            <Route path="Reports/MemberStatement" element={<MemberStatement />} />

            {/* User Management (Admin only) */}
            <Route
              path="UserManagement/Users"
              element={
                <RequireAdmin>
                  <Users />
                </RequireAdmin>
              }
            />
            <Route
              path="UserManagement/Roles"
              element={
                <RequireAdmin>
                  <Roles />
                </RequireAdmin>
              }
            />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}