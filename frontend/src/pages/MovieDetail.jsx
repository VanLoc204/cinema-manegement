import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState({});
    const [showtimes, setShowtimes] = useState([]);

    // 🚩 ĐỊA CHỈ SERVER (Để lấy đúng link ảnh)
    const API_URL = "http://localhost:5000";

    useEffect(() => {
        // 🎬 Lấy thông tin phim
        axios.get("/movies").then(res => {
            const found = res.data.find(m => String(m._id) === String(id));
            if (found) setMovie(found);
        }).catch(err => console.error("Lỗi lấy phim:", err));

        // 🕒 Lấy danh sách suất chiếu
        axios.get(`/showtimes/${id}`).then(res => {
            setShowtimes(res.data);
        }).catch(err => console.error("Lỗi lấy suất chiếu:", err));
    }, [id]);

    const handleBookingClick = (showtimeId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập để tiếp tục đặt vé!");
            navigate("/login");
        } else {
            navigate(`/booking/${showtimeId}`);
        }
    };

    return (
        <div style={containerStyle}>
            {/* 🎥 Phần thông tin Phim */}
            <div style={movieHeaderStyle}>
                <div style={posterContainerStyle}>
                    {/* 🚩 ĐÃ SỬA: Thêm API_URL và xử lý ảnh lỗi */}
                    <img
                        src={movie?.image ? `${API_URL}${movie.image}` : ""}
                        alt={movie?.title}
                        style={posterImageStyle}
                        onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x450?text=No+Poster";
                        }}
                    />
                </div>
                
                <div style={infoContentStyle}>
                    <h1 style={titleStyle}>{movie?.title || "Đang tải..."}</h1>
                    <div style={tagContainerStyle}>
                        <span style={tagStyle}>{movie?.genre || "Hành động"}</span>
                        <span style={tagStyle}>{movie?.duration} Phút</span>
                        <span style={statusTagStyle}>{movie?.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}</span>
                    </div>
                    
                    <p style={descriptionStyle}>{movie?.description}</p>
                    
                    <div style={detailListStyle}>
                        {/* 🚩 Cập nhật ngày tháng động từ DB nếu có */}
                        <p><strong>🕒 Khởi chiếu:</strong> {movie?.createdAt ? new Date(movie.createdAt).toLocaleDateString('vi-VN') : "2026-03-22"}</p>
                        <p><strong>🌐 Ngôn ngữ:</strong> Phụ đề Tiếng Việt</p>
                    </div>
                </div>
            </div>

            <hr style={dividerStyle} />

            {/* 🎟️ Phần chọn Suất chiếu */}
            <div style={showtimeSectionStyle}>
                <h3 style={sectionTitleStyle}>
                    <span style={accentBarStyle}></span>
                    LỊCH CHIẾU
                </h3>

                <div style={showtimeGridStyle}>
                    {showtimes.map(s => {
                        const date = new Date(s.time);
                        const timeStr = date.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                        const dateStr = date.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit'
                        });

                        return (
                            <div key={s._id} style={showtimeCardStyle}>
                                <div style={roomNameStyle}>{s.roomId?.name || "Standard Room"}</div>
                                <button
                                    onClick={() => handleBookingClick(s._id)}
                                    style={timeButtonStyle}
                                    onMouseOver={(e) => e.target.style.background = "#d6361e"}
                                    onMouseOut={(e) => e.target.style.background = "#fb4226"}
                                >
                                    <span style={{fontSize: '1.2rem'}}>{timeStr}</span>
                                    <span style={{fontSize: '0.8rem', opacity: 0.8}}>{dateStr}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {showtimes.length === 0 && (
                    <div style={emptyBoxStyle}>
                        <p>Hiện tại chưa có suất chiếu cho phim này.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- 🎨 Styles (Giữ nguyên phong cách của sếp) ---

const containerStyle = {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "0 20px",
    color: "#333",
    fontFamily: "Arial, sans-serif"
};

const movieHeaderStyle = {
    display: "flex",
    gap: "40px",
    flexWrap: "wrap",
    marginBottom: "40px"
};

const posterContainerStyle = {
    flex: "0 0 280px"
};

const posterImageStyle = {
    width: "100%",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    border: "4px solid #fff",
    objectFit: "cover"
};

const infoContentStyle = {
    flex: 1,
    minWidth: "300px"
};

const titleStyle = {
    fontSize: "2.5rem",
    fontWeight: "800",
    margin: "0 0 15px 0",
    color: "#222",
    textTransform: "uppercase"
};

const tagContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
};

const tagStyle = {
    padding: "5px 12px",
    background: "#eee",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#555"
};

const statusTagStyle = {
    padding: "5px 12px",
    background: "#fb4226",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: "bold"
};

const descriptionStyle = {
    fontSize: "1.05rem",
    lineHeight: "1.8",
    color: "#555",
    marginBottom: "25px"
};

const detailListStyle = {
    fontSize: "0.95rem",
    color: "#777"
};

const dividerStyle = {
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "40px 0"
};

const showtimeSectionStyle = {
    marginBottom: "60px"
};

const sectionTitleStyle = {
    fontSize: "1.5rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "30px"
};

const accentBarStyle = {
    width: "6px",
    height: "24px",
    background: "#fb4226",
    borderRadius: "2px"
};

const showtimeGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "20px"
};

const showtimeCardStyle = {
    textAlign: "center",
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "10px",
    background: "#fff"
};

const roomNameStyle = {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "8px",
    fontWeight: "600"
};

const timeButtonStyle = {
    width: "100%",
    padding: "10px 0",
    background: "#fb4226",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    flexDirection: "column",
    transition: "0.3s"
};

const emptyBoxStyle = {
    padding: "40px",
    textAlign: "center",
    background: "#f9f9f9",
    borderRadius: "10px",
    color: "#999",
    border: "1px dashed #ccc"
};