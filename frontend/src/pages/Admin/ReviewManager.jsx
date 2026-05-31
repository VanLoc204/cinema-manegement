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
        <div className="review-manager-container">
            <style>{`
                .review-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .rv-filter-bar {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    flex-wrap: wrap;
                }
                .rv-filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .rv-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 10px;
                    border: 1px solid #eee;
                    background: #fff;
                }
                .rv-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                @media (max-width: 768px) {
                    .rv-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                        padding: 15px;
                    }
                    .rv-filter-group select {
                        width: 100% !important;
                        min-width: 0 !important;
                    }
                    .rv-filter-bar .rv-count-badge {
                        margin-left: 0 !important;
                        text-align: center;
                        width: 100%;
                        border-top: 1px solid #f0f0f0;
                        padding-top: 10px;
                    }
                }
            `}</style>
            
            <h2 style={{ color: "#333", marginBottom: 25, fontSize: "1.5rem", fontWeight: "800" }}>QUẢN LÝ ĐÁNH GIÁ CỦA KHÁCH HÀNG</h2>

            {/* 🔍 BỘ LỌC THÔNG MINH */}
            <div className="rv-filter-bar">
                <div className="rv-filter-group">
                    <label style={labelStyle}>Lọc theo phim:</label>
                    <select style={selectStyle} value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)}>
                        <option value="all">Tất cả phim</option>
                        {movies.map(m => (
                            <option key={m._id} value={m._id}>{m.title}</option>
                        ))}
                    </select>
                </div>

                <div className="rv-filter-group">
                    <label style={labelStyle}>Lọc theo sao:</label>
                    <select style={selectStyle} value={filterStar} onChange={(e) => setFilterStar(e.target.value)}>
                        <option value="all">Tất cả số sao</option>
                        {[5, 4, 3, 2, 1].map(s => (
                            <option key={s} value={s}>{s} Sao ★</option>
                        ))}
                    </select>
                </div>

                <div className="rv-count-badge" style={{ marginLeft: 'auto', color: '#666', fontSize: '0.85rem', fontWeight: "bold" }}>
                    Tìm thấy: <strong style={{color: "#fb4226"}}>{displayReviews.length}</strong> kết quả
                </div>
            </div>

            <div className="rv-table-wrapper">
                <table className="rv-table">
                    <thead>
                        <tr style={theadStyle}>
                            <th style={thStyle}>Phim</th>
                            <th style={thStyle}>Khán giả</th>
                            <th style={thStyle}>Sao</th>
                            <th style={{...thStyle, width: '30%'}}>Nội dung</th>
                            <th style={thStyle}>Ngày gửi</th>
                            <th style={thStyle}>Trạng thái</th>
                            <th style={thStyle}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayReviews.length > 0 ? displayReviews.map(r => (
                            <tr key={r._id} style={trStyle}>
                                <td style={tdStyle}><strong>{r.movieId?.title}</strong></td>
                                <td style={tdStyle}>{r.userId?.name}</td>
                                <td style={tdStyle}><span style={{color:'#f1c40f', fontWeight: "bold"}}>★</span> {r.rating}</td>
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
        </div>
    );
}

// --- Styles Nâng Cấp ---
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '5px' };
const selectStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', minWidth: '180px', fontSize: '0.9rem' };
const theadStyle = { background: "#f8f9fa", color: "#666" };
const thStyle = { padding: "15px", textAlign: "left", fontSize: "0.85rem", borderBottom: '2px solid #eee' };
const trStyle = { borderBottom: "1px solid #eee" };
const tdStyle = { padding: "15px", fontSize: "0.9rem", color: "#333" };

const activeBadge = { background: '#eafaf1', color: '#2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: "1px solid #2ecc71" };
const hiddenBadge = { background: '#fdedec', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: "1px solid #e74c3c" };

const btnHide = { padding: '8px 15px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: "bold", fontSize: "0.8rem", transition: "0.2s" };
const btnShow = { padding: '8px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: "bold", fontSize: "0.8rem", transition: "0.2s" };