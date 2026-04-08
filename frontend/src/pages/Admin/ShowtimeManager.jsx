import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function ShowtimeManager() {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    const [newShowtime, setNewShowtime] = useState({ movieId: "", roomId: "", time: "" });
    const [editingShowtime, setEditingShowtime] = useState(null);

    // 1. Lấy tất cả dữ liệu cần thiết
    const fetchAllData = async () => {
        try {
            const [resShowtimes, resMovies, resRooms] = await Promise.all([
                axios.get("/showtimes/all/list"),
                axios.get("/movies"),
                axios.get("/rooms")
            ]);
            setShowtimes(resShowtimes.data);
            setMovies(resMovies.data);
            setRooms(resRooms.data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu suất chiếu:", err);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ➕ HÀM XẾP LỊCH CHIẾU MỚI
    const handleCreateShowtime = async () => {
        if (!newShowtime.movieId || !newShowtime.roomId || !newShowtime.time) {
            return alert("Sếp nhập thiếu thông tin rồi!");
        }
        try {
            await axios.post("/showtimes", newShowtime);
            alert("✅ Đã xếp lịch thành công!");
            setNewShowtime({ movieId: "", roomId: "", time: "" });
            fetchAllData();
        } catch (err) {
            alert("❌ Lỗi khi xếp lịch!");
        }
    };

    // ✏️ HÀM CẬP NHẬT LỊCH CHIẾU
    const handleUpdateShowtime = async () => {
        try {
            await axios.put(`/showtimes/${editingShowtime._id}`, editingShowtime);
            alert("✅ Đã cập nhật lịch chiếu thành công!");
            setEditingShowtime(null);
            fetchAllData();
        } catch (err) {
            alert("❌ Lỗi cập nhật rồi sếp!");
        }
    };

    // ❌ HÀM XÓA SUẤT CHIẾU
    const handleDeleteShowtime = async (id) => {
        if (window.confirm("Xóa lịch chiếu này hả sếp?")) {
            try {
                await axios.delete(`/showtimes/${id}`);
                fetchAllData();
            } catch (err) {
                alert("❌ Lỗi khi xóa lịch chiếu!");
            }
        }
    };

    return (
        <div>
            <h2 style={{ color: "#333", marginBottom: 25 }}>🕒 QUẢN LÝ SUẤT CHIẾU</h2>

            {/* ➕ FORM XẾP LỊCH MỚI */}
            <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>🕒 Xếp lịch chiếu mới</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px" }}>
                    <select style={inputStyle} value={newShowtime.movieId} onChange={e => setNewShowtime({ ...newShowtime, movieId: e.target.value })}>
                        <option value="">-- Chọn Phim --</option>
                        {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </select>

                    <select style={inputStyle} value={newShowtime.roomId} onChange={e => setNewShowtime({ ...newShowtime, roomId: e.target.value })}>
                        <option value="">-- Chọn Phòng --</option>
                        {rooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.type})</option>)}
                    </select>

                    <input type="datetime-local" style={inputStyle} value={newShowtime.time} onChange={e => setNewShowtime({ ...newShowtime, time: e.target.value })} />

                    <button onClick={handleCreateShowtime} style={btnSubmitStyle}>XẾP LỊCH</button>
                </div>
            </div>

            {/* 📋 BẢNG DANH SÁCH SUẤT CHIẾU */}
            <table style={tableStyle}>
                <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                        <th style={thStyle}>Tên Phim</th>
                        <th style={thStyle}>Phòng</th>
                        <th style={thStyle}>Giờ chiếu</th>
                        <th style={thStyle}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {showtimes.map(s => (
                        <tr key={s._id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={tdStyle}><b>{s.movieId?.title || "Phim đã xóa"}</b></td>
                            <td style={tdStyle}>{s.roomId?.name || "Phòng đã xóa"}</td>
                            <td style={tdStyle}>{new Date(s.time).toLocaleString('vi-VN')}</td>
                            <td style={tdStyle}>
                                <button onClick={() => setEditingShowtime(s)} style={{ ...btnEditStyle, marginRight: 10 }}>Sửa</button>
                                <button onClick={() => handleDeleteShowtime(s._id)} style={btnDeleteStyle}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 🟦 MODAL SỬA SUẤT CHIẾU */}
            {editingShowtime && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA LỊCH CHIẾU</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
                            <div style={{ textAlign: "left" }}>
                                <label style={labelStyle}>Chọn Phim:</label>
                                <select style={inputStyle} value={editingShowtime.movieId?._id || editingShowtime.movieId}
                                    onChange={e => setEditingShowtime({ ...editingShowtime, movieId: e.target.value })}>
                                    {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                                </select>
                            </div>

                            <div style={{ textAlign: "left" }}>
                                <label style={labelStyle}>Chọn Phòng:</label>
                                <select style={inputStyle} value={editingShowtime.roomId?._id || editingShowtime.roomId}
                                    onChange={e => setEditingShowtime({ ...editingShowtime, roomId: e.target.value })}>
                                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>

                            <div style={{ textAlign: "left" }}>
                                <label style={labelStyle}>Giờ chiếu mới:</label>
                                <input type="datetime-local" style={inputStyle}
                                    onChange={e => setEditingShowtime({ ...editingShowtime, time: e.target.value })} />
                            </div>

                            <button onClick={handleUpdateShowtime} style={{ ...btnSubmitStyle, marginTop: 10 }}>CẬP NHẬT NGAY</button>
                            <button onClick={() => setEditingShowtime(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (Giữ nguyên từ Admin.jsx) ---
const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box' };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "15px", width: "400px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };
const labelStyle = { fontSize: "0.85rem", fontWeight: "bold", display: 'block', marginBottom: '5px' };