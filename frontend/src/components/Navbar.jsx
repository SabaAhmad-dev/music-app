import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";

function Navbar() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await api.get("/api/auth/me");
        setRole(res.data.user.role);
      } catch {
        setRole(null);
      }
    }
    fetchMe();
  }, []);

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      navigate("/login");
    }
  }

  return (
    <nav>
      <span className="brand">🎵 Musify</span>
      <NavLink to="/music">Music</NavLink>
      {role === "artist" && <NavLink to="/upload">Upload</NavLink>}
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;