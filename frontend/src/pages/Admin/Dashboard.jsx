import { useState, useEffect } from "react";
import axios from "../../api/axios";
// 📈 Import bộ thư viện biểu đồ xịn xò
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export default function Dashboard() {
    const [dashData, setDashData] = useState({
        totalRevenue: 0,
        ticketRevenue: 0, 
        snackRevenue: 0,  
        totalTickets: 0,
        totalSnacks: 0,   
        totalMovies: 0,
        totalRooms: 0,
        topMovies: [],
        recentBookings: []
    });

    const fetchDashboard = async () => {
        try {
            const res = await axios.get("/bookings/admin/dashboard");
            setDashData(res.data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu Dashboard:", err);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // 🥧 Chuẩn bị dữ liệu cho biểu đồ tròn (Tỷ trọng doanh thu)
    const pieData = [
        { name: 'Tiền vé', value: dashData.ticketRevenue || 0 },
        { name: 'Bắp nước', value: dashData.snackRevenue || 0 },
    ];
    // Màu sắc thương hiệu: Xanh Lux và Vàng Popcorn
    const COLORS = ['#3498db', '#f39c12']; 

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h2 style={{ marginBottom: 30, color: "#333" }}>TỔNG QUAN HỆ THỐNG</h2>

            {/* ⚡ HÀNG 1: CÁC THẺ DOANH THU (Giữ nguyên của sếp) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div style={dashCardStyle("#2ecc71")}>
                    <p style={cardLabel}>Tổng doanh thu</p>
                    <h2 style={cardValue}>{dashData.totalRevenue?.toLocaleString()}đ</h2>
                </div>
                <div style={dashCardStyle("#3498db")}>
                    <p style={cardLabel}>Doanh thu Vé</p>
                    <h2 style={cardValue}>{dashData.ticketRevenue?.toLocaleString()}đ</h2>
                </div>
                <div style={dashCardStyle("#f39c12")}>
                    <p style={cardLabel}>Doanh thu Bắp nước</p>
                    <h2 style={cardValue}>{dashData.snackRevenue?.toLocaleString()}đ</h2>
                </div>
            </div>

            {/* ⚡ HÀNG 2: THỐNG KÊ SỐ LƯỢNG (Giữ nguyên của sếp) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                <div style={smallCardStyle("#9b59b6")}>
                    <p style={smallLabel}>Vé đã bán</p>
                    <h3 style={smallValue}>{dashData.totalTickets} Vé</h3>
                </div>
                <div style={smallCardStyle("#e74c3c")}>
                    <p style={smallLabel}>Combo đã bán</p>
                    <h3 style={smallValue}>{dashData.totalSnacks} Bộ</h3>
                </div>
                <div style={smallCardStyle("#f1c40f")}>
                    <p style={smallLabel}>Tổng phim</p>
                    <h3 style={smallValue}>{dashData.totalMovies} Phim</h3>
                </div>
                <div style={smallCardStyle("#34495e")}>
                    <p style={smallLabel}>Phòng chiếu</p>
                    <h3 style={smallValue}>{dashData.totalRooms} Rạp</h3>
                </div>
            </div>

            {/* 📉 HÀNG 3: KHU VỰC BIỂU ĐỒ (Ý tưởng mới cho sếp) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", marginBottom: "40px" }}>
                
                {/* 1. Biểu đồ tròn: Tỷ trọng nguồn thu */}
                <div style={whiteBoxStyle}>
                    <h3 style={chartTitle}>Cơ cấu doanh thu</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    innerRadius={60} 
                                    outerRadius={85} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => value.toLocaleString() + 'đ'} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Biểu đồ cột: Top 5 phim đỉnh nhất */}
                <div style={whiteBoxStyle}>
                    <h3 style={chartTitle}>Phim có doanh thu cao nhất</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dashData.topMovies}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis 
                                    dataKey="title" 
                                    fontSize={11} 
                                    tick={{fill: '#666'}} 
                                    axisLine={false} 
                                    interval={0}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    formatter={(value) => value.toLocaleString() + 'đ'} 
                                    cursor={{fill: '#fcfcfc'}} 
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    fill="#fb4226" 
                                    radius={[8, 8, 0, 0]} 
                                    barSize={45} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ⚡ HÀNG 4: DANH SÁCH CHI TIẾT (Giữ nguyên của sếp) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                <div style={whiteBoxStyle}>
                    <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "15px" }}>Phim "hái ra tiền" nhất</h3>
                    {dashData.topMovies.map((m, index) => (
                        <div key={index} style={itemRowStyle}>
                            <span>{m.title}</span>
                            <b style={{ color: "#fb4226" }}>{m.revenue.toLocaleString()}đ</b>
                        </div>
                    ))}
                    {dashData.topMovies.length === 0 && <p style={emptyText}>Chưa có dữ liệu phim...</p>}
                </div>

                <div style={whiteBoxStyle}>
                    <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "15px" }}>Giao dịch mới nhất</h3>
                    {dashData.recentBookings.map((b, index) => (
                        <div key={index} style={itemRowStyle}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span>{b.showtimeId?.movieId?.title || "Phim đã xóa"}</span>
                                <span style={{ fontSize: "0.75rem", color: "#888" }}>{new Date(b.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <b style={{ color: "#2ecc71" }}>+{b.totalAmount.toLocaleString()}đ</b>
                        </div>
                    ))}
                    {dashData.recentBookings.length === 0 && <p style={emptyText}>Chưa có giao dịch nào...</p>}
                </div>
            </div>
        </div>
    );
}

// --- Styles (Gộp style cũ của sếp và thêm style mới) ---
const dashCardStyle = (color) => ({
    background: color, color: "#fff", padding: "25px", borderRadius: "15px", boxShadow: `0 8px 20px ${color}44`
});

const smallCardStyle = (color) => ({
    background: "#fff", padding: "15px 20px", borderRadius: "12px", borderLeft: `5px solid ${color}`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
});

const cardLabel = { margin: 0, fontSize: "0.9rem", opacity: 0.8, fontWeight: 'bold' };
const cardValue = { margin: "10px 0 0 0", fontSize: "1.8rem", color: "#f2f1f1" };
const smallLabel = { margin: 0, fontSize: "0.8rem", color: "#666", fontWeight: 'bold' };
const smallValue = { margin: "5px 0 0 0", fontSize: "1.2rem", color: "#333" };

const whiteBoxStyle = { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)", border: '1px solid #f0f0f0' };
const itemRowStyle = { display: "flex", justifyContent: "space-between", alignItems: 'center', padding: "12px 0", borderBottom: "1px solid #f9f9f9" };
const chartTitle = { marginTop: 0, fontSize: '1rem', color: '#555', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' };
const emptyText = { color: '#888', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' };