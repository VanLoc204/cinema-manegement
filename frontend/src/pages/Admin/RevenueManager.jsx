import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function RevenueManager() {
    const [revenueData, setRevenueData] = useState({ 
        totalRevenue: 0, 
        ticketRevenue: 0, 
        snackRevenue: 0, 
        totalTickets: 0, 
        totalSnacks: 0, 
        history: [] 
    });

    const fetchRevenue = async () => {
        try {
            const res = await axios.get("/bookings/admin/revenue");
            // Backend đã được sếp sửa để trả về các trường này rồi
            setRevenueData({
                totalRevenue: res.data.totalRevenue,
                ticketRevenue: res.data.ticketRevenue,
                snackRevenue: res.data.snackRevenue,
                totalTickets: res.data.totalTickets,
                totalSnacks: res.data.totalSnacks,
                history: res.data.history
            });
        } catch (err) {
            console.error("Lỗi lấy doanh thu:", err);
        }
    };

    useEffect(() => {
        fetchRevenue();
    }, []);

    return (
        <div>
            <h2 style={{ color: "#333", marginBottom: 30 }}>💰 BÁO CÁO CHI TIẾT TÀI CHÍNH</h2>

            {/* 📊 CÁC THẺ DOANH THU */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                <div style={revenueCardStyle("#2ecc71")}>
                    <p style={labelStyle}>💰 TỔNG DOANH THU</p>
                    <h2 style={valueStyle}>{revenueData.totalRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tổng cộng (Vé + Bắp)</p>
                </div>
                <div style={revenueCardStyle("#3498db")}>
                    <p style={labelStyle}>🎟️ DOANH THU VÉ</p>
                    <h2 style={valueStyle}>{revenueData.ticketRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tiền bán vé xem phim</p>
                </div>
                <div style={revenueCardStyle("#f39c12")}>
                    <p style={labelStyle}>🍿 DOANH THU BẮP NƯỚC</p>
                    <h2 style={valueStyle}>{revenueData.snackRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tiền bán combo bắp nước</p>
                </div>
            </div>

            {/* 📊 CÁC THẺ SỐ LƯỢNG */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                <div style={countCardStyle("#9b59b6")}>
                    <span>Tổng số vé bán ra:</span>
                    <b style={{fontSize: '1.5rem'}}>{revenueData.totalTickets} vé</b>
                </div>
                <div style={countCardStyle("#e74c3c")}>
                    <span>Tổng combo bắp nước:</span>
                    <b style={{fontSize: '1.5rem'}}>{revenueData.totalSnacks} bộ</b>
                </div>
            </div>

            {/* 📋 NHẬT KÝ GIAO DỊCH CHI TIẾT */}
            <h3 style={{ marginBottom: 20 }}>🕒 Nhật ký giao dịch gần đây</h3>
            <div style={{background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)'}}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                            <th style={thStyle}>Thời gian</th>
                            <th style={thStyle}>Phim</th>
                            <th style={thStyle}>Số ghế</th>
                            <th style={thStyle}>Combo / Bắp nước</th> {/* 🚩 CỘT MỚI */}
                            <th style={thStyle}>Tổng tiền</th>
                            <th style={thStyle}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revenueData.history.map(item => (
                            <tr key={item._id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={tdStyle}>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                                <td style={{ ...tdStyle, fontWeight: "bold" }}>{item.showtimeId?.movieId?.title || "N/A"}</td>
                                <td style={tdStyle}>{item.seats?.join(", ")}</td>
                                
                                {/* 🚩 HIỂN THỊ CHI TIẾT SNACKS */}
                                <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#666' }}>
                                    {item.snacks && item.snacks.length > 0 ? (
                                        item.snacks.map((s, idx) => (
                                            <div key={idx}>• {s.name} (x{s.quantity})</div>
                                        ))
                                    ) : (
                                        <span style={{ color: '#ccc' }}>Không mua bắp</span>
                                    )}
                                </td>

                                <td style={{ ...tdStyle, color: "#2ecc71", fontWeight: "bold" }}>
                                    +{item.totalAmount?.toLocaleString()}đ
                                </td>
                                <td style={tdStyle}><span style={statusSuccessStyle}>Thành công</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Styles giữ nguyên từ mẫu cũ ---
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "18px 15px", textAlign: "left", color: "#666", fontSize: '0.85rem' };
const tdStyle = { padding: "15px", color: "#333", verticalAlign: 'top' };
const labelStyle = { margin: 0, fontSize: "0.8rem", fontWeight: "bold", opacity: 0.9 };
const valueStyle = { margin: "8px 0", fontSize: "1.8rem" };
const subLabelStyle = { margin: 0, fontSize: "0.7rem", opacity: 0.8 };
const revenueCardStyle = (color) => ({ background: color, color: "#fff", padding: "20px", borderRadius: "20px", boxShadow: `0 10px 20px ${color}44` });
const countCardStyle = (color) => ({ background: '#fff', color: color, padding: "20px", borderRadius: "15px", borderLeft: `8px solid ${color}`, boxShadow: `0 5px 15px rgba(0,0,0,0.01)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const statusSuccessStyle = { background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold" };