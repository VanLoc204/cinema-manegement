import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Profile() {
    const userId = localStorage.getItem("userId");
    
    // 📦 State lưu thông tin hồ sơ
    const [info, setInfo] = useState({
        fullName: localStorage.getItem("name") || "",
        birthday: "",
        address: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);

    // 🔄 1. Vừa vào trang là lấy dữ liệu từ Database hiện lên ngay
    useEffect(() => {
        if (userId) {
            axios.get(`/auth/profile-detail/${userId}`)
                .then(res => {
                    // Nếu đã có dữ liệu trong DB thì điền vào các ô
                    if (res.data) {
                        setInfo({
                            fullName: res.data.fullName || localStorage.getItem("name"),
                            birthday: res.data.birthday || "",
                            address: res.data.address || "",
                            phone: res.data.phone || ""
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi lấy hồ sơ:", err);
                    setLoading(false);
                });
        }
    }, [userId]);

    // 💾 2. Hàm lưu thông tin khi sếp nhấn nút
    const handleSave = async () => {
        try {
            const res = await axios.put(`/auth/update-profile-detail/${userId}`, info);
            
            // Cập nhật lại tên hiển thị ở Navbar nếu sếp đổi Họ tên
            localStorage.setItem("name", info.fullName);
            
            alert("✅ Đã lưu thông tin hồ sơ của sếp thành công!");
            window.location.reload(); // Load lại để Navbar cập nhật tên mới
        } catch (err) {
            alert("❌ Lỗi lưu thông tin rồi sếp ơi!");
        }
    };

    if (loading) return <div style={{ padding: 100, textAlign: "center", color: "#666" }}>Đang tải hồ sơ của sếp...</div>;

    return (
        <div style={{ padding: "60px 20px", background: "#fdfcf0", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "500px", background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 15px 50px rgba(0,0,0,0.08)", borderTop: "8px solid #fb4226" }}>
                
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div style={avatarStyle}>{info.fullName.charAt(0).toUpperCase()}</div>
                    <h2 style={{ color: "#333", margin: "10px 0 5px 0" }}>HỒ SƠ CÁ NHÂN</h2>
                    <p style={{ color: "#888", fontSize: "0.9rem" }}>Sếp có thể xem và chỉnh sửa thông tin tại đây</p>
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Họ và tên của sếp:</label>
                    <input type="text" value={info.fullName} style={inputStyle} onChange={e => setInfo({...info, fullName: e.target.value})} placeholder="Nhập họ tên đầy đủ" />
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Ngày sinh:</label>
                    <input type="date" value={info.birthday} style={inputStyle} onChange={e => setInfo({...info, birthday: e.target.value})} />
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Số điện thoại:</label>
                    <input type="text" value={info.phone} style={inputStyle} onChange={e => setInfo({...info, phone: e.target.value})} placeholder="Nhập số điện thoại" />
                </div>

                <div style={inputGroup}>
                    <label style={labelStyle}>Địa chỉ nơi ở:</label>
                    <input type="text" value={info.address} style={inputStyle} onChange={e => setInfo({...info, address: e.target.value})} placeholder="Nhập địa chỉ của sếp" />
                </div>

                <button onClick={handleSave} style={btnSaveStyle}>
                    LƯU THAY ĐỔI
                </button>

                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#aaa", marginTop: "20px" }}>
                    Thông tin của sếp được bảo mật tuyệt đối tại Cinema Lux.
                </p>
            </div>
        </div>
    );
}

// --- 💄 Styles ---
const avatarStyle = { width: "80px", height: "80px", background: "#fb4226", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto", fontWeight: "bold", boxShadow: "0 5px 15px rgba(251, 66, 38, 0.3)" };
const inputGroup = { marginBottom: "20px" };
const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555", fontSize: "0.9rem" };
const inputStyle = { width: "100%", padding: "12px 15px", borderRadius: "10px", border: "1px solid #ddd", outline: "none", fontSize: "1rem", boxSizing: "border-box", transition: "0.3s" };
const btnSaveStyle = { width: "100%", padding: "15px", background: "#fb4226", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", boxShadow: "0 5px 20px rgba(251, 66, 38, 0.4)", marginTop: "10px" };
