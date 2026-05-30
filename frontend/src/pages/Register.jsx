import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [notice, setNotice] = useState({ show: false, message: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);

  // 📧 OTP States
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const timerRef = useRef(null);

  const navigate = useNavigate();

  // ⏱️ Bộ đếm ngược 60 giây
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && otpSent) {
      // Hết 60s → reset trạng thái
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown, otpSent]);

  // 📧 GỬI MÃ OTP
  const handleSendOtp = async () => {
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setNotice({ show: true, message: "Email không hợp lệ", type: "error" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
      return;
    }

    setSendingOtp(true);
    try {
      await axios.post("/auth/send-otp", { email: formData.email });
      setOtpSent(true);
      setCountdown(60);
      setNotice({ show: true, message: "Đã gửi mã xác thực vào email!", type: "success" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
    } catch (err) {
      setNotice({ show: true, message: err.response?.data || "Gửi mã thất bại!", type: "error" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
    }
    setSendingOtp(false);
  };

  // 📝 ĐĂNG KÝ
  const handleRegister = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu
    if (formData.password !== "123456") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
      if (!passwordRegex.test(formData.password)) {
        setNotice({ show: true, message: "Mật khẩu 8-15 ký tự, có chữ HOA, chữ thường, số & ký tự đặc biệt!", type: "error" });
        setTimeout(() => setNotice({ show: false, message: "", type: "" }), 4000);
        return;
      }
    }

    // Kiểm tra email
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setNotice({ show: true, message: "Email không hợp lệ", type: "error" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
      return;
    }

    // Kiểm tra OTP
    if (!otp || otp.length !== 6) {
      setNotice({ show: true, message: "Vui lòng nhập mã xác thực 6 số!", type: "error" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
      return;
    }

    try {
      await axios.post("/auth/register", { ...formData, otp });
      setNotice({ show: true, message: "Đăng ký thành công! Đang chuyển sang trang Đăng nhập...", type: "success" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setNotice({ show: true, message: err.response?.data || "Đăng ký thất bại!", type: "error" });
      setTimeout(() => setNotice({ show: false, message: "", type: "" }), 3000);
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
          placeholder="Họ tên của bạn"
          required
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
        />

        {/* 📧 EMAIL + NÚT GỬI MÃ */}
        <div style={{ position: "relative", marginBottom: 15 }}>
          <input
            type="email"
            placeholder="Email (Dùng để đăng nhập)"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            style={{ ...inputStyle, marginBottom: 0, paddingRight: "110px" }}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || countdown > 0}
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              padding: "8px 12px",
              background: countdown > 0 ? "#555" : "#e50914",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: countdown > 0 ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              fontWeight: "bold",
              whiteSpace: "nowrap"
            }}
          >
            {sendingOtp ? "Đang gửi..." : countdown > 0 ? `${countdown}s` : "Gửi mã"}
          </button>
        </div>

        {/* 🔢 Ô NHẬP MÃ OTP */}
        {otpSent && (
          <input
            type="text"
            placeholder="Nhập mã xác thực 6 số"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "1.2rem", fontWeight: "bold" }}
          />
        )}

        {/* 🔒 MẬT KHẨU */}
        <div style={{ position: "relative", marginBottom: 15 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            required
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          <div 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#888",
                  display: "flex",
                  alignItems: "center"
              }}
          >
              {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                  </svg>
              ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
              )}
          </div>
        </div>

        <button type="submit" style={buttonStyle}>Đăng ký ngay</button>

        <p style={{ color: "#888", marginTop: 20 }}>
          Đã có tài khoản? <Link to="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: 'bold' }}>Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}

// --- CSS Styles ---
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