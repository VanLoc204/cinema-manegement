import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  // 🔔 State thông báo tự tắt
  const [notice, setNotice] = useState({ show: false, message: "", type: "" });
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // 🚨 Kiểm tra định dạng Email bằng Regex (Bản nghiêm ngặt chuẩn Gmail)
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setNotice({ 
        show: true, 
        message: "Email không hợp lệ", 
        type: "error" 
      });
      setTimeout(() => setNotice({ ...notice, show: false }), 3000);
      return; // Chặn đứng, không gửi request lên Backend
    }

    try {
      // 🚀 Gọi API đăng ký
      await axios.post("/auth/register", formData);
      
      // ✅ Hiện thông báo thành công
      setNotice({ 
        show: true, 
        message: "Đăng ký thành công! Đang chuyển sếp sang trang Đăng nhập...", 
        type: "success" 
      });

      // 🕒 Đợi 2 giây rồi mới chuyển trang
      setTimeout(() => navigate("/login"), 2000);
      
    } catch (err) {
      // ❌ Hiện thông báo lỗi từ Backend (Ví dụ: Email đã tồn tại)
      setNotice({ 
        show: true, 
        message: err.response?.data || "Đăng ký thất bại rồi sếp ơi!", 
        type: "error" 
      });
      
      // Lỗi thì 3 giây tự biến mất
      setTimeout(() => setNotice({ ...notice, show: false }), 3000);
    }
  };

  return (
    <div style={containerStyle}>
      
      {/* 📢 THÔNG BÁO TOAST */}
      {notice.show && (
        <div style={{
          ...toastStyle,
          backgroundColor: notice.type === "success" ? "#28a745" : "#dc3545"
        }}>
          {notice.message}
        </div>
      )}

      <form onSubmit={handleRegister} style={formStyle}>
        <h2 style={{ color: "#fff", marginBottom: 30, fontSize: '1.8rem' }}>Đăng ký tài khoản</h2>

        <input
          placeholder="Họ tên của sếp"
          required
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
        />

        <input
          type="email"
          placeholder="Email (Dùng để đăng nhập)"
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
          Đã có tài khoản? <Link to="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: 'bold' }}>Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}

// --- CSS Styles (Đã thêm hiệu ứng giống Login) ---
const containerStyle = {
  height: "90vh", display: "flex", justifyContent: "center", alignItems: "center",
  background: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1350&q=80')",
  backgroundSize: 'cover'
};

const formStyle = {
  width: 380, padding: "50px 40px", background: "rgba(0,0,0,0.85)", borderRadius: 12, textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)"
};

const inputStyle = {
  width: "100%", padding: "14px", marginBottom: 15, background: "#333", border: "1px solid #444",
  borderRadius: 5, color: "#fff", outline: "none", boxSizing: "border-box"
};

const buttonStyle = {
  width: "100%", padding: "14px", background: "#e50914", color: "white",
  border: "none", borderRadius: 5, fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem", marginTop: 10
};

const toastStyle = {
  position: "fixed", top: "20px", right: "20px", padding: "15px 25px", color: "#fff",
  borderRadius: "8px", fontWeight: "bold", boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  zIndex: 1000, animation: "slideIn 0.5s ease-out", display: "flex", alignItems: "center", gap: "10px"
};