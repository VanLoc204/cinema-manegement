import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import io from "socket.io-client"; // 📡 1. Import thư viện Socket
import Movies from "./pages/Movies";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MovieDetail from "./pages/MovieDetail";
import Admin from "./pages/Admin/Admin";
import TicketHistory from "./pages/TicketHistory";
import Profile from "./pages/Profile";

// 📡 2. Khởi tạo kết nối Socket tới Backend
// Sếp lưu ý đổi port 5000 nếu Backend sếp chạy port khác nhé
const socket = io("http://localhost:5000", {
    autoConnect: true
});

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

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

    const [notice, setNotice] = useState({ show: false, message: "" });

    const handleLogout = () => {
        setNotice({ show: true, message: "Đang đăng xuất... Hẹn gặp lại sếp!" });
        setTimeout(() => {
            localStorage.clear();
            window.location.href = "/";
        }, 1200);
    };

    return (
        <div style={navStyle}>
            {notice.show && (
                <div style={logoutToastStyle}>
                    👋 {notice.message}
                </div>
            )}

            <h2 style={logoStyle} onClick={() => navigate("/")}>CINEMA LUX</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                {isAdminPage ? (
                    <>
                        <span style={{ color: "#fb4226", fontWeight: "bold", borderRight: "1px solid #ddd", paddingRight: "20px" }}>CHẾ ĐỘ QUẢN TRỊ</span>
                        <Link to="/" style={linkStyle}>Quay lại Web</Link>
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
                                    <button style={subButtonStyle} onClick={() => navigate("/admin")}>Quản trị</button>
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
    // 📡 3. Quản lý trạng thái kết nối
    useEffect(() => {
        socket.on("connect", () => {
            console.log("🟢 [Real-time] Đã kết nối tới Server Cinema Lux thành công!");
        });

        socket.on("disconnect", () => {
            console.log("🔴 [Real-time] Mất kết nối Server.");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    return (
        <BrowserRouter>
            <ScrollToTop />
            <div style={{ background: "#fdfcf0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar />
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route
                            path="/admin/*"
                            element={localStorage.getItem("role") === "admin" ? <Admin /> : <Navigate to="/login" />}
                        />
                        <Route path="/" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        {/* 📡 4. Truyền socket vào component Booking để dùng cho sơ đồ ghế */}
                        <Route path="/booking/:id" element={<ProtectedRoute><Booking socket={socket} /></ProtectedRoute>} />
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

// --- STYLES GIỮ NGUYÊN ---
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 60px", background: "#ffffff", color: "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 };
const logoStyle = { margin: 0, color: "#fb4226", cursor: "pointer", fontWeight: "900", letterSpacing: "1.5px" };
const footerStyle = { background: "#222", color: "#bbb", padding: "50px 20px", marginTop: "60px", textAlign: "center", borderTop: "5px solid #fb4226" };
const linkStyle = { color: "#333", textDecoration: "none", fontSize: "1rem", fontWeight: "500" };
const subButtonStyle = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", padding: "6px 15px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" };
const logoutButtonStyle = { background: "#fb4226", color: "white", border: "none", padding: "7px 18px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" };
const logoutToastStyle = { position: "fixed", top: "80px", right: "20px", background: "#333", color: "#fff", padding: "12px 25px", borderRadius: "8px", fontWeight: "bold", boxShadow: "0 5px 15px rgba(0,0,0,0.3)", zIndex: 2000 };

export default App;