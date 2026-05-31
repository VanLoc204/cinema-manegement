import { useEffect, useState } from "react";
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

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="admin-layout-wrapper">
            <style>{`
                .admin-layout-wrapper {
                    display: flex;
                    min-height: 100vh;
                    background: #f4f7f6;
                    max-width: 100vw;
                }
                .admin-sidebar {
                    width: 280px;
                    background: #2c3e50;
                    color: white;
                    padding: 30px 0;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 4px 0 10px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    z-index: 1010;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .admin-main-content {
                    flex: 1;
                    padding: 40px;
                    min-width: 0;
                    max-width: 100%;
                }
                .admin-content-box {
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    min-height: 80vh;
                }
                .admin-mobile-topbar {
                    display: none;
                }
                .admin-sidebar-overlay {
                    display: none;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 768px) {
                    .admin-layout-wrapper {
                        flex-direction: column !important;
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                    }
                    .admin-sidebar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        height: 100vh;
                        width: 280px;
                        transform: translateX(-100%);
                        z-index: 1020;
                        box-shadow: 6px 0 25px rgba(0,0,0,0.25);
                    }
                    .admin-sidebar.open {
                        transform: translateX(0);
                    }
                    .admin-sidebar-overlay {
                        display: block;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.4);
                        z-index: 1015;
                        animation: fadeIn 0.2s ease;
                    }
                    .admin-mobile-topbar {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        padding: 12px 16px;
                        background: #2c3e50;
                        color: white;
                        position: sticky;
                        top: 0;
                        z-index: 990;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        width: 100vw !important;
                        max-width: 100vw !important;
                        box-sizing: border-box !important;
                    }
                    .admin-burger-btn {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                    }
                    .admin-mobile-title {
                        font-weight: 800;
                        font-size: 0.95rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .admin-main-content {
                        padding: 10px !important;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        box-sizing: border-box !important;
                        overflow-x: hidden !important;
                    }
                    .admin-content-box {
                        padding: 15px !important;
                        border-radius: 8px !important;
                        margin: 0 auto !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        min-height: auto !important;
                    }
                }
            `}</style>

            {/* 🛡️ Overlay làm mờ trên mobile */}
            {sidebarOpen && (
                <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* 📱 Mobile Topbar chứa Burger Menu */}
            <div className="admin-mobile-topbar">
                <button className="admin-burger-btn" onClick={() => setSidebarOpen(true)}>
                    ☰
                </button>
                <span className="admin-mobile-title">{activeTab.label}</span>
            </div>

            {/* 🏰 SIDEBAR */}
            <div className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>ADMIN PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>CINEMA LUX SYSTEM</p>
                </div>

                {menuItems.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false); // Tự động đóng sidebar trên mobile khi chọn xong
                        }} 
                        style={navItemStyle(activeTab.id === item.id, item.color)}
                    >
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 🖥️ MAIN CONTENT */}
            <div className="admin-main-content">
                <div className="admin-content-box">
                    <h1 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px", fontSize: "1.6rem", fontWeight: "800" }}>
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
                        <Route path="reviews" element={<ReviewManager />} />
                        <Route path="vouchers" element={<VoucherManager />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

// --- Styles giữ nguyên ---
const navItemStyle = (isActive, color) => ({
    padding: "15px 30px", cursor: "pointer", transition: "0.3s",
    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
    borderLeft: isActive ? `5px solid ${color}` : "5px solid transparent",
    fontWeight: isActive ? "bold" : "normal", display: "flex", alignItems: "center", gap: "15px",
    color: isActive ? "white" : "#bdc3c7"
});