import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 🚀 Gọi API đăng ký (mặc định Backend sẽ gán role: "customer")
      await axios.post("/auth/register", formData);
      alert("Đăng ký thành công! Hãy đăng nhập để đặt vé.");
      navigate("/login");
    } catch (err) {
      alert("Lỗi: " + (err.response?.data || "Đăng ký thất bại"));
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleRegister} style={formStyle}>
        <h2 style={{ color: "#fff", marginBottom: 30 }}>Đăng ký tài khoản</h2>

        <input
          placeholder="Họ tên"
          required
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Email"
          required
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          required
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>Đăng ký ngay</button>

        <p style={{ color: "#888", marginTop: 20 }}>
          Đã có tài khoản? <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}

// --- CSS Styles ---
const containerStyle = {
  height: "90vh", display: "flex", justifyContent: "center", alignItems: "center",
  background: "#111"
};

const formStyle = {
  width: 380, padding: "40px", background: "rgba(0,0,0,0.8)", borderRadius: 10, textAlign: "center",
  boxShadow: "0 0 20px rgba(0,0,0,0.5)"
};

const inputStyle = {
  width: "100%", padding: "12px", marginBottom: 15, background: "#333", border: "none",
  borderRadius: 5, color: "#fff", outline: "none", boxSizing: "border-box"
};

const buttonStyle = {
  width: "100%", padding: "12px", background: "#e50914", color: "white",
  border: "none", borderRadius: 5, fontWeight: "bold", cursor: "pointer", fontSize: "1rem"
};
