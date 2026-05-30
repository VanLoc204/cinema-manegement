import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function StaffMovies() {
    const [allShowtimes, setAllShowtimes] = useState([]); 
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [displayData, setDisplayData] = useState([]); 
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const API_URL = "http://localhost:5000";

    // 📅 Tạo danh sách 14 ngày
    const getNext14Days = () => {
        const dates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
        }
        return dates;
    };
    const dateList = getNext14Days();

    useEffect(() => {
        // Sếp nhớ check lại route này ở Backend nhé (nên là /showtimes)
        axios.get("/showtimes")
            .then(res => {
                setAllShowtimes(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi gọi API:", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (allShowtimes.length > 0) {
            const now = new Date();

            // 🔍 LỌC THÔNG MINH: Đúng ngày + Phải là tương lai
            const dailyShows = allShowtimes.filter(s => {
                const showTimeDate = new Date(s.time);
                const sDateString = showTimeDate.toISOString().split('T')[0];
                
                const isMatchDate = sDateString === selectedDate;
                
                // Nếu là ngày hôm nay thì chỉ hiện suất chưa chiếu
                // Nếu là ngày mai, ngày mốt... thì hiện hết
                const isToday = selectedDate === now.toISOString().split('T')[0];
                const isFuture = showTimeDate > now;

                return isToday ? (isMatchDate && isFuture) : isMatchDate;
            });

            // Gom nhóm theo phim
            const grouped = dailyShows.reduce((acc, curr) => {
                const mId = curr.movieId?._id;
                if (!mId) return acc;
                if (!acc[mId]) {
                    acc[mId] = { info: curr.movieId, slots: [] };
                }
                acc[mId].slots.push(curr);
                return acc;
            }, {});

            // Sắp xếp lại giờ chiếu từ sớm đến muộn cho nhân viên dễ nhìn
            const finalData = Object.values(grouped).map(movie => {
                movie.slots.sort((a, b) => new Date(a.time) - new Date(b.time));
                return movie;
            });

            setDisplayData(finalData);
        }
    }, [selectedDate, allShowtimes]);

    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>Đang tải dữ liệu sếp ơi...</div>;

    return (
        <div style={{ background: "#fff", minHeight: "80vh" }}>
            
            {/* 🕒 BỘ LỌC NGÀY - ĐÃ FIX ĐỀU TĂM TẮP */}
            <div style={dateScrollerStyle}>
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    return (
                        <div key={index} style={dateCardStyle(isActive)} onClick={() => setSelectedDate(fullDate)}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '4px' }}>
                                {index === 0 ? "H.NAY" : date.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase()}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{date.getDate()}</div>
                            <div style={{ fontSize: '0.6rem' }}>Tháng {date.getMonth() + 1}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding: "30px" }}>
                <div style={statusHeader}>
                    <div style={redLine}></div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>LỊCH CHIẾU NGÀY {new Date(selectedDate).toLocaleDateString('vi-VN')}</h3>
                </div>

                <div style={movieListStyle}>
                    {displayData.length > 0 ? displayData.map(movie => (
                        <div key={movie.info._id} style={movieRowStyle}>
                            
                            {/* 🎯 POSTER DÙNG LOGIC SẾP GỬI */}
                            <div style={posterContainer}>
                                <img
                                    src={`${API_URL}${movie.info.image}`}
                                    alt={movie.info.title}
                                    style={posterStyle}
                                    onError={(e) => {
                                        e.target.onerror = null; // Chống lặp vô tận
                                        e.target.src = "https://via.placeholder.com/300x450?text=No+Poster";
                                    }}
                                />
                            </div>

                            <div style={{ flex: 1 }}>
                                <h2 style={movieTitleStyle}>{movie.info.title}</h2>
                                <p style={movieMetaStyle}>{movie.info.genre} | {movie.info.duration} Phút</p>
                                
                                <div style={slotsGridStyle}>
                                    {movie.slots.map(slot => (
                                        <button key={slot._id} style={slotBtnStyle} onClick={() => navigate(`/staff/booking/${slot._id}`)}>
                                            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                                {new Date(slot.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span style={roomBadgeStyle}>{slot.roomId?.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={emptyStyle}>
                            <p>Hôm nay chưa có suất chiếu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 💄 HỆ THỐNG STYLES FIX "LỆCH" ---
const dateScrollerStyle = { display: "flex", gap: "10px", overflowX: "auto", padding: "20px", background: "#f8f9fa", borderBottom: "1px solid #eee", scrollbarWidth: "none" };

const dateCardStyle = (active) => ({
    // Ép cứng chiều rộng 75px để các ô đều nhau
    flex: "0 0 75px", 
    height: "85px", 
    borderRadius: "15px", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center", 
    cursor: "pointer", 
    transition: '0.3s',
    background: active ? "#fb4226" : "#fff", 
    color: active ? "#fff" : "#333", 
    border: active ? "none" : "1px solid #eee",
    boxShadow: active ? "0 8px 15px rgba(251, 66, 38, 0.2)" : "none"
});

const statusHeader = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' };
const redLine = { width: '4px', height: '24px', background: '#fb4226', borderRadius: '10px' };
const movieListStyle = { display: "flex", flexDirection: "column", gap: "35px" };
const movieRowStyle = { display: "flex", gap: "25px", paddingBottom: "25px", borderBottom: "1px solid #f5f5f5" };
const posterContainer = { width: "130px", flexShrink: 0 };
const posterStyle = { width: "100%", borderRadius: "12px", boxShadow: "0 5px 15px rgba(0,0,0,0.08)", aspectRatio: '2/3', objectFit: 'cover' };
const movieTitleStyle = { margin: "0 0 5px 0", fontSize: "1.35rem", fontWeight: "900", color: "#2c3e50" };
const movieMetaStyle = { color: "#999", fontSize: "0.85rem", marginBottom: "20px" };
const slotsGridStyle = { display: "flex", flexWrap: "wrap", gap: "12px" };

const slotBtnStyle = { 
    padding: "12px 18px", background: "#fff", border: "1px solid #edf2f7", 
    borderRadius: "12px", cursor: "pointer", textAlign: "center", 
    display: "flex", flexDirection: "column", minWidth: "100px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)", transition: '0.2s'
};

const roomBadgeStyle = { fontSize: "0.65rem", color: "#fb4226", fontWeight: "bold", marginTop: "4px", textTransform: 'uppercase' };
const emptyStyle = { textAlign: 'center', padding: '100px', color: '#ccc', width: '100%' };