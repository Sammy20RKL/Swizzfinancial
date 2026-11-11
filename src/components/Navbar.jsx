// src/components/Navbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiHelpCircle } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function Navbar() {
  const { displayName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initial = (displayName || "U").charAt(0).toUpperCase();

  return (
    <div className="h-12 bg-indigo-800  flex items-center justify-between px-4 text-white sticky top-0 z-39">
      {/* Left: Workspace / Branding */}
      <div className="flex items-center space-x-4 ml-15">
        <span className="font-bold">Swift Financial</span>
        {/*<Link to="/" className="hover:text-gray-300 text-sm">Home</Link>
        <Link to="/settings" className="hover:text-gray-300 text-sm">Settings</Link>*/}
      </div>

      {/* Middle: Search Bar */}
      <div className="flex items-center bg-indigo-700 px-2 py-1 rounded-md w-1/3">
        <FiSearch className="text-gray-100 mr-2" />
        <input
          type="text"
          placeholder="Search... "
          className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400 text-white"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <FiBell className="cursor-pointer hover:text-gray-300" />
        <FiHelpCircle className="cursor-pointer hover:text-gray-300" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-sm font-bold">{initial}</span>
              </div>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold">{displayName}</span>
                {role && <span className="text-[10px] text-indigo-200">{role}</span>}
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}
