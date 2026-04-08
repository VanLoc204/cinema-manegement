import { useState } from "react";
import MovieManager from "./MovieManager"; 
import RoomManager from "./RoomManager";   
import SnackManager from "./SnackManager"; 
import Dashboard from "./Dashboard";
import ShowtimeManager from "./ShowtimeManager"; // ✅ Đã sửa tên import cho đồng nhất
import RevenueManager from "./RevenueManager";   // ✅ Import thêm cái này để sếp dùng nốt tab cuối

export default function Admin() {
    const [activeTab, setActiveTab] = useState("dashboard"); // Để dashboard làm mặc định cho xịn sếp ạ

    const menuItems = [
        { id: "dashboard", label: "📊 Dashboard", color: "#3498db" },
        { id: "movies", label: "🎬 Quản lý Phim", color: "#e74c3c" },
        { id: "rooms", label: "🏢 Quản lý Phòng chiếu", color: "#f1c40f" },
        { id: "showtimes", label: "🕒 Quản lý Suất chiếu", color: "#9b59b6" }, // ID là showtimes
        { id: "snacks", label: "🍿 Quản lý Bắp nước", color: "#f39c12" },
        { id: "revenue", label: "💰 Quản lý doanh thu", color: "#2ecc71" },
        { id: "member", label: "Quản lý thành viên", color: "#2ecc71" },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f6" }}>
            {/* 🏰 SIDEBAR */}
            <div style={sidebarStyle}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>ADMIN PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>CINEMA LUX SYSTEM</p>
                </div>
                {menuItems.map((item) => (
                    <div key={item.id} onClick={() => setActiveTab(item.id)} style={navItemStyle(activeTab === item.id, item.color)}>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 🖥️ MAIN CONTENT */}
            <div style={{ flex: 1, padding: "40px" }}>
                <div style={contentBoxStyle}>
                    <h1 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h1>

                    {/* Điều hướng các Tab */}
                    {activeTab === "dashboard" && <Dashboard />}
                    {activeTab === "movies" && <MovieManager />}
                    {activeTab === "rooms" && <RoomManager />}
                    {activeTab === "showtimes" && <ShowtimeManager />} {/* ✅ Đã sửa ID thành showtimes cho khớp menu */}
                    {activeTab === "snacks" && <SnackManager />}
                    {activeTab === "revenue" && <RevenueManager />}
                </div>
            </div>
        </div>
    );
}

// --- Styles Sidebar ---
const sidebarStyle = { width: "280px", background: "#2c3e50", color: "white", padding: "30px 0", display: "flex", flexDirection: "column", boxShadow: "4px 0 10px rgba(0,0,0,0.1)" };
const navItemStyle = (isActive, color) => ({
    padding: "15px 30px", cursor: "pointer", transition: "0.3s",
    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
    borderLeft: isActive ? `5px solid ${color}` : "5px solid transparent",
    fontWeight: isActive ? "bold" : "normal", display: "flex", alignItems: "center", gap: "15px"
});
const contentBoxStyle = { background: "#fff", padding: "30px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)", minHeight: "80vh" };