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
                    gap: 10px;
                    overflow-x: auto !important;
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eee;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    -webkit-overflow-scrolling: touch;
                    width: 0px !important;
                    min-width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box;
                }

                .pos-date-card {
                    flex: 0 0 75px;
                    min-width: 75px;
                    height: 85px;
                    border-radius: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #fff;
                    color: #333;
                    border: 1px solid #eee;
                    box-sizing: border-box;
                }

                .pos-date-card.active {
                    background: #fb4226;
                    color: #fff;
                    border: none;
                    box-shadow: 0 8px 15px rgba(251, 66, 38, 0.2);
                }

                .pos-container {
                    padding: 30px;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .pos-status-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 35px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .pos-red-line {
                    width: 4px;
                    height: 24px;
                    background: #fb4226;
                    borderRadius: 10px;
                }

                .pos-movie-list {
                    display: flex;
                    flex-direction: column;
                    gap: 35px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .pos-movie-row {
                    display: flex;
                    gap: 25px;
                    padding-bottom: 25px;
                    border-bottom: 1px solid #f5f5f5;
                    width: 100%;
                    box-sizing: border-box;
                }

                .pos-poster-container {
                    width: 130px;
                    flex-shrink: 0;
                }

                .pos-poster-img {
                    width: 100%;
                    border-radius: 12px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    aspect-ratio: 2/3;
                    object-fit: cover;
                }

                .pos-movie-info {
                    flex: 1;
                    min-width: 0;
                }

                .pos-movie-title {
                    margin: 0 0 5px 0;
                    font-size: 1.35rem;
                    font-weight: 900;
                    color: #2c3e50;
                }

                .pos-movie-meta {
                    color: #999;
                    font-size: 0.85rem;
                    margin: 0 0 20px 0;
                }

                .pos-slots-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-top: 20px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .momo-slot-btn {
                    padding: 10px 8px;
                    background: #fff;
                    border: 1px solid #e2e8f0;
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
                        /* 100vw trừ đi padding ngoài của Main, padding của Scroller và gap rồi chia cho 5 */
                        flex: 0 0 calc((100vw - 30px - 16px - 24px) / 5) !important;
                        min-width: calc((100vw - 30px - 16px - 24px) / 5) !important;
                        height: 62px !important;
                        border-radius: 10px !important;
                    }

                    .pos-date-card div:first-child {
                        font-size: 0.55rem !important;
                        margin-bottom: 2px !important;
                    }

                    .pos-date-card div:nth-child(2) {
                        font-size: 1.0rem !important;
                        font-weight: 800 !important;
                        line-height: 1.1;
                    }

                    .pos-date-card div:last-child {
                        font-size: 0.48rem !important;
                    }

                    /* Bố cục phim: Tên phim ở trên, Poster bên trái, Giờ chiếu bên phải */
                    .pos-movie-row {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 12px !important;
                        padding-bottom: 20px !important;
                    }

                    .pos-movie-title {
                        width: 100% !important; /* Đưa tên phim lên hàng trên cùng */
                        font-size: 1.1rem !important;
                        font-weight: 900 !important;
                        margin-bottom: 5px !important;
                        color: #2c3e50 !important;
                    }

                    .pos-poster-container {
                        width: 75px !important;
                        flex: 0 0 75px !important;
                    }

                    .pos-movie-info {
                        flex: 1 !important;
                        min-width: 0 !important;
                    }

                    .pos-movie-meta {
                        font-size: 0.75rem !important;
                        margin-bottom: 8px !important;
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
                        padding: 4px 2px !important;
                        font-size: 0.72rem !important;
                        border-radius: 6px !important;
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
                            <div>
                                {index === 0 ? "H.NAY" : date.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase()}
                            </div>
                            <div>{date.getDate()}</div>
                            <div>Tháng {date.getMonth() + 1}</div>
                        </div>
                    );
                })}
            </div>

            <div className="pos-container">
                <div className="pos-status-header">
                    <div className="pos-red-line"></div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>LỊCH CHIẾU NGÀY {new Date(selectedDate).toLocaleDateString('vi-VN')}</h3>
                </div>

                <div className="pos-movie-list">
                    {displayData.length > 0 ? displayData.map(movie => (
                        <div key={movie.info._id} className="pos-movie-row">

                            {/* 🎯 TÊN PHIM TRÊN MOBILE */}
                            <h2 className="pos-movie-title">{movie.info.title}</h2>

                            {/* 🎯 POSTER TRÁI */}
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