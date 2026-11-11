import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEllipsisV,
  FaUniversity,
  FaMoneyCheck,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { MdEditDocument } from "react-icons/md";
import AddAccountConfigurationDrawer from "./AddAccountConfigurationDrawer";
import UpdateAccountConfigurationDrawer from "./UpdateAccountConfigurationDrawer";

export default function AccountConfiguration() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = () => {
    fetch(
      `${import.meta.env.VITE_APP_FIN_URL}/api/values/getSystemMappings`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    )
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.Data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This mapping will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // adjust DELETE api if provided
          const res = await fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/${id}`,
            {
              method: "DELETE",
            }
          );
          if (!res.ok) throw new Error("Failed to delete mapping");

          Swal.fire("Deleted!", "Account mapping deleted.", "success");
          fetchAccounts();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete mapping.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white px-8 py-8  rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheck className="text-white" /> Account Configuration
        </h2>
        <Button
          onClick={() => setOpenDrawer(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Account
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">GL Code</span>
          <span className="col-span-3">Description</span>
          <span className="col-span-3">Chart of Account</span>
          <span className="col-span-2">Cost Center</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

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
        ) : accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.Id}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-2">
                    {acc.SystemGeneralLedgerAccountCode}
                  </span>
                  <span className="col-span-3">
                    {acc.SystemGeneralLedgerAccountCodeDescription}
                  </span>
                  <span className="col-span-3">
                    {acc.ChartOfAccountName || "-"}
                  </span>
                  <span className="col-span-2">
                    {acc.ChartOfAccountCostCenterDescription || "-"}
                  </span>


                  <div className="col-span-2 flex justify-end">
                    <Button
                      className="bg-indigo-700 hover:bg-indigo-600"
                      onClick={() => {
                        setSelectedAccount(acc);
                        setEditDrawerOpen(true);
                      }}>
                      <MdEditDocument className="mr-1 text-white" />
                      Edit
                    </Button>
                  </div>
                  {/* Actions 
                  <div className="col-span-2 flex justify-end">
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
                          onClick={() => {
                            setSelectedAccount(acc);
                            setEditDrawerOpen(true);
                          }}
                        >
                          <MdEditDocument className="mr-2 text-blue-600" />
                          Edit
                        </DropdownMenuItem>
                        /<DropdownMenuItem
                          className="hover:text-red-600 text-indigo-600"
                          onClick={() => handleDelete(acc.Id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>*/}

                </div>

                {/* Expanded Detail */}
                {expandedAccount === acc.Id && (
                  <div className="border-t bg-gray-200 p-2 rounded-b-lg">
                    <div className="grid grid-cols-4 gap-2 bg-white p-4 rounded-lg border">
                      <span className="font-semibold flex gap-2">
                        <FaUniversity className="text-blue-600" />
                        Account Type: {acc.ChartOfAccountAccountType}
                      </span>
                      <span>Account Code: {acc.ChartOfAccountAccountCode}</span>
                      <span>
                        Name: {acc.ChartOfAccountAccountName || "N/A"}
                      </span>
                      <span>Created: {acc.CreatedDate}</span>
                    </div>
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
            <p className="font-medium text-gray-400">No Accounts Found.</p>
          </div>
        )}
      </div>

      <UpdateAccountConfigurationDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      <AddAccountConfigurationDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
