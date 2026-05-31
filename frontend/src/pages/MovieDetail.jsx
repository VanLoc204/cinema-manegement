import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState({});
    const [showtimes, setShowtimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // 📦 PHẦN THÊM MỚI: States cho Review & Rating
    const [reviews, setReviews] = useState([]);
    const [filterStar, setFilterStar] = useState("all"); // Bộ lọc sao
    const [userRating, setUserRating] = useState(5);
    const [comment, setComment] = useState("");
    const [canReview, setCanReview] = useState(false); // Điều kiện đã mua vé
    const [hasReviewed, setHasReviewed] = useState(false); // Điều kiện chưa đánh giá
    const [activeMobileTab, setActiveMobileTab] = useState("detail"); // Tab chi tiết/trailer trên mobile
    
    // --- 📢 NOTIFICATION TOAST ---
    const [toastData, setToastData] = useState(null);
    const showToast = (message, type = "error") => {
        setToastData({ message, type });
        setTimeout(() => setToastData(null), 4000);
    };

    const userId = localStorage.getItem("userId");
    const API_URL = import.meta.env.DEV ? "http://localhost:5000" : window.location.origin;

    // 🔄 1. FETCH DATA: GIỮ NGUYÊN LOGIC CỦA SẾP + THÊM LOGIC CHECK QUYỀN
    const fetchData = async () => {
        try {
            // 1. Lấy phim & Suất chiếu & Reviews (Giữ nguyên)
            const movieRes = await axios.get("/movies");
            const found = movieRes.data.find(m => String(m._id) === String(id));
            if (found) setMovie(found);

            const showtimeRes = await axios.get(`/showtimes/${id}`);
            setShowtimes(showtimeRes.data);

            const reviewRes = await axios.get(`/reviews/movie/${id}`);
            const allReviews = reviewRes.data;
            setReviews(allReviews);

            // 🛡️ 2. LOGIC KIỂM TRA QUYỀN (BẢN FIX TRIỆT ĐỂ)
            if (userId) {
                // Check xem đã đánh giá chưa (Dùng String() để so khớp chuẩn)
                setHasReviewed(allReviews.some(r => String(r.userId?._id) === String(userId)));

                // Check vé: Đã thanh toán cho phim này
                const bookingRes = await axios.get(`/bookings/user/${userId}`);

                // Mẹo cho sếp: Bật F12 -> Console để xem cái mảng này nó trông như nào
                console.log("Dữ liệu vé của sếp nè:", bookingRes.data);

                const isEligible = bookingRes.data.some(b => {
                    // Dò tìm ID phim (Nó có thể nằm ở b.movieId hoặc b.showtimeId.movieId)
                    const bMovieId = b.movieId?._id || b.movieId || b.showtimeId?.movieId?._id || b.showtimeId?.movieId;

                    const matchesMovie = String(bMovieId) === String(id);
                    const isPaid = b.status === "Paid";

                    // 💡 Sếp lưu ý: Tôi đã tạm bỏ điều kiện "Phải xem xong" (time < now) 
                    // để sếp mua vé xong là test được ngay!
                    return matchesMovie && isPaid;
                });

                setCanReview(isEligible);
            }
        } catch (err) {
            console.error("Lỗi sếp ơi:", err);
            showToast("Không thể tải dữ liệu, vui lòng thử lại");
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, userId]);

    // 🚀 2. HÀM XỬ LÝ REVIEW & REACTION
    const handleSendReview = async () => {
        if (!comment.trim()) return showToast("Sếp nhập vài chữ cảm nhận phim nhé!");
        try {
            await axios.post("/reviews/add", { movieId: id, userId, rating: userRating, content: comment });
            setComment("");
            fetchData();
            showToast("Cảm ơn sếp đã đánh giá!", "success");
        } catch (err) {
            showToast(err.response?.data);
        }
    };

    const handleReaction = async (reviewId, type) => {
        if (!userId) return showToast("Đăng nhập để tương tác sếp ơi!");
        try {
            await axios.post("/reviews/react", { reviewId, userId, type });
            fetchData();
        } catch (err) { console.error(err); }
    };

    // 📊 Công thức tính Rating trung bình
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    // 🎯 Lọc danh sách theo số sao
    const filteredReviews = reviews.filter(r => filterStar === "all" ? true : r.rating === parseInt(filterStar));

    // --- ⬇️ GIỮ NGUYÊN TOÀN BỘ LOGIC CŨ CỦA SẾP ⬇️ ---
    const filteredShowtimes = showtimes.filter(s => {
        const sDate = new Date(s.time).toISOString().split('T')[0];
        return sDate === selectedDate;
    });

    const handleBookingClick = (showtimeId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            showToast("Vui lòng đăng nhập để tiếp tục đặt vé!");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
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
            const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
        }
        return dates;
    };
    const dateList = getNext14Days();

    const getEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?rel=0` : null;
    };

    const getRatedColor = (rated) => {
        switch (rated) {
            case 'P': return '#2ecc71'; case 'K': return '#3498db'; case 'T13': return '#f1c40f';
            case 'T16': return '#e67e22'; case 'T18': return '#e74c3c'; default: return '#fb4226';
        }
    };

    const toastElement = toastData && (
        <div className="cinema-custom-toast">
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: toastData.type === "success" ? "#4ade80" : "#f87171" }}>
                {toastData.message}
            </h2>
        </div>
    );

    return (
        <div className="movie-detail-page-wrapper">
            {movie?.image && (
                <div 
                    className="movie-detail-dynamic-bg" 
                    style={{ backgroundImage: `url(${API_URL}${movie.image})` }} 
                />
            )}
            <div style={{ ...containerStyle, position: "relative", zIndex: 1 }} className="movie-detail-container">
                {toastElement}
                <style>{`
                    .movie-detail-page-wrapper {
                        background: radial-gradient(circle at 50% 0%, #fdfbf7 0%, #f6f1e3 65%, #ebdcb9 100%);
                        min-height: 100vh;
                        position: relative;
                        padding-bottom: 40px;
                        box-sizing: border-box;
                    }
                    .movie-detail-dynamic-bg {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 700px;
                        background-size: cover;
                        background-position: center 20%;
                        filter: blur(85px) saturate(1.8);
                        opacity: 0.32;
                        z-index: 0;
                        pointer-events: none;
                        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, rgba(0, 0, 0, 0) 100%);
                        -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, rgba(0, 0, 0, 0) 100%);
                    }
                    .movie-detail-page-wrapper::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 12px;
                        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), transparent);
                        z-index: 3;
                        pointer-events: none;
                    }
                    
                    /* Custom styles for detail/trailer mobile tabs to match theme */
                    @media (max-width: 768px) {
                        .mobile-detail-tabs {
                            background: rgba(246, 241, 227, 0.7) !important;
                            border-color: rgba(188, 172, 142, 0.5) !important;
                            backdrop-filter: blur(8px) !important;
                        }
                        .mobile-tab-btn {
                            background: transparent !important;
                            color: #70624d !important;
                        }
                        .mobile-tab-btn.active {
                            background: linear-gradient(135deg, #ff573d 0%, #fb4226 100%) !important;
                            color: #fff !important;
                        }
                    }
                    
                    /* --- 📢 CUSTOM LUXURY TOAST CSS --- */
                .cinema-custom-toast {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    background: rgba(26, 26, 29, 0.95);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 16px 24px;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
                    z-index: 10000;
                    max-width: 380px;
                    color: #fff;
                    animation: toastFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes toastFadeIn {
                    from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .cinema-custom-toast {
                        top: auto !important;
                        bottom: 24px !important;
                        left: 16px !important;
                        right: 16px !important;
                        max-width: none !important;
                        animation: toastFadeInMobile 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                    }
                    @keyframes toastFadeInMobile {
                        from { transform: translateY(20px) scale(0.95); opacity: 0; }
                        to { transform: translateY(0) scale(1); opacity: 1; }
                    }
                }

                /* Desktop layout tab bar hide */
                .mobile-detail-tabs {
                    display: none;
                }

                @media (max-width: 768px) {
                    .movie-detail-container {
                        padding: 15px 12px !important;
                        margin: 10px auto !important;
                        max-width: 100% !important;
                        overflow-x: hidden !important;
                    }
                    .movie-detail-header {
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 20px !important;
                        margin-bottom: 25px !important;
                        text-align: center !important;
                    }
                    .movie-poster-container {
                        width: 160px !important;
                        flex: 0 0 160px !important;
                        margin: 0 auto !important;
                    }
                    .movie-info-content {
                        width: 100% !important;
                    }
                    .movie-info-content h1 {
                        font-size: 1.5rem !important;
                        text-align: center !important;
                    }
                    .movie-tags {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                        gap: 8px !important;
                        margin-bottom: 15px !important;
                    }
                    
                    /* Tabs for Detail/Trailer */
                    .mobile-detail-tabs {
                        display: flex !important;
                        width: 100% !important;
                        border: 1.5px solid #fb4226 !important;
                        border-radius: 30px !important;
                        overflow: hidden !important;
                        margin: 15px 0 !important;
                        background: #fff !important;
                    }
                    .mobile-tab-btn {
                        flex: 1 !important;
                        padding: 10px !important;
                        border: none !important;
                        background: #fff !important;
                        font-weight: 800 !important;
                        font-size: 0.85rem !important;
                        cursor: pointer !important;
                        color: #fb4226 !important;
                        text-transform: uppercase !important;
                        transition: all 0.2s ease !important;
                    }
                    .mobile-tab-btn.active {
                        background: #fb4226 !important;
                        color: #fff !important;
                    }

                    /* Align details to the left */
                    .movie-details-list {
                        border-left: none !important;
                        padding-left: 0 !important;
                        text-align: left !important;
                    }
                    .movie-details-list p {
                        text-align: left !important;
                    }
                    .movie-info-content p {
                        text-align: left !important;
                    }

                    .movie-trailer-container {
                        width: 100% !important;
                        flex: 0 0 auto !important;
                        box-sizing: border-box !important;
                        margin-top: 10px !important;
                    }
                    
                    /* Show exactly 5 days on 1 screen */
                    .date-scroller-container {
                        display: flex !important;
                        gap: 5px !important;
                        padding: 5px 0 !important;
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch;
                        justify-content: space-between !important;
                    }
                    .date-scroller-container::-webkit-scrollbar {
                        height: 0px !important;
                    }
                    .date-scroller-container > div {
                        flex: 0 0 calc((100vw - 24px - 20px) / 5) !important;
                        min-width: calc((100vw - 24px - 20px) / 5) !important;
                        height: 60px !important;
                        box-sizing: border-box !important;
                        border-radius: 8px !important;
                    }
                    .date-scroller-container > div > div {
                        font-size: 0.65rem !important;
                    }

                    /* Show exactly 3 showtimes per row */
                    .showtime-grid-container {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 8px !important;
                    }
                    .showtime-item {
                        padding: 8px 4px !important;
                    }
                    .showtime-item button {
                        padding: 8px 2px !important;
                        font-size: 0.78rem !important;
                    }

                    /* Align ratings header and summary card to the left */
                    .rating-header-flex {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        text-align: left !important;
                        gap: 15px !important;
                    }
                    .rating-header-flex h3 {
                        justify-content: flex-start !important;
                    }
                    .rating-summary-card {
                        width: auto !important;
                        box-sizing: border-box !important;
                        justify-content: flex-start !important;
                        align-self: flex-start !important;
                        padding: 10px 15px !important;
                    }
                    .review-box-container {
                        padding: 20px 15px !important;
                    }
                    .review-box-container textarea {
                        font-size: 0.9rem !important;
                    }
                    .review-box-container button {
                        width: 100% !important;
                    }

                    /* Fit all star filters in one screen */
                    .filter-bar-container {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        align-items: center !important;
                        gap: 3px !important;
                        width: 100% !important;
                        padding: 8px 0 !important;
                        overflow-x: hidden !important;
                        justify-content: space-between !important;
                    }
                    .filter-bar-container span {
                        font-size: 0.68rem !important;
                        margin-right: 2px !important;
                        white-space: nowrap !important;
                    }
                    .filter-bar-container button {
                        flex: 1 !important;
                        font-size: 0.62rem !important;
                        padding: 4px 2px !important;
                        border-radius: 12px !important;
                        white-space: nowrap !important;
                        text-align: center !important;
                    }
                    
                    /* Dynamic tab toggle visibility */
                    .movie-detail-info-block.mobile-hide,
                    .movie-trailer-container.mobile-hide {
                        display: none !important;
                    }
                    .movie-detail-info-block.mobile-show,
                    .movie-trailer-container.mobile-show {
                        display: block !important;
                    }
                }
            `}</style>
            {/* 🎥 1. HEADER (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={movieHeaderStyle} className="movie-detail-header">
                <div style={posterContainerStyle} className="movie-poster-container">
                    <img src={movie?.image ? `${API_URL}${movie.image}` : null} alt={movie?.title} style={posterImageStyle} />
                </div>
                <div style={infoContentStyle} className="movie-info-content">
                    <h1 style={titleStyle}>{movie?.title || "Đang tải..."}</h1>
                    <div style={tagContainerStyle} className="movie-tags">
                        <span style={{ ...statusTagStyle, background: getRatedColor(movie?.rated) }}>{movie?.rated || "P"}</span>
                        <span style={tagStyle}>{movie?.genre}</span>
                        <span style={tagStyle}>{movie?.duration} Phút</span>
                        <span style={{ ...tagStyle, color: '#fb4226', border: '1px solid #fb4226', background: 'none' }}>
                            {movie?.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
                        </span>
                    </div>

                    {/* Nút tròn xem chi tiết & trailer khi responsive */}
                    <div className="mobile-detail-tabs">
                        <button
                            className={`mobile-tab-btn ${activeMobileTab === "detail" ? "active" : ""}`}
                            onClick={() => setActiveMobileTab("detail")}
                        >
                            Chi tiết
                        </button>
                        <button
                            className={`mobile-tab-btn ${activeMobileTab === "trailer" ? "active" : ""}`}
                            onClick={() => setActiveMobileTab("trailer")}
                        >
                            Trailer
                        </button>
                    </div>

                    <div style={detailContainerStyle} className={`movie-details-list movie-detail-info-block ${activeMobileTab === "detail" ? "mobile-show" : "mobile-hide"}`}>
                        <p style={detailItemStyle}><strong>Đạo diễn:</strong> {movie?.director || "Đang cập nhật"}</p>
                        <p style={detailItemStyle}><strong>Diễn viên:</strong> {movie?.cast || "Đang cập nhật"}</p>
                        <p style={detailItemStyle}><strong>Khởi chiếu:</strong> {movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : "22/3/2026"}</p>
                    </div>
                    <p style={descriptionStyle} className={`movie-detail-info-block ${activeMobileTab === "detail" ? "mobile-show" : "mobile-hide"}`}>{movie?.description}</p>
                </div>
                {movie?.trailer && getEmbedUrl(movie.trailer) && (
                    <div style={smallTrailerContainer} className={`movie-trailer-container ${activeMobileTab === "trailer" ? "mobile-show" : "mobile-hide"}`}>
                        <div style={smallVideoWrapper}>
                            <iframe style={iframeStyle} src={getEmbedUrl(movie.trailer)} frameBorder="0" allowFullScreen></iframe>
                        </div>
                    </div>
                )}
            </div>

            <hr style={dividerStyle} />

            {/* 📅 2. BỘ LỌC NGÀY (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={dateScrollerStyle} className="date-scroller-container">
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    return (
                        <div key={index} style={{
                            ...dateCardStyle,
                            borderColor: isActive ? "transparent" : "rgba(188, 172, 142, 0.35)",
                            background: isActive ? "linear-gradient(135deg, #ff573d 0%, #fb4226 100%)" : "rgba(246, 241, 227, 0.65)",
                            boxShadow: isActive ? "0 8px 20px rgba(251, 66, 38, 0.35)" : "0 4px 10px rgba(115, 102, 78, 0.04)"
                        }} onClick={() => setSelectedDate(fullDate)}>
                            <div style={{ ...dateTopStyle, color: isActive ? "#fff" : "#666" }}>{date.getDate()}/{date.getMonth() + 1}</div>
                            <div style={{ ...dateBottomStyle, color: isActive ? "#fff" : "#333" }}>{formatDayName(date)}</div>
                        </div>
                    );
                })}
            </div>

            {/* 🎟️ 3. LỊCH CHIẾU (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={showtimeSectionStyle}>
                <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> LỊCH CHIẾU</h3>
                <div style={showtimeGridStyle} className="showtime-grid-container">
                    {filteredShowtimes.length > 0 ? (
                        filteredShowtimes.map(s => (
                            <div key={s._id} style={showtimeItemStyle} className="showtime-item">
                                <div style={roomInfoWrapper}>
                                    <span style={roomNameText}>{s.roomId?.name}</span>
                                    <span style={roomTypeBadge}>{s.roomId?.type || "2D"}</span>
                                </div>
                                <button onClick={() => handleBookingClick(s._id)} style={timeBtnStyle}>
                                    {new Date(s.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </button>
                            </div>
                        ))
                    ) : <div style={noShowtimeStyle}>Chưa có suất chiếu</div>}
                </div>
            </div>

            {/* 💬 4. PHẦN BÌNH LUẬN & ĐÁNH GIÁ (SỬA ĐẸP LÊN THEO Ý SẾP) */}
            <div style={reviewSectionStyle}>
                {/* 📊 KHỐI HIỂN THỊ TỔNG ĐIỂM RATING */}
                <div style={ratingHeaderFlex} className="rating-header-flex">
                    <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> ĐÁNH GIÁ KHÁN GIẢ</h3>
                    <div style={ratingSummaryCard} className="rating-summary-card">
                        <span style={bigRatingNumber}>{averageRating}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ color: '#f1c40f', fontSize: '1.2rem' }}>★★★★★</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{reviews.length} khán giả đánh giá</div>
                        </div>
                    </div>
                </div>

                {/* 📝 FORM VIẾT ĐÁNH GIÁ (CHỈ HIỆN KHI ĐỦ ĐIỀU KIỆN) */}
                <div style={reviewBoxContainer} className="review-box-container">
                    {!userId ? (
                        <div style={lockMessageStyle}>Sếp hãy đăng nhập để chia sẻ cảm nghĩ nhé!</div>
                    ) : hasReviewed ? (
                        <div style={{ ...lockMessageStyle, color: '#2ecc71', fontWeight: 'bold' }}>Phim này sếp đã đánh giá rồi! Cảm ơn sếp nhiều.</div>
                    ) : !canReview ? (
                        <div style={lockMessageStyle}>Chỉ dành cho khán giả đã mua vé. Sếp hãy trải nghiệm phim rồi quay lại đánh giá nhé!</div>
                    ) : (
                        <div style={activeFormStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '15px' }}>Sếp chấm mấy sao?</span>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <span key={n} onClick={() => setUserRating(n)} style={{ fontSize: '2rem', cursor: 'pointer', color: n <= userRating ? '#f1c40f' : '#ddd' }}>★</span>
                                ))}
                            </div>
                            <textarea placeholder="Sếp thấy phim thế nào?..." style={textareaStyle} value={comment} onChange={(e) => setComment(e.target.value)} />
                            <button onClick={handleSendReview} style={btnReviewStyle}>GỬI ĐÁNH GIÁ</button>
                        </div>
                    )}
                </div>

                {/* 🔍 BỘ LỌC SAO */}
                <div style={filterBarContainer} className="filter-bar-container">
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Lọc theo:</span>
                    {["all", 5, 4, 3, 2, 1].map(star => (
                        <button key={star} onClick={() => setFilterStar(star)} style={filterBtnStyle(filterStar === star)}>
                            {star === "all" ? "Tất cả" : `${star} ★`}
                        </button>
                    ))}
                </div>

                {/* 📋 DANH SÁCH REVIEW (UI MỚI CỰC SANG) */}
                <div style={reviewListStyle}>
                    {filteredReviews.length > 0 ? filteredReviews.map(r => (
                        <div key={r._id} style={premiumCardStyle}>
                            <div style={cardHeader}>
                                <div style={avatarCircle}>{(r.userId?.name || "U").charAt(0).toUpperCase()}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ fontSize: '1.1rem' }}>{r.userId?.name}</strong>
                                        <span style={{ fontSize: '0.8rem', color: '#bbb' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div style={{ color: '#f1c40f', fontSize: '0.9rem' }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                                </div>
                            </div>
                            <p style={cardContent}>{r.content}</p>
                            <div style={cardFooter}>
                                <button onClick={() => handleReaction(r._id, 'like')} style={reactionStyle(r.likes?.includes(userId))}>
                                    {r.likes?.length || 0} Hữu ích
                                </button>
                                <button onClick={() => handleReaction(r._id, 'dislike')} style={reactionStyle(r.dislikes?.includes(userId))}>
                                    {r.dislikes?.length || 0}
                                </button>
                            </div>
                        </div>
                    )) : <div style={emptyReviewStyle}>Chưa có bình luận nào sếp ơi!</div>}
                </div>
            </div>
        </div>
    </div>
    );
}

// --- 💄 HỆ THỐNG STYLES (ĐÃ GỘP CŨ VÀ MỚI) ---
const containerStyle = { maxWidth: "1250px", margin: "0 auto", padding: "0 20px" };
const movieHeaderStyle = { display: "flex", gap: "35px", alignItems: "center", marginBottom: "40px" };
const posterContainerStyle = { flex: "0 0 180px" };
const posterImageStyle = { width: "100%", borderRadius: "16px", boxShadow: "0 15px 35px rgba(115, 102, 78, 0.22)", border: "2px solid rgba(255,255,255,0.7)" };
const infoContentStyle = { flex: "1" };
const titleStyle = { fontSize: "2.3rem", fontWeight: "900", marginBottom: "16px", color: "#3a2d1f", letterSpacing: "-0.5px" };
const tagContainerStyle = { display: "flex", gap: "10px", marginBottom: "15px", alignItems: 'center' };
const tagStyle = { padding: "6px 14px", background: "rgba(246, 241, 227, 0.7)", borderRadius: "30px", fontSize: "0.8rem", fontWeight: "800", color: "#70624d", border: "1px solid rgba(188, 172, 142, 0.3)" };
const statusTagStyle = { padding: "6px 14px", color: "#fff", borderRadius: "30px", fontWeight: "bold", fontSize: '0.8rem' };
const detailContainerStyle = { marginBottom: '20px', borderLeft: '3px solid rgba(188, 172, 142, 0.5)', paddingLeft: '18px' };
const detailItemStyle = { fontSize: '0.92rem', color: '#5c4f40', margin: '6px 0', lineHeight: "1.5" };
const descriptionStyle = { fontSize: "0.95rem", color: "#544637", lineHeight: "1.7", marginBottom: "20px" };
const smallTrailerContainer = { flex: "0 0 400px", background: "rgba(246, 241, 227, 0.5)", backdropFilter: "blur(10px)", padding: "12px", borderRadius: "18px", border: "1px solid rgba(188, 172, 142, 0.25)", boxShadow: "0 10px 25px rgba(115, 102, 78, 0.08)" };
const smallVideoWrapper = { position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" };
const iframeStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };
const dividerStyle = { border: "none", borderTop: "1px solid rgba(188, 172, 142, 0.25)", margin: "40px 0" };
const showtimeSectionStyle = { marginBottom: "60px" };
const sectionTitleStyle = { fontSize: "1.45rem", fontWeight: "900", display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", color: "#3a2d1f", letterSpacing: "0.5px" };
const accentBarStyle = { width: "6px", height: "24px", background: "linear-gradient(to bottom, #ff573d, #fb4226)", borderRadius: "2px" };
const dateScrollerStyle = { display: "flex", gap: "12px", overflowX: "auto", padding: "10px 0", marginBottom: "35px" };
const dateCardStyle = { minWidth: "85px", height: "75px", borderRadius: "14px", border: "1px solid", display: "flex", flexDirection: "column", cursor: "pointer", textAlign: "center", transition: "all 0.3s ease" };
const dateTopStyle = { fontSize: "0.85rem", padding: "6px 0", fontWeight: "600", display: "flex", justifyContent: "center" };
const dateBottomStyle = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold" };
const roomInfoWrapper = { marginBottom: "8px", display: "flex", flexDirection: "column", alignItems: "center" };
const roomNameText = { fontSize: "0.8rem", color: "#8b7e6d", fontWeight: "700" };
const roomTypeBadge = { fontSize: "0.7rem", background: "rgba(112, 98, 77, 0.15)", color: "#70624d", padding: "2px 8px", borderRadius: "4px", marginTop: "4px", fontWeight: "bold" };
const showtimeItemStyle = { background: "rgba(246, 241, 227, 0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(188, 172, 142, 0.3)", borderRadius: "16px", padding: "16px", textAlign: "center", boxShadow: "0 8px 20px rgba(115, 102, 78, 0.05)" };
const timeBtnStyle = { width: "100%", padding: "11px", background: "linear-gradient(135deg, #ff573d 0%, #fb4226 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 6px 15px rgba(251, 66, 38, 0.25)" };
const noShowtimeStyle = { gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "#8b7e6d", border: "1px dashed rgba(188, 172, 142, 0.4)", borderRadius: "18px", background: "rgba(246, 241, 227, 0.2)", fontWeight: "500" };
const showtimeGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" };

// --- STYLES REVIEW MỚI ---
const ratingHeaderFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const ratingSummaryCard = { display: 'flex', alignItems: 'center', gap: '18px', background: 'rgba(246, 241, 227, 0.65)', backdropFilter: "blur(10px)", padding: '16px 28px', borderRadius: '18px', border: '1px solid rgba(188, 172, 142, 0.3)', boxShadow: '0 8px 25px rgba(115, 102, 78, 0.06)' };
const bigRatingNumber = { fontSize: '2.5rem', fontWeight: '900', color: '#3a2d1f' };
const reviewSectionStyle = { marginTop: '60px', paddingBottom: '100px' };
const reviewBoxContainer = { background: 'rgba(246, 241, 227, 0.45)', backdropFilter: "blur(10px)", borderRadius: '24px', padding: '30px', boxShadow: '0 15px 35px rgba(115, 102, 78, 0.08)', marginBottom: '40px', border: '1px solid rgba(188, 172, 142, 0.2)' };
const lockMessageStyle = { textAlign: 'center', padding: '22px', color: '#7a6e5d', background: 'rgba(246, 241, 227, 0.3)', borderRadius: '14px', border: '1px dashed rgba(188, 172, 142, 0.5)', fontWeight: "500" };
const activeFormStyle = { display: 'flex', flexDirection: 'column' };
const textareaStyle = { width: '100%', height: '110px', padding: '15px', borderRadius: '14px', border: '1.5px solid rgba(188, 172, 142, 0.3)', background: 'rgba(255, 255, 255, 0.7)', outline: 'none', marginBottom: '15px', fontSize: '1rem', color: '#4a3e2e' };
const btnReviewStyle = { alignSelf: 'flex-start', padding: '13px 38px', background: 'linear-gradient(135deg, #ff573d 0%, #fb4226 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 18px rgba(251, 66, 38, 0.3)' };
const filterBarContainer = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' };
const filterBtnStyle = (active) => ({ padding: '9px 20px', borderRadius: '25px', border: active ? 'none' : '1px solid rgba(188, 172, 142, 0.4)', background: active ? 'linear-gradient(135deg, #ff573d 0%, #fb4226 100%)' : 'rgba(246, 241, 227, 0.6)', color: active ? '#fff' : '#70624d', cursor: 'pointer', fontWeight: 'bold', boxShadow: active ? '0 6px 15px rgba(251, 66, 38, 0.25)' : 'none', transition: 'all 0.3s ease' });
const reviewListStyle = { display: 'grid', gap: '20px' };
const premiumCardStyle = { background: 'rgba(246, 241, 227, 0.55)', backdropFilter: "blur(10px)", padding: '25px', borderRadius: '22px', border: '1px solid rgba(188, 172, 142, 0.25)', boxShadow: '0 8px 25px rgba(115, 102, 78, 0.04)' };
const cardHeader = { display: 'flex', gap: '15px', marginBottom: '15px' };
const avatarCircle = { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff573d 0%, #fb4226 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.3rem', boxShadow: '0 4px 10px rgba(251,66,38,0.25)' };
const cardContent = { color: '#544637', lineHeight: '1.7', marginBottom: '15px', fontSize: '1rem' };
const cardFooter = { display: 'flex', gap: '20px', paddingTop: '15px', borderTop: '1px solid rgba(188, 172, 142, 0.15)' };
const reactionStyle = (active) => ({ background: 'none', border: 'none', color: active ? '#fb4226' : '#8b7e6d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: active ? 'bold' : 'normal' });
const emptyReviewStyle = { textAlign: 'center', padding: '50px', color: '#8b7e6d', fontWeight: '500' };