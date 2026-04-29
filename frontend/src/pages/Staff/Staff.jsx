import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Import các trang chức năng của nhân viên
import StaffDashboard from "./StaffDashboard";
import StaffMovies from "./StaffMovies";
import StaffShowtimes from "./StaffShowtimes";
import StaffBooking from "./StaffBooking";
import StaffCheckin from "./StaffCheckin"; // Sẽ làm sau

export default function Staff({ socket }) {
    const navigate = useNavigate();
    const location = useLocation();

    // 📋 Menu dành riêng cho nhân viên
    const menuItems = [
        { id: "dashboard", path: "/staff", label: "Bảng điều khiển", color: "#2ecc71" },
        { id: "pos", path: "/staff/pos", label: "Bán vé (POS)", color: "#27ae60" },
        { id: "checkin", path: "/staff/checkin", label: "Soát vé QR", color: "#16a085" },
    ];

    // Xác định tab đang active dựa trên URL
    // Logic này giúp khi sếp vào /staff/booking/... thì menu POS vẫn sáng
    const activeTab = menuItems.find(item =>
        location.pathname === item.path || (item.id === "pos" && location.pathname.includes("staff/booking"))
    ) || menuItems[0];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f6" }}>

            {/* 🏰 SIDEBAR NHÂN VIÊN */}
            <div style={sidebarStyle}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#2ecc71", margin: 0 }}>STAFF PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7, color: "#fff" }}>CINEMA LUX SYSTEM</p>
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

                {/* Nút đăng xuất nhanh cho nhân viên */}
                <div style={logoutArea}>
                    <button onClick={() => { localStorage.clear(); window.location.href = "/login" }} style={logoutBtnStyle}>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* 🖥️ NỘI DUNG CHI TIẾT */}
            <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
                <div style={contentBoxStyle}>
                    <h2 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
                        {activeTab.label}
                    </h2>

                    <Routes>
                        <Route index element={<StaffDashboard />} />
                        <Route path="pos" element={<StaffMovies />} />
                        <Route path="showtimes/:id" element={<StaffShowtimes />} />
                        <Route path="booking/:id" element={<StaffBooking socket={socket} />} />
                        <Route path="checkin" element={<StaffCheckin />} />                    </Routes>
                </div>
            </div>
        </div>
    );
}

// --- 💄 Styles kế thừa từ Admin nhưng đổi tông màu ---
const sidebarStyle = {
    width: "260px", background: "#1a252f", color: "white",
    padding: "30px 0", display: "flex", flexDirection: "column",
    boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
    position: "sticky", top: 0, height: "100vh"
};

const navItemStyle = (isActive, color) => ({
    padding: "15px 30px", cursor: "pointer", transition: "0.3s",
    background: isActive ? "rgba(46, 204, 113, 0.1)" : "transparent",
    borderLeft: isActive ? `5px solid ${color}` : "5px solid transparent",
    fontWeight: isActive ? "bold" : "normal", display: "flex", alignItems: "center", gap: "15px",
    color: isActive ? "#2ecc71" : "#bdc3c7"
});

const contentBoxStyle = {
    background: "#fff", padding: "30px", borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)", minHeight: "85vh"
};

const logoutArea = { marginTop: "auto", padding: "20px" };
const logoutBtnStyle = {
    width: "100%", padding: "10px", background: "#e74c3c", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
};