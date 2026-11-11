import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { Trash2, Plus } from "lucide-react";
import CustomerSelectModal from "./CustomerSelectModal";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const firstOfMonthStr = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .split("T")[0];

const EMPTY_LINE = {
  customerId: "",
  customerAccountId: "",
  accountName: "",
  memberName: "",
  primaryDescription: "",
  secondaryDescription: "",
  principal: "",
  interest: "",
  availableBalance: 0,
  memberAccounts: [],
};

export default function AddInterAccountTransfer({ open, onClose, onSuccess }) {
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

  const [selectedSourceMember, setSelectedSourceMember] = useState(null);
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [selectedSourceAccountId, setSelectedSourceAccountId] = useState("");

  const [allBranches, setAllBranches] = useState([]);
  const [reference, setReference] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [startDate, setStartDate] = useState(firstOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [wireTransferAuthOption, setWireTransferAuthOption] = useState("1");
  const [availableBalance, setAvailableBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [entryModal, setEntryModal] = useState({ open: false, index: null });
  const [branchId, setBranchId] = useState("");

  const totalPrincipal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.principal || 0), 0),
    [lines]
  );
  const totalInterest = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.interest || 0), 0),
    [lines]
  );

  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`)
      .then((res) => res.json())
      .then((data) => {
        if (data.Success) setAllBranches(data.Data || []);
      })
      .catch((err) => {
        console.error(err);
        Swal.fire("Error", "Failed to load branches", "error");
      });
  }, []);

  const addLine = () => setLines((p) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));
  const updateLine = (i, patch) =>
    setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const fetchAccounts = (customerId) =>
    fetch(
      `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerAccount/by-customer?customerId=${customerId}`
    )
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);

  const onSourceMemberSelect = async (member) => {
    setSelectedSourceMember(member);
    setSelectedSourceAccountId("");
    setSourceAccounts([]);
    const accounts = await fetchAccounts(member.Id);
    setSourceAccounts(accounts);
  };

  const onEntryMemberSelect = async (lineIndex, member) => {
    updateLine(lineIndex, {
      customerId: member.Id,
      memberName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
      customerAccountId: "",
      accountName: "",
      availableBalance: 0,
      memberAccounts: [],
    });
    const accounts = await fetchAccounts(member.Id);
    updateLine(lineIndex, { memberAccounts: accounts });
  };

  const onEntryAccountSelect = (lineIndex, accountId) => {
    const line = lines[lineIndex];
    const account = (line.memberAccounts || []).find((a) => a.Id === accountId);
    if (!account) return;
    updateLine(lineIndex, {
      customerAccountId: account.Id,
      accountName: account.AccountName,
      availableBalance: account.AvailableBalance,
    });
  };

  const sourceBalance = useMemo(() => {
    const acc = sourceAccounts.find((a) => a.Id === selectedSourceAccountId);
    return acc ? Number(acc.AvailableBalance || 0) : 0;
  }, [sourceAccounts, selectedSourceAccountId]);

  // Auto-populate availableBalance input when source account changes
  useEffect(() => {
    if (sourceBalance > 0) setAvailableBalance(String(sourceBalance));
  }, [sourceBalance]);

  const postBatch = async () => {
    if (lines.some((l) => !l.customerAccountId)) {
      Swal.fire("Error", "All batch lines must have a member and account selected", "error");
      return;
    }
    if (!selectedSourceAccountId) {
      Swal.fire("Error", "Please select a source account", "error");
      return;
    }

    const payload = {
      branchId,
      customerAccountId: selectedSourceAccountId,
      batchNumber: batchNumber ? Number(batchNumber) : undefined,
      reference: reference || `REF-${Math.floor(Math.random() * 9999)}`,
      availableBalance: availableBalance !== "" ? Number(availableBalance) : sourceBalance,
      createdBy: "system.user",
      startDate: startDate ? `${startDate}T00:00:00` : undefined,
      endDate: endDate ? `${endDate}T23:59:59` : undefined,
      wireTransferAuthOption: Number(wireTransferAuthOption),
      interAccountBatchEntries: lines.map((l) => ({
        customerAccountId: l.customerAccountId,
        principal: l.principal !== "" ? Number(l.principal) : undefined,
        interest: Number(l.interest || 0),
        primaryDescription: l.primaryDescription || "Transfer",
        secondaryDescription: l.secondaryDescription || "",
        reference: `REF-${Math.floor(Math.random() * 9999)}`,
        createdBy: "system.user",
      })),
    };

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/InterAccountTransferBatch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      console.log("Batch post response:", data);

      if (data.Success) {
        Swal.fire("Success", "Batch posted successfully", "success");
        setLines([{ ...EMPTY_LINE }]);
        setReference("");
        setBatchNumber("");
        setStartDate(firstOfMonthStr);
        setEndDate(todayStr);
        setWireTransferAuthOption("1");
        setAvailableBalance("");
        setSelectedSourceMember(null);
        setSelectedSourceAccountId("");
        setSourceAccounts([]);
        setBranchId("");
        if (onSuccess) onSuccess(data);
      } else {
        Swal.fire("Error", data.Message || "Failed to post batch", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          className="fixed top-5 right-5 h-[90vh] w-full max-w-4xl bg-white shadow-2xl rounded-xl z-50 overflow-auto"
        >
          <div className="p-3 flex justify-between items-center bg-indigo-500 text-white m-2 rounded-2xl">
            <h2 className="text-xl font-bold">Add Inter-Account Transfer Batch</h2>
            <Button variant="ghost" onClick={() => onClose(false)} className="bg-indigo-700">
              Close
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* HEADER */}
            <div className="grid grid-cols-3 gap-4 bg-gray-200 p-3 rounded-xl">
              {/* Source Member */}
              <div>
                <Label>Select Source Member</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSourceModalOpen(true)}
                >
                  {selectedSourceMember
                    ? `${selectedSourceMember.IndividualFirstName} ${selectedSourceMember.IndividualLastName}`
                    : "Select member"}
                </Button>
              </div>

              {/* Source Account (customerAccountId in payload) */}
              <div>
                <Label>Source Account</Label>
                <Select
                  value={selectedSourceAccountId}
                  onValueChange={setSelectedSourceAccountId}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceAccounts
                      .filter((a) => a.CustomerAccountTypeTargetProductDescription !== "ENTRANCE FEE")
                      .map((a) => (
                        <SelectItem key={a.Id} value={a.Id}>
                          {a.CustomerAccountTypeTargetProductDescription}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedSourceAccountId && (
                  <div className="mt-1 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700 font-medium">
                    Account Balance:{" "}
                    {sourceBalance.toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                    })}
                  </div>
                )}
              </div>

              {/* Available Balance (user-editable, sent in payload) */}
              <div>
                <Label>Available Balance</Label>
                <Input
                  type="number"
                  value={availableBalance}
                  onChange={(e) => setAvailableBalance(e.target.value)}
                  placeholder="Enter available balance"
                  className="bg-gray-50"
                />
                <p className="mt-0.5 text-xs text-gray-400">Auto-filled from account; can be overridden</p>
              </div>

              {/* Branch */}
              <div>
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBranches.map((branch) => (
                      <SelectItem key={branch.Id} value={branch.Id}>
                        {branch.PaddedCode} — {branch.Description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div>
                <Label>Reference</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. JAN-REFUND-2026"
                  className="bg-gray-50"
                />
              </div>

              {/* Batch Number */}
              {/* <div>
                <Label>Batch Number</Label>
                <Input
                  type="number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. 1025"
                  className="bg-gray-50"
                />
              </div> */}

              {/* Wire Transfer Auth Option */}
              {/* <div>
                <Label>Wire Transfer Auth</Label>
                <Select value={wireTransferAuthOption} onValueChange={setWireTransferAuthOption}>
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                    <SelectItem value="3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* Start Date */}
              {/* <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-50"
                />
              </div> */}

              {/* End Date */}
              {/* <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-50"
                />
              </div> */}
            </div>

            {/* LINES */}
            <div className="border rounded">
              <div className="grid grid-cols-12 bg-gray-600 text-white p-2 text-xs font-semibold uppercase">
                <div className="col-span-2">Member</div>
                <div className="col-span-3">Account</div>
                {/* <div className="col-span-2">Primary Desc.</div> */}
                <div className="col-span-3">Principal</div>
                <div className="col-span-2">Interest</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 border-b p-2 bg-gray-50 gap-2 items-start">
                  <div className="col-span-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs h-9"
                      onClick={() => setEntryModal({ open: true, index: i })}
                    >
                      {l.memberName || "Select member"}
                    </Button>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={l.customerAccountId || ""}
                      onValueChange={(v) => onEntryAccountSelect(i, v)}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {(l.memberAccounts || [])
                          .filter((a) => a.CustomerAccountTypeTargetProductDescription !== "ENTRANCE FEE")
                          .map((a) => (
                            <SelectItem key={a.Id} value={a.Id}>
                              {
                                a.CustomerAccountTypeTargetProductDescription}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {l.customerAccountId && (
                      <div className="mt-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
                        Bal:{" "}
                        {Number(l.availableBalance || 0).toLocaleString("en-KE", {
                          style: "currency",
                          currency: "KES",
                        })}
                      </div>
                    )}
                  </div>

                  {/* <div className="col-span-2">
                    <Input
                      placeholder="Primary desc."
                      value={l.primaryDescription}
                      onChange={(e) => updateLine(i, { primaryDescription: e.target.value })}
                      className="text-xs h-9"
                    />
                    <Input
                      placeholder="Secondary desc."
                      value={l.secondaryDescription}
                      onChange={(e) => updateLine(i, { secondaryDescription: e.target.value })}
                      className="text-xs h-9 mt-1"
                    />
                  </div> */}

                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Principal"
                      value={l.principal}
                      onChange={(e) => updateLine(i, { principal: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Interest"
                      value={l.interest}
                      onChange={(e) => updateLine(i, { interest: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end pt-1">
                    {lines.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removeLine(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="p-2 text-right font-semibold text-sm">
                Total Principal: {totalPrincipal.toLocaleString("en-KE", { style: "currency", currency: "KES" })} &nbsp;|&nbsp; Total Interest:{" "}
                {totalInterest.toLocaleString("en-KE", { style: "currency", currency: "KES" })}
              </div>
            </div>

            <Button variant="outline" onClick={addLine} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Line
            </Button>

            <div className="flex justify-end gap-2">
              <Button onClick={postBatch} className="bg-indigo-700 text-white">
                {loading ? "Posting..." : "Post Batch"}
              </Button>
            </div>
          </div>

          <CustomerSelectModal
            open={sourceModalOpen}
            onClose={() => setSourceModalOpen(false)}
            onSelect={(member) => onSourceMemberSelect(member)}
          />

          <CustomerSelectModal
            open={entryModal.open}
            onClose={() => setEntryModal({ open: false, index: null })}
            onSelect={(member) => onEntryMemberSelect(entryModal.index, member)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
