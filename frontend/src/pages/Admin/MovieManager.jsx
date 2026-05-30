import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function MovieManager() {
    const [movies, setMovies] = useState([]);
    const [editingMovie, setEditingMovie] = useState(null);
    const [newMovie, setNewMovie] = useState({
        title: "", description: "", director: "", cast: "", genre: "",
        duration: "", releaseDate: "", language: "", rated: "P", status: "now_showing", trailer: ""
    });

    const [movieFile, setMovieFile] = useState(null); 
    const [preview, setPreview] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // 🔍 STATES CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDate, setFilterDate] = useState("");

    // 🔔 State quản lý thông báo tự tắt
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    const showNotify = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    const fetchMovies = () => {
        axios.get("/movies").then(res => setMovies(res.data));
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    // 🎯 LOGIC LỌC PHIM
    const filteredMovies = movies.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.director.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" ? true : 
                             filterStatus === "hidden" ? m.status === "ended" : 
                             m.status !== "ended"; 
        const matchesDate = filterDate ? m.releaseDate?.startsWith(filterDate) : true;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!movieFile || !newMovie.title || !newMovie.description) {
            return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        }

        const formData = new FormData();
        Object.keys(newMovie).forEach(key => formData.append(key, newMovie[key]));
        formData.append("image", movieFile);

        try {
            await axios.post("/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });
            showNotify("Thêm phim mới thành công");
            setNewMovie({ 
                title: "", description: "", director: "", cast: "", genre: "", 
                duration: "", releaseDate: "", language: "", rated: "P", status: "now_showing", trailer: "" 
            });
            setMovieFile(null); setPreview(null); e.target.reset(); fetchMovies();
        } catch (err) {
            showNotify("Không thể lưu dữ liệu", "error");
        }
    };

    const handleUpdateMovie = async () => {
        try {
            const formData = new FormData();
            Object.keys(editingMovie).forEach(key => {
                if (key !== "_id" && key !== "image") formData.append(key, editingMovie[key]);
            });
            if (movieFile) formData.append("image", movieFile);

            await axios.put(`/movies/${editingMovie._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showNotify("Đã cập nhật phim thành công");
            setEditingMovie(null); setMovieFile(null); setPreview(null); fetchMovies();
        } catch (err) {
            showNotify("Không thể cập nhật dữ liệu", "error");
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!window.confirm(`Sếp có chắc muốn nhập phim từ file "${file.name}" không?`)) return;

        const formData = new FormData();
        formData.append("file", file); 
        setIsImporting(true);
        try {
            const res = await axios.post("/movies/import-excel", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            showNotify(`✅ Thành công! ${res.data.message}`);
            fetchMovies(); 
        } catch (err) {
            showNotify("❌ Lỗi nhập Excel sếp ơi!", "error");
        } finally {
            setIsImporting(false); e.target.value = null; 
        }
    };

    const handleToggleStatus = async (movie) => {
        const nextStatus = movie.status === 'ended' ? 'now_showing' : 'ended';
        try {
            await axios.put(`/movies/${movie._id}`, { status: nextStatus });
            showNotify(nextStatus === 'ended' ? "Đã ẩn phim thành công" : "Đã hiện phim thành công");
            fetchMovies();
        } catch (err) {
            showNotify("Không thể cập nhật dữ liệu", "error");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    return (
        <div style={{ padding: "20px", position: 'relative' }}>
            
            {/* 📢 THÔNG BÁO TỰ TẮT */}
            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === "success" ? "#2ecc71" : "#e74c3c" }}>
                    {notification.message}
                </div>
            )}

            {/* 🟢 1. KHU VỰC NHẬP EXCEL */}
            <div style={excelImportBoxStyle}>
                <div>
                    <h3 style={{ margin: 0, color: "#2e7d32" }}>Nhập phim hàng loạt</h3>
                    <p style={{ margin: "5px 0 0", fontSize: "0.85rem", color: "#666" }}>Tải file Excel lên để thêm nhanh danh sách phim.</p>
                </div>
                <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={hiddenInputStyle} id="excel-upload" disabled={isImporting} />
                <label htmlFor="excel-upload" style={isImporting ? btnExcelDisabledStyle : btnExcelStyle}>
                    {isImporting ? "ĐANG XỬ LÝ..." : "CHỌN FILE EXCEL"}
                </label>
            </div>

            {/* 🔴 2. FORM THÊM PHIM MỚI */}
            <div style={cardStyle}>
                <h3 style={{ marginTop: 0, color: "#fb4226" }}>THÊM PHIM MỚI</h3>
                <form onSubmit={handleAddMovie} style={formStyle}>
                    <input placeholder="Tên phim" value={newMovie.title} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} required />
                    <input placeholder="Đạo diễn" value={newMovie.director} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, director: e.target.value })} />
                    <input placeholder="Diễn viên" value={newMovie.cast} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, cast: e.target.value })} />
                    <input placeholder="Thể loại" value={newMovie.genre} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} />
                    <input type="number" placeholder="Thời lượng (Phút)" value={newMovie.duration} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, duration: e.target.value })} />
                    <input type="date" value={newMovie.releaseDate} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, releaseDate: e.target.value })} />
                    <input placeholder="Ngôn ngữ" value={newMovie.language} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, language: e.target.value })} />
                    
                    <select style={inputStyle} value={newMovie.rated} onChange={e => setNewMovie({...newMovie, rated: e.target.value})}>
                        <option value="P">P - Mọi lứa tuổi</option>
                        <option value="K">K - Dưới 13 tuổi</option>
                        <option value="T13">T13 - Trên 13 tuổi</option>
                        <option value="T16">T16 - Trên 16 tuổi</option>
                        <option value="T18">T18 - Trên 18 tuổi</option>
                    </select>

                    <input placeholder="Trailer (Youtube URL)" value={newMovie.trailer} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, trailer: e.target.value })} />
                    
                    <select style={inputStyle} value={newMovie.status} onChange={e => setNewMovie({...newMovie, status: e.target.value})}>
                        <option value="now_showing">Đang chiếu</option>
                        <option value="coming_soon">Sắp chiếu</option>
                        <option value="ended">Ngừng chiếu</option>
                    </select>

                    <textarea placeholder="Mô tả nội dung phim..." value={newMovie.description} 
                        style={{ ...inputStyle, gridColumn: "span 2", minHeight: "80px" }} 
                        onChange={e => setNewMovie({ ...newMovie, description: e.target.value })} required />

                    <div style={uploadBoxStyle}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>POSTER PHIM</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if(file) { setMovieFile(file); setPreview(URL.createObjectURL(file)); }
                        }} />
                        {preview && <img src={preview} width="40" height="55" style={{ borderRadius: '4px', objectFit: 'cover' }} />}
                    </div>

                    <button type="submit" style={btnSubmitStyle}>LƯU PHIM MỚI</button>
                </form>
            </div>

            {/* 🟡 3. THANH BỘ LỌC (ĐÃ DI CHUYỂN XUỐNG ĐÂY) */}
            <div style={filterContainerStyle}>
                <div style={{ flex: 2 }}>
                    <input 
                        placeholder="Tìm theo tên phim hoặc đạo diễn..." 
                        style={inputStyle} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <select style={inputStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Tất cả trạng thái</option>
                        <option value="shown">Phim đang hiện</option>
                        <option value="hidden">Phim đã ẩn</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <input 
                        type="date" 
                        style={inputStyle} 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterDate(""); }} style={btnResetStyle}>LÀM MỚI</button>
            </div>

            {/* 🔵 4. DANH SÁCH PHIM */}
            <table style={tableStyle}>
                <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                        <th style={thStyle}>Poster</th>
                        <th style={thStyle}>Tên Phim / Đạo Diễn</th>
                        <th style={thStyle}>Thể Loại / Rated</th>
                        <th style={thStyle}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMovies.length > 0 ? filteredMovies.map(m => (
                        <tr key={m._id} style={{ borderBottom: "1px solid #eee", opacity: m.status === 'ended' ? 0.6 : 1 }}>
                            <td style={tdStyle}><img src={`http://localhost:5000${m.image}`} width="50" height="70" style={{ borderRadius: 4, objectFit: 'cover' }} /></td>
                            <td style={tdStyle}><b>{m.title}</b><br/><small style={{ color: '#888' }}>{m.director}</small></td>
                            <td style={tdStyle}>{m.genre}<br/><span style={{ color: '#fb4226', fontWeight: 'bold' }}>{m.rated}</span></td>
                            <td style={tdStyle}>
                                <button onClick={() => { setEditingMovie(m); setPreview(null); }} style={btnEditStyle}>Sửa</button>
                                <button onClick={() => handleToggleStatus(m)} style={m.status === 'ended' ? btnShowStyle : btnHideStyle}>{m.status === 'ended' ? "Hiện" : "Ẩn"}</button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#999" }}>Không tìm thấy phim phù hợp</td></tr>
                    )}
                </tbody>
            </table>

            {/* MODAL CHỈNH SỬA PHIM */}
            {editingMovie && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: "800px" }}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>CẬP NHẬT PHIM</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", maxHeight: '75vh', overflowY: 'auto', padding: '10px' }}>
                            <div style={inputGroup}><label style={labelStyle}>Tên phim:</label>
                                <input style={inputStyle} value={editingMovie.title} onChange={e => setEditingMovie({ ...editingMovie, title: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Thể loại:</label>
                                <input style={inputStyle} value={editingMovie.genre} onChange={e => setEditingMovie({ ...editingMovie, genre: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Đạo diễn:</label>
                                <input style={inputStyle} value={editingMovie.director} onChange={e => setEditingMovie({ ...editingMovie, director: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Thời lượng (phút):</label>
                                <input type="number" style={inputStyle} value={editingMovie.duration} onChange={e => setEditingMovie({ ...editingMovie, duration: e.target.value })} />
                            </div>
                            <div style={{ ...inputGroup, gridColumn: 'span 2' }}><label style={labelStyle}>Diễn viên:</label>
                                <input style={inputStyle} value={editingMovie.cast} onChange={e => setEditingMovie({ ...editingMovie, cast: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Ngày khởi chiếu:</label>
                                <input type="date" style={inputStyle} value={formatDate(editingMovie.releaseDate)} onChange={e => setEditingMovie({ ...editingMovie, releaseDate: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Phân loại (Rated):</label>
                                <select style={inputStyle} value={editingMovie.rated} onChange={e => setEditingMovie({...editingMovie, rated: e.target.value})}>
                                    <option value="P">P</option><option value="K">K</option><option value="T13">T13</option><option value="T16">T16</option><option value="T18">T18</option>
                                </select>
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Ngôn ngữ:</label>
                                <input style={inputStyle} value={editingMovie.language} onChange={e => setEditingMovie({ ...editingMovie, language: e.target.value })} />
                            </div>
                            <div style={inputGroup}><label style={labelStyle}>Trạng thái:</label>
                                <select style={inputStyle} value={editingMovie.status} onChange={e => setEditingMovie({...editingMovie, status: e.target.value})}>
                                    <option value="now_showing">Đang chiếu</option><option value="coming_soon">Sắp chiếu</option><option value="ended">Ngừng chiếu</option>
                                </select>
                            </div>
                            <div style={{ ...inputGroup, gridColumn: 'span 2' }}><label style={labelStyle}>Trailer Youtube:</label>
                                <input style={inputStyle} value={editingMovie.trailer} onChange={e => setEditingMovie({ ...editingMovie, trailer: e.target.value })} />
                            </div>
                            <div style={{ ...inputGroup, gridColumn: 'span 2' }}><label style={labelStyle}>Mô tả:</label>
                                <textarea style={{ ...inputStyle, height: "100px" }} value={editingMovie.description} onChange={e => setEditingMovie({ ...editingMovie, description: e.target.value })} />
                            </div>
                            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Thay đổi Poster:</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) { setMovieFile(file); setPreview(URL.createObjectURL(file)); }
                                    }} />
                                    <img src={preview || `http://localhost:5000${editingMovie.image}`} width="50" height="70" style={{ borderRadius: '4px', objectFit: 'cover' }} />
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button onClick={handleUpdateMovie} style={btnSubmitStyle}>LƯU THAY ĐỔI</button>
                                <button onClick={() => { setEditingMovie(null); setMovieFile(null); setPreview(null); }} style={btnCancelStyle}>HỦY BỎ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (Giữ nguyên) ---
const toastStyle = { position: 'fixed', top: '20px', right: '20px', padding: '12px 25px', color: 'white', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const filterContainerStyle = { display: "flex", gap: "15px", marginBottom: "20px", background: "#fdfcf0", padding: "15px", borderRadius: "10px", border: "1px solid #eee", alignItems: "center" };
const btnResetStyle = { padding: "10px 15px", background: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const excelImportBoxStyle = { background: "#e8f5e9", padding: "20px", borderRadius: "12px", border: "1px solid #c8e6c9", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const btnExcelStyle = { background: "#2e7d32", color: "white", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "inline-block", fontSize: "0.9rem" };
const btnExcelDisabledStyle = { ...btnExcelStyle, background: "#999", cursor: "not-allowed" };
const hiddenInputStyle = { position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", border: "0" };
const cardStyle = { background: "#fff", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const formStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const inputStyle = { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };
const inputGroup = { textAlign: 'left' };
const labelStyle = { fontSize: "0.8rem", fontWeight: "bold", marginBottom: '5px', display: 'block', color: '#555' };
const uploadBoxStyle = { gridColumn: "span 2", background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', gap: '20px' };
const btnSubmitStyle = { gridColumn: "span 2", padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: '1rem' };
const btnCancelStyle = { flex: 1, padding: "12px", background: "#eee", color: "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", background: '#fff', borderRadius: '8px', overflow: 'hidden' };
const thStyle = { padding: "15px", textAlign: "left", color: "#666", fontSize: '0.85rem', borderBottom: '2px solid #eee' };
const tdStyle = { padding: "15px", fontSize: '0.9rem' };
const btnEditStyle = { background: "#3498db", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginRight: '8px' };
const btnHideStyle = { padding: "6px 12px", background: "#f39c12", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" };
const btnShowStyle = { padding: "6px 12px", background: "#2ecc71", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" };