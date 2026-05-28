import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // 🚩 Quản lý thông báo
    const [notice, setNotice] = useState({ show: false, message: "", type: "" });
    
    const navigate = useNavigate();

    const handleLogin = async () => {
        const cleanEmail = email.trim().toLowerCase();

        // 🚨 Kiểm tra định dạng Email chuẩn bằng Regex (Bản nghiêm ngặt chuẩn Gmail)
        const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) {
            setNotice({ 
                show: true, 
                message: "Định dạng Email không hợp lệ sếp ơi!", 
                type: "error" 
            });
            setTimeout(() => setNotice({ ...notice, show: false }), 3000);
            return; // Chặn lại không cho gửi request lên Backend
        }

        try {
            const res = await axios.post("/auth/login", { email: cleanEmail, password });
            
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name); 
            localStorage.setItem("role", res.data.role);
            localStorage.setItem("userId", res.data.userId); 

            // 🏆 Tùy biến lời chào theo chức vụ
            let welcomeMsg = "Đăng nhập thành công! Đang vào rạp...";
            if (res.data.role === "admin") {
                welcomeMsg = `Chào Quản trị viên! Đang vào hệ thống...`;
            } else if (res.data.role === "staff") {
                welcomeMsg = `Chào Nhân viên! Đang chuẩn bị trạm làm việc...`;
            }

            setNotice({ 
                show: true, 
                message: welcomeMsg, 
                type: "success" 
            });

            // 🕒 Điều hướng thông minh dựa trên Role
            // Dùng window.location.href để ép trình duyệt load lại toàn bộ State (sạch bài)
            setTimeout(() => {
                const role = res.data.role;
                if (role === "admin") {
                    window.location.href = "/admin"; 
                } else if (role === "staff") {
                    window.location.href = "/staff"; // 🎯 Chỉ cần về /staff là vào thẳng Dashboard nhân viên
                } else {
                    window.location.href = "/"; 
                }
            }, 1500);

        } catch (err) {
            setNotice({ 
                show: true, 
                message: "Đăng nhập thất bại: " + (err.response?.data?.message || "Sai email hoặc mật khẩu sếp ơi!"), 
                type: "error" 
            });
            
            setTimeout(() => setNotice({ ...notice, show: false }), 3000);
        }
    };

    return (
        <div style={containerStyle}>
            
            {/* 🚩 TOAST THÔNG BÁO */}
            {notice.show && (
                <div style={{
                    ...toastStyle,
                    backgroundColor: notice.type === "success" ? "#28a745" : "#dc3545"
                }}>
                    {notice.type === "success" ? "" : ""} {notice.message}
                </div>
            )}

            <div style={loginBoxStyle}>
                <h2 style={{ color: "#fff", marginBottom: 30, fontSize: "2rem" }}>Đăng nhập</h2>

                <input
                    placeholder="Email của bạn"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                />

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
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

// --- 🎨 STYLE (SẾP GIỮ NGUYÊN) ---
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

const toastStyle = {
    position: "fixed", top: "20px", right: "20px", padding: "15px 25px", color: "#fff",
    borderRadius: "8px", fontWeight: "bold", boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
    zIndex: 1000, display: "flex", alignItems: "center", gap: "10px"
};