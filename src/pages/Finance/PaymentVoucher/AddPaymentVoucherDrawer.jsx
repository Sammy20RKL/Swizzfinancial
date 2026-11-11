import { useState, useEffect } from "react";
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
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoIosArrowDropleftCircle } from "react-icons/io";

export default function AddPaymentVoucherDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    Description: "",
    InvoiceId: "4FB331D4-F695-F011-B055-C8E2651EF92D", // default invoice id
    PaymentMethod: "Cash",
    BankLinkageChartOfAccountId: "9DE7809D-7C26-F011-8984-28C63F4EECBE",
    VendorNo: 0,
    PaidDate: new Date().toISOString().split("T")[0],
    PaymentLines: [
      {
        InvoiceId: "",
        Type: 1,
        ChartOfAccountId: "",
        Description: "",
        Quantity: 1,
        TotalAmount: 0,
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [showLinesDrawer, setShowLinesDrawer] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [invoiceLines, setInvoiceLines] = useState([]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.PaymentLines];
    updated[index][field] =
      field === "Quantity" || field === "TotalAmount"
        ? parseFloat(value) || 0
        : value;
    setFormData({ ...formData, PaymentLines: updated });
  };

  // When user selects an invoice line, auto-fill fields
  const handleInvoiceLineSelect = (index, invoiceLineId) => {
    const selected = invoiceLines.find(
      (line) => line.PurchaseInvoiceId === invoiceLineId
    );
    if (selected) {
      const updated = [...formData.PaymentLines];
      updated[index] = {
        ...updated[index],
        InvoiceId: selected.PurchaseInvoiceId,
        Type: selected.Type,
        ChartOfAccountId: selected.DebitChartOfAccountId,
        Description: selected.Description,
        Quantity: selected.Quantity,
        TotalAmount: selected.TotalAmount,
      };
      setFormData({ ...formData, PaymentLines: updated });
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      PaymentLines: [
        ...formData.PaymentLines,
        {
          InvoiceId: "",
          Type: 1,
          ChartOfAccountId: "",
          Description: "",
          Quantity: 1,
          TotalAmount: 0,
        },
      ],
    });
    setExpandedIndex(formData.PaymentLines.length);
  };

  const removeLine = (index) => {
    const updated = formData.PaymentLines.filter((_, i) => i !== index);
    setFormData({ ...formData, PaymentLines: updated });
    setExpandedIndex(null);
  };

  // Submit voucher
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/PostPaymentVoucher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData),
        }
      );

      console.log(formData);
      console.log(res);

      const data = await res.json().catch(() => ({}));
      console.log(data);
      if (!res.ok) throw new Error(data.message || "Failed to create voucher");

      Swal.fire("Success", "Payment Voucher created successfully", "success");

      // reset
      setFormData({
        Description: "",
        InvoiceId: "4FB331D4-F695-F011-B055-C8E2651EF92D",
        PaymentMethod: "Cash",
        BankLinkageChartOfAccountId: "9DE7809D-7C26-F011-8984-28C63F4EECBE",
        VendorNo: 0,
        PaidDate: new Date().toISOString().split("T")[0],
        PaymentLines: [
          {
            InvoiceId: "",
            Type: 1,
            ChartOfAccountId: "",
            Description: "",
            Quantity: 1,
            TotalAmount: 0,
          },
        ],
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Expand first line when opening drawer
  useEffect(() => {
    if (showLinesDrawer && formData.PaymentLines.length > 0) {
      setExpandedIndex(0);
    }
  }, [showLinesDrawer, formData.PaymentLines.length]);

  // Fetch static data
  useEffect(() => {
    // fetch Payment Types
    fetch(
      `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoiceEntryTypes`
    )
      .then((res) => res.json())
      .then((data) => setPaymentTypes(data))
      .catch((err) => console.error("Error fetching payment types:", err));

    // fetch Chart of Accounts
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`)
      .then((res) => res.json())
      .then((data) => {
        const accounts = Array.isArray(data) ? data : data.Data || [];
        setChartOfAccounts(accounts);
      })
      .catch(() => setChartOfAccounts([]));

    // fetch Invoice Lines
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/invoicelines`)
      .then((res) => res.json())
      .then((data) => {
        if (data.Success && Array.isArray(data.Data)) {
          setInvoiceLines(data.Data);
        }
      })
      .catch((err) => console.error("Error fetching invoice lines:", err));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">
                Add Payment Voucher
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.Description}
                    onChange={(e) =>
                      handleChange("Description", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Vendor No</Label>
                  <Input
                    type="number"
                    value={formData.VendorNo}
                    onChange={(e) =>
                      handleChange("VendorNo", parseInt(e.target.value))
                    }
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Input
                    value={formData.PaymentMethod}
                    onChange={(e) =>
                      handleChange("PaymentMethod", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Paid Date</Label>
                  <Input
                    type="date"
                    value={formData.PaidDate}
                    onChange={(e) => handleChange("PaidDate", e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => setShowLinesDrawer(true)}
                  className="bg-gray-700 w-full flex justify-between gap-2"
                >
                  <IoIosArrowDropleftCircle /> Add Payment Lines (
                  {formData.PaymentLines.length})
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Payment Voucher"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Lines Drawer */}
          <AnimatePresence>
            {showLinesDrawer && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black z-48"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowLinesDrawer(false)}
                />
                <motion.div
                  className="fixed top-5 right-[520px] w-[450px] max-h-[90vh] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-3"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                    <h2 className="font-bold text-lg text-white">
                      Payment Lines
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinesDrawer(false)}
                    >
                      Close
                    </Button>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-2">
                    {formData.PaymentLines.map((line, idx) => (
                      <div key={idx} className="border rounded-lg">
                        <div
                          className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                          onClick={() =>
                            setExpandedIndex(
                              expandedIndex === idx ? null : idx
                            )
                          }
                        >
                          <span className="font-semibold">
                            Line {idx + 1} - {line.Description || "New Line"}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLine(idx);
                              }}
                            >
                              <FaTrash />
                            </button>
                            {expandedIndex === idx ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedIndex === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden p-2 space-y-2"
                            >
                              {/* Invoice line dropdown */}
                              <Label>Select Invoice Line</Label>
                              <Select
                                value={line.InvoiceId || ""}
                                onValueChange={(val) =>
                                  handleInvoiceLineSelect(idx, val)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Invoice Line" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {invoiceLines.map((inv) => (
                                    <SelectItem
                                      key={inv.PurchaseInvoiceId}
                                      value={inv.PurchaseInvoiceId}
                                    >
                                      {inv.Description} - {inv.TotalAmount}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                value={line.Description}
                                disabled
                                placeholder="Description"
                              />

                              <Input
                                type="number"
                                value={line.Quantity}
                                onChange={(e) =>
                                  handleLineChange(idx, "Quantity", e.target.value)
                                }
                                placeholder="Quantity"
                              />

                              <Input
                                type="number"
                                value={line.TotalAmount}
                                onChange={(e) =>
                                  handleLineChange(idx, "TotalAmount", e.target.value)
                                }
                                placeholder="Total Amount"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addLine}
                      className="bg-indigo-600 w-full"
                    >
                      + Add Payment Line
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
