import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // 🚩 Thêm State để quản lý thông báo
    const [notice, setNotice] = useState({ show: false, message: "", type: "" });
    
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post("/auth/login", { email, password });
            
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name); 
            localStorage.setItem("role", res.data.role);
            localStorage.setItem("userId", res.data.userId); 

            // 🏆 Hiện thông báo thành công
            setNotice({ 
                show: true, 
                message: res.data.role === "admin" ? `Chào sếp Quản trị viên! Đang vào hệ thống...` : "Đăng nhập thành công! Đang vào rạp...", 
                type: "success" 
            });

            // 🕒 Đợi 1.5 giây cho khách kịp nhìn thông báo rồi mới chuyển trang
            setTimeout(() => {
                if (res.data.role === "admin") {
                    window.location.href = "/admin"; // Dùng href để nó tự load lại Navbar luôn cho sếp
                } else {
                    window.location.href = "/";
                }
            }, 1500);

        } catch (err) {
            // ❌ Hiện thông báo lỗi
            setNotice({ 
                show: true, 
                message: "Đăng nhập thất bại: " + (err.response?.data?.message || "Sai email hoặc mật khẩu sếp ơi!"), 
                type: "error" 
            });
            
            // Lỗi thì sau 3 giây cho nó biến mất để khách nhập lại
            setTimeout(() => setNotice({ ...notice, show: false }), 3000);
        }
    };

    return (
        <div style={containerStyle}>
            
            {/* 🚩 KHUNG THÔNG BÁO TỰ CHẾ (Hiện ra rồi tự mất) */}
            {notice.show && (
                <div style={{
                    ...toastStyle,
                    backgroundColor: notice.type === "success" ? "#28a745" : "#dc3545"
                }}>
                    {notice.type === "success" ? "✅" : "❌"} {notice.message}
                </div>
            )}

            <div style={loginBoxStyle}>
                <h2 style={{ color: "#fff", marginBottom: 30, fontSize: "2rem" }}>Đăng nhập</h2>

                <input
                    placeholder="Email của bạn"
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                />

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                />

                <button onClick={handleLogin} style={buttonStyle}>
                    Đăng nhập
                </button>

                <p style={{ color: "#888", marginTop: 20 }}>
                    Bạn là khách hàng mới? <Link to="/register" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
}

// --- 🎨 PHẦN STYLE ĐÃ ĐƯỢC NÂNG CẤP ---

const containerStyle = {
    height: "90vh", display: "flex", justifyContent: "center", alignItems: "center",
    background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1350&q=80')",
    backgroundSize: 'cover',
    position: 'relative'
};

const loginBoxStyle = {
    width: 380, padding: "50px 40px", background: "rgba(0,0,0,0.85)", borderRadius: 10, textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.1)"
};

const inputStyle = {
    width: "100%", padding: "14px", marginBottom: 15, background: "#333", border: "1px solid #444",
    borderRadius: 5, color: "#fff", outline: "none", boxSizing: "border-box", transition: '0.3s'
};

const buttonStyle = {
    width: "100%", padding: "14px", background: "#e50914", color: "white",
    border: "none", borderRadius: 5, fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", marginTop: 20,
    transition: '0.3s'
};

// 🚩 STYLE CHO CÁI THÔNG BÁO (TOAST)
const toastStyle = {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 25px",
    color: "#fff",
    borderRadius: "8px",
    fontWeight: "bold",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
    zIndex: 1000,
    animation: "slideIn 0.5s ease-out",
    display: "flex",
    alignItems: "center",
    gap: "10px"
};