import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("name") || "Khách";
    const role = localStorage.getItem("role"); // 'admin', 'staff', 'customer'
    const isAdminPage = location.pathname.startsWith("/admin");
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    const [notice, setNotice] = useState({ show: false, message: "" });

    const handleLogout = () => {
        setNotice({ show: true, message: "Đang đăng xuất..." });
        setTimeout(() => {
            localStorage.clear();
            window.location.href = "/";
        }, 1200);
    };

    const handleLogoClick = () => {
        const currentRole = localStorage.getItem("role");
        if (currentRole === "staff") {
            navigate("/staff"); 
        } else if (currentRole === "admin") {
            navigate("/admin");
        } else {
            navigate("/");
        }
    };

    return (
        <nav style={navStyle}>
            {notice.show && <div style={logoutToastStyle}>{notice.message}</div>}

            <div style={logoContainer} onClick={handleLogoClick}>
                <h2 style={logoStyle}>CINEMA <span style={{ color: "#333" }}>LUX</span></h2>
            </div>

            <div style={menuContainer}>
                {isAdminPage ? (
                    <>
                        <span style={adminBadge}>ADMIN MODE</span>
                        <Link to="/" style={navLink}>Quay lại Web</Link>
                        <button onClick={handleLogout} style={logoutBtn}>Đăng xuất</button>
                    </>
                ) : (
                    <>
                        {(role !== "staff" && role !== "admin") || isAuthPage ? (
                            <Link to="/" style={{ ...navLink, color: location.pathname === "/" ? "#fb4226" : "#333" }}>
                                Trang chủ
                            </Link>
                        ) : null}

                        {!token || isAuthPage ? (
                            <Link to="/login" style={{ ...navLink, color: location.pathname === "/login" ? "#fb4226" : "#333" }}>Đăng nhập</Link>
                        ) : (
                            <div style={userGroup}>
                                <span style={welcomeText}>Hi, <b style={{ color: '#333' }}>{userName}</b>!</span>

                                <div style={buttonGroup}>
                                    {/* 1. ROLE ADMIN */}
                                    {role === "admin" && (
                                        <button style={actionBtn} onClick={() => navigate("/admin")}>Quản trị</button>
                                    )}

                                    {/* 2. ROLE STAFF: Đã xóa toàn bộ nút điều hướng tại đây theo ý sếp */}
                                    {role === "staff" ? (
                                        null
                                    ) : (
                                        /* 3. ROLE CUSTOMER */
                                        <>
                                            <button
                                                style={{ ...actionBtn, borderBottom: location.pathname === "/profile" ? "2px solid #fb4226" : "none" }}
                                                onClick={() => navigate("/profile")}
                                            >Hồ Sơ</button>

                                            <button
                                                style={{ ...actionBtn, borderBottom: location.pathname === "/history" ? "2px solid #fb4226" : "none" }}
                                                onClick={() => navigate("/history")}
                                            >Vé đã mua</button>

                                            <button
                                                style={{ ...actionBtn, borderBottom: location.pathname === "/watched-movies" ? "2px solid #fb4226" : "none" }}
                                                onClick={() => navigate("/watched-movies")}
                                            >Phim đã xem</button>
                                        </>
                                    )}
                                </div>

                                <button onClick={handleLogout} style={logoutBtn}>Đăng xuất</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}

// --- Styles giữ nguyên 100% ---
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 60px", height: "80px", background: "#ffffff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #f0f0f0" };
const logoContainer = { cursor: "pointer" };
const logoStyle = { margin: 0, color: "#fb4226", fontWeight: "900", letterSpacing: "2px", fontSize: "1.6rem", textTransform: "uppercase" };
const menuContainer = { display: "flex", alignItems: "center", gap: "30px" };
const navLink = { textDecoration: "none", fontSize: "0.95rem", fontWeight: "600", transition: "0.3s", padding: "10px 0" };
const userGroup = { display: "flex", alignItems: "center", gap: "20px" };
const welcomeText = { fontSize: "0.9rem", color: "#fb4226", fontWeight: "500" };
const buttonGroup = { display: "flex", gap: "5px", background: "#f8f9fa", padding: "5px", borderRadius: "12px" };
const actionBtn = { background: "transparent", color: "#555", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "0.2s", outline: "none" };
const logoutBtn = { background: "#fb4226", color: "white", border: "none", padding: "10px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", fontSize: "0.85rem", boxShadow: "0 4px 10px rgba(251, 66, 38, 0.3)", transition: "0.3s" };
const adminBadge = { background: "#333", color: "#fff", padding: "5px 12px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "1px" };
const logoutToastStyle = { position: "fixed", top: "100px", right: "30px", background: "#333", color: "#fff", padding: "15px 30px", borderRadius: "12px", fontWeight: "bold", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 2000 };