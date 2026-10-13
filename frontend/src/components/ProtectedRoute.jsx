import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

function ProtectedRoute({ children, role }) {
  const [status, setStatus] = useState("loading");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get("/api/auth/me");
        setUserRole(res.data.user.role);
        setStatus("authed");
      } catch {
        setStatus("guest");
      }
    }
    checkAuth();
  }, []);

  if (status === "loading") {
    return <p className="empty">Loading...</p>;
  }

  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/music" replace />;
  }

  return children;
}

export default ProtectedRoute;