import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("name") || "Khách";
    const role = localStorage.getItem("role"); // 'admin', 'staff', 'customer'
    const isAdminPage = location.pathname.startsWith("/admin");
    const isStaffPage = location.pathname.startsWith("/staff");
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    const [notice, setNotice] = useState({ show: false, message: "" });
    const [menuOpen, setMenuOpen] = useState(false);

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
        <nav className="nb-nav" style={navStyle}>
            <style>{`
                @media (max-width: 1024px) {
                    .nb-menu { display: none !important; }
                    .nb-menu.open { display: flex !important; flex-direction: column; align-items: flex-start;
                        position: fixed; top: 0; right: 0; width: 75vw; max-width: 300px; height: 100vh;
                        background: #fff; padding: 80px 24px 40px; gap: 20px; z-index: 1100;
                        box-shadow: -6px 0 30px rgba(0,0,0,0.15); overflow-y: auto; }
                    .nb-hamburger { display: flex !important; }
                    .nb-overlay { display: block !important; }
                    .nb-user-group { flex-direction: column; align-items: flex-start; gap: 12px; width: 100%; }
                    .nb-btn-group { flex-direction: column; width: 100%; }
                    .nb-action-btn { text-align: left; width: 100%; padding: 10px 14px; font-size: 0.9rem; }
                    .nb-logout-btn { width: 100%; text-align: center; }
                    .nb-nav-link { font-size: 1rem; width: 100%; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
                    .nb-welcome { font-size: 0.95rem; }
                    .nb-nav { padding: 0 16px !important; height: 60px !important; }
                    .nb-logo { font-size: 1.2rem !important; }
                    .nb-staff-hi { display: flex !important; }
                    
                    /* Căn chỉnh các nút admin trong drawer di động */
                    .nb-menu.open .nb-admin-badge {
                        width: 100%;
                        text-align: center;
                        padding: 10px 0;
                        font-size: 0.85rem !important;
                        box-sizing: border-box;
                    }
                }
                .nb-hamburger { display: none; flex-direction: column; justify-content: space-between;
                    width: 26px; height: 20px; background: none; border: none; cursor: pointer; z-index: 1200; }
                .nb-hamburger span { display: block; height: 3px; background: #333; border-radius: 3px; transition: 0.3s; }
                .nb-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1050; }
                .nb-staff-hi { display: none; align-items: center; gap: 6px; font-size: 0.85rem; color: #fb4226; font-weight: 600; }
                @media (max-width: 768px) {
                    .nb-logout-toast {
                        right: auto !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        width: calc(100% - 32px) !important;
                        max-width: 300px !important;
                        text-align: center !important;
                        top: 20px !important;
                        padding: 12px 20px !important;
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>

            {notice.show && <div className="nb-logout-toast" style={logoutToastStyle}>{notice.message}</div>}

            <div style={logoContainer} onClick={handleLogoClick}>
                <h2 style={logoStyle} className="nb-logo">CINEMA <span style={{ color: "#333" }}>LUX</span></h2>
            </div>

            {/* Hiện "Hi, staff01!" trực tiếp trên Navbar mobile khi đang ở trang Staff */}
            {isStaffPage && token && (
                <span className="nb-staff-hi">
                    Hi, <b style={{ color: '#333', marginLeft: '3px' }}>{userName}</b>!
                </span>
            )}

            {!isStaffPage && (
                <button className="nb-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    <span></span><span></span><span></span>
                </button>
            )}

            {menuOpen && <div className="nb-overlay" onClick={() => setMenuOpen(false)} />}

            <div className={`nb-menu${menuOpen ? " open" : ""}`} style={menuContainer}>
                {isAdminPage ? (
                    <>
                        <span style={adminBadge} className="nb-admin-badge">ADMIN MODE</span>
                        <Link to="/" style={navLink} className="nb-nav-link" onClick={() => setMenuOpen(false)}>Quay lại Web</Link>
                        <button onClick={handleLogout} style={logoutBtn} className="nb-logout-btn">Đăng xuất</button>
                    </>
                ) : (
                    <>
                        {(role !== "staff" && role !== "admin") || isAuthPage ? (
                            <Link to="/" style={{ ...navLink, color: location.pathname === "/" ? "#fb4226" : "#333" }} className="nb-nav-link" onClick={() => setMenuOpen(false)}>
                                Trang chủ
                            </Link>
                        ) : null}

                        {!token || isAuthPage ? (
                            <Link to="/login" style={{ ...navLink, color: location.pathname === "/login" ? "#fb4226" : "#333" }} className="nb-nav-link" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
                        ) : (
                            <div style={userGroup} className="nb-user-group">
                                <span style={welcomeText} className="nb-welcome">Hi, <b style={{ color: '#333' }}>{userName}</b>!</span>

                                <div style={buttonGroup} className="nb-btn-group">
                                    {role === "admin" && (
                                        <button style={actionBtn} className="nb-action-btn" onClick={() => { navigate("/admin"); setMenuOpen(false); }}>Quản trị</button>
                                    )}
                                    {role !== "staff" && (
                                        <button
                                            style={{
                                                ...actionBtn,
                                                borderBottom: ["/profile", "/history", "/watched-movies", "/membership", "/vouchers"].includes(location.pathname) ? "2px solid #fb4226" : "none"
                                            }}
                                            className="nb-action-btn"
                                            onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                                        >Tài khoản của tôi</button>
                                    )}
                                </div>
                                {role !== "staff" && (
                                    <button onClick={handleLogout} style={logoutBtn} className="nb-logout-btn">Đăng xuất</button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}

// --- Styles giữ nguyên 100% ---
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px", height: "70px", background: "#ffffff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #f0f0f0" };
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