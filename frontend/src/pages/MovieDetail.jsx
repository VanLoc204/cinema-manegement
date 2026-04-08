import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState({});
    const [showtimes, setShowtimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const API_URL = "http://localhost:5000";

    const getNext14Days = () => {
        const dates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    };
    const dateList = getNext14Days();

    useEffect(() => {
        axios.get("/movies").then(res => {
            const found = res.data.find(m => String(m._id) === String(id));
            if (found) setMovie(found);
        }).catch(err => console.error("Lỗi lấy phim:", err));

        axios.get(`/showtimes/${id}`).then(res => {
            setShowtimes(res.data);
        }).catch(err => console.error("Lỗi lấy suất chiếu:", err));
    }, [id]);

    const filteredShowtimes = showtimes.filter(s => {
        const sDate = new Date(s.time).toISOString().split('T')[0];
        return sDate === selectedDate;
    });

    const handleBookingClick = (showtimeId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập để tiếp tục đặt vé!");
            navigate("/login");
        } else {
            navigate(`/booking/${showtimeId}`);
        }
    };

    const formatDayName = (date) => {
        const today = new Date().toISOString().split('T')[0];
        const checkDate = date.toISOString().split('T')[0];
        if (today === checkDate) return "H.nay";
        const day = date.getDay();
        if (day === 0) return "C.Nhật";
        return `Thứ ${day + 1}`;
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    return (
        <div style={containerStyle}>
            <div style={movieHeaderStyle}>
                <div style={posterContainerStyle}>
                    <img
                        src={movie?.image ? `${API_URL}${movie.image}` : ""}
                        alt={movie?.title}
                        style={posterImageStyle}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Poster"; }}
                    />
                </div>
                <div style={infoContentStyle}>
                    <h1 style={titleStyle}>{movie?.title || "Đang tải..."}</h1>
                    <div style={tagContainerStyle}>
                        <span style={tagStyle}>{movie?.genre}</span>
                        <span style={tagStyle}>{movie?.duration} Phút</span>
                        <span style={statusTagStyle}>{movie?.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}</span>
                    </div>
                    <p style={descriptionStyle}>{movie?.description}</p>
                    
                    {movie?.trailer && (
                        <button onClick={() => window.open(movie.trailer, '_blank')} style={trailerBtnStyle}>
                            ▶ XEM TRAILER
                        </button>
                    )}

                    <div style={{ marginTop: '20px', color: '#777', fontSize: '0.9rem' }}>
                        <p><strong>🕒 Khởi chiếu:</strong> {movie?.createdAt ? new Date(movie.createdAt).toLocaleDateString('vi-VN') : "2026-03-22"}</p>
                        <p><strong>🌐 Ngôn ngữ:</strong> Phụ đề Tiếng Việt</p>
                    </div>
                </div>
            </div>

            <hr style={dividerStyle} />

            {/* 📅 BỘ LỌC 14 NGÀY */}
            <div className="date-scroller" style={dateScrollerStyle}>
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                        <div 
                            key={index} 
                            style={{
                                ...dateCardStyle,
                                borderColor: isActive ? "#fb4226" : "#eee",
                                background: isActive ? "#fb4226" : "#f5f5f5"
                            }}
                            onClick={() => setSelectedDate(fullDate)}
                        >
                            <div style={{...dateTopStyle, color: isActive ? "#fff" : (isWeekend ? "#fb4226" : "#666")}}>
                                {date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}/{ (date.getMonth()+1) < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1 }
                            </div>
                            <div style={{...dateBottomStyle, color: isActive ? "#fff" : (isWeekend ? "#fb4226" : "#333")}}>
                                {formatDayName(date)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={showtimeSectionStyle}>
                <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> LỊCH CHIẾU</h3>
                <div style={showtimeGridStyle}>
                    {filteredShowtimes.length > 0 ? (
                        filteredShowtimes.map(s => {
                            const timeStr = new Date(s.time).toLocaleTimeString('vi-VN', {
                                hour: '2-digit', minute: '2-digit', hour12: false
                            });
                            return (
                                <div key={s._id} style={showtimeItemStyle}>
                                    <div style={roomInfoWrapper}>
                                        <span style={roomNameText}>{s.roomId?.name || "Standard"}</span>
                                        <span style={roomTypeBadge}>{s.roomId?.type || "2D"}</span>
                                    </div>
                                    <button onClick={() => handleBookingClick(s._id)} style={timeBtnStyle}>
                                        {timeStr}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div style={noShowtimeStyle}>Hôm nay chưa có suất chiếu sếp ơi!</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 🎨 PHẦN STYLE ĐÃ FIX LỖI LỆCH CHỮ ---

const dateScrollerStyle = { 
    display: "flex", 
    gap: "12px", 
    overflowX: "auto", 
    padding: "10px 0", 
    marginBottom: "30px", 
    scrollbarWidth: "none" 
};

const dateCardStyle = { 
    minWidth: "85px", 
    height: "75px", 
    borderRadius: "10px", 
    border: "2px solid", 
    display: "flex", 
    flexDirection: "column", 
    cursor: "pointer", 
    transition: "0.2s", 
    overflow: "hidden" 
};

const dateTopStyle = { 
    fontSize: "0.85rem", 
    padding: "6px 0", 
    background: "rgba(255,255,255,0.8)", 
    fontWeight: "600",
    display: "flex",           // Thêm flex để căn giữa
    justifyContent: "center",  // Căn giữa ngang
    alignItems: "center"       // Căn giữa dọc
};

const dateBottomStyle = { 
    flex: 1, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",  // Đã sửa từ justifyConnection thành justifyContent ✅
    fontSize: "1rem", 
    fontWeight: "bold" 
};

// Các Style khác giữ nguyên...
const trailerBtnStyle = { padding: "10px 20px", background: "transparent", color: "#fb4226", border: "2px solid #fb4226", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };
const videoResponsiveStyle = { position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", maxWidth: "100%", background: "#000", borderRadius: "12px" };
const roomInfoWrapper = { marginBottom: "8px", display: "flex", flexDirection: "column", alignItems: "center" };
const roomNameText = { fontSize: "0.8rem", color: "#888", fontWeight: "600" };
const roomTypeBadge = { fontSize: "0.7rem", background: "#333", color: "#fff", padding: "2px 8px", borderRadius: "4px", marginTop: "4px", fontWeight: "bold" };
const showtimeItemStyle = { background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" };
const timeBtnStyle = { width: "100%", padding: "10px", background: "#fb4226", color: "#fff", border: "none", borderRadius: "6px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" };
const noShowtimeStyle = { width: "100%", gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#999", border: "1px dashed #ccc", borderRadius: "10px" };
const containerStyle = { maxWidth: "1100px", margin: "40px auto", padding: "0 20px" };
const movieHeaderStyle = { display: "flex", gap: "40px", flexWrap: "wrap", marginBottom: "40px" };
const posterContainerStyle = { flex: "0 0 280px" };
const posterImageStyle = { width: "100%", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" };
const infoContentStyle = { flex: 1, minWidth: "300px" };
const titleStyle = { fontSize: "2.5rem", fontWeight: "800", marginBottom: "15px" };
const tagContainerStyle = { display: "flex", gap: "10px", marginBottom: "20px" };
const tagStyle = { padding: "5px 12px", background: "#eee", borderRadius: "4px", fontSize: "0.85rem" };
const statusTagStyle = { padding: "5px 12px", background: "#fb4226", color: "#fff", borderRadius: "4px" };
const descriptionStyle = { fontSize: "1rem", color: "#555", lineHeight: "1.6" };
const dividerStyle = { border: "none", borderTop: "1px solid #ddd", margin: "40px 0" };
const showtimeSectionStyle = { marginBottom: "60px" };
const sectionTitleStyle = { fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px" };
const accentBarStyle = { width: "6px", height: "24px", background: "#fb4226" };
const showtimeGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" };