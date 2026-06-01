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
        <div className="revenue-manager-container">
            <style>{`
                .revenue-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .rev-filter-bar {
                    background: #fff;
                    padding: 15px 25px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 25px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .rev-filter-flex {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .rev-grid-cards {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 25px;
                }
                .rev-grid-counts {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .rev-table-wrapper {
                    background: #fff;
                    border-radius: 15px;
                    overflow-x: auto;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                    border: 1px solid #eee;
                }
                .rev-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                @media (max-width: 1024px) {
                    .rev-grid-cards {
                        grid-template-columns: 1fr 1fr;
                    }
                    .rev-filter-flex select,
                    .rev-filter-flex input {
                        width: 100% !important;
                    }
                }

                @media (max-width: 768px) {
                    .rev-filter-bar {
                        padding: 15px;
                    }
                    .rev-filter-flex {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .rev-filter-flex span {
                        margin-bottom: 5px;
                    }
                    .rev-filter-flex select,
                    .rev-filter-flex input,
                    .rev-filter-flex button {
                        width: 100% !important;
                        margin: 0 !important;
                    }
                    .rev-grid-cards {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    .rev-grid-counts {
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin-bottom: 25px;
                    }
                    .rev-grid-counts > div {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 10px;
                    }
                }
            `}</style>
            
            <h2 style={{ color: "#333", marginBottom: 30, fontSize: "1.5rem", fontWeight: "800" }}>BÁO CÁO CHI TIẾT TÀI CHÍNH</h2>

            {/* 🔍 BỘ LỌC DOANH THU */}
            <div className="rev-filter-bar">
                <div className="rev-filter-flex">
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
            <div className="rev-grid-cards">
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
            <div className="rev-grid-counts">
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
            <h3 style={{ marginBottom: 20, color: "#333", fontWeight: "bold" }}>Nhật ký giao dịch gần đây</h3>
            <div className="rev-table-wrapper">
                <table className="rev-table">
                    <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                            <th style={thStyle}>Thời gian</th>
                            <th style={thStyle}>Phim</th>
                            <th style={thStyle}>Số ghế</th>
                            <th style={thStyle}>Combo / Bắp nước</th>
                            <th style={thStyle}>Voucher sử dụng</th>
                            <th style={thStyle}>Tổng tiền</th>
                            <th style={thStyle}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revenueData.history.length > 0 ? (
                            revenueData.history.map(item => (
                                <tr key={item._id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={tdStyle}>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                                    <td style={{ ...tdStyle, fontWeight: "bold", whiteSpace: "nowrap" }}>{item.showtimeId?.movieId?.title || "N/A"}</td>
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
                                    <td style={{ ...tdStyle, fontSize: '0.85rem' }}>
                                        {item.appliedVoucher ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                <span style={voucherBadgeStyle}>
                                                    {item.appliedVoucher}
                                                </span>
                                                {item.discountAmount > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 'bold', marginTop: '2px' }}>
                                                        -{item.discountAmount.toLocaleString()}đ
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#ccc' }}>Không dùng</span>
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
                                <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#999" }}>Không có giao dịch nào trong khoảng này!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- STYLES NÂNG CẤP ---
const filterInputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };
const btnSearchStyle = { padding: "12px 25px", background: "#333", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" };
const thStyle = { padding: "18px 15px", textAlign: "left", color: "#666", fontSize: '0.85rem', borderBottom: '2px solid #eee' };
const tdStyle = { padding: "15px", color: "#333", verticalAlign: 'top', fontSize: '0.9rem' };
const labelStyle = { margin: 0, fontSize: "0.8rem", fontWeight: "bold", opacity: 0.9 };
const valueStyle = { margin: "8px 0", fontSize: "1.8rem" };
const subLabelStyle = { margin: 0, fontSize: "0.7rem", opacity: 0.8 };
const revenueCardStyle = (color) => ({ background: color, color: "#fff", padding: "20px", borderRadius: "20px", boxShadow: `0 10px 20px ${color}44` });
const countCardStyle = (color) => ({ background: '#fff', color: color, padding: "20px", borderRadius: "15px", borderLeft: `8px solid ${color}`, boxShadow: `0 5px 15px rgba(0,0,0,0.01)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const statusSuccessStyle = { background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold", whiteSpace: "nowrap", display: "inline-block" };
const voucherBadgeStyle = { background: "#ffe0b2", color: "#e65100", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", display: "inline-block" };