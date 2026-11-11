import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaBars, FaRegFileAlt, FaRegUser, FaWallet, FaUserCog } from "react-icons/fa";
import MiniSidebar from "./MiniSidebar";
import MainSidebar from "./MainSidebar";
import Navbar from "./Navbar";
import { IoIosAlbums } from "react-icons/io";
import { GrResources } from "react-icons/gr";
import { SiFsecure } from "react-icons/si";
import { RiBankFill } from "react-icons/ri";
import { MdInventory2 } from "react-icons/md";
import { MdBusinessCenter } from "react-icons/md";
import bgcircle from "../assets/circle.jpg";
import { Outlet } from "react-router-dom";

const mockWorkspaces = [
  {
    id: "ws6",
    name: "Membership",
    title: "Member..",
    icon: <MdBusinessCenter className="text-2xl" />,
    dms: [
      { id: "Membership/companies", name: "Companies", sublinks: [] },
      { id: "Membership/branches", name: "Branches", sublinks: [] },
      { id: "Membership/Employers", name: "Employers", sublinks: [] },
      { id: "Membership/Division", name: "Division", sublinks: [] },
      { id: "Membership/Zones", name: "Zones", sublinks: [] },
      { id: "Membership/Stations", name: "Stations", sublinks: [] },
      { id: "Membership/Administrative", name: "Administrative", sublinks: [] },
      { id: "Membership/Products", name: "Products", sublinks: [] },
      { id: "Membership/Insurance", name: "Insurance", sublinks: [] },
      { id: "Membership/Members", name: "Members", sublinks: [] },
      { id: "Membership/MemberExit", name: "Member Exit", sublinks: [] },
      { id: "Membership/MemberGuarantorReplacement", name: "Guarantor Replacement", sublinks: [] },
    ],
  },
  {
    id: "ws7",
    name: "Loaning",
    title: "Loaning",
    icon: <FaWallet className="text-2xl" />,
    dms: [
      { id: "Loaning/LoanProducts", name: "Loan Products", sublinks: [] },
      { id: "Loaning/LoanApplication", name: "Loan Application", sublinks: [] },
      { id: "Loaning/OnlineLoans/OnlineLoanApplications", name: "Online Loan Application", sublinks: [] },
      { id: "Loaning/LoanSector", name: "Loan Sector", sublinks: [] },
      { id: "Loaning/LoanSubSector", name: "Loan SubSector", sublinks: [] },
      { id: "Loaning/LoanCalculator", name: "Loan Calculator", sublinks: [] },
      { id: "Loaning/LoanRegister", name: "Applied Loans", sublinks: [] },
    ],
  },
  {
    id: "ws3",
    name: "Finance/ChartsOfAccount",
    title: "Finance",
    icon: <RiBankFill className="text-2xl" />,
    dms: [
      { id: "Finance/Setup", name: "Setup", sublinks: [] },
      { id: "Finance/ChartsOfAccount", name: "Charts Of Account", sublinks: [] },
      { id: "Finance/PostingJournal", name: "Posting Journal", sublinks: [] },
      { id: "Finance/AccountsPayable", name: "Accounts Payable", sublinks: [] },
      { id: "Finance/AccountsReceivable", name: "Accounts Receivable", sublinks: [] },
      { id: "Finance/PaymentVoucher", name: "Payment voucher", sublinks: [] },
      { id: "Finance/MemberReceipting", name: "MemberReceipt", sublinks: [] },
      { id: "Finance/Creditbatches", name: "CheckOffbatches", sublinks: [] },
      { id: "Finance/InterAccountTransfer", name: "InterAccountTransfer", sublinks: [] },
      { id: "Finance/MemberPayout", name: "Member Payout", sublinks: [] },
    ],
  },
  {
    id: "ws8",
    name: "Reports",
    title: "Reports",
    icon: <FaRegFileAlt className="text-2xl" />,
    dms: [
      { id: "Reports/LoanReports", name: "Loan Reports", sublinks: [] },
      { id: "Reports/FinancialReports", name: "Finance Reports", sublinks: [] },
      { id: "Reports/GenerateSasraForm", name: "Generate Sasra Form", sublinks: [] },
      { id: "Reports/MemberStatement", name: "Member Statement", sublinks: [] },
    ],
  },
  {
    id: "ws1",
    name: "Payroll",
    title: "Payroll",
    icon: <GrResources className="text-2xl" />,
    dms: [
      { id: "Payroll/payrollsetup", name: "Payroll Setup", sublinks: [] },
      { id: "Payroll/statutorysetup", name: "Statutory Setup", sublinks: [] },
      { id: "Payroll/Accounts", name: "Accounts", sublinks: [] },
      { id: "Payroll/Employees", name: "Employees Setup", sublinks: [] },
    ],
  },
  {
    id: "ws2",
    name: "Procurement",
    title: "Procu..",
    icon: <SiFsecure className="text-2xl" />,
    dms: [
      { id: "Procurement/Vendors", name: "Vendors", sublinks: [] },
      { id: "Procurement/ProjectsWithBudgets", name: "Projects Budgets", sublinks: [] },
      { id: "Procurement/requisitions", name: "Requisitions", sublinks: [] },
      { id: "Procurement/RFQ", name: "Request For Quotation", sublinks: [] },
      { id: "Procurement/SubmitQuotation", name: "Submit Quotation", sublinks: [] },
      { id: "Procurement/Quotation", name: "Bid Analysis", sublinks: [] },
      { id: "Procurement/StoreRequisitions", name: "Store Requisitions", sublinks: [] },
      { id: "Procurement/PurchaseOrder", name: "Purchase Order", sublinks: [] },
      { id: "Procurement/Document", name: "Document", sublinks: [] },
    ],
  },
  {
    id: "ws4",
    name: "Inventory",
    title: "Invent..",
    icon: <MdInventory2 className="text-2xl" />,
    dms: [
      { id: "Inventory/invCategories", name: "Categories", sublinks: [] },
      { id: "Inventory/invUnitOfMeasure", name: "Unit Of Measure", sublinks: [] },
      { id: "Inventory/Invlocations", name: "Locations", sublinks: [] },
      { id: "Inventory/InvItems", name: "Items", sublinks: [] },
      { id: "Inventory/InvJournals", name: "Journals", sublinks: [] },
      { id: "Inventory/InvTransactions", name: "Transactions", sublinks: [] },
    ],
  },
  {
    id: "ws9",
    name: "UserManagement",
    title: "Users",
    icon: <FaUserCog className="text-2xl" />,
    dms: [
      { id: "UserManagement/Users", name: "Users", sublinks: [] },
      { id: "UserManagement/Roles", name: "Roles", sublinks: [] },
    ],
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentWorkspace =
    mockWorkspaces.find(
      (ws) =>
        location.pathname.startsWith(`/${ws.name}`) ||
        ws.dms.some((dm) => location.pathname.startsWith(`/${dm.id}`))
    ) || mockWorkspaces[0];

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-1 bg-indigo-800 relative overflow-hidden">

        {/* ── DESKTOP: both sidebars in normal flow (lg+) ── */}
        <div className="hidden lg:flex shrink-0">
          <MiniSidebar
            workspaces={mockWorkspaces}
            activeWorkspace={currentWorkspace.id}
            onSelect={() => {}}
          />
        </div>
        <div className="hidden lg:flex shrink-0">
          <MainSidebar workspace={currentWorkspace} />
        </div>

        {/* ── TABLET: MiniSidebar in flow; clicking icon opens MainSidebar overlay (md–lg) ── */}
        <div className="hidden md:flex lg:hidden shrink-0">
          <MiniSidebar
            workspaces={mockWorkspaces}
            activeWorkspace={currentWorkspace.id}
            onSelect={openSidebar}
          />
        </div>

        {/* ── OVERLAY: MainSidebar (tablet) + both sidebars (mobile) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeSidebar}
              />

              {/* Slide-in panel */}
              <motion.div
                className="fixed inset-y-0 left-0 z-50 flex lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* MiniSidebar only on mobile (tablet already has it in flow) */}
                <div className="md:hidden">
                  <MiniSidebar
                    workspaces={mockWorkspaces}
                    activeWorkspace={currentWorkspace.id}
                    onSelect={() => {}}
                  />
                </div>

                {/* MainSidebar with close support */}
                <MainSidebar
                  workspace={currentWorkspace}
                  onClose={closeSidebar}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Mobile top bar with hamburger */}
          <div className="md:hidden bg-indigo-900 text-white px-3 py-2 flex items-center gap-3 shrink-0 border-b border-indigo-700">
            <button
              onClick={openSidebar}
              className="p-1.5 rounded-md bg-indigo-700 hover:bg-indigo-600 transition-colors"
              aria-label="Open menu"
            >
              <FaBars className="text-lg" />
            </button>
            <span className="text-sm font-semibold truncate">{currentWorkspace.name}</span>
          </div>

          {/* Page content */}
          <div
            className="flex-1 bg-indigo-100 p-1 overflow-auto"
            style={{
              backgroundImage: `url(${bgcircle})`,
              backgroundColor: "rgba(224, 231, 255, 0.7)",
              backgroundSize: "200px",
              backgroundBlendMode: "saturation",
              backgroundPosition: "center",
            }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}