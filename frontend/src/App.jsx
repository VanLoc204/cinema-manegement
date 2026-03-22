import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Movies from "./pages/Movies";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MovieDetail from "./pages/MovieDetail";
import Admin from "./pages/Admin";


// 🏠 Component Navbar tone màu sáng (Modern Cinema Style)
function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("name") || "Khách";

    const handleLogout = () => {
        localStorage.clear();
        alert("Đã đăng xuất thành công!");
        navigate("/");
        window.location.reload();
    };

    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "15px 60px", background: "#ffffff", color: "#333", 
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100
        }}>
            {/* 🏷️ Tên web: CINEMA LUX */}
            <h2 style={{ 
                margin: 0, color: "#fb4226", cursor: "pointer", 
                fontWeight: "900", letterSpacing: "1.5px" 
            }} onClick={() => navigate("/")}>CINEMA LUX</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                <Link to="/" style={linkStyle}>Trang chủ</Link>

                {!token ? (
                    <Link to="/login" style={linkStyle}>Đăng nhập</Link>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <span style={{ color: "#fb4226", fontWeight: "bold" }}>Hi, {userName}!</span>
                        
                        <button style={subButtonStyle} onClick={() => alert("Chức năng Hồ sơ đang phát triển!")}>Hồ sơ</button>
                        <button style={subButtonStyle} onClick={() => alert("Chức năng Lịch sử vé đang phát triển!")}>Lịch sử vé</button>
                        
                        <button onClick={handleLogout} style={logoutButtonStyle}>Đăng xuất</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// 🦶 Component Footer mới
function Footer() {
    return (
        <footer style={{ 
            background: "#222", color: "#bbb", padding: "50px 20px", 
            marginTop: "60px", textAlign: "center", borderTop: "5px solid #fb4226" 
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h3 style={{ color: "#fff", marginBottom: "15px" }}>CINEMA LUX</h3>
                <p>Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam.</p>
                <p style={{ fontSize: "0.9rem" }}>Địa chỉ: 123 Đường Điện Ảnh, Quận 1, TP. Hồ Chí Minh</p>
                <p style={{ fontSize: "0.9rem" }}>Hotline: 1900 1234 | Email: support@cinemalux.vn</p>
                
                <div style={{ margin: "25px 0", display: "flex", justifyContent: "center", gap: "20px" }}>
                    <span style={{ cursor: "pointer" }}>Facebook</span>
                    <span style={{ cursor: "pointer" }}>Instagram</span>
                    <span style={{ cursor: "pointer" }}>Youtube</span>
                </div>

                <hr style={{ borderColor: "#444", margin: "20px 0" }} />
                <p style={{ fontSize: "0.8rem" }}>© 2026 Cinema Lux. All rights reserved.</p>
            </div>
        </footer>
    );
}

function App() {
    return (
        <BrowserRouter>
            {/* 🎨 Nền kem nhạt cho toàn bộ trang web */}
            <div style={{ background: "#fdfcf0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar />
                
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/admin" element={<Admin />} /> 
                        <Route path="/" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/booking/:id" element={<Booking />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </div>

                <Footer />
            </div>
        </BrowserRouter>
    );
}

// --- 💄 CSS Styles cho Tone màu sáng ---
const linkStyle = { 
    color: "#333", 
    textDecoration: "none", 
    fontSize: "1rem", 
    fontWeight: "500" 
};

const subButtonStyle = {
    background: "#f4f4f4", 
    color: "#333", 
    border: "1px solid #ddd", 
    padding: "6px 15px",
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "0.3s"
};

const logoutButtonStyle = {
    background: "#fb4226", // Đỏ cam hiện đại
    color: "white", 
    border: "none", 
    padding: "7px 18px",
    borderRadius: "4px", 
    cursor: "pointer", 
    fontWeight: "bold",
    boxShadow: "0 2px 5px rgba(251, 66, 38, 0.3)"
};

export default App;
