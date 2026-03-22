import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function Admin() {
    const [activeTab, setActiveTab] = useState("movies");
    const [movies, setMovies] = useState([]);
    const [editingShowtime, setEditingShowtime] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);
    // 1. Biến lưu phim đang chọn để sửa
    const [editingMovie, setEditingMovie] = useState(null);
    const [revenueData, setRevenueData] = useState({ totalRevenue: 0, totalTickets: 0, history: [] });
    // 1. Thêm State (Dán vào đầu file Admin.jsx)
    const [dashData, setDashData] = useState({
        totalRevenue: 0, totalTickets: 0, totalMovies: 0, totalRooms: 0,
        topMovies: [], recentBookings: []
    });
    // 🛡️ Cảnh sát bảo vệ trang Admin
    const AdminRoute = ({ children }) => {
        const role = localStorage.getItem("role");
        if (role !== "admin") {
            alert("Sếp ơi, khu vực này chỉ dành cho Admin thôi!");
            return <Navigate to="/login" />;
        }
        return children;
    };


    // 2. Hàm lấy dữ liệu
    const fetchDashboard = () => {
        axios.get("/bookings/admin/dashboard").then(res => setDashData(res.data));
    };

    const fetchRevenue = () => {
        axios.get("/bookings/admin/revenue").then(res => setRevenueData(res.data));
    };

    useEffect(() => {
        if (activeTab === "revenue") fetchRevenue();
    }, [activeTab]);
    // 2. Hàm gửi dữ liệu sửa lên Server
    const handleUpdateMovie = async () => {
        try {
            const movieData = {
                ...editingMovie,
                duration: Number(editingMovie.duration) // Ép kiểu số
            };
            await axios.put(`/movies/${editingMovie._id}`, movieData);
            alert("✅ Đã cập nhật thông tin phim thành công sếp ơi!");
            setEditingMovie(null); // Đóng modal
            fetchMovies(); // Tải lại danh sách
        } catch (err) {
            alert("❌ Lỗi cập nhật phim rồi sếp!");
        }
    };

    const handleUpdateRoom = async () => {
        try {
            await axios.put(`/rooms/${editingRoom._id}`, editingRoom);
            alert("✅ Cập nhật phòng thành công!");
            setEditingRoom(null);
            fetchRooms();
        } catch (err) {
            alert("❌ Lỗi cập nhật phòng!");
        }
    };

    // Hàm xóa phòng (Đảm bảo sếp đã có hàm này)
    const handleDeleteRoom = async (id) => {
        if (window.confirm("Xóa phòng này hả sếp?")) {
            await axios.delete(`/rooms/${id}`);
            fetchRooms();
        }
    };

    const handleUpdateShowtime = async () => {
        try {
            // Gọi API PUT để lưu vào Database
            await axios.put(`/showtimes/${editingShowtime._id}`, editingShowtime);
            alert("✅ Đã cập nhật lịch chiếu thành công!");
            setEditingShowtime(null); // Đóng cửa sổ sửa
            fetchShowtimes(); // Tải lại bảng
        } catch (err) {
            alert("❌ Lỗi cập nhật rồi sếp!");
        }
    };

    // 📦 State cho Form thêm phim
    const [newMovie, setNewMovie] = useState({
        title: "",
        description: "",
        image: "",
        genre: "",
        duration: ""
    });
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ name: "", price: "", rows: 9, cols: 12 });
    // 🕒 Thêm biến lưu danh sách suất chiếu và suất chiếu mới
    const [showtimes, setShowtimes] = useState([]);
    const [newShowtime, setNewShowtime] = useState({ movieId: "", roomId: "", time: "" });

    // 🕒 Hàm lấy danh sách suất chiếu từ Backend
    const fetchShowtimes = () => {
        axios.get("/showtimes/all/list").then(res => setShowtimes(res.data));
    };

    // ❌ Hàm xóa suất chiếu
    const handleDeleteShowtime = async (id) => {
        if (window.confirm("Xóa lịch chiếu này hả sếp?")) {
            await axios.delete(`/showtimes/${id}`);
            fetchShowtimes();
        }
    };

    const fetchRooms = () => {
        axios.get("/rooms").then(res => setRooms(res.data));
    };

    useEffect(() => {
        if (activeTab === "rooms") fetchRooms();
    }, [activeTab]);

    // 🎬 1. Lấy danh sách phim từ Database
    const fetchMovies = () => {
        axios.get("/movies").then(res => setMovies(res.data));
    };
    // 3. Cập nhật useEffect cũ của sếp
    useEffect(() => {
        if (activeTab === "dashboard") fetchDashboard();
        // ... (giữ lại các if cho movies, rooms, showtimes của sếp)
    }, [activeTab]);
    useEffect(() => {
        fetchMovies(); // Luôn lấy phim để hiện vào ô chọn (Dropdown)
        fetchRooms();  // Luôn lấy phòng để hiện vào ô chọn (Dropdown)

        if (activeTab === "rooms") fetchRooms();
        if (activeTab === "showtimes") fetchShowtimes();
    }, [activeTab]);

    // ➕ 2. Hàm thêm phim mới (Đã sửa lỗi thiếu dữ liệu)
    const handleAddMovie = async (e) => {
        e.preventDefault();
        try {
            // Đảm bảo dữ liệu gửi lên khớp 100% với Schema Backend
            const movieData = {
                title: newMovie.title,
                description: newMovie.description,
                image: newMovie.image,
                genre: newMovie.genre,
                duration: Number(newMovie.duration), // Ép kiểu số
                status: "now_showing" // Trạng thái mặc định
            };

            await axios.post("/movies", movieData);
            alert("✅ Đã 'bơm' phim thành công và đủ dữ liệu sếp ơi!");

            // Xóa form sau khi thêm
            setNewMovie({ title: "", description: "", image: "", genre: "", duration: "" });
            fetchMovies();
        } catch (err) {
            alert("❌ Lỗi khi thêm phim rồi sếp!");
        }
    };

    // ❌ 3. Hàm xóa phim
    const handleDelete = async (id) => {
        if (window.confirm("Sếp có chắc muốn xóa phim này không?")) {
            try {
                await axios.delete(`/movies/${id}`);
                fetchMovies();
            } catch (err) {
                alert("Lỗi khi xóa phim!");
            }
        }
    };

    // 📝 Danh sách menu quản trị
    const menuItems = [
        { id: "dashboard", label: "📊 Dashboard", color: "#3498db" },
        { id: "movies", label: "🎬 Quản lý Phim", color: "#e74c3c" },
        { id: "rooms", label: "🏢 Quản lý Phòng chiếu", color: "#f1c40f" },
        { id: "showtimes", label: "🕒 Quản lý Suất chiếu", color: "#9b59b6" },
        { id: "users", label: "👥 Quản lý tài khoản", color: "#1abc9c" },
        { id: "revenue", label: "💰 Quản lý doanh thu", color: "#2ecc71" },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f6" }}>

            {/* 🏰 SIDEBAR */}
            <div style={{ width: "280px", background: "#2c3e50", color: "white", padding: "30px 0", display: "flex", flexDirection: "column", boxShadow: "4px 0 10px rgba(0,0,0,0.1)" }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>ADMIN PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>CINEMA LUX SYSTEM</p>
                </div>

                {menuItems.map((item) => (
                    <div key={item.id} onClick={() => setActiveTab(item.id)}
                        style={{
                            padding: "15px 30px", cursor: "pointer", transition: "0.3s",
                            background: activeTab === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                            borderLeft: activeTab === item.id ? `5px solid ${item.color}` : "5px solid transparent",
                            fontWeight: activeTab === item.id ? "bold" : "normal",
                            display: "flex", alignItems: "center", gap: "15px"
                        }}>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 🖥️ MAIN CONTENT (Đã tích hợp Quản lý Phim và Phòng chiếu) */}
            <div style={{ flex: 1, padding: "40px" }}>
                <div style={{ background: "#fff", padding: "30px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)", minHeight: "80vh" }}>
                    <h1 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
                        {menuItems.find(i => i.id === activeTab).label}
                    </h1>

                    {/* 🎬 TRƯỜNG HỢP 1: QUẢN LÝ PHIM */}
                    {activeTab === "movies" && (
                        <div>
                            <div style={cardStyle}>
                                <h3 style={{ marginTop: 0 }}>➕ Thêm phim mới</h3>
                                <form onSubmit={handleAddMovie} style={formStyle}>
                                    <input placeholder="Tên phim" value={newMovie.title} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} required />
                                    <input placeholder="Thể loại" value={newMovie.genre} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} />
                                    <input placeholder="Thời lượng (phút)" type="number" value={newMovie.duration} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, duration: e.target.value })} />
                                    <input placeholder="Link ảnh Poster" value={newMovie.image} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, image: e.target.value })} required />
                                    <textarea placeholder="Mô tả phim" value={newMovie.description} style={{ ...inputStyle, gridColumn: "span 2", minHeight: "100px" }} onChange={e => setNewMovie({ ...newMovie, description: e.target.value })} required />
                                    <button type="submit" style={btnSubmitStyle}>LƯU PHIM VÀO HỆ THỐNG</button>
                                </form>
                            </div>

                            <table style={tableStyle}>
                                <thead style={{ background: "#f8f9fa" }}>
                                    <tr>
                                        <th style={thStyle}>Ảnh</th>
                                        <th style={thStyle}>Tên phim</th>
                                        <th style={thStyle}>Thể loại</th>
                                        <th style={thStyle}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movies.map(m => (
                                        <tr key={m._id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={tdStyle}><img src={m.image} width="50" style={{ borderRadius: 5 }} alt="" /></td>
                                            <td style={{ ...tdStyle, fontWeight: "bold" }}>{m.title}</td>
                                            <td style={tdStyle}>{m.genre}</td>
                                            <td style={tdStyle}>
                                                {/* ✏️ Nút Sửa mới thêm cho sếp */}
                                                <button
                                                    onClick={() => setEditingMovie(m)}
                                                    style={{ ...btnEditStyle, marginRight: 10 }}
                                                >Sửa</button>
                                                <button onClick={() => handleDelete(m._id)} style={btnDeleteStyle}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* 🟦 MODAL SỬA PHIM (Hiện lên khi sếp nhấn nút Sửa) */}
                            {editingMovie && (
                                <div style={modalOverlayStyle}>
                                    <div style={{ ...modalContentStyle, width: "600px" }}>
                                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA THÔNG TIN PHIM</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px" }}>

                                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Tên phim:</label>
                                                <input style={inputStyle} value={editingMovie.title}
                                                    onChange={e => setEditingMovie({ ...editingMovie, title: e.target.value })} />
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Thể loại:</label>
                                                <input style={inputStyle} value={editingMovie.genre}
                                                    onChange={e => setEditingMovie({ ...editingMovie, genre: e.target.value })} />
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Thời lượng (phút):</label>
                                                <input type="number" style={inputStyle} value={editingMovie.duration}
                                                    onChange={e => setEditingMovie({ ...editingMovie, duration: e.target.value })} />
                                            </div>

                                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Link ảnh Poster:</label>
                                                <input style={inputStyle} value={editingMovie.image}
                                                    onChange={e => setEditingMovie({ ...editingMovie, image: e.target.value })} />
                                            </div>

                                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Mô tả phim:</label>
                                                <textarea style={{ ...inputStyle, height: "100px" }} value={editingMovie.description}
                                                    onChange={e => setEditingMovie({ ...editingMovie, description: e.target.value })} />
                                            </div>

                                            <button onClick={handleUpdateMovie} style={{ ...btnSubmitStyle, gridColumn: "span 2" }}>CẬP NHẬT THAY ĐỔI</button>
                                            <button onClick={() => setEditingMovie(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", gridColumn: "span 2" }}>Hủy bỏ</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* 🏢 TRƯỜNG HỢP 2: QUẢN LÝ PHÒNG CHIẾU (DÁN VÀO ĐÂY) */}
                    {activeTab === "rooms" && (
                        <div>
                            <h2 style={{ color: "#333", marginBottom: 25 }}>🏢 QUẢN LÝ PHÒNG CHIẾU & GIÁ VÉ</h2>

                            {/* ➕ FORM TẠO PHÒNG MỚI */}
                            <div style={cardStyle}>
                                <h4 style={{ marginTop: 0 }}>➕ Tạo phòng mới</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px" }}>
                                    <input placeholder="Tên phòng (VD: Phòng 01)" style={inputStyle}
                                        value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} />

                                    <select style={inputStyle} value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}>
                                        <option value="2D">Loại: 2D</option>
                                        <option value="3D">Loại: 3D</option>
                                        <option value="IMAX">Loại: IMAX</option>
                                        <option value="GOLD CLASS">Loại: GOLD CLASS</option>
                                    </select>

                                    <input placeholder="Giá vé (VND)" type="number" style={inputStyle}
                                        value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: e.target.value })} />

                                    <button onClick={async () => {
                                        if (!newRoom.name || !newRoom.price) return alert("Sếp nhập thiếu tên hoặc giá rồi!");
                                        await axios.post("/rooms", newRoom);
                                        alert("Đã tạo phòng thành công sếp ơi!");
                                        setNewRoom({ name: "", price: "", type: "2D", rows: 9, cols: 12 });
                                        fetchRooms();
                                    }} style={btnSubmitStyle}>TẠO PHÒNG</button>
                                </div>
                            </div>

                            {/* 📋 BẢNG DANH SÁCH PHÒNG */}
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ background: "#f8f9fa" }}>
                                        <th style={thStyle}>Tên phòng</th>
                                        <th style={thStyle}>Loại</th>
                                        <th style={thStyle}>Giá vé gốc</th>
                                        <th style={thStyle}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.map(r => (
                                        <tr key={r._id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={tdStyle}><b>{r.name}</b></td>
                                            <td style={tdStyle}><span style={badgeStyle}>{r.type}</span></td>
                                            <td style={{ ...tdStyle, color: "#fb4226", fontWeight: "bold" }}>
                                                {r.price?.toLocaleString()}đ
                                            </td>
                                            <td style={tdStyle}>
                                                {/* ✏️ Nút Sửa mới thêm */}
                                                <button
                                                    onClick={() => setEditingRoom(r)}
                                                    style={{ ...btnEditStyle, marginRight: 10 }}
                                                >Sửa</button>
                                                {/* ❌ Nút Xóa (Đã gọi đúng hàm) */}
                                                <button onClick={() => handleDeleteRoom(r._id)} style={btnDeleteStyle}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* 🟦 MODAL SỬA PHÒNG (Hiện lên khi nhấn Sửa) */}
                            {editingRoom && (
                                <div style={modalOverlayStyle}>
                                    <div style={modalContentStyle}>
                                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA PHÒNG CHIẾU</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Tên phòng:</label>
                                                <input style={inputStyle} value={editingRoom.name}
                                                    onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })} />
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Loại rạp:</label>
                                                <select style={inputStyle} value={editingRoom.type}
                                                    onChange={e => setEditingRoom({ ...editingRoom, type: e.target.value })}>
                                                    <option value="2D">2D</option>
                                                    <option value="3D">3D</option>
                                                    <option value="IMAX">IMAX</option>
                                                    <option value="GOLD CLASS">GOLD CLASS</option>
                                                </select>
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Giá vé mới (VND):</label>
                                                <input type="number" style={inputStyle} value={editingRoom.price}
                                                    onChange={e => setEditingRoom({ ...editingRoom, price: e.target.value })} />
                                            </div>

                                            <button onClick={handleUpdateRoom} style={{ ...btnSubmitStyle, marginTop: 10 }}>LƯU THAY ĐỔI</button>
                                            <button onClick={() => setEditingRoom(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>Hủy bỏ</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🕒 DÁN VÀO ĐÂY: GIAO DIỆN QUẢN LÝ SUẤT CHIẾU */}
                    {activeTab === "showtimes" && (
                        <div>
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

                                    <button onClick={async () => {
                                        if (!newShowtime.movieId || !newShowtime.roomId || !newShowtime.time) return alert("Sếp nhập thiếu thông tin rồi!");
                                        await axios.post("/showtimes", newShowtime);
                                        alert("✅ Đã xếp lịch thành công!");
                                        setNewShowtime({ movieId: "", roomId: "", time: "" });
                                        fetchShowtimes();
                                    }} style={btnSubmitStyle}>XẾP LỊCH</button>
                                </div>
                            </div>

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
                                                {/* ✏️ Nút Sửa mới thêm cho sếp */}
                                                <button
                                                    onClick={() => setEditingShowtime(s)}
                                                    style={{ ...btnEditStyle, marginRight: 10 }}
                                                >Sửa</button>
                                                <button onClick={() => handleDeleteShowtime(s._id)} style={btnDeleteStyle}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* 🟦 MODAL SỬA SUẤT CHIẾU (Hiện lên khi sếp nhấn nút Sửa) */}
                            {editingShowtime && (
                                <div style={modalOverlayStyle}>
                                    <div style={modalContentStyle}>
                                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA LỊCH CHIẾU</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Chọn Phim:</label>
                                                <select style={inputStyle} value={editingShowtime.movieId?._id || editingShowtime.movieId}
                                                    onChange={e => setEditingShowtime({ ...editingShowtime, movieId: e.target.value })}>
                                                    {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                                                </select>
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Chọn Phòng:</label>
                                                <select style={inputStyle} value={editingShowtime.roomId?._id || editingShowtime.roomId}
                                                    onChange={e => setEditingShowtime({ ...editingShowtime, roomId: e.target.value })}>
                                                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                                </select>
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Giờ chiếu mới:</label>
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
                    )}
                    {activeTab === "revenue" && (
                        <div>
                            <h2 style={{ color: "#333", marginBottom: 30 }}>💰 BÁO CÁO DOANH THU HỆ THỐNG</h2>

                            {/* 📊 CÁC CON SỐ TỔNG KẾT */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "40px" }}>
                                <div style={revenueCardStyle("#2ecc71")}>
                                    <p style={{ margin: 0, fontSize: "1.1rem" }}>Tổng doanh thu thực tế</p>
                                    <h1 style={{ margin: "10px 0", fontSize: "2.5rem" }}>
                                        {revenueData.totalRevenue?.toLocaleString()} <span style={{ fontSize: '1rem' }}>VND</span>
                                    </h1>
                                    <p style={{ margin: 0, opacity: 0.8 }}>Tiền đã đổ về ví MoMo của sếp 🚀</p>
                                </div>

                                <div style={revenueCardStyle("#3498db")}>
                                    <p style={{ margin: 0, fontSize: "1.1rem" }}>Tổng số vé đã bán</p>
                                    <h1 style={{ margin: "10px 0", fontSize: "2.5rem" }}>
                                        {revenueData.totalTickets?.toLocaleString()} <span style={{ fontSize: '1rem' }}>VÉ</span>
                                    </h1>
                                    <p style={{ margin: 0, opacity: 0.8 }}>Dựa trên số lượng ghế khách đã chọn</p>
                                </div>
                            </div>

                            {/* 📋 DANH SÁCH GIAO DỊCH CHI TIẾT */}
                            <h3 style={{ marginBottom: 20 }}>🕒 Nhật ký giao dịch gần đây</h3>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ background: "#f8f9fa" }}>
                                        <th style={thStyle}>Thời gian</th>
                                        <th style={thStyle}>Phim</th>
                                        <th style={thStyle}>Số ghế</th>
                                        <th style={thStyle}>Số tiền</th>
                                        <th style={thStyle}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revenueData.history.map(item => (
                                        <tr key={item._id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={tdStyle}>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                                            <td style={{ ...tdStyle, fontWeight: "bold" }}>{item.showtimeId?.movieId?.title}</td>
                                            <td style={tdStyle}>{item.seats.join(", ")}</td>
                                            <td style={{ ...tdStyle, color: "#2ecc71", fontWeight: "bold" }}>
                                                +{item.totalAmount.toLocaleString()}đ
                                            </td>
                                            <td style={tdStyle}><span style={statusSuccessStyle}>Thành công</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "dashboard" && (
                        <div>
                            <h2 style={{ marginBottom: 30, color: "#333" }}>📊 TỔNG QUAN HỆ THỐNG</h2>

                            {/* ⚡ THẺ THỐNG KÊ NHANH */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                                <div style={dashCardStyle("#2ecc71")}>
                                    <p style={cardLabel}>Doanh thu</p>
                                    <h2 style={cardValue}>{dashData.totalRevenue?.toLocaleString()}đ</h2>
                                </div>
                                <div style={dashCardStyle("#3498db")}>
                                    <p style={cardLabel}>Vé đã bán</p>
                                    <h2 style={cardValue}>{dashData.totalTickets} Vé</h2>
                                </div>
                                <div style={dashCardStyle("#f1c40f")}>
                                    <p style={cardLabel}>Tổng phim</p>
                                    <h2 style={cardValue}>{dashData.totalMovies} Phim</h2>
                                </div>
                                <div style={dashCardStyle("#9b59b6")}>
                                    <p style={cardLabel}>Phòng chiếu</p>
                                    <h2 style={cardValue}>{dashData.totalRooms} Rạp</h2>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                                {/* 🏆 PHIM DOANH THU CAO */}
                                <div style={whiteBoxStyle}>
                                    <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "15px" }}>🎬 Phim "hái ra tiền" nhất</h3>
                                    {dashData.topMovies.map((m, index) => (
                                        <div key={index} style={itemRowStyle}>
                                            <span>{m.title}</span>
                                            <b style={{ color: "#fb4226" }}>{m.revenue.toLocaleString()}đ</b>
                                        </div>
                                    ))}
                                </div>

                                {/* 🕒 GIAO DỊCH VỪA XONG */}
                                <div style={whiteBoxStyle}>
                                    <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "15px" }}>🔔 Giao dịch mới nhất</h3>
                                    {dashData.recentBookings.map((b, index) => (
                                        <div key={index} style={itemRowStyle}>
                                            <span>{b.showtimeId?.movieId?.title}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#888" }}>{new Date(b.createdAt).toLocaleTimeString()}</span>
                                            <b style={{ color: "#2ecc71" }}>+{b.totalAmount.toLocaleString()}đ</b>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* ⚙️ CÁC MỤC CÒN LẠI */}

                </div>
            </div>

        </div>
    );
}

const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px" };
const formStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" };
const btnSubmitStyle = { gridColumn: "span 2", padding: "15px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer" };
const badgeStyle = {
    background: "#f0f0f0",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: "#555",
    display: "inline-block"
};
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };
// 🎨 Dán thêm 2 dòng này vào cuối file Admin.jsx sếp nhé
const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center",
    alignItems: "center", zIndex: 1000
};

const modalContentStyle = {
    background: "#fff", padding: "30px", borderRadius: "15px",
    width: "400px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
};
const revenueCardStyle = (color) => ({
    background: color,
    color: "#fff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: `0 10px 20px ${color}44`,
    textAlign: "left"
});

const statusSuccessStyle = {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold"
};
const dashCardStyle = (color) => ({
    background: color, color: "#fff", padding: "20px", borderRadius: "15px", boxShadow: `0 8px 20px ${color}33`
});
const cardLabel = { margin: 0, fontSize: "0.9rem", opacity: 0.8 };
const cardValue = { margin: "5px 0 0 0", fontSize: "1.6rem" };
const whiteBoxStyle = { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)" };
const itemRowStyle = { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f9f9f9" };
