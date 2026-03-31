"use client";

import { useEffect, useState } from "react";

// 🔥 explicitly point to your Python Auth Service
const API_URL = "http://13.235.209.92:8001";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 1. SECURE THE PAGE ON LOAD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        alert("Access Denied. Redirecting to home.");
        window.location.href = "/";
      } else {
        setIsAdmin(true);
        fetchUsers(token);
      }
    } catch {
      window.location.href = "/";
    }
  }, []);

  // 🔥 2. FETCH ALL USERS
  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    }
    setLoading(false);
  };

  // 🔥 3. CHANGE USER ROLE (Free/Premium)
  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        // Update local state so UI refreshes instantly
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        alert(`User successfully upgraded to ${newRole.toUpperCase()}`);
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 4. DELETE USER
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${email}?`)) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin || loading) return <div style={darkBg}><p style={loadingText}>Verifying Credentials...</p></div>;

  return (
    <div style={darkBg}>
      <div style={container}>
        <div style={headerFlex}>
          <h1 style={title}>🛡️ YatraAI Command Center</h1>
          <button onClick={() => window.location.href = "/"} style={backBtn}>Back to App</button>
        </div>

        {/* STATS ROW */}
        <div style={statsGrid}>
          <div style={statCard}>
            <p style={statLabel}>Total Users</p>
            <p style={statValue}>{users.length}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Premium Members</p>
            <p style={statValue}>{users.filter(u => u.role === "premium").length}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>System Health</p>
            <p style={statValueGreen}>Operational</p>
          </div>
        </div>

        {/* USER MANAGEMENT TABLE */}
        <div style={tableContainer}>
          <h2 style={tableTitle}>User Management</h2>
          <table style={table}>
            <thead>
              <tr style={tableHeadRow}>
                <th style={th}>Email</th>
                <th style={th}>Current Role</th>
                <th style={th}>Change Plan</th>
                <th style={th}>Danger Zone</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={tableRow}>
                  <td style={td}>{user.email}</td>
                  <td style={td}>
                    <span style={user.role === 'premium' ? premiumBadge : user.role === 'admin' ? adminBadge : regularBadge}>
                      {user.role?.toUpperCase() || "GUEST"}
                    </span>
                  </td>
                  <td style={td}>
                    <select 
                      value={user.role || "guest"} 
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      style={dropdown}
                    >
                      <option value="guest">Guest</option>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={td}>
                    <button onClick={() => handleDeleteUser(user._id, user.email)} style={deleteBtn}>
                      Remove User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const darkBg = { backgroundColor: "#000000", minHeight: "100vh", color: "white", padding: "40px", fontFamily: "sans-serif" };
const container = { maxWidth: "1000px", margin: "0 auto" };
const headerFlex = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" };
const title = { fontSize: "32px", fontWeight: "bold" };
const backBtn = { backgroundColor: "#333", color: "white", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", border: "none" };
const loadingText = { textAlign: "center" as const, marginTop: "20vh", fontSize: "24px", color: "#666" };

const statsGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" };
const statCard = { backgroundColor: "#111", padding: "24px", borderRadius: "12px", border: "1px solid #333" };
const statLabel = { color: "#888", fontSize: "14px", textTransform: "uppercase" as const, marginBottom: "8px" };
const statValue = { fontSize: "36px", fontWeight: "bold", color: "white" };
const statValueGreen = { fontSize: "36px", fontWeight: "bold", color: "#10b981" };

const tableContainer = { backgroundColor: "#111", padding: "24px", borderRadius: "12px", border: "1px solid #333" };
const tableTitle = { fontSize: "20px", marginBottom: "20px" };
const table = { width: "100%", borderCollapse: "collapse" as const, textAlign: "left" as const };
const tableHeadRow = { borderBottom: "1px solid #333" };
const th = { padding: "12px", color: "#888", fontSize: "14px" };
const tableRow = { borderBottom: "1px solid #222" };
const td = { padding: "16px 12px" };

const premiumBadge = { backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" };
const adminBadge = { backgroundColor: "rgba(168, 85, 247, 0.2)", color: "#a855f7", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" };
const regularBadge = { backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" };
const dropdown = { backgroundColor: "#222", color: "white", border: "1px solid #444", padding: "8px", borderRadius: "6px", cursor: "pointer" };
const deleteBtn = { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" };
