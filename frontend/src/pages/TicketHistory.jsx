import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function TicketHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (userId) {
            // 🔍 Gọi API lấy lịch sử đặt vé của sếp
            axios.get(`/bookings/user/${userId}`)
                .then(res => {
                    setHistory(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi lấy lịch sử:", err);
                    setLoading(false);
                });
        }
    }, [userId]);

    if (loading) return <div style={{ padding: 100, textAlign: "center", color: "#666" }}>Đang tải lịch sử vé của sếp...</div>;

    return (
        <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto", minHeight: "80vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                <div style={{ width: "8px", height: "35px", background: "#fb4226", borderRadius: "4px" }}></div>
                <h2 style={{ margin: 0, color: "#333", fontSize: "2rem", fontWeight: "800" }}>LỊCH SỬ ĐẶT VÉ</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {history.length > 0 ? history.map(ticket => (
                    <div key={ticket._id} style={ticketCardStyle}>
                        {/* 🎫 CỘT TRÁI: Thông tin vé */}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 12px 0", color: "#fb4226", fontSize: "1.4rem" }}>
                                {ticket.showtimeId?.movieId?.title || "Phim không xác định"}
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <p style={infoTextStyle}>📅 <b>Ngày:</b> {new Date(ticket.showtimeId?.time).toLocaleDateString('vi-VN')}</p>
                                <p style={infoTextStyle}>⏰ <b>Giờ:</b> {new Date(ticket.showtimeId?.time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                                <p style={infoTextStyle}>🏛️ <b>Phòng:</b> {ticket.showtimeId?.roomId?.name || "N/A"}</p>
                                <p style={infoTextStyle}>💺 <b>Ghế:</b> <span style={{ color: "#fb4226", fontWeight: "bold" }}>{ticket.seats?.join(", ")}</span></p>
                            </div>
                        </div>

                        {/* 💰 CỘT PHẢI: Giá và Mã vé */}
                        <div style={{ textAlign: "right", borderLeft: "2px dashed #eee", paddingLeft: "40px", minWidth: "150px" }}>
                            <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "5px" }}>ID: {ticket._id.slice(-8).toUpperCase()}</p>
                            <span style={statusBadgeStyle}>✓ ĐÃ THANH TOÁN</span>
                            <h2 style={{ color: "#333", margin: "15px 0 0 0", fontSize: "1.6rem" }}>
                                {ticket.totalAmount?.toLocaleString()}đ
                            </h2>
                        </div>
                    </div>
                )) : (
                    <div style={emptyBoxStyle}>
                        <p style={{ fontSize: "1.2rem", margin: 0 }}>Sếp chưa đặt vé nào cả!</p>
                        <p style={{ fontSize: "0.9rem", color: "#aaa" }}>Hãy quay lại trang chủ để chọn phim hay nhé.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- 💄 Styles chuyên nghiệp cho Cinema Lux ---
const ticketCardStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
    borderLeft: "10px solid #fb4226",
    transition: "transform 0.3s ease",
    cursor: "default"
};

const infoTextStyle = { margin: "0", color: "#555", fontSize: "0.95rem" };

const statusBadgeStyle = {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    letterSpacing: "0.5px"
};

const emptyBoxStyle = {
    textAlign: "center",
    padding: "80px 20px",
    color: "#999",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    border: "2px dashed #eee"
};
