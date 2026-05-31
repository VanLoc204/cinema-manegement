import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function StaffMovies() {
    const [allShowtimes, setAllShowtimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [displayData, setDisplayData] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const API_URL = import.meta.env.DEV ? "http://localhost:5000" : window.location.origin;

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
        <div className="pos-page-wrapper">
            <style>{`
                /* --- CSS HỆ THỐNG PHONG CÁCH POS MOMO CHUYÊN NGHIỆP --- */
                .pos-page-wrapper {
                    background: #fff;
                    min-height: 80vh;
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden;
                    box-sizing: border-box;
                    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                }

                /* Ẩn thanh cuộn ngang mặc định */
                .pos-date-scroller::-webkit-scrollbar {
                    display: none;
                    height: 0px !important;
                }
                .pos-date-scroller {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto !important;
                    padding: 16px 20px;
                    background: #fdfbf7;
                    border: 1px solid #f3ece0;
                    border-radius: 16px;
                    margin-bottom: 30px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    -webkit-overflow-scrolling: touch;
                    width: 100% !important;
                    box-sizing: border-box;
                }

                .pos-date-card {
                    flex: 0 0 80px;
                    min-width: 80px;
                    height: 90px;
                    border-radius: 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    background: #fff;
                    color: #5c4f40;
                    border: 1px solid #ebdcb9;
                    box-sizing: border-box;
                    box-shadow: 0 2px 5px rgba(115, 102, 78, 0.04);
                }

                .pos-date-card:hover {
                    border-color: #fb4226;
                    background: rgba(251, 66, 38, 0.02);
                    transform: translateY(-1px);
                }

                .pos-date-card.active {
                    background: linear-gradient(135deg, #fb4226 0%, #d82c14 100%);
                    color: #fff;
                    border: none;
                    box-shadow: 0 6px 16px rgba(251, 66, 38, 0.28);
                    transform: translateY(-2px);
                }

                .pos-date-card .weekday {
                    font-size: 0.65rem;
                    font-weight: 800;
                    letter-spacing: 0.8px;
                    opacity: 0.85;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                }

                .pos-date-card.active .weekday {
                    opacity: 0.95;
                }

                .pos-date-card .day-num {
                    font-size: 1.4rem;
                    font-weight: 900;
                    line-height: 1.1;
                }

                .pos-date-card .month {
                    font-size: 0.6rem;
                    font-weight: 700;
                    opacity: 0.75;
                    margin-top: 4px;
                }

                .pos-date-card.active .month {
                    opacity: 0.9;
                }

                .pos-container {
                    padding: 10px 20px 30px;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .pos-status-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 30px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .pos-red-line {
                    width: 4px;
                    height: 24px;
                    background: #fb4226;
                    border-radius: 10px;
                }

                .pos-movie-list {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .pos-movie-row {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    padding: 26px 24px;
                    background: #fff;
                    border: 1px solid #f3ece0;
                    border-radius: 18px;
                    box-shadow: 0 4px 15px rgba(115, 102, 78, 0.04);
                    width: 100%;
                    box-sizing: border-box;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .pos-movie-row:hover {
                    box-shadow: 0 8px 25px rgba(115, 102, 78, 0.08);
                    transform: translateY(-2px);
                }

                .pos-movie-title {
                    margin: 0;
                    font-size: 1.45rem;
                    font-weight: 900;
                    color: #3a2d1f;
                    letter-spacing: -0.3px;
                    border-left: 4px solid #fb4226;
                    padding-left: 12px;
                }

                .pos-movie-body {
                    display: flex;
                    gap: 25px;
                    width: 100%;
                }

                .pos-poster-container {
                    width: 125px;
                    flex-shrink: 0;
                }

                .pos-poster-img {
                    width: 100%;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(115, 102, 78, 0.12);
                    aspect-ratio: 2/3;
                    object-fit: cover;
                    border: 2px solid #fff;
                }

                .pos-movie-info {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                }

                .pos-movie-meta {
                    color: #8a7e6d;
                    font-size: 0.88rem;
                    margin: 0 0 16px 0;
                    font-weight: 600;
                }

                .pos-slots-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .momo-slot-btn {
                    padding: 10px 8px;
                    background: #fff;
                    border: 1px solid #ebdcb9;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    min-width: 120px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                    align-items: center;
                    justify-content: center;
                    outline: none;
                    box-sizing: border-box;
                }

                .momo-slot-btn:hover {
                    transform: translateY(-4px);
                    border-color: #fb4226;
                    box-shadow: 0 8px 24px rgba(251, 66, 38, 0.12);
                }

                .momo-slot-room {
                    font-size: 0.85rem;
                    color: #718096;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .momo-slot-badge {
                    font-size: 0.62rem;
                    padding: 2px 8px;
                    background: #2d3748;
                    color: #fff;
                    border-radius: 5px;
                    font-weight: 900;
                    text-transform: uppercase;
                    display: inline-block;
                    margin-bottom: 6px;
                    letter-spacing: 0.5px;
                }

                .momo-slot-time-wrapper {
                    width: 100%;
                    padding: 6px 6px;
                    background: linear-gradient(135deg, #fb4226 0%, #e03014 100%);
                    color: #fff;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 900;
                    text-align: center;
                    box-shadow: 0 3px 8px rgba(251, 66, 38, 0.2);
                    margin-top: 4px;
                }

                .pos-empty {
                    text-align: center;
                    padding: 100px 0;
                    color: #ccc;
                    width: 100%;
                }

                /* --- 📱 HỆ THỐNG RESPONSIVE MOBILE MOMO CHUẨN ĐẸP --- */
                @media (max-width: 768px) {
                    .pos-page-wrapper {
                        max-width: 100% !important;
                        width: 100% !important;
                        overflow-x: hidden !important;
                    }

                    .pos-container {
                        padding: 15px 10px !important;
                    }

                    .pos-status-header {
                        margin-bottom: 20px !important;
                    }

                    /* 5 ngày trên một khung hình khít khao nhờ công thức view-width (vw) */
                    .pos-date-scroller {
                        padding: 10px 8px !important;
                        gap: 6px !important;
                        display: flex !important;
                        overflow-x: auto !important;
                        width: 0px !important;
                        min-width: 100% !important;
                        max-width: 100% !important;
                    }

                    .pos-date-card {
                        flex: 0 0 calc((100vw - 30px - 16px - 24px) / 5) !important;
                        min-width: calc((100vw - 30px - 16px - 24px) / 5) !important;
                        height: 68px !important;
                        border-radius: 10px !important;
                    }

                    .pos-date-card .weekday {
                        font-size: 0.55rem !important;
                        margin-bottom: 2px !important;
                    }

                    .pos-date-card .day-num {
                        font-size: 1.05rem !important;
                        font-weight: 800 !important;
                        line-height: 1.1;
                    }

                    .pos-date-card .month {
                        font-size: 0.5rem !important;
                        margin-top: 2px !important;
                    }

                    .pos-movie-row {
                        padding: 18px 15px !important;
                        border-radius: 14px !important;
                        margin-bottom: 20px !important;
                        gap: 12px !important;
                    }

                    .pos-movie-title {
                        font-size: 1.15rem !important;
                        padding-left: 8px !important;
                        border-left-width: 3px !important;
                    }

                    .pos-movie-body {
                        gap: 12px !important;
                    }

                    .pos-poster-container {
                        width: 80px !important;
                        flex: 0 0 80px !important;
                    }

                    .pos-poster-img {
                        border-width: 1px !important;
                        box-shadow: 0 4px 10px rgba(115, 102, 78, 0.1) !important;
                    }

                    .pos-movie-info {
                        flex: 1 !important;
                        min-width: 0 !important;
                    }

                    .pos-movie-meta {
                        font-size: 0.78rem !important;
                        margin-bottom: 10px !important;
                    }

                    /* Giờ chiếu: Grid 2 cột nhỏ xinh chữ nhật như Momo */
                    .pos-slots-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 8px !important;
                        margin-top: 8px !important;
                        width: 100% !important;
                    }

                    .momo-slot-btn {
                        min-width: 0 !important;
                        width: 100% !important;
                        padding: 6px 4px !important;
                        border-radius: 8px !important;
                    }

                    .momo-slot-room {
                        font-size: 0.65rem !important;
                        margin-bottom: 2px !important;
                    }

                    .momo-slot-badge {
                        font-size: 0.55rem !important;
                        padding: 1px 4px !important;
                        margin-bottom: 4px !important;
                    }

                    .momo-slot-time-wrapper {
                        padding: 4px 1px !important;
                        font-size: 0.65rem !important;
                        border-radius: 6px !important;
                        white-space: nowrap !important;
                        letter-spacing: -0.3px !important;
                    }
                }

                @media (max-width: 340px) {
                    .pos-date-card {
                        flex: 0 0 calc((100vw - 30px - 16px - 16px) / 5) !important;
                        min-width: calc((100vw - 30px - 16px - 16px) / 5) !important;
                    }
                }
            `}</style>

            {/* 🕒 BỘ LỌC NGÀY */}
            <div className="pos-date-scroller">
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    return (
                        <div 
                            key={index} 
                            className={`pos-date-card ${isActive ? 'active' : ''}`}
                            onClick={() => setSelectedDate(fullDate)}
                        >
                            <span className="weekday">
                                {index === 0 ? "H.NAY" : ["CN", "THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7"][date.getDay()]}
                            </span>
                            <span className="day-num">{date.getDate()}</span>
                            <span className="month">Tháng {date.getMonth() + 1}</span>
                        </div>
                    );
                })}
            </div>

            <div className="pos-container">
                <div className="pos-status-header">
                    <div className="pos-red-line"></div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#3a2d1f' }}>LỊCH CHIẾU NGÀY {new Date(selectedDate).toLocaleDateString('vi-VN')}</h3>
                </div>

                <div className="pos-movie-list">
                    {displayData.length > 0 ? displayData.map(movie => (
                        <div key={movie.info._id} className="pos-movie-row">
                            {/* 🎯 TÊN PHIM TRÊN CÙNG CARD */}
                            <h2 className="pos-movie-title">{movie.info.title}</h2>

                            <div className="pos-movie-body">
                                {/* 🎯 POSTER */}
                                <div className="pos-poster-container">
                                    <img
                                        src={`${API_URL}${movie.info.image}`}
                                        alt={movie.info.title}
                                        className="pos-poster-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/300x450?text=No+Poster";
                                        }}
                                    />
                                </div>

                                {/* 🎯 LỊCH CHIẾU PHẢI */}
                                <div className="pos-movie-info">
                                    <p className="pos-movie-meta">{movie.info.genre} | {movie.info.duration} Phút</p>
                                    <div className="pos-slots-grid">
                                    {movie.slots && movie.slots.map(slot => {
                                        const startTime = new Date(slot.time);
                                        const duration = slot.movieId?.duration || 120;
                                        const endTime = new Date(startTime.getTime() + duration * 60000);
                                        const rType = slot.roomId?.type || "2D";

                                        return (
                                            <button
                                                key={slot._id}
                                                className="momo-slot-btn"
                                                onClick={() => navigate(`/staff/booking/${slot._id}`)}
                                            >
                                                <div className="momo-slot-room">
                                                    {slot.roomId?.name || "Room"}
                                                </div>

                                                <span className="momo-slot-badge">
                                                    {rType}
                                                </span>

                                                <div className="momo-slot-time-wrapper">
                                                    {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    <span style={{ opacity: 0.6, fontSize: '0.72rem', margin: '0 3px' }}>~</span>
                                                    <span>
                                                        {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    )) : (
                        <div className="pos-empty">
                            <p>Hôm nay chưa có suất chiếu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}