import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function ShowtimeManager() {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [newShowtime, setNewShowtime] = useState({ movieId: "", roomId: "", time: "" });
    const [editingShowtime, setEditingShowtime] = useState(null);

    // 🤖 AI States
    const [aiDates, setAiDates] = useState({ start: "", end: "" });
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Lấy chuỗi ngày hôm nay theo giờ địa phương (YYYY-MM-DD)
    const getLocalToday = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        return new Date(today.getTime() - offset).toISOString().split('T')[0];
    };

    // 🔍 1. States cho bộ lọc (Dùng để nhập liệu)
    const [filterMovie, setFilterMovie] = useState("");
    const [filterDate, setFilterDate] = useState(getLocalToday());
    const [filterStatus, setFilterStatus] = useState("");

    // 🎯 2. State chứa tham số thực tế khi bấm TÌM KIẾM
    const [searchTrigger, setSearchTrigger] = useState({ movieId: "", date: getLocalToday(), status: "" });

    // 🎨 State chế độ xem (Bảng / POS)
    const [viewMode, setViewMode] = useState("table");

    // 🔄 3. Hàm lấy dữ liệu (Chỉ chạy khi searchTrigger thay đổi)
    const fetchAllData = async () => {
        try {
            const [resShowtimes, resMovies, resRooms] = await Promise.all([
                axios.get("/showtimes/all/list", {
                    params: searchTrigger // Gửi bộ lọc lên backend
                }),
                axios.get("/movies"),
                axios.get("/rooms")
            ]);
            setShowtimes(resShowtimes.data);
            setMovies(resMovies.data);
            setRooms(resRooms.data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
            alert("Không thể tải dữ liệu");
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [searchTrigger]); // Chỉ load lại khi bấm nút Tìm kiếm

    // 🔍 HÀM XỬ LÝ TÌM KIẾM
    const handleSearch = () => {
        const finalDate = filterDate ? filterDate : getLocalToday();
        if (!filterDate) setFilterDate(finalDate); // Nếu lỡ xóa trắng thì gán lại trên UI
        
        setSearchTrigger({
            movieId: filterMovie,
            date: finalDate,
            status: filterStatus
        });
    };

    // ◀ Giảm 1 ngày & tự tìm kiếm luôn
    const handlePrevDay = () => {
        const baseDate = filterDate ? new Date(filterDate) : new Date();
        baseDate.setDate(baseDate.getDate() - 1);
        const prevDateStr = baseDate.toISOString().split("T")[0];
        setFilterDate(prevDateStr);
        setSearchTrigger(prev => ({ ...prev, date: prevDateStr }));
    };

    // ▶ Tăng 1 ngày & tự tìm kiếm luôn
    const handleNextDay = () => {
        const baseDate = filterDate ? new Date(filterDate) : new Date();
        baseDate.setDate(baseDate.getDate() + 1);
        const nextDateStr = baseDate.toISOString().split("T")[0];
        setFilterDate(nextDateStr);
        setSearchTrigger(prev => ({ ...prev, date: nextDateStr }));
    };

    // ➕ HÀM XẾP LỊCH CHIẾU MỚI
    const handleCreateShowtime = async () => {
        if (!newShowtime.movieId || !newShowtime.roomId || !newShowtime.time) {
            return alert("Vui lòng nhập đầy đủ thông tin");
        }
        try {
            await axios.post("/showtimes", newShowtime);
            alert("Đã xếp lịch thành công");
            setNewShowtime({ movieId: "", roomId: "", time: "" });
            fetchAllData();
        } catch (err) {
            alert("Không thể xử lý, vui lòng thử lại");
        }
    };

    // ✏️ HÀM CẬP NHẬT LỊCH CHIẾU
    const handleUpdateShowtime = async () => {
        try {
            await axios.put(`/showtimes/${editingShowtime._id}`, editingShowtime);
            alert("Đã cập nhật lịch chiếu thành công");
            setEditingShowtime(null);
            fetchAllData();
        } catch (err) {
            alert("Không thể xử lý, vui lòng thử lại");
        }
    };

    // ❌ HÀM XÓA SUẤT CHIẾU
    const handleDeleteShowtime = async (id) => {
        if (window.confirm("Xóa suất chiếu này")) {
            try {
                await axios.delete(`/showtimes/${id}`);
                fetchAllData();
            } catch (err) {
                alert("Không thể xử lý, vui lòng thử lại");
            }
        }
    };

    // 🤖 HÀM CHẠY AI
    const handleRunAI = async () => {
        if (!aiDates.start || !aiDates.end) return alert("Sếp phải chọn từ ngày nào đến ngày nào nhé!");
        setIsAiLoading(true);
        try {
            const res = await axios.post("/showtimes/ai/generate", { startDate: aiDates.start, endDate: aiDates.end });
            alert(`${res.data.message}\nĐã tạo ${res.data.generatedCount} suất chiếu.`);
            fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi chạy AI");
        }
        setIsAiLoading(false);
    };

    // ✅ HÀM DUYỆT AI
    const handleApproveAI = async () => {
        if (window.confirm("Sếp có chắc muốn duyệt toàn bộ bản nháp này để công bố cho khách hàng?")) {
            try {
                await axios.post("/showtimes/ai/approve");
                alert("Đã duyệt và xuất bản lịch chiếu thành công!");
                fetchAllData();
            } catch (err) {
                alert("Lỗi duyệt lịch");
            }
        }
    };

    // ❌ HÀM HỦY BẢN NHÁP AI
    const handleDeleteDrafts = async () => {
        if (window.confirm("Sếp không ưng ý và muốn xóa tất cả bản nháp này?")) {
            try {
                const res = await axios.delete("/showtimes/ai/drafts");
                alert(res.data.message || "Đã xóa bản nháp thành công!");
                fetchAllData();
            } catch (err) {
                alert("Lỗi xóa bản nháp");
            }
        }
    };

    return (
        <div>
            <h2 style={{ color: "#333", marginBottom: 25 }}>QUẢN LÝ SUẤT CHIẾU</h2>

            {/* ➕ FORM XẾP LỊCH MỚI */}
            <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Xếp lịch chiếu mới</h3>
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

            {/* 🤖 HỆ THỐNG AI ĐỀ XUẤT */}
            <div style={{ ...cardStyle, background: "#f0f8ff", borderColor: "#cce5ff" }}>
                <h3 style={{ marginTop: 0, color: "#0056b3" }}>Hệ thống AI Đề Xuất Lịch Chiếu</h3>
                <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ fontWeight: "bold", color: "#333" }}>Từ ngày:</label>
                    <input type="date" style={inputStyle} value={aiDates.start} onChange={e => setAiDates({ ...aiDates, start: e.target.value })} />
                    <label style={{ fontWeight: "bold", color: "#333" }}>Đến ngày:</label>
                    <input type="date" style={inputStyle} value={aiDates.end} onChange={e => setAiDates({ ...aiDates, end: e.target.value })} />

                    <button onClick={handleRunAI} disabled={isAiLoading} style={{ ...btnSubmitStyle, background: "#0056b3" }}>
                        {isAiLoading ? "AI ĐANG XỬ LÝ (CHỜ XÍU)..." : "TỰ ĐỘNG XẾP LỊCH (AI)"}
                    </button>

                    {showtimes.some(s => s.isDraft) && (
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handleDeleteDrafts} style={{ ...btnSubmitStyle, background: "#dc3545", margin: 0 }}>
                                HỦY TẤT CẢ BẢN NHÁP
                            </button>
                            <button onClick={handleApproveAI} style={{ ...btnSubmitStyle, background: "#28a745", margin: 0 }}>
                                DUYỆT TẤT CẢ BẢN NHÁP
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔍 BỘ LỌC TÍCH HỢP NÚT TÌM KIẾM */}
            <div style={filterBarStyle}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "bold", color: "#555" }}>Bộ lọc:</span>

                    <select style={{ ...inputStyle, width: "200px" }} value={filterMovie} onChange={e => setFilterMovie(e.target.value)}>
                        <option value="">Tất cả phim</option>
                        {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </select>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <button onClick={handlePrevDay} style={btnArrowStyle} title="Ngày trước">◀</button>
                        <input type="date" style={{ ...inputStyle, width: "160px" }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        <button onClick={handleNextDay} style={btnArrowStyle} title="Ngày sau">▶</button>
                    </div>

                    <select style={{ ...inputStyle, width: "160px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="upcoming">Sắp chiếu</option>
                        <option value="running">Đang chiếu</option>
                        <option value="finished">Đã chiếu</option>
                    </select>

                    <button onClick={handleSearch} style={btnSearchStyle}>TÌM KIẾM</button>
                    
                    <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                        <button onClick={() => setViewMode("table")} style={{ ...btnViewStyle, background: viewMode === "table" ? "#333" : "#ddd", color: viewMode === "table" ? "#fff" : "#333" }}>📋 Dạng Bảng</button>
                        <button onClick={() => setViewMode("pos")} style={{ ...btnViewStyle, background: viewMode === "pos" ? "#fb4226" : "#ddd", color: viewMode === "pos" ? "#fff" : "#333" }}>🎫 Dạng POS</button>
                    </div>
                </div>
            </div>

            {/* 📋 HIỂN THỊ DANH SÁCH SUẤT CHIẾU */}
            {viewMode === "table" ? (
                <table style={tableStyle}>
                <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                        <th style={thStyle}>Tên Phim</th>
                        <th style={thStyle}>Phòng</th>
                        <th style={thStyle}>Giờ chiếu</th>
                        <th style={thStyle}>Trạng thái</th>
                        <th style={thStyle}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {showtimes.map(s => (
                        <tr key={s._id} style={{
                            borderBottom: "1px solid #eee",
                            background: s.isDraft ? "#fff3cd" : "transparent",
                            opacity: s.status === "finished" ? 0.6 : 1
                        }}>
                            <td style={tdStyle}><b>{s.movieId?.title || "Phim đã xóa"}</b></td>
                            <td style={tdStyle}>{s.roomId?.name || "Phòng đã xóa"}</td>
                            <td style={tdStyle}>{new Date(s.time).toLocaleString('vi-VN')}</td>
                            <td style={tdStyle}>
                                {s.status === "upcoming" && <span style={badgeGreenStyle}>Sắp chiếu</span>}
                                {s.status === "running" && <span style={badgeBlueStyle}>Đang chiếu</span>}
                                {s.status === "finished" && <span style={badgeGrayStyle}>Đã chiếu</span>}
                                {s.isDraft && <span style={{ ...badgeBlueStyle, background: "#ffc107", color: "#856404", borderColor: "#ffeeba", marginLeft: 8 }}>🤖 Bản nháp AI</span>}
                            </td>
                            <td style={tdStyle}>
                                {s.status === "upcoming" ? (
                                    <>
                                        <button onClick={() => setEditingShowtime(s)} style={{ ...btnEditStyle, marginRight: 10 }}>Sửa</button>
                                        <button onClick={() => handleDeleteShowtime(s._id)} style={btnDeleteStyle}>Xóa</button>
                                    </>
                                ) : (
                                    <span style={{ color: "#999", fontSize: "0.85rem", fontStyle: "italic" }}>Không thể chỉnh sửa</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {showtimes.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#999" }}>Không có dữ liệu</td>
                        </tr>
                    )}
                </tbody>
            </table>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginTop: "20px" }}>
                    {Object.values(showtimes.reduce((acc, curr) => {
                        const movieId = curr.movieId?._id;
                        if (!movieId) return acc;
                        if (!acc[movieId]) acc[movieId] = { movie: curr.movieId, showtimes: [] };
                        acc[movieId].showtimes.push(curr);
                        return acc;
                    }, {})).map(group => (
                        <div key={group.movie._id} style={{ display: "flex", gap: "25px", background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                            <img src={`http://localhost:5000${group.movie.image}`} alt={group.movie.title} style={{ width: "130px", height: "190px", objectFit: "cover", borderRadius: "10px" }} />
                            <div>
                                <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontSize: "1.5rem" }}>{group.movie.title}</h3>
                                <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "0.95rem" }}>{group.movie.genre} | {group.movie.duration} Phút</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                    {group.showtimes.map(st => (
                                        <div key={st._id} style={{ padding: "12px 18px", background: st.isDraft ? "#fff3cd" : "#fff", border: st.isDraft ? "1px solid #ffeeba" : "1px solid #eee", borderRadius: "12px", textAlign: "center", minWidth: "80px", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                                            <div style={{ fontWeight: "900", fontSize: "1.2rem", color: st.isDraft ? "#856404" : "#1a1a1a" }}>{new Date(st.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                                            <div style={{ fontSize: "0.85rem", color: st.isDraft ? "#856404" : "#fb4226", fontWeight: "800", marginTop: "5px" }}>{st.roomId?.name}</div>
                                            {st.isDraft && <span style={{ position: "absolute", top: "-10px", right: "-10px", background: "#dc3545", color: "#fff", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "12px", fontWeight: "bold" }}>Bản nháp AI</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {showtimes.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px", color: "#999", background: "#fff", borderRadius: "15px" }}>Không có dữ liệu</div>
                    )}
                </div>
            )}

            {/* 🟦 MODAL SỬA SUẤT CHIẾU */}
            {editingShowtime && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>CHỈNH SỬA LỊCH CHIẾU</h3>
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

// --- Styles ---
const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px" };
const filterBarStyle = { background: "#fff", padding: "15px 25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const inputStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", boxSizing: 'border-box', fontSize: '0.9rem' };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const btnSearchStyle = { padding: "10px 25px", background: "#333", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "15px", width: "400px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };
const labelStyle = { fontSize: "0.85rem", fontWeight: "bold", display: 'block', marginBottom: '5px' };

const badgeGreenStyle = { padding: "4px 10px", background: "#e6fffa", color: "#38b2ac", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", border: "1px solid #38b2ac" };
const badgeGrayStyle = { padding: "4px 10px", background: "#f7fafc", color: "#a0aec0", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", border: "1px solid #a0aec0" };
const badgeBlueStyle = { padding: "4px 10px", background: "#ebf8ff", color: "#3182ce", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", border: "1px solid #3182ce" };
const btnViewStyle = { padding: "10px 15px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" };
const btnArrowStyle = {
    padding: "10px 14px",
    background: "#fff",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
};