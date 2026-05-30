import { useEffect, useState } from "react";
import axios from "../../api/axios"; 

export default function ReviewManager() {
    const [reviews, setReviews] = useState([]);
    const [movies, setMovies] = useState([]);
    const [filterMovie, setFilterMovie] = useState("all");
    const [filterStar, setFilterStar] = useState("all");

    const fetchAllReviews = () => {
        axios.get("/reviews/all")
            .then(res => setReviews(res.data))
            .catch(err => {
                console.error(err);
                alert("Không thể tải dữ liệu, vui lòng thử lại");
            });
    };

    const fetchMovies = () => {
        axios.get("/movies")
            .then(res => setMovies(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchAllReviews();
        fetchMovies();
    }, []);

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === "approved" ? "hidden" : "approved";
            await axios.put(`/reviews/status/${id}`, { status: newStatus });
            fetchAllReviews();
        } catch (err) {
            console.error(err);
            alert("Không thể cập nhật trạng thái đánh giá");
        }
    };

    // 🎯 2. Logic Lọc "Kép" (Phim + Sao)
    const displayReviews = reviews.filter(r => {
        const matchMovie = filterMovie === "all" || r.movieId?._id === filterMovie;
        const matchStar = filterStar === "all" || r.rating === parseInt(filterStar);
        return matchMovie && matchStar;
    });

    return (
        <div>
            {/* 🔍 BỘ LỌC THÔNG MINH */}
            <div style={filterBarContainer}>
                <div style={filterGroup}>
                    <label style={labelStyle}>Lọc theo phim:</label>
                    <select style={selectStyle} value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)}>
                        <option value="all">Tất cả phim</option>
                        {movies.map(m => (
                            <option key={m._id} value={m._id}>{m.title}</option>
                        ))}
                    </select>
                </div>

                <div style={filterGroup}>
                    <label style={labelStyle}>Lọc theo sao:</label>
                    <select style={selectStyle} value={filterStar} onChange={(e) => setFilterStar(e.target.value)}>
                        <option value="all">Tất cả số sao</option>
                        {[5, 4, 3, 2, 1].map(s => (
                            <option key={s} value={s}>{s} Sao ★</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', color: '#666', fontSize: '0.9rem' }}>
                    Tìm thấy: <strong>{displayReviews.length}</strong> kết quả
                </div>
            </div>

            <table style={tableStyle}>
                <thead>
                    <tr style={theadStyle}>
                        <th>Phim</th>
                        <th>Khán giả</th>
                        <th>Sao</th>
                        <th style={{width: '30%'}}>Nội dung</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {displayReviews.length > 0 ? displayReviews.map(r => (
                        <tr key={r._id} style={trStyle}>
                            <td style={tdStyle}><strong>{r.movieId?.title}</strong></td>
                            <td style={tdStyle}>{r.userId?.name}</td>
                            <td style={tdStyle}><span style={{color:'#f1c40f'}}>★</span> {r.rating}</td>
                            <td style={tdStyle}>{r.content}</td>
                            <td style={tdStyle}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td style={tdStyle}>
                                <span style={r.status === 'approved' ? activeBadge : hiddenBadge}>
                                    {r.status === 'approved' ? "Đang hiện" : "Đã ẩn"}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <button 
                                    onClick={() => toggleStatus(r._id, r.status)}
                                    style={r.status === 'approved' ? btnHide : btnShow}
                                >
                                    {r.status === 'approved' ? "Ẩn đi" : "Hiện lại"}
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                                Không tìm thấy đánh giá nào khớp với bộ lọc
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// --- Styles Nâng Cấp ---
const filterBarContainer = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    marginBottom: '25px', 
    padding: '20px', 
    background: '#fff', 
    borderRadius: '12px', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
};

const filterGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' };
const selectStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', minWidth: '180px' };

const tableStyle = { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "10px", overflow: "hidden" };
const theadStyle = { background: "#f8f9fa", textAlign: "left", color: "#666", fontSize: "0.9rem" };
const trStyle = { borderBottom: "1px solid #eee" };
const tdStyle = { padding: "15px", fontSize: "0.9rem" };

const activeBadge = { background: '#eafaf1', color: '#2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' };
const hiddenBadge = { background: '#fdedec', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' };

const btnHide = { padding: '6px 12px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnShow = { padding: '6px 12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };