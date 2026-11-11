import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import * as authApi from "@/apis/auth/authApi";

export default function RegisterMember({ open, onClose, refresh }) {
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Username: "",
    Email: "",
    PhoneNumber: "",
    Password: "",
    ConfirmPassword: "",
    Role: "",
    Department: "",
  });

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // ✅ Fetch Roles when drawer opens
  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await authApi.getRoles();
      const data = response.data;

      if (data.success) {
        setRoles(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !form.FirstName ||
      !form.LastName ||
      !form.Username ||
      !form.Email ||
      !form.Password ||
      !form.Role
    ) {
      Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
      return;
    }

    if (form.Password !== form.ConfirmPassword) {
      Swal.fire("Password Error", "Passwords do not match.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        firstName: form.FirstName,
        lastName: form.LastName,
        username: form.Username,
        email: form.Email,
        phoneNumber: form.PhoneNumber,
        password: form.Password,
        role: form.Role,
        department: form.Department,
      });

      const data = response.data;

      if (data?.success === false) {
        throw new Error(data.message || "Registration failed");
      }

      Swal.fire("Success!", "User registered successfully", "success");

      setForm({
        FirstName: "",
        LastName: "",
        Username: "",
        Email: "",
        PhoneNumber: "",
        Password: "",
        ConfirmPassword: "",
        Role: "",
        Department: "",
      });

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
      {open && (
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
                  Register New User
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
                    <Label>Username *</Label>
                    <Input
                      value={form.Username}
                      onChange={(e) => update("Username", e.target.value)}
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

                  <div className="relative">
                    <Label>Password *</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.Password}
                      onChange={(e) => update("Password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div>
                    <Label>Confirm Password *</Label>
                    <Input
                      type="password"
                      value={form.ConfirmPassword}
                      onChange={(e) =>
                        update("ConfirmPassword", e.target.value)
                      }
                    />
                  </div>

                  {/* ✅ ROLE DROPDOWN */}
                  <div>
                    <Label>Role *</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={form.Role}
                      onChange={(e) => update("Role", e.target.value)}
                    >
                      <option value="">
                        {rolesLoading
                          ? "Loading roles..."
                          : "Select Role"}
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
                    {loading ? "Registering..." : "Register User"}
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