// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Swal from "sweetalert2";

// export default function AddAccountConfigurationDrawer({ open, onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     SystemGeneralLedgerAccountCode: "",
//     ChartOfAccountId: "",
//     Description: "",
//   });
//   const [loading, setLoading] = useState(false);

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const res = await fetch(
//         "https://94d802144a6f.ngrok-free.app/api/values/addSystemMapping",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "ngrok-skip-browser-warning": "true",
//           },
//           body: JSON.stringify({
//             SystemGeneralLedgerAccountCode: formData.SystemGeneralLedgerAccountCode,
//             ChartOfAccountId: formData.ChartOfAccountId,
//             Description: formData.Description,
//           }),
//         }
//       );

//       if (!res.ok) throw new Error("Failed to add account configuration");

//       Swal.fire("Success", "Account configuration added successfully!", "success");

//       setFormData({
//         SystemGeneralLedgerAccountCode: "",
//         ChartOfAccountId: "",
//         Description: "",
//       });

//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to add account configuration.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           {/* Background Overlay */}
//           <motion.div
//             className="fixed inset-0 bg-black z-40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.4 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />
//           {/* Drawer */}
//           <motion.div
//             className="fixed top-5 right-5 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 300, damping: 30 }}
//           >
//             {/* Header */}
//             <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//               <h2 className="font-bold text-lg text-white">Add Account Configuration</h2>
//               <Button variant="outline" size="sm" onClick={onClose}>
//                 Close
//               </Button>
//             </div>

//             {/* Form */}
//             <div className="p-3 flex-1 overflow-y-auto">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <Label>System General Ledger Account Code</Label>
//                   <Input
//                     placeholder="Enter GL Account Code"
//                     value={formData.SystemGeneralLedgerAccountCode}
//                     onChange={(e) => handleChange("SystemGeneralLedgerAccountCode", e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Chart Of Account Id</Label>
//                   <Input
//                     placeholder="Enter Chart Of Account Id"
//                     value={formData.ChartOfAccountId}
//                     onChange={(e) => handleChange("ChartOfAccountId", e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Description</Label>
//                   <Input
//                     placeholder="Enter Description"
//                     value={formData.Description}
//                     onChange={(e) => handleChange("Description", e.target.value)}
//                   />
//                 </div>

//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-indigo-600 hover:bg-indigo-700"
//                 >
//                   {loading ? "Saving..." : "Save Account"}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }












import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";





/* ---------------- SUB DRAWERS ---------------- */

// Chart of Account Drawer
function ChartOfAccountSubDrawer({ open, onClose, onSelect }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchAccounts = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`
          );
          const data = await res.json();
          if (data.Success) setAccounts(data.Data);
        } catch (err) {
          console.error("Failed to fetch chart of accounts:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAccounts();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-48"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-135 w-[350px] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-4 h-150"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center mb-4 bg-indigo-700 p-4 rounded-2xl">
              <h3 className="text-lg font-bold text-white">Select Chart of Account</h3>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {loading ? (
              <p>Loading accounts...</p>
            ) : (
              <div className="space-y-2 overflow-y-auto">
                {accounts.map((acc) => (
                  <div
                    key={acc.Id}
                    onClick={() => {
                      onSelect(acc);
                      onClose();
                    }}
                    className="p-3 border rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    <p className="font-medium">{acc.AccountName}</p>
                    <p className="text-sm text-gray-500">{acc.Id}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}





// System General Ledger Drawer
function SystemGLSubDrawer({ open, onClose, onSelect }) {
  const [glAccounts, setGlAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchGl = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetSystemMapItems`
          );
          const data = await res.json();
          // ✅ API returns an array directly
          if (Array.isArray(data)) setGlAccounts(data);
        } catch (err) {
          console.error("Failed to fetch GL accounts:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchGl();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-135 w-[350px] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-4 h-150"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center mb-4 bg-indigo-700 p-4 rounded-2xl">
              <h3 className="text-lg font-bold text-white">Select System GL Account</h3>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {loading ? (
              <p>Loading GL accounts...</p>
            ) : (
              <div className="space-y-2 overflow-y-auto">
                {glAccounts.map((gl) => (
                  <div
                    key={gl.Value}
                    onClick={() => {
                      onSelect(gl); // send whole object to parent
                      onClose();
                    }}
                    className="p-3 border rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    <p className="font-medium">{gl.Text}</p>
                    <p className="text-sm text-gray-500">{gl.Value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}






/* ---------------- MAIN DRAWER ---------------- */

export default function AddAccountConfigurationDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    SystemGeneralLedgerAccountCode: "",
    ChartOfAccountId: "",
    Description: "",
  });
  const [loading, setLoading] = useState(false);

  const [coaDrawerOpen, setCoaDrawerOpen] = useState(false);
  const [glDrawerOpen, setGlDrawerOpen] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  console.log(formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/addSystemMapping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error("Failed to add account configuration");

      Swal.fire("Success", "Account configuration added successfully!", "success");

      setFormData({
        SystemGeneralLedgerAccountCode: "",
        ChartOfAccountId: "",
        Description: "",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add account configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-5 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Account Configuration</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Form */}
            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* System GL Account Code */}
                <div>
                  <Label>System General Ledger Account</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Select GL Account"
                      value={formData.SystemGeneralLedgerAccountName}   // 👈 show label
                      readOnly
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => setGlDrawerOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Select
                    </Button>
                  </div>
                </div>


                {/* Chart of Account */}
                <div>
                  <Label>Chart Of Account</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Select Chart Of Account"
                      value={formData.ChartOfAccountName}   // 👈 show label
                      readOnly
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => setCoaDrawerOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Select
                    </Button>
                  </div>
                </div>


                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Enter Description"
                    value={formData.Description}
                    onChange={(e) => handleChange("Description", e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Account"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Sub Drawers */}
          <SystemGLSubDrawer
            open={glDrawerOpen}
            onClose={() => setGlDrawerOpen(false)}
            onSelect={(gl) => {
              handleChange("SystemGeneralLedgerAccountCode", gl.Value);   // value
              handleChange("SystemGeneralLedgerAccountName", gl.Text);    // label
            }}
          />



          <ChartOfAccountSubDrawer
            open={coaDrawerOpen}
            onClose={() => setCoaDrawerOpen(false)}
            onSelect={(acc) => {
              handleChange("ChartOfAccountId", acc.Id);              // 👈 value
              handleChange("ChartOfAccountName", acc.AccountName);   // 👈 label
            }}
          />

        </>
      )}
    </AnimatePresence>
  );
}
