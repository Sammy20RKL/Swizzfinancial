import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddPaymentVoucherDrawer from "./AddPaymentVoucherDrawer"; // import the drawer
import {
  FaChevronDown,
  FaChevronUp,
  FaMoneyCheckAlt,
  FaEllipsisV,
  FaTrash,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

export default function PaymentVoucher() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const fetchPayments = () => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPayments`)
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.Data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };


  console.log(payments);

  useEffect(() => {
    fetchPayments();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will delete the payment voucher.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_PRO_URL}/api/values/DeletePayment/${id}`,
            {
              method: "DELETE"
            }
          );
          if (!res.ok) throw new Error("Failed to delete payment");

          Swal.fire("Deleted!", "Payment voucher has been deleted.", "success");
          fetchPayments();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete voucher.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> Payment Vouchers
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
        >
          + New Voucher
        </Button>
      </div>

      {/* Table Header */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Voucher No</span>
          <span className="col-span-2">Invoice No</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Posted</span>
          <span className="col-span-2">Reference</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>


        {/* Loader */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
              >
                {Array.from({ length: 12 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.Id}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Main Row */}
                <div className="grid grid-cols-13 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-green-700 col-span-2 truncate">
                    {payment.VoucherNumber}
                  </span>
                  <span className="col-span-2">{payment.InvoiceNo}</span>
                  <span className="col-span-2 text-indigo-600 font-semibold">
                    {payment.Amount}
                  </span>
                  <span
                    className={`text-sm col-span-2 px-2 py-1 rounded-full text-center ${payment.Posted
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                      }`}
                  >
                    {payment.Posted ? "Posted" : "Pending"}
                  </span>
                  <span className="col-span-2">{payment.Reference || "-"}</span>

                  <span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                      onClick={() =>
                        setExpandedPayment(
                          expandedPayment === payment.Id ? null : payment.Id
                        )
                      }
                    >
                      {expandedPayment === payment.Id ? (
                        <>
                          <FaChevronUp /> Hide Payment Lines
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View Payment Lines
                        </>
                      )}
                    </Button>
                  </span>

                  {/* Actions */}
                  <span className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <FaEllipsisV className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          className="hover:text-red-600 text-indigo-600"
                          onClick={() => handleDelete(payment.Id)}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>


                </div>

                {/* Expanded Payment Lines */}
                <div className="border-t bg-gray-100 px-6 py-2">

                </div>

                {expandedPayment === payment.Id && payment.PaymentLines && (
                  <div className="border-t bg-white p-3">
                    {payment.PaymentLines.length > 0 ? (
                      <div className="divide-y">
                        {payment.PaymentLines.map((line) => (
                          <div
                            key={line.Id}
                            className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-md border"
                          >
                            <span className="col-span-2 font-semibold text-green-800">
                              {line.Description}
                            </span>
                            <span className="col-span-1">
                              Qty: {line.Quantity}
                            </span>
                            <span className="col-span-1">
                              Total: {line.TotalAmount}
                            </span>
                            <span className="col-span-2 text-gray-500 text-sm">
                              ChartId: {line.ChartOfAccountId}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic px-6 py-3">
                        No payment lines found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">No Payments Found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddPaymentVoucherDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
