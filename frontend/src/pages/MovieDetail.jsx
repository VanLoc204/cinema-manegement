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

    return (
        <div style={containerStyle}>
            {/* 🎥 HEADER 3 CỘT - TRAILER ĐÃ PHÓNG TO */}
            <div style={movieHeaderStyle}>
                
                {/* CỘT 1: POSTER */}
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
                        <span style={tagStyle}>{movie?.genre}</span>
                        <span style={tagStyle}>{movie?.duration} Phút</span>
                        <span style={statusTagStyle}>{movie?.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}</span>
                    </div>
                    <p style={descriptionStyle}>{movie?.description}</p>
                    <div style={{ marginTop: '15px', color: '#777', fontSize: '0.9rem' }}>
                        <p><strong>🕒 Khởi chiếu:</strong> 22/3/2026</p>
                        <p><strong>🌐 Ngôn ngữ:</strong> Phụ đề Tiếng Việt</p>
                    </div>
                </div>

                {/* CỘT 3: TRAILER (Phóng to lên 450px) */}
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
                        /* 🚩 FIX CANH GIỮA Ở ĐÂY SẾP ƠI */
                        <div style={noShowtimeStyle}>Hôm nay chưa có suất chiếu sếp ơi!</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 🎨 STYLE CHI TIẾT ---

const containerStyle = { maxWidth: "1250px", margin: "40px auto", padding: "0 20px" };

const movieHeaderStyle = { 
    display: "flex", gap: "35px", alignItems: "flex-start", marginBottom: "40px", flexWrap: "nowrap" 
};

const posterContainerStyle = { flex: "0 0 200px" };
const posterImageStyle = { width: "100%", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #ddd" };

const infoContentStyle = { flex: "1" };
const titleStyle = { fontSize: "2.3rem", fontWeight: "900", marginBottom: "15px", color: "#222", letterSpacing: "-1px" };
const tagContainerStyle = { display: "flex", gap: "10px", marginBottom: "20px" };
const tagStyle = { padding: "5px 12px", background: "#eee", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold", color: "#555" };
const statusTagStyle = { padding: "5px 12px", background: "#fb4226", color: "#fff", borderRadius: "4px", fontWeight: "bold" };
const descriptionStyle = { fontSize: "0.95rem", color: "#444", lineHeight: "1.8", marginBottom: "20px" };

// 🚩 TĂNG CỘT NÀY LÊN 450PX
const smallTrailerContainer = {
    flex: "0 0 450px", background: "#fff", padding: "12px", borderRadius: "15px", 
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0"
};

const smallVideoWrapper = {
    position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", 
    borderRadius: "10px", background: "#000"
};

const iframeStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };

const trailerLabelWrapper = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px"
};

const trailerIconStyle = { color: "#fb4226", fontSize: "1rem" };

const trailerLabelTextStyle = {
    fontSize: "0.75rem", fontWeight: "800", color: "#222", letterSpacing: "1.5px", textTransform: "uppercase"
};

const dividerStyle = { border: "none", borderTop: "1px solid #ddd", margin: "40px 0" };
const showtimeSectionStyle = { marginBottom: "60px" };
const sectionTitleStyle = { fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" };
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

// 🚩 FIX CANH GIỮA TUYỆT ĐỐI CHO GRID
const noShowtimeStyle = { 
    gridColumn: "1 / -1", // Chiếm hết các cột của grid
    textAlign: "center", 
    padding: "60px", 
    color: "#999", 
    border: "1px dashed #ccc", 
    borderRadius: "15px",
    background: "#fafafa",
    fontSize: "1.1rem"
};

const showtimeGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" };