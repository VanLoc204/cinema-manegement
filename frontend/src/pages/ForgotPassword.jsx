import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP, 3: Đặt MK mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [notice, setNotice] = useState({ show: false, message: "", type: "" });
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

  // ⏱️ Bộ đếm ngược
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const showNotice = (message, type = "error") => {
    setNotice({ show: true, message, type });
    setTimeout(() => setNotice({ show: false, message: "", type: "" }), 4000);
  };

  // 📧 BƯỚC 1: Gửi OTP
  const handleSendOtp = async () => {
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return showNotice("Email không hợp lệ");
    }

    setSending(true);
    try {
      await axios.post("/auth/forgot-send-otp", { email });
      setStep(2);
      setCountdown(60);
      showNotice("Đã gửi mã xác thực vào email!", "success");
    } catch (err) {
      showNotice(err.response?.data || "Gửi mã thất bại!");
    }
    setSending(false);
  };

  // 🔢 BƯỚC 2: Xác nhận OTP (Gọi API để nhận resetToken)
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return showNotice("Vui lòng nhập mã 6 số!");
    }
    try {
      const res = await axios.post("/auth/verify-forgot-otp", { email, otp });
      setResetToken(res.data.resetToken);
      setStep(3);
      showNotice("Xác thực thành công!", "success");
    } catch (err) {
      showNotice(err.response?.data || "Xác thực thất bại!");
    }
  };

  // 🔒 BƯỚC 3: Đặt mật khẩu mới
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      return showNotice("Mật khẩu nhập lại không khớp!");
    }

    if (newPassword !== "123456") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
      if (!passwordRegex.test(newPassword)) {
        return showNotice("Mật khẩu 8-15 ký tự, có chữ HOA, chữ thường, số & ký tự đặc biệt!");
      }
    }

    try {
      await axios.post("/auth/reset-password", { email, resetToken, newPassword });
      showNotice("Đổi mật khẩu thành công! Đang chuyển về Đăng nhập...", "success");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err) {
      showNotice(err.response?.data || "Đổi mật khẩu thất bại!");
    }
  };

  // --- EYE ICON ---
  const EyeIcon = ({ show }) => show ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div style={containerStyle}>

      {/* 📢 TOAST */}
      {notice.show && (
        <div style={{ ...toastStyle, backgroundColor: notice.type === "success" ? "#28a745" : "#dc3545" }}>
          {notice.message}
        </div>
      )}

      <div style={formStyle}>
        <h2 style={{ color: "#fff", marginBottom: 10, fontSize: "1.8rem" }}>Quên mật khẩu</h2>
        <p style={{ color: "#888", marginBottom: 30, fontSize: "0.9rem" }}>
          {step === 1 && "Nhập email đã đăng ký để nhận mã xác thực"}
          {step === 2 && "Nhập mã 6 số đã gửi vào email của bạn"}
          {step === 3 && "Tạo mật khẩu mới cho tài khoản"}
        </p>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Nhập email đã đăng ký"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleSendOtp}
              disabled={sending}
              style={{ ...buttonStyle, opacity: sending ? 0.6 : 1 }}
            >
              {sending ? "Đang gửi..." : "Gửi mã xác thực"}
            </button>
          </>
        )}

        {/* BƯỚC 2: NHẬP OTP */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Nhập mã xác thực 6 số"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "1.3rem", fontWeight: "bold" }}
            />
            <p style={{ color: countdown > 0 ? "#e50914" : "#888", fontSize: "0.85rem", marginBottom: 15 }}>
              {countdown > 0 ? `Mã hết hạn sau ${countdown}s` : "Mã đã hết hạn!"}
            </p>
            <button onClick={handleVerifyOtp} style={buttonStyle}>Xác nhận mã</button>
            {countdown === 0 && (
              <button
                onClick={handleSendOtp}
                disabled={sending}
                style={{ ...secondaryBtnStyle, marginTop: 10 }}
              >
                {sending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
            )}
          </>
        )}

        {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
        {step === 3 && (
          <>
            <div style={{ position: "relative", marginBottom: 15 }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <div onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                <EyeIcon show={showPassword} />
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: 15 }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <div onClick={() => setShowConfirm(!showConfirm)} style={eyeStyle}>
                <EyeIcon show={showConfirm} />
              </div>
            </div>

            <button onClick={handleResetPassword} style={buttonStyle}>Đổi mật khẩu</button>
          </>
        )}

        <p style={{ color: "#888", marginTop: 25, fontSize: "0.9rem" }}>
          <Link to="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>← Quay lại Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = {
  height: "90vh", display: "flex", justifyContent: "center", alignItems: "center",
  background: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1350&q=80')",
  backgroundSize: "cover"
};

const formStyle = {
  width: 380, padding: "50px 40px", background: "rgba(0,0,0,0.85)", borderRadius: 12, textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)"
};

const inputStyle = {
  width: "100%", padding: "14px", marginBottom: 15, background: "#333", border: "1px solid #444",
  borderRadius: 5, color: "#fff", outline: "none", boxSizing: "border-box", fontSize: "1rem"
};

const buttonStyle = {
  width: "100%", padding: "14px", background: "#e50914", color: "white",
  border: "none", borderRadius: 5, fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem"
};

const secondaryBtnStyle = {
  width: "100%", padding: "12px", background: "transparent", color: "#e50914",
  border: "1px solid #e50914", borderRadius: 5, fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem"
};

const eyeStyle = {
  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
  cursor: "pointer", color: "#888", display: "flex", alignItems: "center"
};

const toastStyle = {
  position: "fixed", top: "20px", right: "20px", padding: "15px 25px", color: "#fff",
  borderRadius: "8px", fontWeight: "bold", boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  zIndex: 1000, display: "flex", alignItems: "center", gap: "10px"
};
