import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { Search, X, Filter, Copy } from "lucide-react";

// Color mapping for different sections
const SECTION_COLORS = {
  INCOME: "bg-green-100 text-green-800",
  EXPENSES: "bg-red-100 text-red-800",
  ASSETS: "bg-blue-100 text-blue-800",
  LIABILITIES: "bg-orange-100 text-orange-800",
  "CURRENT LIABILITIES": "bg-yellow-100 text-yellow-800",
  PROVISIONS: "bg-gray-100 text-gray-800"
};

const TYPE_COLORS = {
  Asset: "bg-blue-100 text-blue-700",
  Liability: "bg-orange-100 text-orange-700",
  "Equity/Capital": "bg-purple-100 text-purple-700",
  "Income/Revenue": "bg-green-100 text-green-700",
  Expense: "bg-red-100 text-red-700",
};

// Get Main Group from account data
const getGlAccMainGroup = (accountType, accountCode, accountName) => {
  const code = String(accountCode);
  
  if (accountType === 4000) return "INCOME";
  if (accountType === 5000) return "EXPENSES";
  
  if (accountType === 1000) return "ASSETS";
  if (accountType === 2000) {
    if (code.startsWith("4131")) return "CURRENT LIABILITIES";
    if (code.startsWith("4132")) return "PROVISIONS";
    return "LIABILITIES";
  }
  if (accountType === 3000) return "EQUITY";
  
  return "OTHER";
};

// Get Sub Group based on the PARENT account (header account)
// This maps the parent account name/code to the sub-group
const getSubGroupFromParent = (parentAccount) => {
  if (!parentAccount) return "Other";
  
  const parentCode = String(parentAccount.AccountCode);
  const parentName = parentAccount.AccountName || "";
  
  // Income subgroups
  if (parentCode === "11100000" || parentName === "Income From Members") 
    return "1-11-00000 Income From Members";
  if (parentCode === "11200000" || parentName === "Investment Income") 
    return "1-12-00000 Investment Income";
  if (parentCode === "11300000" || parentName === "Fees & Commission Income") 
    return "1-13-00000 Fees & Commission Income";
  if (parentCode === "11400000" || parentName === "Other Operating Income") 
    return "1-14-00000 Other Operating Income";
  
  // Expense subgroups
  if (parentCode === "21100000" || parentName === "Staff Expenses") 
    return "2-11-00000 Staff Expenses";
  if (parentCode === "21200000" || parentName === "Directors Expenses") 
    return "2-12-00000 Directors Expenses";
  if (parentCode === "21300000" || parentName === "Members Expenses") 
    return "2-13-00000 Members Expenses";
  if (parentCode === "21400000" || parentName === "Financial & Professional Expenses") 
    return "2-14-00000 Financial & professional Exp";
  if (parentCode === "21500000" || parentName === "Administrative Exp") 
    return "2-15-00000 Administrative Exp";
  if (parentCode === "21600000" || parentName === "Marketing and Publicity") 
    return "2-16-00000 Marketing and Publicity";
  if (parentCode === "21700000" || parentName === "Repair and Maintenance") 
    return "2-17-00000 Repair and Maintenance";
  if (parentCode === "21800000" || parentName === "Depreciation and Amortization  Exp") 
    return "2-18-00000 Depreciation and Amortization Exp";
  if (parentCode === "29990000" || parentName === "YTD Profit & Loss") 
    return "2-99-90000 YTD Profit & Loss";
  
  // Asset subgroups
  if (parentCode === "31000000" || parentName === "Property Plant & Equipment") 
    return "3-10-00000 Property Plant & Equipment";
  if (parentCode === "31100000" || parentName === "Investment") 
    return "3-11-00000 Investment";
  if (parentCode === "31200000" || parentName === "Members Loans") 
    return "3-12-00000 Members Loans";
  if (parentCode === "31300000" || parentName === "Loan Interest Receivable") 
    return "3-13-00000 Loan Interest Receivable";
  if (parentCode === "31400000" || parentName === "Investment Income Receivable") 
    return "3-14-00000 Investment Income Receivable";
  if (parentCode === "31500000" || parentName === "Checkoff & Payroll Contral Acc") 
    return "3-15-00000 Checkoff & Payroll Contral Acc";
  if (parentCode === "31600000" || parentName === "Other Receivables") 
    return "3-16-00000 Other Receivables";
  if (parentCode === "31700000" || parentName === "Cash & Cash Equivalent") 
    return "3-17-00000 Cash & Cash Equivalent";
  
  // Liability subgroups
  if (parentCode === "41100000" || parentName === "Equity & Liabilities") 
    return "4-11-00000 Equity & Liabilities";
  if (parentCode === "41210000" || parentName === "Long Term Liabilities") 
    return "4-12-10000 Long Term Liabilities";
  if (parentCode === "41310000" || parentName === "Accounts Payable") 
    return "4-13-10000 Accounts Payable";
  if (parentCode === "41320000" || parentName === "Provisions") 
    return "4-13-20000 Provisions";
  
  return "Other";
};

// Get Sub Group for an account (uses parent if available, otherwise falls back to code prefix)
const getSubGroup = (account) => {
  // If account has a parent, use the parent to determine sub-group
  if (account.Parent) {
    return getSubGroupFromParent(account.Parent);
  }
  
  // Fallback: use account code prefix for header accounts themselves
  const code = String(account.AccountCode);
  
  // Income subgroups (header accounts)
  if (code === "11100000") return "1-11-00000 Income From Members";
  if (code === "11200000") return "1-12-00000 Investment Income";
  if (code === "11300000") return "1-13-00000 Fees & Commission Income";
  if (code === "11400000") return "1-14-00000 Other Operating Income";
  
  // Expense subgroups (header accounts)
  if (code === "21100000") return "2-11-00000 Staff Expenses";
  if (code === "21200000") return "2-12-00000 Directors Expenses";
  if (code === "21300000") return "2-13-00000 Members Expenses";
  if (code === "21400000") return "2-14-00000 Financial & professional Exp";
  if (code === "21500000") return "2-15-00000 Administrative Exp";
  if (code === "21600000") return "2-16-00000 Marketing and Publicity";
  if (code === "21700000") return "2-17-00000 Repair and Maintenance";
  if (code === "21800000") return "2-18-00000 Depreciation and Amortization Exp";
  if (code === "29990000") return "2-99-90000 YTD Profit & Loss";
  
  // Asset subgroups (header accounts)
  if (code === "31000000") return "3-10-00000 Property Plant & Equipment";
  if (code === "31100000") return "3-11-00000 Investment";
  if (code === "31200000") return "3-12-00000 Members Loans";
  if (code === "31300000") return "3-13-00000 Loan Interest Receivable";
  if (code === "31400000") return "3-14-00000 Investment Income Receivable";
  if (code === "31500000") return "3-15-00000 Checkoff & Payroll Contral Acc";
  if (code === "31600000") return "3-16-00000 Other Receivables";
  if (code === "31700000") return "3-17-00000 Cash & Cash Equivalent";
  
  // Liability subgroups (header accounts)
  if (code === "41100000") return "4-11-00000 Equity & Liabilities";
  if (code === "41210000") return "4-12-10000 Long Term Liabilities";
  if (code === "41310000") return "4-13-10000 Accounts Payable";
  if (code === "41320000") return "4-13-20000 Provisions";
  
  return "Other";
};

// Enhanced Account Preview Card with grouping info
function AccountPreviewCard({ account, onSelect }) {
  const mainGroup = getGlAccMainGroup(account.AccountType, account.AccountCode, account.AccountName);
  const subGroup = getSubGroup(account);
  const typeColor = TYPE_COLORS[account.AccountTypeDescription] ?? "bg-gray-100 text-gray-700";
  const sectionColor = SECTION_COLORS[mainGroup] || "bg-gray-100 text-gray-800";
  
  return (
    <div 
      className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-400 group"
      onClick={() => onSelect(account)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono font-bold text-indigo-800 text-sm">
              {account.AccountCode}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor}`}>
              {account.AccountTypeDescription}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sectionColor}`}>
              {mainGroup}
            </span>
          </div>
          <p className="font-semibold text-gray-800 text-sm mb-1" title={account.AccountName}>
            {account.AccountName}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="text-gray-500">
              <span className="font-medium">Sub Group:</span> {subGroup}
            </span>
            <span className="text-gray-500">
              <span className="font-medium">Parent:</span> {account.Parent?.AccountName || "Root"}
            </span>
            <span className="text-gray-500">
              <span className="font-medium">Category:</span> {account.AccountCategoryDescription}
            </span>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Copy className="w-4 h-4 text-indigo-500" />
        </div>
      </div>
    </div>
  );
}

// ── Main Drawer ──────────────────────────────────────────────────────────────
export default function AddAccountDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    accountType: "",
    accountCategory: "",
    accountCode: "",
    accountName: "",
    mainGroup: "",
    subGroup: "",
    depth: "1",
  });
  const [loading, setLoading] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedMainGroupFilter, setSelectedMainGroupFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const accountTypes = [
    { value: "1000", label: "Assets" },
    { value: "2000", label: "Liabilities" },
    { value: "3000", label: "Equity" },
    { value: "4000", label: "Revenue" },
    { value: "5000", label: "Expenses" },
  ];

  const accountCategories = [
    { value: "4096", label: "Header Account (Non-Postable)" },
    { value: "4097", label: "Detail Account (Postable)" },
  ];

  // Main Group options for dropdown
  const mainGroupOptions = [
    "INCOME",
    "EXPENSES", 
    "ASSETS",
    "LIABILITIES",
    "CURRENT LIABILITIES",
    "PROVISIONS",
    "EQUITY"
  ];

  // Sub Group options based on selected Main Group
  const subGroupOptions = useMemo(() => {
    const groups = {
      "INCOME": [
        "1-11-00000 Income From Members",
        "1-12-00000 Investment Income",
        "1-13-00000 Fees & Commission Income",
        "1-14-00000 Other Operating Income"
      ],
      "EXPENSES": [
        "2-11-00000 Staff Expenses",
        "2-12-00000 Directors Expenses",
        "2-13-00000 Members Expenses",
        "2-14-00000 Financial & professional Exp",
        "2-15-00000 Administrative Exp",
        "2-16-00000 Marketing and Publicity",
        "2-17-00000 Repair and Maintenance",
        "2-18-00000 Depreciation and Amortization Exp",
        "2-99-90000 YTD Profit & Loss"
      ],
      "ASSETS": [
        "3-10-00000 Property Plant & Equipment",
        "3-11-00000 Investment",
        "3-12-00000 Members Loans",
        "3-13-00000 Loan Interest Receivable",
        "3-14-00000 Investment Income Receivable",
        "3-15-00000 Checkoff & Payroll Contral Acc",
        "3-16-00000 Other Receivables",
        "3-17-00000 Cash & Cash Equivalent"
      ],
      "LIABILITIES": [
        "4-11-00000 Equity & Liabilities",
        "4-12-10000 Long Term Liabilities"
      ],
      "CURRENT LIABILITIES": [
        "4-13-10000 Accounts Payable"
      ],
      "PROVISIONS": [
        "4-13-20000 Provisions"
      ],
      "EQUITY": [
        "4-11-00000 Equity & Liabilities"
      ]
    };
    
    if (form.mainGroup && groups[form.mainGroup]) {
      return groups[form.mainGroup];
    }
    return [];
  }, [form.mainGroup]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`
        );
        if (!res.ok) throw new Error("Failed to fetch accounts");
        const data = await res.json();
        if (data?.Success) setAllAccounts(data.Data);
      } catch (err) {
        console.error(err);
      }
    };

    if (open) fetchAccounts();
  }, [open]);

  // Process accounts with grouping info
  const processedAccounts = useMemo(() => {
    return allAccounts.map(acc => ({
      ...acc,
      mainGroup: getGlAccMainGroup(acc.AccountType, acc.AccountCode, acc.AccountName),
      subGroup: getSubGroup(acc)
    }));
  }, [allAccounts]);

  // Get unique values for filters
  const mainGroups = useMemo(() => {
    const groups = new Set();
    processedAccounts.forEach(acc => groups.add(acc.mainGroup));
    return Array.from(groups).sort();
  }, [processedAccounts]);

  const accountTypesList = useMemo(() => {
    const types = new Set();
    processedAccounts.forEach(acc => {
      if (acc.AccountTypeDescription) {
        types.add(acc.AccountTypeDescription);
      }
    });
    return Array.from(types).sort();
  }, [processedAccounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let filtered = processedAccounts;
    
    if (searchName.trim()) {
      const term = searchName.trim().toLowerCase();
      filtered = filtered.filter((acc) => 
        acc.AccountName.toLowerCase().includes(term)
      );
    }
    
    if (searchCode.trim()) {
      const term = searchCode.trim().toLowerCase();
      filtered = filtered.filter((acc) => 
        String(acc.AccountCode).toLowerCase().includes(term)
      );
    }
    
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter((acc) => 
        acc.AccountTypeDescription === selectedTypeFilter
      );
    }
    
    if (selectedMainGroupFilter !== "all") {
      filtered = filtered.filter((acc) => 
        acc.mainGroup === selectedMainGroupFilter
      );
    }
    
    return filtered.slice(0, 100);
  }, [searchName, searchCode, selectedTypeFilter, selectedMainGroupFilter, processedAccounts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSelectChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const clearSearch = () => {
    setSearchName("");
    setSearchCode("");
    setSelectedTypeFilter("all");
    setSelectedMainGroupFilter("all");
  };

  // Auto-fill form when an account is clicked
  const handleAccountSelect = (account) => {
    const accountCategory = account.Depth === 0 ? "4096" : "4097";
    const mainGroup = getGlAccMainGroup(account.AccountType, account.AccountCode, account.AccountName);
    const subGroup = getSubGroup(account);
    
    setForm({
      accountType: String(account.AccountType),
      accountCategory: accountCategory,
      accountCode: String(account.AccountCode),
      accountName: account.AccountName,
      mainGroup: mainGroup,
      subGroup: subGroup,
      depth: String(account.Depth + 1 || "1"),
    });
    
    Swal.fire({
      icon: "success",
      title: "Account Loaded",
      text: `Loaded details for ${account.AccountName}. You can now modify and create a new account.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/chartofaccount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: "",
            accountType: form.accountType,
            accountCategory: form.accountCategory,
            accountCode: form.accountCode,
            accountName: form.accountName,
            depth: form.depth,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to create account");
      const data = await res.json();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Account created successfully!",
        confirmButtonColor: "#2563eb",
      });

      setForm({
        accountType: "",
        accountCategory: "",
        accountCode: "",
        accountName: "",
        mainGroup: "",
        subGroup: "",
        depth: "1",
      });
      setSearchName("");
      setSearchCode("");
      setSelectedTypeFilter("all");
      setSelectedMainGroupFilter("all");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create account. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
            />

            <motion.div
              className="fixed top-5 right-3 rounded-2xl bg-white shadow-xl z-50 flex flex-col overflow-hidden"
              style={{ width: "1000px", maxHeight: "calc(100vh - 2.5rem)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-indigo-800 text-white px-6 py-4 flex justify-between items-center shrink-0 rounded-t-2xl">
                <h2 className="font-bold text-lg">Create Chart of Account</h2>
                <Button variant="outline" size="sm" className="text-gray-800" onClick={onClose}>
                  Close
                </Button>
              </div>

              <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Search & Account Cards */}
                <div className="w-[450px] shrink-0 border-r flex flex-col bg-gray-50">
                  <div className="p-4 border-b bg-white space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                        Search by Account Name
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="e.g., Fixed Assets, Cash Account"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          className="pl-9 bg-white pr-10"
                        />
                        {searchName && (
                          <button
                            onClick={() => setSearchName("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                        Search by Account Code
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="e.g., 31100000, 31700001"
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value)}
                          className="pl-9 bg-white pr-10"
                        />
                        {searchCode && (
                          <button
                            onClick={() => setSearchCode("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Filter className="w-3 h-3" />
                        {showFilters ? "Hide filters" : "Show filters"}
                      </button>
                      <p className="text-[11px] text-gray-400">
                        {filteredAccounts.length} of {allAccounts.length} accounts
                      </p>
                    </div>

                    {showFilters && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">
                            Filter by Type
                          </Label>
                          <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                          >
                            <option value="all">All Account Types</option>
                            {accountTypesList.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">
                            Filter by Main Group
                          </Label>
                          <select
                            value={selectedMainGroupFilter}
                            onChange={(e) => setSelectedMainGroupFilter(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                          >
                            <option value="all">All Main Groups</option>
                            {mainGroups.map(group => (
                              <option key={group} value={group}>{group}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {(searchName || searchCode || selectedTypeFilter !== "all" || selectedMainGroupFilter !== "all") && (
                      <div className="mt-2">
                        <button
                          onClick={clearSearch}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                      <p className="text-xs text-indigo-700">
                        💡 <span className="font-semibold">Tip:</span> Click on any account card below to auto-fill the form.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredAccounts.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-gray-400 text-sm">No accounts found.</p>
                        <p className="text-gray-400 text-xs mt-1">Try a different search term.</p>
                      </div>
                    ) : (
                      filteredAccounts.map((acc) => (
                        <AccountPreviewCard 
                          key={acc.Id} 
                          account={acc} 
                          onSelect={handleAccountSelect}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT: Form */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">📝 How to use:</span> Search for an account similar to what you want to create, 
                      click on its card, then modify the fields below.
                    </p>
                  </div>
                  
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <Label htmlFor="accountName" className="text-sm font-semibold">
                        Account Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountName"
                        name="accountName"
                        value={form.accountName}
                        onChange={handleChange}
                        placeholder="e.g., Fixed Assets, Cash Account"
                        className="bg-white mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountCode" className="text-sm font-semibold">
                        Account Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountCode"
                        name="accountCode"
                        value={form.accountCode}
                        onChange={handleChange}
                        placeholder="e.g., 1067, 31100000"
                        className="bg-white mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Main Group</Label>
                      <Select
                        value={form.mainGroup}
                        onValueChange={(val) => handleSelectChange("mainGroup", val)}
                      >
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue placeholder="Select main group" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainGroupOptions.map((group) => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        Determines which financial statement section this account appears in
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Sub Group</Label>
                      <Select
                        value={form.subGroup}
                        onValueChange={(val) => handleSelectChange("subGroup", val)}
                      >
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue placeholder="Select sub group" />
                        </SelectTrigger>
                        <SelectContent>
                          {subGroupOptions.map((group) => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        Detailed classification within the main group
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Account Type</Label>
                      <Select
                        value={form.accountType}
                        onValueChange={(val) => handleSelectChange("accountType", val)}
                      >
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Account Category</Label>
                      <Select
                        value={form.accountCategory}
                        onValueChange={(val) => handleSelectChange("accountCategory", val)}
                      >
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="depth" className="text-sm font-semibold">Depth</Label>
                      <Input
                        id="depth"
                        name="depth"
                        value={form.depth}
                        onChange={handleChange}
                        placeholder="1"
                        className="bg-white mt-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        0 = Header Account (Non-Postable), 1+ = Detail Account (Postable)
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-indigo-800 hover:bg-indigo-900" disabled={loading}>
                      {loading ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}