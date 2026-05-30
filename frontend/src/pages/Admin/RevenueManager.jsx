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

    const [movies, setMovies] = useState([]);
    
    // 🔍 1. States cho bộ lọc
    const [filterMovie, setFilterMovie] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterHasSnack, setFilterHasSnack] = useState(""); // Lọc theo combo/bắp nước

    const fetchRevenue = async (params = {}) => {
        try {
            // Gửi các tham số lọc lên Backend
            const res = await axios.get("/bookings/admin/revenue", { params });
            setRevenueData({
                totalRevenue: res.data.totalRevenue || 0,
                ticketRevenue: res.data.ticketRevenue || 0,
                snackRevenue: res.data.snackRevenue || 0,
                totalTickets: res.data.totalTickets || 0,
                totalSnacks: res.data.totalSnacks || 0,
                history: res.data.history || []
            });
        } catch (err) {
            console.error("Lỗi lấy doanh thu:", err);
            alert("Không thể xử lý, vui lòng thử lại");
        }
    };

    const fetchMovies = async () => {
        try {
            const res = await axios.get("/movies");
            setMovies(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchRevenue();
        fetchMovies();
    }, []);

    // 🎯 Hàm xử lý khi bấm TÌM KIẾM
    const handleSearch = () => {
        fetchRevenue({
            movieId: filterMovie,
            date: filterDate,
            hasSnack: filterHasSnack
        });
    };

    return (
        <div>
            <h2 style={{ color: "#333", marginBottom: 30 }}>BÁO CÁO CHI TIẾT TÀI CHÍNH</h2>

            {/* 🔍 BỘ LỌC DOANH THU */}
            <div style={filterBarStyle}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#666" }}>Bộ lọc:</span>
                    <select style={filterInputStyle} value={filterMovie} onChange={e => setFilterMovie(e.target.value)}>
                        <option value="">Tất cả phim</option>
                        {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </select>
                    <input type="date" style={filterInputStyle} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    <select style={filterInputStyle} value={filterHasSnack} onChange={e => setFilterHasSnack(e.target.value)}>
                        <option value="">Tất cả giao dịch</option>
                        <option value="true">Có mua bắp nước</option>
                        <option value="false">Chỉ mua vé</option>
                    </select>
                    <button onClick={handleSearch} style={btnSearchStyle}>Tìm kiếm</button>
                </div>
            </div>

            {/* 📊 CÁC THẺ DOANH THU (Tự động cập nhật theo filter) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                <div style={revenueCardStyle("#2ecc71")}>
                    <p style={labelStyle}>TỔNG DOANH THU</p>
                    <h2 style={valueStyle}>{revenueData.totalRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tổng cộng (Vé + Bắp)</p>
                </div>
                <div style={revenueCardStyle("#3498db")}>
                    <p style={labelStyle}>DOANH THU VÉ</p>
                    <h2 style={valueStyle}>{revenueData.ticketRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tiền bán vé xem phim</p>
                </div>
                <div style={revenueCardStyle("#f39c12")}>
                    <p style={labelStyle}>DOANH THU BẮP NƯỚC</p>
                    <h2 style={valueStyle}>{revenueData.snackRevenue?.toLocaleString()}đ</h2>
                    <p style={subLabelStyle}>Tiền bán combo bắp nước</p>
                </div>
            </div>

            {/* 📊 CÁC THẺ SỐ LƯỢNG */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                <div style={countCardStyle("#9b59b6")}>
                    <span>Tổng vé đã bán:</span>
                    <b style={{fontSize: '1.5rem'}}>{revenueData.totalTickets} vé</b>
                </div>
                <div style={countCardStyle("#e74c3c")}>
                    <span>Tổng combo đã bán:</span>
                    <b style={{fontSize: '1.5rem'}}>{revenueData.totalSnacks} bộ</b>
                </div>
            </div>

            {/* 📋 NHẬT KÝ GIAO DỊCH (Đã fix Hydration Error) */}
            <h3 style={{ marginBottom: 20 }}>Nhật ký giao dịch gần đây</h3>
            <div style={{background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)'}}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                            <th style={thStyle}>Thời gian</th>
                            <th style={thStyle}>Phim</th>
                            <th style={thStyle}>Số ghế</th>
                            <th style={thStyle}>Combo / Bắp nước</th>
                            <th style={thStyle}>Tổng tiền</th>
                            <th style={thStyle}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revenueData.history.length > 0 ? (
                            revenueData.history.map(item => (
                                <tr key={item._id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={tdStyle}>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                                    <td style={{ ...tdStyle, fontWeight: "bold" }}>{item.showtimeId?.movieId?.title || "N/A"}</td>
                                    <td style={tdStyle}>{item.seats?.join(", ")}</td>
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#999" }}>Không có giao dịch nào trong khoảng này!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- STYLES NÂNG CẤP ---
const filterBarStyle = { background: "#fff", padding: "15px 25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "25px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const filterInputStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", fontSize: '0.9rem' };
const btnSearchStyle = { padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "18px 15px", textAlign: "left", color: "#666", fontSize: '0.85rem' };
const tdStyle = { padding: "15px", color: "#333", verticalAlign: 'top' };
const labelStyle = { margin: 0, fontSize: "0.8rem", fontWeight: "bold", opacity: 0.9 };
const valueStyle = { margin: "8px 0", fontSize: "1.8rem" };
const subLabelStyle = { margin: 0, fontSize: "0.7rem", opacity: 0.8 };
const revenueCardStyle = (color) => ({ background: color, color: "#fff", padding: "20px", borderRadius: "20px", boxShadow: `0 10px 20px ${color}44` });
const countCardStyle = (color) => ({ background: '#fff', color: color, padding: "20px", borderRadius: "15px", borderLeft: `8px solid ${color}`, boxShadow: `0 5px 15px rgba(0,0,0,0.01)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const statusSuccessStyle = { background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold" };