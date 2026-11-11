import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2, Plus, Save, Trash2, Upload, AlertTriangle, FilePlus2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "KES" });
const EMPTY_ROW = { accountId: "", description: "", debit: "", credit: "", department: "" };

export default function PostingJournal() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [refNo, setRefNo] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [showDepartments, setShowDepartments] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, r) => s + Number(r.debit || 0), 0);
    const credit = lines.reduce((s, r) => s + Number(r.credit || 0), 0);
    const diff = +(debit - credit).toFixed(2);
    return { debit, credit, diff };
  }, [lines]);

  const balanced = Math.abs(totals.diff) < 0.005 && totals.debit > 0 && totals.credit > 0;

  const updateLine = (idx, patch) => {
    setLines((prev) => {
      const copy = [...prev];
      const current = { ...copy[idx], ...patch };
      if ("debit" in patch && patch.debit !== "") current.credit = "";
      if ("credit" in patch && patch.credit !== "") current.debit = "";
      copy[idx] = current;
      return copy;
    });
  };

  const addRow = () => setLines((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));
  
  const clearAll = () => {
    setRefNo("");
    setMemo("");
    setLines([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    setAttachments([]);
    setBranchId("");
    setAccountSearch("");
  };

  const onImportCSV = () => alert("Import CSV not implemented in demo");
  const onAttachFiles = (files) => setAttachments((prev) => [...prev, ...Array.from(files || [])]);

  const saveDraft = () => {
    const draftPayload = { date, reference: refNo, memo, branchId, lines, totals, attachmentsCount: attachments.length };
    console.log("DRAFT:", draftPayload);
    Swal.fire({
      icon: "success",
      title: "Draft Saved",
      text: "Journal draft has been saved successfully!",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const postJournal = async () => {
    // Validate before submission
    if (!balanced) {
      Swal.fire({
        icon: "error",
        title: "Journal Not Balanced",
        html: `Debit: ${fmt(totals.debit)}<br/>Credit: ${fmt(totals.credit)}<br/>Difference: ${fmt(totals.diff)}`,
        confirmButtonColor: "#dc2626",
      });
      return;
    }
    
    if (!branchId) {
      Swal.fire({
        icon: "error",
        title: "Branch Required",
        text: "Please select a branch before posting.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const hasEntries = lines.some(l => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (!hasEntries) {
      Swal.fire({
        icon: "error",
        title: "No Entries",
        text: "Please add at least one journal entry line.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // Show loading state
    setIsSubmitting(true);
    
    Swal.fire({
      title: "Processing Journal...",
      text: "Please wait while your journal is being posted.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const apiPayload = lines
      .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
      .map((l) => ({
        TotalValue: Number(l.debit || l.credit || 0),
        DebitAmount: Number(l.debit || 0),
        CreditAmount: Number(l.credit || 0),
        BranchId: branchId,
        TransactionCode: 1,
        PrimaryDescription: memo || l.description || "Journal entry",
        SecondaryDescription: l.description || memo || "",
        Reference: refNo || `JRN-${Date.now()}`,
        ValueDate: date,
        CreditChartOfAccountId: l.credit ? l.accountId : "",
        DebitChartOfAccountId: l.debit ? l.accountId : "",
        ChartOfAccountId: l.accountId,
        ContraChartOfAccountId: "",
        Description: l.description || memo || "Journal entry",
      }));

    console.log("Posting payload:", apiPayload);

    try {
      const res = await fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/PostJournal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      
      const data = await res.json();
      
      if (res.ok && data.Success) {
        // Success - clear form and show success message
        clearAll();
        
        Swal.fire({
          icon: "success",
          title: "Journal Posted Successfully!",
          html: `
            <div class="text-center">
              <div class="mb-3">
                <i class="fas fa-check-circle text-green-500 text-5xl"></i>
              </div>
              <p class="mb-2">Reference: ${refNo || "Auto-generated"}</p>
              <p class="mb-2">Date: ${new Date(date).toLocaleDateString()}</p>
              <p class="mb-2">Total Debit: ${fmt(totals.debit)}</p>
              <p class="mb-2">Total Credit: ${fmt(totals.credit)}</p>
              <p class="text-sm text-gray-500 mt-3">Journal has been successfully posted to the ledger.</p>
            </div>
          `,
          confirmButtonText: "OK",
          confirmButtonColor: "#22c55e",
        });
      } else {
        // API error
        Swal.fire({
          icon: "error",
          title: "Failed to Post Journal",
          text: data.Message || data.Errors || "An error occurred while posting. Please try again.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (err) {
      console.error("Network error:", err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err.message || "Unable to connect to the server. Please check your connection and try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAccounts = accountOptions.filter(a =>
    a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
    a.type.toLowerCase().includes(accountSearch.toLowerCase())
  );

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`);
        const data = await res.json();
        if (data.Success && Array.isArray(data.Data)) {
          setAccountOptions(
            data.Data.map((acc) => ({
              id: acc.Id,
              name: acc.AccountName,
              type: acc.AccountTypeDescription,
              code: acc.AccountCode,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };

    const fetchBranches = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`);
        const data = await res.json();
        if (data.Success && Array.isArray(data.Data)) {
          setBranchOptions(data.Data.map((b) => ({ id: b.Id, description: b.Description })));
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    fetchAccounts();
    fetchBranches();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-2 md:p-8 space-y-4 mt-4 bg-white rounded-2xl shadow-2xl border-1 border-indigo-800">
      <div className="flex items-center justify-between bg-indigo-800 rounded-lg shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight p-4 text-white">New Journal Entry</h1>
        <div className="flex items-center gap-2 bg-indigo-800 p-4 rounded-lg shadow-2xl">
          <Button variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> Save draft
          </Button>
          <Button 
            disabled={!balanced || isSubmitting} 
            onClick={postJournal} 
            className="text-white bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Post journal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card className="shadow-2xl border-1 border-indigo-800">
        <CardHeader className="pb-2 bg-indigo-800 text-white rounded-t-lg">
          <CardTitle className="text-base">Header Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" className="bg-white" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Reference No.</Label>
            <Input id="ref" placeholder="e.g., JRN-00045" className="bg-white" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="memo">Memo / Description</Label>
            <Textarea 
              id="memo" 
              placeholder="Enter additional notes for this journal entry" 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)} 
              className="bg-white"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="shadow-2xl border-1 border-indigo-800">
        <CardHeader className="pb-2 flex-row items-center justify-between mb-2 bg-indigo-800 rounded-t-lg">
          <CardTitle className="text-base text-white">Journal Lines</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={addRow} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="min-w-[250px]">Account *</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="w-[150px] text-right">Debit (KES)</TableHead>
                  <TableHead className="w-[150px] text-right">Credit (KES)</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((row, idx) => (
                  <TableRow key={idx} className="border-b hover:bg-gray-50">
                    <TableCell className="align-top">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white hover:bg-gray-50"
                          >
                            {row.accountId
                              ? (() => {
                                  const account = accountOptions.find(a => a.id === row.accountId);
                                  return account ? `${account.name} (${account.code})` : "Select account";
                                })()
                              : "Select account"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 p-0" align="start">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search by name or code..."
                              value={accountSearch}
                              onChange={e => setAccountSearch(e.target.value)}
                              className="w-full"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredAccounts.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No accounts found
                              </div>
                            ) : (
                              filteredAccounts.map((a) => (
                                <Button
                                  key={a.id}
                                  variant="ghost"
                                  className="w-full justify-start rounded-none hover:bg-indigo-50 h-auto py-3 px-3"
                                  onClick={() => {
                                    updateLine(idx, { accountId: a.id });
                                    setAccountSearch("");
                                  }}
                                >
                                  <div className="text-left">
                                    <div className="font-medium text-sm">{a.name}</div>
                                    <div className="text-xs text-gray-500">
                                      Code: {a.code} | Type: {a.type}
                                    </div>
                                  </div>
                                </Button>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        placeholder="Line description"
                        value={row.description}
                        className="bg-white"
                        onChange={(e) => updateLine(idx, { description: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right bg-white"
                        placeholder="0.00"
                        value={row.debit}
                        onChange={(e) => updateLine(idx, { debit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right bg-white"
                        placeholder="0.00"
                        value={row.credit}
                        onChange={(e) => updateLine(idx, { credit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeRow(idx)} 
                        aria-label="Remove line"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={2} className="text-right">Totals:</TableCell>
                  <TableCell className="text-right text-green-700">
                    {fmt(totals.debit)}
                  </TableCell>
                  <TableCell className="text-right text-red-700">
                    {fmt(totals.credit)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {balanced ? (
                <Badge variant="default" className="gap-1 bg-green-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Out of balance by {fmt(Math.abs(totals.diff))}
                </Badge>
              )}
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-muted-foreground">{lines.length} line(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearAll} disabled={isSubmitting}>
                Reset Form
              </Button>
              <Button 
                disabled={!balanced || isSubmitting} 
                onClick={postJournal}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Post Journal
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-gray-400">
        <p>💡 Tip: Each line can have either a Debit OR a Credit amount, not both. Total Debits must equal Total Credits.</p>
      </div>
    </div>
  );
}