import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AccountDrawer from "./AccountDrawer";
import AddAccountDrawer from "./AddAccountDrawer";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaDownload, FaTimes, FaPrint, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ACCOUNT_CATEGORIES = [
  { label: "Assets", value: 1000 },
  { label: "Liabilities", value: 2000 },
  { label: "Equity", value: 3000 },
  { label: "Income", value: 4000 },
  { label: "Expenses", value: 5000 },
];

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });

export default function ChartOfAccounts() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ACCOUNT_CATEGORIES[0].value);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [accountNameSearch, setAccountNameSearch] = useState("");
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  /* ── derived lists ─────────────────────────────────────────── */
  const parentAccounts = allAccounts.filter(
    (a) => a.ParentId === null || a.ParentId === undefined || a.ParentId === ""
  );

  const filteredParentAccounts = parentAccounts.filter(
    (a) =>
      a.Description?.toLowerCase().includes(accountNameSearch.toLowerCase()) ||
      String(a.Code).includes(accountNameSearch)
  );

  const childAccounts = selectedParent
    ? allAccounts.filter((a) => a.ParentId === selectedParent.Id)
    : [];

  const filteredChildren = childAccounts.filter(
    (a) =>
      a.Description?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.Code).includes(search)
  );

  /* ── fetch ALL accounts ────────────────────────────────────── */
  const fetchAllAccounts = async () => {
    setLoading(true);
    try {
      // Fetch all categories
      const promises = ACCOUNT_CATEGORIES.map(cat => 
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetGeneralLedgers?accountCategory=${cat.value}`)
          .then(r => r.json())
      );
      
      const results = await Promise.all(promises);
      let allData = [];
      results.forEach((data, index) => {
        if (data.Success) {
          const accounts = data.Data || [];
          // Add category info to each account
          accounts.forEach(acc => {
            acc.CategoryValue = ACCOUNT_CATEGORIES[index].value;
            acc.CategoryLabel = ACCOUNT_CATEGORIES[index].label;
          });
          allData = [...allData, ...accounts];
        }
      });
      
      setAllAccounts(allData);
    } catch (error) {
      console.error("Error fetching all accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ── fetch single category ─────────────────────────────────── */
  const fetchAccounts = (category) => {
    setLoading(true);
    const url = `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetGeneralLedgers?accountCategory=${category}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.Success) {
          const accounts = data.Data || [];
          accounts.forEach(acc => {
            acc.CategoryValue = category;
            acc.CategoryLabel = ACCOUNT_CATEGORIES.find(c => c.value === category)?.label || "";
          });
          setAllAccounts(accounts);
          setSelectedParent(null);
          setSearch("");
          setAccountNameSearch("");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts(selectedCategory);
  }, [selectedCategory]);

  /* ── Get all accounts in a flat list ───────────────────────── */
  const getAllAccountsFlat = () => {
    const flatList = [];
    
    ACCOUNT_CATEGORIES.forEach(cat => {
      const categoryAccounts = allAccounts.filter(a => a.CategoryValue === cat.value);
      if (categoryAccounts.length > 0) {
        categoryAccounts.forEach(acc => {
          flatList.push({
            ...acc,
            CategoryLabel: cat.label,
            // Determine if it's a parent or child
            IsParent: !acc.ParentId || acc.ParentId === null || acc.ParentId === "",
            HasChildren: categoryAccounts.some(child => child.ParentId === acc.Id)
          });
        });
      }
    });
    
    return flatList;
  };

  /* ── Get all accounts with hierarchy ───────────────────────── */
  const getAllAccountsWithHierarchy = () => {
    const result = [];
    
    ACCOUNT_CATEGORIES.forEach(cat => {
      const categoryAccounts = allAccounts.filter(a => a.CategoryValue === cat.value);
      if (categoryAccounts.length === 0) return;
      
      // Get parent accounts (no parent)
      const parents = categoryAccounts.filter(a => !a.ParentId || a.ParentId === null || a.ParentId === "");
      
      // Get child accounts
      const children = categoryAccounts.filter(a => a.ParentId && a.ParentId !== null && a.ParentId !== "");
      
      result.push({
        category: cat,
        parentAccounts: parents,
        childAccounts: children,
        totalAccounts: categoryAccounts.length
      });
    });
    
    return result;
  };

  /* ── Generate Complete PDF (All in one) ───────────────────── */
  const generateCompletePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Rubani Sacco", pageWidth / 2, startY, { align: "center" });
    startY += 10;
    
    doc.setFontSize(16);
    doc.text("Chart of Accounts - Complete List", pageWidth / 2, startY, { align: "center" });
    startY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, startY, { align: "center" });
    startY += 6;
    doc.text("All amounts are in Kenyan Shillings (KES)", pageWidth / 2, startY, { align: "center" });
    startY += 12;
    
    doc.line(14, startY, pageWidth - 14, startY);
    startY += 8;
    
    // Get all accounts with hierarchy
    const hierarchyData = getAllAccountsWithHierarchy();
    
    // Process each category
    hierarchyData.forEach((categoryData) => {
      if (startY > 240) {
        doc.addPage();
        startY = 20;
      }
      
      // Category header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(`${categoryData.category.label} (${categoryData.totalAccounts} accounts)`, 14, startY);
      doc.setTextColor(0, 0, 0);
      startY += 8;
      
      // Prepare table data for this category
      const tableData = [];
      
      // Add parent accounts with their children
      categoryData.parentAccounts.forEach(parent => {
        // Add parent as a header row
        tableData.push([
          parent.Code || "-",
          `► ${parent.Description}`,
          parent.TypeDescription || "",
          fmt(parent.Balance || 0)
        ]);
        
        // Add children under parent
        const children = categoryData.childAccounts.filter(c => c.ParentId === parent.Id);
        children.forEach((child, idx) => {
          tableData.push([
            child.Code || "-",
            `  ├─ ${child.Description}`,
            child.TypeDescription || "",
            fmt(child.Balance || 0)
          ]);
        });
        
        // Add empty row for spacing if there are children
        if (children.length > 0) {
          tableData.push(["", "", "", ""]);
        }
      });
      
      // Add standalone accounts (accounts with no parent and no children)
      const standaloneAccounts = categoryData.parentAccounts.filter(parent => {
        const hasChildren = categoryData.childAccounts.some(c => c.ParentId === parent.Id);
        return !hasChildren;
      });
      
      if (standaloneAccounts.length > 0) {
        tableData.push(["", "--- Standalone Accounts ---", "", ""]);
        standaloneAccounts.forEach(acc => {
          tableData.push([
            acc.Code || "-",
            acc.Description,
            acc.TypeDescription || "",
            fmt(acc.Balance || 0)
          ]);
        });
      }
      
      if (tableData.length > 0) {
        autoTable(doc, {
          startY: startY,
          head: [["Code", "Description", "Type", "Balance (KES)"]],
          body: tableData,
          styles: { 
            fontSize: 7.5, 
            cellPadding: 2,
            overflow: 'linebreak'
          },
          headStyles: { 
            fillColor: [79, 70, 229], 
            textColor: 255,
            fontSize: 8,
            fontStyle: "bold"
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 85 },
            2: { cellWidth: 30 },
            3: { cellWidth: 45, halign: "right" }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: function(data) {
            // Highlight parent rows
            if (data.section === 'body') {
              const rowData = data.cell.raw;
              if (rowData && rowData[1] && rowData[1].includes('►')) {
                data.cell.styles.fillColor = [241, 245, 249];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });
        
        startY = doc.lastAutoTable.finalY + 10;
      }
    });
    
    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, 285);
      doc.text("Rubani Sacco - Chart of Accounts", 14, 285);
      doc.setTextColor(0, 0, 0);
    }
    
    return doc;
  };

  /* ── Generate Complete Excel (All in one) ─────────────────── */
  const generateCompleteExcel = () => {
    const workbook = XLSX.utils.book_new();
    const hierarchyData = getAllAccountsWithHierarchy();
    
    // Create a single sheet with all data
    const allRows = [
      ["Rubani Sacco - Chart of Accounts"],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Category", "Code", "Description", "Type", "Balance (KES)"]
    ];
    
    // Add all accounts
    hierarchyData.forEach(categoryData => {
      // Add category header
      allRows.push([`=== ${categoryData.category.label} (${categoryData.totalAccounts} accounts) ===`, "", "", "", ""]);
      
      // Add parent accounts with their children
      categoryData.parentAccounts.forEach(parent => {
        // Add parent
        allRows.push([
          categoryData.category.label,
          parent.Code || "-",
          parent.Description,
          parent.TypeDescription || "",
          parent.Balance || 0
        ]);
        
        // Add children under parent
        const children = categoryData.childAccounts.filter(c => c.ParentId === parent.Id);
        children.forEach(child => {
          allRows.push([
            categoryData.category.label,
            child.Code || "-",
            `  └─ ${child.Description}`,
            child.TypeDescription || "",
            child.Balance || 0
          ]);
        });
        
        // Add empty row for spacing if there are children
        if (children.length > 0) {
          allRows.push(["", "", "", "", ""]);
        }
      });
      
      // Add standalone accounts
      const standaloneAccounts = categoryData.parentAccounts.filter(parent => {
        const hasChildren = categoryData.childAccounts.some(c => c.ParentId === parent.Id);
        return !hasChildren;
      });
      
      if (standaloneAccounts.length > 0) {
        allRows.push(["", "--- Standalone Accounts ---", "", "", ""]);
        standaloneAccounts.forEach(acc => {
          allRows.push([
            categoryData.category.label,
            acc.Code || "-",
            acc.Description,
            acc.TypeDescription || "",
            acc.Balance || 0
          ]);
        });
      }
      
      // Add spacing between categories
      allRows.push(["", "", "", "", ""]);
      allRows.push(["", "", "", "", ""]);
    });
    
    const sheet = XLSX.utils.aoa_to_sheet(allRows);
    
    // Set column widths
    sheet["!cols"] = [
      { wch: 15 },  // Category
      { wch: 12 },  // Code
      { wch: 45 },  // Description
      { wch: 25 },  // Type
      { wch: 18 },  // Balance
    ];
    
    XLSX.utils.book_append_sheet(workbook, sheet, "Chart of Accounts");
    
    // Save workbook
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    saveAs(file, `ChartOfAccounts_Complete_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  /* ── PDF Export ─────────────────────────────────────────────── */
  const handlePDF = () => {
    const doc = generateCompletePDF();
    doc.save(`ChartOfAccounts_Complete_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  /* ── Excel Export ───────────────────────────────────────────── */
  const handleExcel = () => {
    generateCompleteExcel();
  };

  /* ── Preview ───────────────────────────────────────────────── */
  const handlePreview = () => {
    const hierarchyData = getAllAccountsWithHierarchy();
    setPreviewData(hierarchyData);
    setShowPreview(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('preview-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Chart of Accounts Preview</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .category-title { background: #4f46e5; color: white; padding: 12px; margin-top: 25px; border-radius: 4px; }
              .category-title h3 { margin: 0; }
              .category-title p { margin: 5px 0 0 0; opacity: 0.8; }
              .parent-row { background: #f8fafc; font-weight: bold; }
              .child-row { padding-left: 20px; }
              .standalone-title { background: #dbeafe; padding: 8px; margin-top: 15px; font-weight: bold; }
              table { border-collapse: collapse; width: 100%; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background: #4f46e5; color: white; }
              .text-right { text-align: right; }
              .footer { text-align: center; font-size: 10px; color: #6b7280; margin-top: 30px; }
              .level-badge { 
                display: inline-block; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 10px;
                font-weight: bold;
              }
              .level-parent { background: #e0e7ff; color: #4338ca; }
              .level-child { background: #f3e8ff; color: #7e22ce; }
              .level-standalone { background: #d1fae5; color: #065f46; }
              @media print {
                button { display: none; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  /* ── Preview Modal ─────────────────────────────────────────── */
  const PreviewModal = () => {
    if (!showPreview || !previewData) return null;
    
    return (
      <AnimatePresence>
        {showPreview && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
            />
            <motion.div
              className="fixed z-50 top-1/2 left-1/2 w-[95vw] max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col"
              initial={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
              animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }}
              exit={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
              style={{ transform: "translate(-50%, -50%)" }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b bg-indigo-700 rounded-t-xl">
                <h3 className="text-lg font-semibold text-white">
                  Chart of Accounts - Complete List
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md flex items-center gap-2"
                  >
                    <FaPrint /> Print
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                <div id="preview-content" className="bg-white p-8 shadow-lg rounded-lg">
                  <div className="header">
                    <h1 className="text-2xl font-bold">Rubani Sacco</h1>
                    <h2 className="text-xl font-semibold">Chart of Accounts - Complete List</h2>
                    <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    <p className="text-sm text-gray-500">All amounts are in Kenyan Shillings (KES)</p>
                  </div>
                  
                  <hr className="mb-6" />

                  {previewData.map((categoryData) => (
                    <div key={categoryData.category.label} className="mb-8">
                      <div className="category-title">
                        <h3>{categoryData.category.label}</h3>
                        <p>{categoryData.totalAccounts} accounts</p>
                      </div>
                      
                      <table>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th className="text-right">Balance (KES)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryData.parentAccounts.map(parent => {
                            const children = categoryData.childAccounts.filter(c => c.ParentId === parent.Id);
                            const hasChildren = children.length > 0;
                            
                            return (
                              <>
                                {/* Parent row */}
                                <tr className="parent-row">
                                  <td>{parent.Code || "-"}</td>
                                  <td><strong>► {parent.Description}</strong></td>
                                  <td>{parent.TypeDescription || ""}</td>
                                  <td className="text-right">{fmt(parent.Balance)}</td>
                                </tr>
                                
                                {/* Child rows */}
                                {children.map(child => (
                                  <tr key={child.Id} className="child-row">
                                    <td>{child.Code || "-"}</td>
                                    <td style={{ paddingLeft: '30px' }}>├─ {child.Description}</td>
                                    <td>{child.TypeDescription || ""}</td>
                                    <td className="text-right">{fmt(child.Balance)}</td>
                                  </tr>
                                ))}
                              </>
                            );
                          })}
                          
                          {/* Standalone accounts */}
                          {categoryData.parentAccounts.filter(parent => {
                            const hasChildren = categoryData.childAccounts.some(c => c.ParentId === parent.Id);
                            return !hasChildren;
                          }).map(acc => (
                            <tr key={acc.Id}>
                              <td>{acc.Code || "-"}</td>
                              <td>{acc.Description}</td>
                              <td>{acc.TypeDescription || ""}</td>
                              <td className="text-right">{fmt(acc.Balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  <div className="footer">
                    Rubani Sacco - Chart of Accounts • All amounts in Kenyan Shillings (KES)
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700">
                  <FaPrint className="mr-2" /> Print
                </Button>
                <Button onClick={handleExcel} className="bg-green-600 hover:bg-green-700">
                  <FaFileExcel className="mr-2" /> Export Excel
                </Button>
                <Button onClick={handlePDF} className="bg-red-600 hover:bg-red-700">
                  <FaDownload className="mr-2" /> Export PDF
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ══ TOP NAVIGATION – category tabs ══════════════════════ */}
      <div className="bg-white border-b px-6 flex items-center justify-between flex-shrink-0">
        <nav className="flex">
          {ACCOUNT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-5 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                selectedCategory === cat.value
                  ? "border-indigo-600 text-indigo-700 bg-gray-100"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="flex gap-2 py-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreview} 
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
          >
            <FaEye className="mr-1" /> Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExcel} 
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <FaFileExcel className="mr-1" /> Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePDF} 
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <FaDownload className="mr-1" /> Export PDF
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAddDrawerOpen(true)}>
            + Add Account
          </Button>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR – parent accounts (ParentId = null) ──────── */}
        <aside className="w-84 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-700 flex-shrink-0">
            <p className="text-white font-semibold text-sm">
              {ACCOUNT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
            </p>
            <p className="text-indigo-200 text-xs mt-0.5">Account Groups</p>
          </div>

          {/* Account name search input for sidebar */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Filter accounts by name..."
              value={accountNameSearch}
              onChange={(e) => setAccountNameSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="bg-gray-200 rounded-lg p-4 border border-gray-200 shadow-sm divide-y divide-gray-100">
              {loading ? (
                <p className="p-3 text-sm text-gray-400">Loading...</p>
              ) : filteredParentAccounts.length === 0 ? (
                <p className="p-3 text-sm text-gray-400">
                  {accountNameSearch ? "No accounts match your search" : "No accounts found"}
                </p>
              ) : (
                filteredParentAccounts.map((acc) => {
                  const active = selectedParent?.Id === acc.Id;
                  return (
                    <button
                      key={acc.Id}
                      onClick={() => { setSelectedParent(acc); setSearch(""); }}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all hover:text-white ${
                        active
                          ? "bg-indigo-600 text-white shadow-sm mb-2"
                          : "text-gray-700 hover:bg-indigo-600 hover:text-white bg-white mb-2"
                      }`}
                    >
                      <p className="font-semibold text-sm leading-tight">{acc.Description}</p>
                      <p className={`text-xs mt-1 ${active ? "text-indigo-200" : "text-gray-400"}`}>
                        Available: {fmt(acc.Balance)}
                      </p>
                      <p className={`text-xs ${active ? "text-indigo-200" : "text-gray-400"}`}>
                        Code: {acc.Code}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* ── CENTER – child accounts ───────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedParent ? (
            <>
              {/* Center header */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{selectedParent.Description}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedParent.CategoryDescription} · {childAccounts.length} sub-account{childAccounts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search sub-accounts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1.5 border rounded-md text-sm w-56 bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clear filter button when search is active */}
              {search && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center justify-between">
                  <span className="text-xs text-yellow-700">
                    Showing {filteredChildren.length} of {childAccounts.length} sub-accounts
                  </span>
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-yellow-700 hover:text-yellow-900 underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              {/* Child account list */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
                {childAccounts.length === 0 ? (
                  /* Parent has no sub-accounts — offer direct entry view */
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10 flex flex-col items-center gap-3 max-w-sm w-full">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700 text-sm">{selectedParent.Description}</p>
                        <p className="text-xs text-gray-400 mt-1">This account has no sub-accounts.</p>
                      </div>
                      <button
                        onClick={() => { setSelectedAccount(selectedParent); setDrawerOpen(true); }}
                        className="mt-1 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        View Transaction
                      </button>
                    </div>
                  </div>
                ) : filteredChildren.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <img src={NotFoundImage} className="w-28 mb-3 opacity-60" alt="" />
                    <p className="text-sm">No sub-accounts match your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredChildren.map((acc) => (
                      <div
                        key={acc.Id}
                        onClick={() => { setSelectedAccount(acc); setDrawerOpen(true); }}
                        className="bg-white px-5 py-4 rounded-xl border border-gray-200 cursor-pointer
                                   hover:border-indigo-400 hover:shadow-sm transition-all group flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                            {acc.Description}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {acc.TypeDescription}
                            {acc.Code ? ` · Code ${acc.Code}` : ""}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0 ml-6">
                          <p className="font-bold text-indigo-700 text-sm">{fmt(acc.Balance)}</p>
                          <p className="text-xs text-gray-400">Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state – nothing selected yet */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400 select-none">
                <p className="text-5xl mb-4">⟵</p>
                <p className="text-sm font-medium">Select an account group from the sidebar</p>
                <p className="text-xs mt-1">Sub-accounts will appear here</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ DRAWERS ══════════════════════════════════════════════ */}
      <AccountDrawer
        open={drawerOpen}
        account={selectedAccount}
        onClose={() => setDrawerOpen(false)}
      />
      <AddAccountDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={() => fetchAccounts(selectedCategory)}
      />

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
}