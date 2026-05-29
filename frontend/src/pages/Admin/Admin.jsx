import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import MovieManager from "./MovieManager"; 
import RoomManager from "./RoomManager";   
import SnackManager from "./SnackManager"; 
import Dashboard from "./Dashboard";
import ShowtimeManager from "./ShowtimeManager"; 
import RevenueManager from "./RevenueManager";   
import MemberManager from "./MemberManager"; // ✅ 1. ĐÃ IMPORT Ở ĐÂY
import ReviewManager from "./ReviewManager";
import VoucherManager from "./VoucherManager";

export default function Admin() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: "dashboard", path: "/admin", label: "Dashboard", color: "#3498db" },
        { id: "movies", path: "/admin/movies", label: "Quản lý Phim", color: "#e74c3c" },
        { id: "rooms", path: "/admin/rooms", label: "Quản lý Phòng chiếu", color: "#f1c40f" },
        { id: "showtimes", path: "/admin/showtimes", label: "Quản lý Suất chiếu", color: "#9b59b6" },
        { id: "snacks", path: "/admin/snacks", label: "Quản lý Bắp nước", color: "#f39c12" },
        { id: "revenue", path: "/admin/revenue", label: "Quản lý doanh thu", color: "#2ecc71" },
        { id: "member", path: "/admin/member", label: "Quản lý thành viên", color: "#27ae60" },
        { id: "reviews", path: "/admin/reviews", label: "Quản lý đánh giá", color: "#e67e22" }, // Đổi màu xíu cho khác Doanh thu
        { id: "vouchers", path: "/admin/vouchers", label: "Quản lý Voucher", color: "#fb4226" },
    ];

    const activeTab = menuItems.find(item => 
        item.path === location.pathname
    ) || menuItems[0];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f6" }}>
            
            {/* 🏰 SIDEBAR */}
            <div style={sidebarStyle}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>ADMIN PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>CINEMA LUX SYSTEM</p>
                </div>

                {menuItems.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => navigate(item.path)} 
                        style={navItemStyle(activeTab.id === item.id, item.color)}
                    >
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 🖥️ MAIN CONTENT */}
            <div style={{ flex: 1, padding: "40px" }}>
                <div style={contentBoxStyle}>
                    <h1 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
                        {activeTab.label}
                    </h1>

                    <Routes>
                        <Route index element={<Dashboard />} /> 
                        <Route path="movies" element={<MovieManager />} />
                        <Route path="rooms" element={<RoomManager />} />
                        <Route path="showtimes" element={<ShowtimeManager />} />
                        <Route path="snacks" element={<SnackManager />} />
                        <Route path="revenue" element={<RevenueManager />} />
                        <Route path="member" element={<MemberManager />} />
                        <Route path="reviews" element={<ReviewManager />} /> {/* ✅ 2. ĐÃ MỞ KHÓA Ở ĐÂY */}
                        <Route path="vouchers" element={<VoucherManager />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

// --- Styles (Giữ nguyên của sếp) ---
const sidebarStyle = { 
    width: "280px", background: "#2c3e50", color: "white", 
    padding: "30px 0", display: "flex", flexDirection: "column", 
    boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
    position: "sticky", top: 0, height: "100vh" 
};

const navItemStyle = (isActive, color) => ({
    padding: "15px 30px", cursor: "pointer", transition: "0.3s",
    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
    borderLeft: isActive ? `5px solid ${color}` : "5px solid transparent",
    fontWeight: isActive ? "bold" : "normal", display: "flex", alignItems: "center", gap: "15px",
    color: isActive ? "white" : "#bdc3c7"
});

const contentBoxStyle = { 
    background: "#fff", padding: "30px", borderRadius: "15px", 
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)", minHeight: "80vh" 
};