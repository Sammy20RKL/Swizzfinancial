import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import * as authApi from "@/apis/auth/authApi";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.identifier || !form.password) {
      Swal.fire("Missing Fields", "Please enter your email/username and password.", "warning");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login(form.identifier, form.password);
      const data = response.data;

      if (data?.success === false) {
        throw new Error(data?.message || "Login failed.");
      }

      const token = data?.data?.Token;
      const userInfo = data?.data;

      if (!token) {
        throw new Error(data?.message || "Login failed: no token returned.");
      }

      // Store both token and user data (including CompanyId)
      login(token, userInfo);

      const redirectTo = location.state?.from?.pathname || "/Membership/Members";
      navigate(redirectTo, { replace: true });
      
      Swal.fire({
        title: "Success!",
        text: "Login successful!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to log in. Please check your credentials.";
      Swal.fire("Login Failed", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Section */}
      <div className="w-1/2 bg-[#3E1FB6] text-white flex flex-col justify-center items-end relative overflow-hidden">
        <div className="relative z-10 w-full">
          {/* Logo */}
          <div className="flex items-center mb-6 ml-50">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
              <span className="text-[#3E1FB6] font-bold text-lg">S</span>
            </div>
            <h2 className="ml-3 font-semibold text-xl">Swift Financial</h2>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold leading-snug mb-4 ml-50">
            Simplify your finance <br /> with Swift Financial
          </h1>
          <p className="text-gray-200 mb-6 ml-50">
            Manage accounts, journals, and payments — all in one place.
          </p>

          {/* Web App Skeleton */}
          <div className="rounded-l-xl overflow-hidden shadow-2xl border border-white bg-[#2B1B8C] backdrop-blur-sm max-[300px] ml-40">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-14 bg-[#2B1B8C] p-3 flex flex-col space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-md ${i === 1
                      ? "bg-[#6B4EFF] animate-pulse"
                      : "bg-[#4B38C3] animate-pulse"
                      }`}
                  ></div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex flex-col w-full">
                <div className=" flex-1 bg-[#2B1B8C] shimmer justify-items-end">
                  <div className="bg-gray-200 rounded-md h-5 w-1/2 m-3 shimmer"></div>
                </div>

                <div className="flex rounded-tl-2xl bg-white/95">
                  <div className="flex-1 bg-indigo-800 rounded-tl-2xl h-full w-1/3 p-4">
                    <div className=" flex flex-col space-y-3">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-full h-6 rounded-md ${i === 1
                            ? "bg-[#6B4EFF] animate-pulse"
                            : "bg-[#4B38C3] animate-pulse"
                            }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 w-2/3">
                    {/* Header Bar */}
                    <div className="bg-indigo-800 rounded-md h-8 w-full mb-4 shimmer flex justify-end items-center">
                      <div className="h-5 w-1/3 bg-gray-300 rounded-md shimmer mr-3"></div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-3 mb-3">
                      <div className="space-x-2 flex">
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                      </div>
                      <div className="h-8 w-full bg-gray-300 rounded shimmer"></div>
                      <div className="h-5 w-1/2 bg-[#6B4EFF] rounded shimmer"></div>
                      <div className="h-8 w-full bg-gray-200 rounded shimmer"></div>
                    </div>

                    {/* Table-like Rows */}
                    <div className="space-y-2 animate-pulse bg-gray-200 p-2 rounded-md">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded"
                        >
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-4 bg-gray-300 rounded"></div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Buttons */}
                    <div className="flex justify-end mt-5 space-x-2">
                      <div className="h-6 w-20 bg-gray-300 rounded shimmer"></div>
                      <div className="h-6 w-20 bg-[#6B4EFF] rounded shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section (Login form) */}
      <div className="w-1/2 bg-white flex justify-center items-center">
        <div className="w-full max-w-md px-3">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Sign in to your account
          </h2>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="Enter email or username"
                value={form.identifier}
                onChange={(e) => update("identifier", e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B4EFF] hover:bg-[#5b3cd8] text-white py-2 rounded-md font-medium transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}