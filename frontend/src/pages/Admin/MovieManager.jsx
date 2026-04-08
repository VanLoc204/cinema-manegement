import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function MovieManager() {
    const [movies, setMovies] = useState([]);
    const [editingMovie, setEditingMovie] = useState(null);
    const [newMovie, setNewMovie] = useState({
        title: "",
        description: "",
        genre: "",
        duration: "",
        status: "now_showing"
    });

    const [movieFile, setMovieFile] = useState(null); 
    const [preview, setPreview] = useState(null);

    const fetchMovies = () => {
        axios.get("/movies").then(res => setMovies(res.data));
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    // ➕ HÀM THÊM PHIM
    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!movieFile) return alert("Sếp ơi, chọn cái ảnh Poster đã!");

        const formData = new FormData();
        formData.append("title", newMovie.title);
        formData.append("description", newMovie.description);
        formData.append("genre", newMovie.genre);
        formData.append("duration", Number(newMovie.duration));
        formData.append("status", newMovie.status);
        formData.append("image", movieFile);

        try {
            await axios.post("/movies", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("✅ Thêm phim thành công!");
            setNewMovie({ title: "", description: "", genre: "", duration: "", status: "now_showing" });
            setMovieFile(null);
            setPreview(null);
            e.target.reset();
            fetchMovies();
        } catch (err) {
            alert("❌ Lỗi thêm phim!");
        }
    };

    // ✏️ HÀM CẬP NHẬT PHIM
    const handleUpdateMovie = async () => {
        try {
            const formData = new FormData();
            formData.append("title", editingMovie.title);
            formData.append("description", editingMovie.description);
            formData.append("genre", editingMovie.genre);
            formData.append("duration", Number(editingMovie.duration));
            formData.append("status", editingMovie.status);
            
            if (movieFile) formData.append("image", movieFile);

            await axios.put(`/movies/${editingMovie._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            alert("✅ Đã cập nhật phim!");
            setEditingMovie(null);
            setMovieFile(null);
            setPreview(null);
            fetchMovies();
        } catch (err) {
            alert("❌ Lỗi cập nhật!");
        }
    };

    // 🕵️‍♂️ HÀM BẬT/TẮT TRẠNG THÁI PHIM (ẨN/HIỆN)
    const handleToggleStatus = async (movie) => {
        const isHidden = movie.status === 'ended';
        const nextStatus = isHidden ? 'now_showing' : 'ended';
        const actionText = isHidden ? "hiện lại" : "ẩn";

        if (window.confirm(`Sếp muốn ${actionText} phim này chứ?`)) {
            try {
                await axios.put(`/movies/${movie._id}`, { status: nextStatus });
                alert(`✅ Đã ${actionText} phim thành công!`);
                fetchMovies();
            } catch (err) {
                alert("❌ Lỗi xử lý rồi sếp!");
            }
        }
    };

    const renderStatusBadge = (status) => {
        switch(status) {
            case 'now_showing': return <span style={{...badgeStyle, background: '#e8f5e9', color: '#2e7d32'}}>Đang chiếu</span>;
            case 'coming_soon': return <span style={{...badgeStyle, background: '#fff3e0', color: '#ef6c00'}}>Sắp chiếu</span>;
            case 'ended': return <span style={{...badgeStyle, background: '#ffebee', color: '#c62828'}}>Ngừng chiếu</span>;
            default: return status;
        }
    };

    return (
        <div>
            <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>➕ Thêm phim mới (Upload Poster)</h3>
                <form onSubmit={handleAddMovie} style={formStyle}>
                    <input placeholder="Tên phim" value={newMovie.title} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} required />
                    <input placeholder="Thể loại" value={newMovie.genre} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} />
                    <input placeholder="Thời lượng" type="number" value={newMovie.duration} style={inputStyle} onChange={e => setNewMovie({ ...newMovie, duration: e.target.value })} />
                    
                    <select style={inputStyle} value={newMovie.status} onChange={e => setNewMovie({...newMovie, status: e.target.value})}>
                        <option value="now_showing">Trạng thái: Đang chiếu</option>
                        <option value="coming_soon">Trạng thái: Sắp chiếu</option>
                        <option value="ended">Trạng thái: Ngừng chiếu</option>
                    </select>

                    {/* 🚩 HÀNG MỚI: MÔ TẢ VÀ UPLOAD HÌNH */}
                    <textarea placeholder="Mô tả ngắn về phim..." value={newMovie.description} 
                        style={{ ...inputStyle, minHeight: "80px", resize: 'vertical' }} 
                        onChange={e => setNewMovie({ ...newMovie, description: e.target.value })} required />

                    <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px dashed #ccc', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>📸 POSTER PHIM</label>
                        <input type="file" accept="image/*" style={{ fontSize: '0.8rem', width: '100%' }} onChange={(e) => {
                            const file = e.target.files[0];
                            if(file) {
                                setMovieFile(file);
                                setPreview(URL.createObjectURL(file));
                            }
                        }} />
                        {preview && <img src={preview} width="40" height="55" style={{ borderRadius: '4px', objectFit: 'cover', border: '1px solid #eee' }} />}
                    </div>

                    <button type="submit" style={btnSubmitStyle}>LƯU PHIM VÀO HỆ THỐNG</button>
                </form>
            </div>

            <table style={tableStyle}>
                <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                        <th style={thStyle}>Ảnh</th>
                        <th style={thStyle}>Tên phim</th>
                        <th style={thStyle}>Trạng thái</th>
                        <th style={thStyle}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map(m => (
                        <tr key={m._id} style={{ 
                            borderBottom: "1px solid #eee",
                            opacity: m.status === 'ended' ? 0.6 : 1 
                        }}>
                            <td style={tdStyle}>
                                <img src={`http://localhost:5000${m.image}`} width="45" height="60" style={{ borderRadius: 4, objectFit: 'cover' }} 
                                     onError={(e) => e.target.src="https://via.placeholder.com/45x60?text=Film"} />
                            </td>
                            <td style={{ ...tdStyle, fontWeight: "bold" }}>{m.title}</td>
                            <td style={tdStyle}>{renderStatusBadge(m.status)}</td>
                            <td style={tdStyle}>
                                <button onClick={() => { setEditingMovie(m); setPreview(null); }} style={{ ...btnEditStyle, marginRight: 10 }}>Sửa</button>
                                
                                {/* 🚩 NÚT CÔNG TẮC: ẨN / HIỆN */}
                                <button 
                                    onClick={() => handleToggleStatus(m)} 
                                    style={m.status === 'ended' ? btnShowStyle : btnHideStyle}
                                >
                                    {m.status === 'ended' ? "Hiện phim" : "Ẩn phim"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 🟦 MODAL SỬA PHIM */}
            {editingMovie && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: "600px" }}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA PHIM</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px" }}>
                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                <label style={labelStyle}>Tên phim:</label>
                                <input style={inputStyle} value={editingMovie.title} onChange={e => setEditingMovie({ ...editingMovie, title: e.target.value })} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                                <label style={labelStyle}>Trạng thái:</label>
                                <select style={inputStyle} value={editingMovie.status} onChange={e => setEditingMovie({...editingMovie, status: e.target.value})}>
                                    <option value="now_showing">Đang chiếu</option>
                                    <option value="coming_soon">Sắp chiếu</option>
                                    <option value="ended">Ngừng chiếu</option>
                                </select>
                            </div>
                            <div style={{ textAlign: "left" }}>
                                <label style={labelStyle}>Thời lượng:</label>
                                <input type="number" style={inputStyle} value={editingMovie.duration} onChange={e => setEditingMovie({ ...editingMovie, duration: e.target.value })} />
                            </div>
                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                <label style={labelStyle}>Thay đổi Poster (Để trống nếu giữ nguyên):</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) {
                                            setMovieFile(file);
                                            setPreview(URL.createObjectURL(file));
                                        }
                                    }} />
                                    <img src={preview || `http://localhost:5000${editingMovie.image}`} width="40" height="55" style={{ borderRadius: '4px', objectFit: 'cover' }} />
                                </div>
                            </div>
                            <div style={{ textAlign: "left", gridColumn: "span 2" }}>
                                <label style={labelStyle}>Mô tả:</label>
                                <textarea style={{ ...inputStyle, height: "80px" }} value={editingMovie.description} onChange={e => setEditingMovie({ ...editingMovie, description: e.target.value })} />
                            </div>
                            <button onClick={handleUpdateMovie} style={{ ...btnSubmitStyle, gridColumn: "span 2" }}>CẬP NHẬT THAY ĐỔI</button>
                            <button onClick={() => { setEditingMovie(null); setMovieFile(null); setPreview(null); }} style={{ background: "none", border: "none", color: "#888", gridColumn: "span 2", cursor: 'pointer' }}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px" };
const formStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: "0.85rem", fontWeight: "bold", display: 'block', marginBottom: '5px' };
const btnSubmitStyle = { gridColumn: "span 2", padding: "15px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };
const badgeStyle = { padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "15px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };

// 🚩 STYLES MỚI CHO NÚT ẨN/HIỆN
const btnHideStyle = { padding: "5px 12px", background: "none", border: "1px solid #f39c12", color: "#f39c12", borderRadius: "4px", cursor: "pointer", fontWeight: "500" };
const btnShowStyle = { padding: "5px 12px", background: "none", border: "1px solid #2ecc71", color: "#2ecc71", borderRadius: "4px", cursor: "pointer", fontWeight: "500" };