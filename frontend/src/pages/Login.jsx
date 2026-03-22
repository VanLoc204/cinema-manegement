import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post("/auth/login", { email, password });
            
            // 💾 Lưu tất cả thông tin quan trọng vào máy khách
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name); 
            localStorage.setItem("role", res.data.role);

            if (res.data.role === "admin") {
                alert(`Chào sếp ${res.data.name}! Đang chuyển hướng đến trang quản trị...`);
                navigate("/admin");
            } else {
                navigate("/");
            }

            // 🔄 Tự động tải lại trang để Navbar cập nhật "Hi, [Tên của bạn]!"
            window.location.reload();

        } catch (err) {
            alert("Đăng nhập thất bại: " + (err.response?.data || "Lỗi server"));
        }
    };

    return (
        <div style={{
            height: "90vh", display: "flex", justifyContent: "center", alignItems: "center",
            background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com')"
        }}>
            <div style={{
                width: 380, padding: "50px 40px", background: "rgba(0,0,0,0.85)", borderRadius: 10, textAlign: "center"
            }}>
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

                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%", padding: "14px", background: "#e50914", color: "white",
                        border: "none", borderRadius: 5, fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", marginTop: 20
                    }}
                >
                    Đăng nhập
                </button>

                <p style={{ color: "#888", marginTop: 20 }}>
                    Bạn là khách hàng mới? <Link to="/register" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%", padding: "14px", marginBottom: 15, background: "#333", border: "none",
    borderRadius: 5, color: "#fff", outline: "none", boxSizing: "border-box"
};
