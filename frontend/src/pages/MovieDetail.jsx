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

    const getEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1&showinfo=0`;
        }
        return null;
    };

    const getRatedColor = (rated) => {
        switch(rated) {
            case 'P': return '#2ecc71';
            case 'K': return '#3498db';
            case 'T13': return '#f1c40f';
            case 'T16': return '#e67e22';
            case 'T18': return '#e74c3c';
            default: return '#fb4226';
        }
    };

    return (
        <div style={containerStyle}>
            {/* 🎥 HEADER 3 CỘT - ĐÃ HẠ THẤP CHIỀU CAO (Thon gọn hơn) */}
            <div style={movieHeaderStyle}>
                
                {/* CỘT 1: POSTER (Giảm xuống 180px) */}
                <div style={posterContainerStyle}>
                    <img
                        src={movie?.image ? `${API_URL}${movie.image}` : null}
                        alt={movie?.title}
                        style={posterImageStyle}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Poster"; }}
                    />
                </div>

                {/* CỘT 2: THÔNG TIN PHIM */}
                <div style={infoContentStyle}>
                    <h1 style={titleStyle}>{movie?.title || "Đang tải..."}</h1>
                    
                    <div style={tagContainerStyle}>
                        <span style={{ ...statusTagStyle, background: getRatedColor(movie?.rated) }}>
                            {movie?.rated || "P"}
                        </span>
                        <span style={tagStyle}>{movie?.genre}</span>
                        <span style={tagStyle}>{movie?.duration} Phút</span>
                        <span style={{ ...tagStyle, color: '#fb4226', border: '1px solid #fb4226', background: 'none' }}>
                            {movie?.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
                        </span>
                    </div>

                    <div style={detailContainerStyle}>
                        <p style={detailItemStyle}><strong>Đạo diễn:</strong> {movie?.director || "Đang cập nhật"}</p>
                        <p style={detailItemStyle}><strong>Diễn viên:</strong> {movie?.cast || "Đang cập nhật"}</p>
                        <p style={detailItemStyle}><strong>Khởi chiếu:</strong> {movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : "22/3/2026"}</p>
                        <p style={detailItemStyle}><strong>Ngôn ngữ:</strong> {movie?.language || "Phụ đề Tiếng Việt"}</p>
                    </div>

                    <p style={descriptionStyle}>{movie?.description}</p>
                </div>

                {/* CỘT 3: TRAILER (Hạ xuống 380px để giảm chiều cao) */}
                {movie?.trailer && getEmbedUrl(movie.trailer) && (
                    <div style={smallTrailerContainer}>
                        <div style={smallVideoWrapper}>
                            <iframe
                                style={iframeStyle}
                                src={getEmbedUrl(movie.trailer)}
                                title="YouTube trailer"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div style={trailerLabelWrapper}>
                            <span style={trailerIconStyle}>▶</span>
                            <span style={trailerLabelTextStyle}>TRAILER FILM</span>
                        </div>
                    </div>
                )}
            </div>

            <hr style={dividerStyle} />

            {/* BỘ LỌC NGÀY */}
            <div className="date-scroller" style={dateScrollerStyle}>
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                        <div key={index} style={{ ...dateCardStyle, borderColor: isActive ? "#fb4226" : "#eee", background: isActive ? "#fb4226" : "#f5f5f5" }} onClick={() => setSelectedDate(fullDate)}>
                            <div style={{ ...dateTopStyle, color: isActive ? "#fff" : (isWeekend ? "#fb4226" : "#666") }}>
                                {date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}/{(date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}
                            </div>
                            <div style={{ ...dateBottomStyle, color: isActive ? "#fff" : (isWeekend ? "#fb4226" : "#333") }}>
                                {formatDayName(date)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LỊCH CHIẾU */}
            <div style={showtimeSectionStyle}>
                <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> LỊCH CHIẾU</h3>
                <div style={showtimeGridStyle}>
                    {filteredShowtimes.length > 0 ? (
                        filteredShowtimes.map(s => (
                            <div key={s._id} style={showtimeItemStyle}>
                                <div style={roomInfoWrapper}>
                                    <span style={roomNameText}>{s.roomId?.name || "Standard"}</span>
                                    <span style={roomTypeBadge}>{s.roomId?.type || "2D"}</span>
                                </div>
                                <button onClick={() => handleBookingClick(s._id)} style={timeBtnStyle}>
                                    {new Date(s.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={noShowtimeStyle}>Hôm nay chưa có suất chiếu sếp ơi!</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 🎨 STYLE CHI TIẾT ĐÃ ĐƯỢC "ÉP" THẤP XUỐNG ---

const containerStyle = { maxWidth: "1250px", margin: "40px auto", padding: "0 20px" };

const movieHeaderStyle = { 
    display: "flex", 
    gap: "30px", 
    alignItems: "center", 
    marginBottom: "35px", 
    flexWrap: "nowrap"
    // 🛠️ Đã bỏ minHeight để khung không bị cố định quá cao
};

// 🛠️ Ép Poster thấp xuống tí
const posterContainerStyle = { flex: "0 0 180px" };
const posterImageStyle = { width: "100%", borderRadius: "10px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", border: "1px solid #ddd" };

const infoContentStyle = { flex: "1" };
const titleStyle = { fontSize: "2rem", fontWeight: "900", marginBottom: "12px", color: "#222", letterSpacing: "-1px" };
const tagContainerStyle = { display: "flex", gap: "10px", marginBottom: "15px", alignItems: 'center' };
const tagStyle = { padding: "4px 10px", background: "#f5f5f5", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold", color: "#666" };
const statusTagStyle = { padding: "4px 10px", color: "#fff", borderRadius: "4px", fontWeight: "bold", fontSize: '0.8rem' };

const detailContainerStyle = { marginBottom: '15px', borderLeft: '3px solid #eee', paddingLeft: '15px' };
const detailItemStyle = { fontSize: '0.9rem', color: '#555', margin: '4px 0' };

const descriptionStyle = { fontSize: "0.9rem", color: "#444", lineHeight: "1.6", marginBottom: "15px" };

// 🛠️ Thu hẹp chiều ngang trailer -> Tự động giảm chiều cao
const smallTrailerContainer = {
    flex: "0 0 380px", background: "#fff", padding: "10px", borderRadius: "12px", 
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0"
};

const smallVideoWrapper = {
    position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", 
    borderRadius: "8px", background: "#000"
};

const iframeStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };
const trailerLabelWrapper = { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "10px" };
const trailerIconStyle = { color: "#fb4226", fontSize: "0.9rem" };
const trailerLabelTextStyle = { fontSize: "0.7rem", fontWeight: "800", color: "#222", letterSpacing: "1.2px", textTransform: "uppercase" };

const dividerStyle = { border: "none", borderTop: "1px solid #ddd", margin: "35px 0" };
const showtimeSectionStyle = { marginBottom: "60px" };
const sectionTitleStyle = { fontSize: "1.4rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" };
const accentBarStyle = { width: "6px", height: "24px", background: "#fb4226", borderRadius: "2px" };
const dateScrollerStyle = { display: "flex", gap: "10px", overflowX: "auto", padding: "10px 0", marginBottom: "30px", scrollbarWidth: "none" };
const dateCardStyle = { minWidth: "85px", height: "75px", borderRadius: "10px", border: "2px solid", display: "flex", flexDirection: "column", cursor: "pointer", textAlign: "center" };
const dateTopStyle = { fontSize: "0.85rem", padding: "6px 0", fontWeight: "600", display: "flex", justifyContent: "center" };
const dateBottomStyle = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold" };
const roomInfoWrapper = { marginBottom: "8px", display: "flex", flexDirection: "column", alignItems: "center" };
const roomNameText = { fontSize: "0.8rem", color: "#888", fontWeight: "600" };
const roomTypeBadge = { fontSize: "0.7rem", background: "#333", color: "#fff", padding: "2px 8px", borderRadius: "4px", marginTop: "4px" };
const showtimeItemStyle = { background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center" };
const timeBtnStyle = { width: "100%", padding: "10px", background: "#fb4226", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const noShowtimeStyle = { gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "#999", border: "1px dashed #ccc", borderRadius: "15px", background: "#fafafa", fontSize: "1.1rem" };
const showtimeGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" };