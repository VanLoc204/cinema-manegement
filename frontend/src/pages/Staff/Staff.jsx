import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Import các trang chức năng của nhân viên
import StaffDashboard from "./StaffDashboard";
import StaffMovies from "./StaffMovies";
import StaffShowtimes from "./StaffShowtimes";
import StaffBooking from "./StaffBooking";
import StaffCheckin from "./StaffCheckin";

export default function Staff({ socket }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // 📋 Menu dành riêng cho nhân viên
    const menuItems = [
        { id: "dashboard", path: "/staff", label: "Bảng điều khiển", color: "#2ecc71" },
        { id: "pos", path: "/staff/pos", label: "Bán vé (POS)", color: "#27ae60" },
        { id: "checkin", path: "/staff/checkin", label: "Soát vé QR", color: "#16a085" },
    ];

    const activeTab = menuItems.find(item =>
        location.pathname === item.path || (item.id === "pos" && location.pathname.includes("staff/booking"))
    ) || menuItems[0];

    const handleNav = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    // Nội dung menu (dùng chung cho cả sidebar desktop & drawer mobile)
    const MenuContent = () => (
        <>
            <div style={{ textAlign: "center", marginBottom: "40px", padding: "0 20px" }}>
                <h2 style={{ color: "#2ecc71", margin: 0 }}>STAFF PANEL</h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, color: "#fff", margin: "5px 0 0" }}>CINEMA LUX SYSTEM</p>
            </div>

            {menuItems.map((item) => (
                <div
                    key={item.id}
                    onClick={() => handleNav(item.path)}
                    style={navItemStyle(activeTab.id === item.id, item.color)}
                >
                    <span>{item.label}</span>
                </div>
            ))}

            {/* Nút đăng xuất duy nhất */}
            <div style={{ marginTop: "auto", padding: "20px" }}>
                <button onClick={handleLogout} style={logoutBtnStyle}>
                    Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <>
            <style>{`
                .staff-wrapper {
                    display: flex;
                    min-height: 100vh;
                    background: #f4f7f6;
                    overflow-x: hidden;
                }
                .staff-sidebar {
                    width: 260px;
                    background: #1a252f;
                    color: white;
                    padding: 30px 0;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 4px 0 10px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    flex-shrink: 0;
                }
                .staff-main {
                    flex: 1;
                    padding: 30px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    min-width: 0;
                }
                .staff-content-box {
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    min-height: 85vh;
                    min-width: 0;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }

                /* --- MOBILE HAMBURGER BAR --- */
                .staff-mobile-topbar {
                    display: none;
                }

                /* --- DRAWER OVERLAY --- */
                .staff-drawer-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                .staff-drawer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 260px;
                    height: 100vh;
                    background: #1a252f;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    padding: 30px 0;
                    z-index: 1001;
                    box-shadow: 4px 0 20px rgba(0,0,0,0.3);
                    animation: slideInLeft 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }

                @media (max-width: 768px) {
                    .staff-wrapper {
                        flex-direction: column !important;
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                    }
                    .staff-sidebar {
                        display: none;
                    }
                    .staff-mobile-topbar {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px 16px;
                        background: #1a252f;
                        color: white;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    }
                    .staff-drawer-overlay {
                        display: block;
                    }
                    .staff-main {
                        padding: 15px;
                    }
                    .staff-content-box {
                        padding: 15px;
                        min-height: auto;
                        border-radius: 12px;
                    }
                }
            `}</style>

            <div className="staff-wrapper">

                {/* ── SIDEBAR DESKTOP ── */}
                <div className="staff-sidebar">
                    <MenuContent />
                </div>

                {/* ── MAIN CONTENT AREA ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                    {/* Top bar chỉ hiện trên mobile với nút ☰ */}
                    <div className="staff-mobile-topbar">
                        <span style={{ fontWeight: "900", color: "#2ecc71", fontSize: "1rem", letterSpacing: "0.5px" }}>
                            {activeTab.label.toUpperCase()}
                        </span>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            style={{
                                background: "none", border: "none", color: "#fff",
                                fontSize: "1.6rem", cursor: "pointer", lineHeight: 1,
                                padding: "4px 8px"
                            }}
                        >
                            ☰
                        </button>
                    </div>

                    <div className="staff-main">
                        <div className="staff-content-box">
                            {!location.pathname.includes("/staff/booking/") && (
                                <h2 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
                                    {activeTab.label}
                                </h2>
                            )}

                            <Routes>
                                <Route index element={<StaffDashboard />} />
                                <Route path="pos" element={<StaffMovies />} />
                                <Route path="showtimes/:id" element={<StaffShowtimes />} />
                                <Route path="booking/:id" element={<StaffBooking socket={socket} />} />
                                <Route path="checkin" element={<StaffCheckin />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MOBILE DRAWER OVERLAY + MENU ── */}
            {drawerOpen && (
                <div className="staff-drawer-overlay" onClick={() => setDrawerOpen(false)}>
                    <div className="staff-drawer" onClick={(e) => e.stopPropagation()}>
                        {/* Nút đóng drawer */}
                        <button
                            onClick={() => setDrawerOpen(false)}
                            style={{
                                position: "absolute", top: "15px", right: "15px",
                                background: "rgba(255,255,255,0.1)", border: "none",
                                color: "#fff", fontSize: "1.2rem", cursor: "pointer",
                                width: "35px", height: "35px", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                        >
                            ✕
                        </button>

                        <MenuContent />
                    </div>
                </div>
            )}
        </>
    );
}

// --- 💄 Styles ---
const navItemStyle = (isActive, color) => ({
    padding: "15px 30px", cursor: "pointer", transition: "0.3s",
    background: isActive ? "rgba(46, 204, 113, 0.1)" : "transparent",
    borderLeft: isActive ? `5px solid ${color}` : "5px solid transparent",
    fontWeight: isActive ? "bold" : "normal", display: "flex", alignItems: "center", gap: "15px",
    color: isActive ? "#2ecc71" : "#bdc3c7"
});

const logoutBtnStyle = {
    width: "100%", padding: "10px", background: "#e74c3c", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
};
