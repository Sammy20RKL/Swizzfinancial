import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500 mt-2">
          You need Administrator privileges to view this page.
        </p>
      </div>
    );
  }

  return children;
}
