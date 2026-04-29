import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";

export default function StaffShowtimes() {
    const { id } = useParams(); // ID của phim
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);

    useEffect(() => {
        // 1. Lấy thông tin phim để hiện tiêu đề
        axios.get(`/movies/detail/${id}`).then(res => setMovie(res.data));
        
        // 2. Lấy danh sách suất chiếu của phim này
        // Lưu ý: Sếp kiểm tra xem Backend của sếp dùng đường dẫn nào để lấy suất chiếu theo phim nhé
        axios.get(`/showtimes/movie/${id}`).then(res => setShowtimes(res.data));
    }, [id]);

    return (
        <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", textAlign: 'center' }}>
            {movie && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ color: '#fb4226', textTransform: 'uppercase' }}>Chọn suất chiếu cho phim</h2>
                    <h1 style={{ fontWeight: '900' }}>{movie.title}</h1>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {showtimes.length > 0 ? showtimes.map(st => (
                    <div key={st._id} style={showtimeCard} onClick={() => navigate(`/staff/booking/${st._id}`)}>
                        <div style={timeStyle}>
                            {new Date(st.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ color: '#888', marginTop: '5px' }}>
                            {new Date(st.time).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={roomBadge}>{st.roomId?.name || "Phòng mặc định"}</div>
                        <div style={priceTag}>{st.roomId?.price?.toLocaleString()}đ</div>
                        <button style={selectBtn}>CHỌN SUẤT NÀY</button>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1/-1', padding: '50px', color: '#888' }}>
                        Phim này hiện chưa có suất chiếu nào sếp ơi! 😅
                    </div>
                )}
            </div>
            
            <button onClick={() => navigate("/staff/pos")} style={backBtn}> ⬅️ Quay lại chọn phim khác</button>
        </div>
    );
}

// --- Style cho "sang chảnh" ---
const showtimeCard = { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.3s', border: '1px solid #eee' };
const timeStyle = { fontSize: '2rem', fontWeight: '900', color: '#333' };
const roomBadge = { display: 'inline-block', marginTop: '10px', padding: '5px 15px', background: '#f0f0f0', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' };
const priceTag = { marginTop: '10px', color: '#fb4226', fontWeight: 'bold' };
const selectBtn = { marginTop: '15px', width: '100%', padding: '10px', background: '#fb4226', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const backBtn = { marginTop: '40px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' };