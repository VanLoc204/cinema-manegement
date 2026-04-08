import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Movies from "./pages/Movies";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MovieDetail from "./pages/MovieDetail";
import Admin from "./pages/Admin/Admin";
import TicketHistory from "./pages/TicketHistory";
import Profile from "./pages/Profile";

// 🚀 FIX LỖI 2: Ép trình duyệt luôn về đầu trang khi chuyển trang hoặc F5
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// Chặn trình duyệt tự động ghi nhớ vị trí cuộn (Scroll Restoration)
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;
    return children;
};

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("name") || "Khách";
    const role = localStorage.getItem("role");
    const isAdminPage = location.pathname.startsWith("/admin");

    const handleLogout = () => {
        localStorage.clear();
        alert("Đã đăng xuất thành công!");
        navigate("/");
        window.location.reload();
    };

    return (
        <div style={navStyle}>
            <h2 style={logoStyle} onClick={() => navigate("/")}>CINEMA LUX</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                {isAdminPage ? (
                    <>
                        <span style={{ color: "#fb4226", fontWeight: "bold", borderRight: "1px solid #ddd", paddingRight: "20px" }}>🛠️ CHẾ ĐỘ QUẢN TRỊ</span>
                        <Link to="/" style={linkStyle}>🏠 Quay lại Web</Link>
                        <span style={{ fontWeight: "bold" }}>Sếp: {userName}</span>
                        <button onClick={handleLogout} style={logoutButtonStyle}>Đăng xuất</button>
                    </>
                ) : (
                    <>
                        <Link to="/" style={linkStyle}>Trang chủ</Link>
                        {!token ? (
                            <Link to="/login" style={linkStyle}>Đăng nhập</Link>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                <span style={{ color: "#fb4226", fontWeight: "bold" }}>Hi, {userName}!</span>
                                {role === "admin" && (
                                    <button style={subButtonStyle} onClick={() => navigate("/admin")}>🛡️ Quản trị</button>
                                )}
                                <button style={subButtonStyle} onClick={() => navigate("/profile")}>Hồ Sơ</button>
                                <button style={subButtonStyle} onClick={() => navigate("/history")}>Lịch sử</button>
                                <button onClick={handleLogout} style={logoutButtonStyle}>Đăng xuất</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function Footer() {
    return (
        <footer style={footerStyle}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h3 style={{ color: "#fff", marginBottom: "15px" }}>CINEMA LUX</h3>
                <p>Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam.</p>
                <p style={{ fontSize: "0.8rem" }}>© 2026 Cinema Lux. All rights reserved.</p>
            </div>
        </footer>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop /> {/* 🔥 Kích hoạt tự động cuộn lên đầu trang */}
            <div style={{ background: "#fdfcf0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar />
                <div style={{ flex: 1 }}>
                    <Routes>
                        {/* 🛡️ FIX LỖI 1: Sử dụng cấu trúc /* để hỗ trợ URL cho từng Tab Admin */}
                        <Route
                            path="/admin/*"
                            element={localStorage.getItem("role") === "admin" ? <Admin /> : <Navigate to="/login" />}
                        />
                        
                        <Route path="/" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><TicketHistory /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </BrowserRouter>
    );
}

// --- STYLES ---
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 60px", background: "#ffffff", color: "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 };
const logoStyle = { margin: 0, color: "#fb4226", cursor: "pointer", fontWeight: "900", letterSpacing: "1.5px" };
const footerStyle = { background: "#222", color: "#bbb", padding: "50px 20px", marginTop: "60px", textAlign: "center", borderTop: "5px solid #fb4226" };
const linkStyle = { color: "#333", textDecoration: "none", fontSize: "1rem", fontWeight: "500" };
const subButtonStyle = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", padding: "6px 15px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" };
const logoutButtonStyle = { background: "#fb4226", color: "white", border: "none", padding: "7px 18px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" };

export default App;