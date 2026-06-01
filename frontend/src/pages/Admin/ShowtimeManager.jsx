import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function ShowtimeManager() {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [newShowtime, setNewShowtime] = useState({ movieId: "", roomId: "", time: "" });
    const [editingShowtime, setEditingShowtime] = useState(null);

    // 🔔 State quản lý thông báo tự tắt
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    const showNotify = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    // ❓ State quản lý hộp thoại xác nhận Custom Modal
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        onConfirm: null
    });

    const askConfirm = (title, message, onConfirm) => {
        setConfirmModal({
            show: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmModal({ show: false, title: "", message: "", onConfirm: null });
            }
        });
    };

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
            showNotify("Không thể tải dữ liệu", "error");
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
            return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        }
        try {
            await axios.post("/showtimes", newShowtime);
            showNotify("Đã xếp lịch thành công");
            setNewShowtime({ movieId: "", roomId: "", time: "" });
            fetchAllData();
        } catch (err) {
            showNotify("Không thể xử lý, vui lòng thử lại", "error");
        }
    };

    // ✏️ HÀM CẬP NHẬT LỊCH CHIẾU
    const handleUpdateShowtime = async () => {
        if (!editingShowtime.movieId || !editingShowtime.roomId || !editingShowtime.time) {
            return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        }
        try {
            await axios.put(`/showtimes/${editingShowtime._id}`, editingShowtime);
            showNotify("Đã cập nhật lịch chiếu thành công");
            setEditingShowtime(null);
            fetchAllData();
        } catch (err) {
            showNotify("Không thể xử lý, vui lòng thử lại", "error");
        }
    };

    // ❌ HÀM XÓA SUẤT CHIẾU
    const handleDeleteShowtime = (id) => {
        askConfirm(
            "Xác nhận xóa suất chiếu",
            "Sếp có chắc chắn muốn xóa suất chiếu này không? Hành động này sẽ không thể khôi phục lại.",
            async () => {
                try {
                    await axios.delete(`/showtimes/${id}`);
                    showNotify("Đã xóa suất chiếu thành công");
                    fetchAllData();
                } catch (err) {
                    showNotify("Không thể xử lý, vui lòng thử lại", "error");
                }
            }
        );
    };

    // 🤖 HÀM CHẠY AI
    const handleRunAI = async () => {
        if (!aiDates.start || !aiDates.end) return showNotify("Sếp phải chọn từ ngày nào đến ngày nào nhé!", "error");
        setIsAiLoading(true);
        try {
            const res = await axios.post("/showtimes/ai/generate", { startDate: aiDates.start, endDate: aiDates.end });
            showNotify(`${res.data.message}. Đã tạo ${res.data.generatedCount} suất chiếu.`);
            fetchAllData();
        } catch (err) {
            showNotify(err.response?.data?.message || "Lỗi chạy AI", "error");
        }
        setIsAiLoading(false);
    };

    // ✅ HÀM DUYỆT AI
    const handleApproveAI = () => {
        askConfirm(
            "Duyệt tất cả bản nháp AI",
            "Sếp có chắc muốn duyệt toàn bộ bản nháp này để công bố cho khách hàng?",
            async () => {
                try {
                    await axios.post("/showtimes/ai/approve");
                    showNotify("Đã duyệt và xuất bản lịch chiếu thành công!");
                    fetchAllData();
                } catch (err) {
                    showNotify("Lỗi duyệt lịch", "error");
                }
            }
        );
    };

    // ❌ HÀM HỦY BẢN NHÁP AI
    const handleDeleteDrafts = () => {
        askConfirm(
            "Xóa tất cả bản nháp AI",
            "Sếp không ưng ý và muốn xóa tất cả bản nháp này?",
            async () => {
                try {
                    const res = await axios.delete("/showtimes/ai/drafts");
                    showNotify(res.data.message || "Đã xóa bản nháp thành công!");
                    fetchAllData();
                } catch (err) {
                    showNotify("Lỗi xóa bản nháp", "error");
                }
            }
        );
    };

    return (
        <div className="showtime-manager-container" style={{ position: 'relative' }}>
            {/* 📢 THÔNG BÁO TỰ TẮT */}
            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === "success" ? "#2ecc71" : "#e74c3c" }}>
                    {notification.message}
                </div>
            )}
            <style>{`
                .showtime-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .st-card-box {
                    background: #fdfcf0;
                    padding: 25px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 20px;
                }
                .st-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 15px;
                }
                .st-ai-box {
                    background: #f0f8ff;
                    border: 1px solid #cce5ff;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                }
                .st-ai-flex {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .st-filter-bar {
                    background: #fff;
                    padding: 15px 25px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .st-filter-flex {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .st-day-picker {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .st-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #eee;
                    margin-top: 15px;
                }
                .st-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                }
                
                /* POS view responsive styling */
                .st-pos-list {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    margin-top: 20px;
                }
                .st-pos-card {
                    display: flex;
                    gap: 25px;
                    background: #fff;
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    border: 1px solid #f0f0f0;
                }
                .st-pos-img {
                    width: 130px;
                    height: 190px;
                    object-fit: cover;
                    border-radius: 10px;
                }
                .st-pos-content {
                    flex: 1;
                }
                .st-pos-time-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .st-modal-content {
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    width: 400px;
                    max-width: 90%;
                    box-sizing: border-box;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                @media (max-width: 1024px) {
                    .st-form-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .st-filter-flex {
                        gap: 10px;
                    }
                    .st-filter-flex select, 
                    .st-filter-flex input {
                        width: 100% !important;
                    }
                }

                @media (max-width: 768px) {
                    .st-card-box, .st-ai-box {
                        padding: 15px;
                    }
                    .st-form-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .st-ai-flex {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .st-ai-flex input,
                    .st-ai-flex button {
                        width: 100% !important;
                    }
                    .st-ai-flex .st-draft-btn-group {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        width: 100%;
                    }
                    .st-filter-bar {
                        padding: 15px;
                    }
                    .st-filter-flex {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .st-filter-flex select,
                    .st-filter-flex input,
                    .st-filter-flex button {
                        width: 100% !important;
                        margin: 0 !important;
                    }
                    .st-filter-flex .st-day-picker {
                        display: flex;
                        width: 100%;
                        gap: 8px;
                    }
                    .st-filter-flex .st-day-picker input {
                        flex: 1;
                    }
                    .st-filter-flex .st-view-modes {
                        margin-left: 0 !important;
                        display: flex;
                        width: 100%;
                        gap: 8px;
                    }
                    .st-filter-flex .st-view-modes button {
                        flex: 1;
                    }
                    
                    /* POS view card stacked vertically */
                    .st-pos-card {
                        flex-direction: column;
                        padding: 15px;
                        gap: 15px;
                        align-items: center;
                        text-align: center;
                    }
                    .st-pos-img {
                        width: 150px;
                        height: 220px;
                    }
                    .st-pos-time-grid {
                        justify-content: center;
                    }
                }
            `}</style>
            <h2 style={{ color: "#333", marginBottom: 25, fontSize: "1.5rem", fontWeight: "800" }}>QUẢN LÝ SUẤT CHIẾU</h2>

            {/* ➕ FORM XẾP LỊCH MỚI */}
            <div className="st-card-box">
                <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#555", fontWeight: "bold" }}>Xếp lịch chiếu mới</h3>
                <div className="st-form-grid">
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
            <div className="st-ai-box">
                <h3 style={{ marginTop: 0, color: "#0056b3", fontWeight: "bold", marginBottom: "15px" }}>Hệ thống AI Đề Xuất Lịch Chiếu</h3>
                <div className="st-ai-flex">
                    <label style={{ fontWeight: "bold", color: "#333" }}>Từ ngày:</label>
                    <input type="date" style={inputStyle} value={aiDates.start} onChange={e => setAiDates({ ...aiDates, start: e.target.value })} />
                    <label style={{ fontWeight: "bold", color: "#333" }}>Đến ngày:</label>
                    <input type="date" style={inputStyle} value={aiDates.end} onChange={e => setAiDates({ ...aiDates, end: e.target.value })} />

                    <button onClick={handleRunAI} disabled={isAiLoading} style={{ ...btnSubmitStyle, background: "#0056b3" }}>
                        {isAiLoading ? "AI ĐANG XỬ LÝ (CHỜ XÍU)..." : "TỰ ĐỘNG XẾP LỊCH (AI)"}
                    </button>

                    {showtimes.some(s => s.isDraft) && (
                        <div className="st-draft-btn-group">
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
            <div className="st-filter-bar">
                <div className="st-filter-flex">
                    <span style={{ fontWeight: "bold", color: "#555" }}>Bộ lọc:</span>

                    <select style={{ ...inputStyle, width: "200px" }} value={filterMovie} onChange={e => setFilterMovie(e.target.value)}>
                        <option value="">Tất cả phim</option>
                        {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </select>

                    <div className="st-day-picker">
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
                    
                    <div className="st-view-modes" style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                        <button onClick={() => setViewMode("table")} style={{ ...btnViewStyle, background: viewMode === "table" ? "#333" : "#ddd", color: viewMode === "table" ? "#fff" : "#333" }}>Dạng Bảng</button>
                        <button onClick={() => setViewMode("pos")} style={{ ...btnViewStyle, background: viewMode === "pos" ? "#fb4226" : "#ddd", color: viewMode === "pos" ? "#fff" : "#333" }}>Dạng POS</button>
                    </div>
                </div>
            </div>

            {/* 📋 HIỂN THỊ DANH SÁCH SUẤT CHIẾU */}
            {viewMode === "table" ? (
                <div className="st-table-wrapper">
                    <table className="st-table">
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
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {s.status === "upcoming" && <span style={badgeGreenStyle}>Sắp chiếu</span>}
                                            {s.status === "running" && <span style={badgeBlueStyle}>Đang chiếu</span>}
                                            {s.status === "finished" && <span style={badgeGrayStyle}>Đã chiếu</span>}
                                            {s.isDraft && <span style={{ ...badgeBlueStyle, background: "#ffc107", color: "#856404", borderColor: "#ffeeba" }}>🤖 Bản nháp AI</span>}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        {s.status === "upcoming" ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setEditingShowtime(s)} style={btnEditStyle}>Sửa</button>
                                                <button onClick={() => handleDeleteShowtime(s._id)} style={btnDeleteStyle}>Xóa</button>
                                            </div>
                                        ) : (
                                            <span style={{ color: "#999", fontSize: "0.85rem", fontStyle: "italic" }}>Không chỉnh sửa</span>
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
                </div>
            ) : (
                <div className="st-pos-list">
                    {Object.values(showtimes.reduce((acc, curr) => {
                        const movieId = curr.movieId?._id;
                        if (!movieId) return acc;
                        if (!acc[movieId]) acc[movieId] = { movie: curr.movieId, showtimes: [] };
                        acc[movieId].showtimes.push(curr);
                        return acc;
                    }, {})).map(group => (
                        <div key={group.movie._id} className="st-pos-card">
                            <img src={`${import.meta.env.DEV ? "http://localhost:5000" : window.location.origin}${group.movie.image}`} alt={group.movie.title} className="st-pos-img" />
                            <div className="st-pos-content">
                                <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontSize: "1.4rem", fontWeight: "bold" }}>{group.movie.title}</h3>
                                <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "0.9rem", fontWeight: "600" }}>{group.movie.genre} | {group.movie.duration} Phút</p>
                                <div className="st-pos-time-grid">
                                    {group.showtimes.map(st => (
                                        <div key={st._id} style={{ padding: "12px 18px", background: st.isDraft ? "#fff3cd" : "#fff", border: st.isDraft ? "1px solid #ffeeba" : "1px solid #eee", borderRadius: "12px", textAlign: "center", minWidth: "80px", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                                            <div style={{ fontWeight: "900", fontSize: "1.1rem", color: st.isDraft ? "#856404" : "#1a1a1a" }}>{new Date(st.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                                            <div style={{ fontSize: "0.8rem", color: st.isDraft ? "#856404" : "#fb4226", fontWeight: "800", marginTop: "5px" }}>{st.roomId?.name}</div>
                                            {st.isDraft && <span style={{ position: "absolute", top: "-10px", right: "-10px", background: "#dc3545", color: "#fff", fontSize: "0.65rem", padding: "3px 8px", borderRadius: "12px", fontWeight: "bold" }}>Bản nháp AI</span>}
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
                    <div className="st-modal-content">
                        <h3 style={{ color: "#fb4226", marginTop: 0, fontWeight: "bold" }}>CHỈNH SỬA LỊCH CHIẾU</h3>
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
                            <button onClick={() => setEditingShowtime(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontWeight: "bold" }}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟦 CUSTOM CONFIRMATION MODAL */}
            {confirmModal.show && (
                <div style={modalOverlayStyle}>
                    <div className="st-modal-content" style={{ animation: "scaleIn 0.2s ease-out" }}>
                        <style>{`
                            @keyframes scaleIn {
                                from { transform: scale(0.9); opacity: 0; }
                                to { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                        <div style={{ fontSize: "3rem", color: "#fb4226", marginBottom: "15px" }}>⚠️</div>
                        <h3 style={{ color: "#333", marginTop: 0, fontWeight: "900", fontSize: "1.4rem" }}>{confirmModal.title}</h3>
                        <p style={{ color: "#666", fontSize: "0.95rem", margin: "15px 0 25px 0", lineHeight: "1.5" }}>{confirmModal.message}</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button 
                                onClick={() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })} 
                                style={{ padding: "10px 20px", background: "#eee", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm} 
                                style={{ padding: "10px 25px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(251, 66, 38, 0.2)" }}
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const inputStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" };
const btnSearchStyle = { padding: "10px 25px", background: "#333", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666", fontSize: '0.85rem', borderBottom: '2px solid #eee' };
const tdStyle = { padding: "15px", color: "#333", fontSize: '0.9rem' };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const labelStyle = { fontSize: "0.85rem", fontWeight: "bold", display: 'block', marginBottom: '5px', color: '#555' };

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
const toastStyle = { position: 'fixed', top: '20px', right: '20px', padding: '12px 25px', color: 'white', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
