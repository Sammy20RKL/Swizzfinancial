import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import * as authApi from "@/apis/auth/authApi";

export default function EditUser({ open, onClose, refresh, user }) {
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    PhoneNumber: "",
    Department: "",
    Role: "",
  });

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  useEffect(() => {
    if (open && user) {
      setForm({
        FirstName: user.FirstName || "",
        LastName: user.LastName || "",
        Email: user.Email || "",
        PhoneNumber: user.PhoneNumber || "",
        Department: user.Department || "",
        Role: user.Role || "",
      });
      fetchRoles();
    }
  }, [open, user]);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await authApi.getRoles();
      const data = response.data;
      if (data.success) setRoles(data.data);
    } catch (error) {
      Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.FirstName || !form.LastName || !form.Email) {
      Swal.fire("Missing Fields", "First name, last name and email are required.", "warning");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.updateUser(user.Id, {
        firstName: form.FirstName,
        lastName: form.LastName,
        email: form.Email,
        phoneNumber: form.PhoneNumber,
        department: form.Department,
        role: form.Role,
      });

      const data = response.data;
      if (data?.success === false) {
        throw new Error(data.message || "Update failed");
      }

      Swal.fire("Success!", "User updated successfully", "success");

      if (refresh) refresh();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && user && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-3 right-3 w-[90vw] max-w-[700px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="bg-gray-200 m-2 rounded-xl">
              <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                <h2 className="font-bold text-xl text-white">
                  Edit User — {user.Username}
                </h2>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl m-3 overflow-y-auto h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={form.FirstName}
                      onChange={(e) => update("FirstName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={form.LastName}
                      onChange={(e) => update("LastName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.Email}
                      onChange={(e) => update("Email", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={form.PhoneNumber}
                      onChange={(e) => update("PhoneNumber", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Role</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={form.Role}
                      onChange={(e) => update("Role", e.target.value)}
                    >
                      <option value="">
                        {rolesLoading ? "Loading roles..." : "Select Role"}
                      </option>
                      {roles.map((role) => (
                        <option key={role.Id} value={role.RoleName}>
                          {role.RoleName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Department</Label>
                    <Input
                      value={form.Department}
                      onChange={(e) => update("Department", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
