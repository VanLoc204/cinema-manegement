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

    const userId = localStorage.getItem("userId");
    const API_URL = "http://localhost:5000";

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
        } catch (err) { console.error("Lỗi sếp ơi:", err); }
    };

    useEffect(() => {
        fetchData();
    }, [id, userId]);

    // 🚀 2. HÀM XỬ LÝ REVIEW & REACTION
    const handleSendReview = async () => {
        if (!comment.trim()) return alert("Sếp nhập vài chữ cảm nhận phim nhé!");
        try {
            await axios.post("/reviews/add", { movieId: id, userId, rating: userRating, content: comment });
            setComment("");
            fetchData();
            alert("✅ Cảm ơn sếp đã đánh giá!");
        } catch (err) { alert(err.response?.data); }
    };

    const handleReaction = async (reviewId, type) => {
        if (!userId) return alert("Đăng nhập để tương tác sếp ơi!");
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

    return (
        <div style={containerStyle}>
            {/* 🎥 1. HEADER (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={movieHeaderStyle}>
                <div style={posterContainerStyle}>
                    <img src={movie?.image ? `${API_URL}${movie.image}` : null} alt={movie?.title} style={posterImageStyle} />
                </div>
                <div style={infoContentStyle}>
                    <h1 style={titleStyle}>{movie?.title || "Đang tải..."}</h1>
                    <div style={tagContainerStyle}>
                        <span style={{ ...statusTagStyle, background: getRatedColor(movie?.rated) }}>{movie?.rated || "P"}</span>
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
                    </div>
                    <p style={descriptionStyle}>{movie?.description}</p>
                </div>
                {movie?.trailer && getEmbedUrl(movie.trailer) && (
                    <div style={smallTrailerContainer}>
                        <div style={smallVideoWrapper}>
                            <iframe style={iframeStyle} src={getEmbedUrl(movie.trailer)} frameBorder="0" allowFullScreen></iframe>
                        </div>
                    </div>
                )}
            </div>

            <hr style={dividerStyle} />

            {/* 📅 2. BỘ LỌC NGÀY (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={dateScrollerStyle}>
                {dateList.map((date, index) => {
                    const fullDate = date.toISOString().split('T')[0];
                    const isActive = selectedDate === fullDate;
                    return (
                        <div key={index} style={{ ...dateCardStyle, borderColor: isActive ? "#fb4226" : "#eee", background: isActive ? "#fb4226" : "#f5f5f5" }} onClick={() => setSelectedDate(fullDate)}>
                            <div style={{ ...dateTopStyle, color: isActive ? "#fff" : "#666" }}>{date.getDate()}/{date.getMonth() + 1}</div>
                            <div style={{ ...dateBottomStyle, color: isActive ? "#fff" : "#333" }}>{formatDayName(date)}</div>
                        </div>
                    );
                })}
            </div>

            {/* 🎟️ 3. LỊCH CHIẾU (GIỮ NGUYÊN CỦA SẾP) */}
            <div style={showtimeSectionStyle}>
                <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> LỊCH CHIẾU</h3>
                <div style={showtimeGridStyle}>
                    {filteredShowtimes.length > 0 ? (
                        filteredShowtimes.map(s => (
                            <div key={s._id} style={showtimeItemStyle}>
                                <div style={roomInfoWrapper}>
                                    <span style={roomNameText}>{s.roomId?.name}</span>
                                    <span style={roomTypeBadge}>{s.roomId?.type || "2D"}</span>
                                </div>
                                <button onClick={() => handleBookingClick(s._id)} style={timeBtnStyle}>
                                    {new Date(s.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </button>
                            </div>
                        ))
                    ) : <div style={noShowtimeStyle}>Hôm nay chưa có suất chiếu sếp ơi!</div>}
                </div>
            </div>

            {/* 💬 4. PHẦN BÌNH LUẬN & ĐÁNH GIÁ (SỬA ĐẸP LÊN THEO Ý SẾP) */}
            <div style={reviewSectionStyle}>
                {/* 📊 KHỐI HIỂN THỊ TỔNG ĐIỂM RATING */}
                <div style={ratingHeaderFlex}>
                    <h3 style={sectionTitleStyle}><span style={accentBarStyle}></span> ĐÁNH GIÁ KHÁN GIẢ</h3>
                    <div style={ratingSummaryCard}>
                        <span style={bigRatingNumber}>{averageRating}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ color: '#f1c40f', fontSize: '1.2rem' }}>★★★★★</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{reviews.length} khán giả đánh giá</div>
                        </div>
                    </div>
                </div>

                {/* 📝 FORM VIẾT ĐÁNH GIÁ (CHỈ HIỆN KHI ĐỦ ĐIỀU KIỆN) */}
                <div style={reviewBoxContainer}>
                    {!userId ? (
                        <div style={lockMessageStyle}>Sếp hãy đăng nhập để chia sẻ cảm nghĩ nhé!</div>
                    ) : hasReviewed ? (
                        <div style={{ ...lockMessageStyle, color: '#2ecc71', fontWeight: 'bold' }}>✅ Phim này sếp đã đánh giá rồi! Cảm ơn sếp nhiều.</div>
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
                <div style={filterBarContainer}>
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
                                    👍 {r.likes?.length || 0} Hữu ích
                                </button>
                                <button onClick={() => handleReaction(r._id, 'dislike')} style={reactionStyle(r.dislikes?.includes(userId))}>
                                    👎 {r.dislikes?.length || 0}
                                </button>
                            </div>
                        </div>
                    )) : <div style={emptyReviewStyle}>Chưa có bình luận nào sếp ơi!</div>}
                </div>
            </div>
        </div>
    );
}

// --- 💄 HỆ THỐNG STYLES (ĐÃ GỘP CŨ VÀ MỚI) ---
const containerStyle = { maxWidth: "1250px", margin: "40px auto", padding: "0 20px" };
const movieHeaderStyle = { display: "flex", gap: "30px", alignItems: "center", marginBottom: "35px" };
const posterContainerStyle = { flex: "0 0 180px" };
const posterImageStyle = { width: "100%", borderRadius: "10px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", border: "1px solid #ddd" };
const infoContentStyle = { flex: "1" };
const titleStyle = { fontSize: "2rem", fontWeight: "900", marginBottom: "12px", color: "#222" };
const tagContainerStyle = { display: "flex", gap: "10px", marginBottom: "15px", alignItems: 'center' };
const tagStyle = { padding: "4px 10px", background: "#f5f5f5", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold", color: "#666" };
const statusTagStyle = { padding: "4px 10px", color: "#fff", borderRadius: "4px", fontWeight: "bold", fontSize: '0.8rem' };
const detailContainerStyle = { marginBottom: '15px', borderLeft: '3px solid #eee', paddingLeft: '15px' };
const detailItemStyle = { fontSize: '0.9rem', color: '#555', margin: '4px 0' };
const descriptionStyle = { fontSize: "0.9rem", color: "#444", lineHeight: "1.6", marginBottom: "15px" };
const smallTrailerContainer = { flex: "0 0 380px", background: "#fff", padding: "10px", borderRadius: "12px", border: "1px solid #f0f0f0" };
const smallVideoWrapper = { position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" };
const iframeStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };
const dividerStyle = { border: "none", borderTop: "1px solid #ddd", margin: "35px 0" };
const showtimeSectionStyle = { marginBottom: "60px" };
const sectionTitleStyle = { fontSize: "1.4rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" };
const accentBarStyle = { width: "6px", height: "24px", background: "#fb4226", borderRadius: "2px" };
const dateScrollerStyle = { display: "flex", gap: "10px", overflowX: "auto", padding: "10px 0", marginBottom: "30px" };
const dateCardStyle = { minWidth: "85px", height: "75px", borderRadius: "10px", border: "2px solid", display: "flex", flexDirection: "column", cursor: "pointer", textAlign: "center" };
const dateTopStyle = { fontSize: "0.85rem", padding: "6px 0", fontWeight: "600", display: "flex", justifyContent: "center" };
const dateBottomStyle = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold" };
const roomInfoWrapper = { marginBottom: "8px", display: "flex", flexDirection: "column", alignItems: "center" };
const roomNameText = { fontSize: "0.8rem", color: "#888", fontWeight: "600" };
const roomTypeBadge = { fontSize: "0.7rem", background: "#333", color: "#fff", padding: "2px 8px", borderRadius: "4px", marginTop: "4px" };
const showtimeItemStyle = { background: "#fff", border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center" };
const timeBtnStyle = { width: "100%", padding: "10px", background: "#fb4226", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const noShowtimeStyle = { gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "#999", border: "1px dashed #ccc", borderRadius: "15px" };
const showtimeGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" };

// --- STYLES REVIEW MỚI ---
const ratingHeaderFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const ratingSummaryCard = { display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', padding: '15px 25px', borderRadius: '15px', border: '1px solid #f0f0f0', boxShadow: '0 5px 15px rgba(0,0,0,0.03)' };
const bigRatingNumber = { fontSize: '2.5rem', fontWeight: '900', color: '#333' };
const reviewSectionStyle = { marginTop: '60px', paddingBottom: '100px' };
const reviewBoxContainer = { background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #f9f9f9' };
const lockMessageStyle = { textAlign: 'center', padding: '20px', color: '#888', background: '#fcfcfc', borderRadius: '12px', border: '1px dashed #ddd' };
const activeFormStyle = { display: 'flex', flexDirection: 'column' };
const textareaStyle = { width: '100%', height: '100px', padding: '15px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', marginBottom: '15px', fontSize: '1rem' };
const btnReviewStyle = { alignSelf: 'flex-start', padding: '12px 35px', background: '#fb4226', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const filterBarContainer = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' };
const filterBtnStyle = (active) => ({ padding: '8px 18px', borderRadius: '20px', border: active ? 'none' : '1px solid #ddd', background: active ? '#333' : '#fff', color: active ? '#fff' : '#666', cursor: 'pointer', fontWeight: 'bold' });
const reviewListStyle = { display: 'grid', gap: '20px' };
const premiumCardStyle = { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' };
const cardHeader = { display: 'flex', gap: '15px', marginBottom: '15px' };
const avatarCircle = { width: '48px', height: '48px', borderRadius: '50%', background: '#fb4226', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.3rem' };
const cardContent = { color: '#444', lineHeight: '1.7', marginBottom: '15px', fontSize: '1rem' };
const cardFooter = { display: 'flex', gap: '20px', paddingTop: '15px', borderTop: '1px solid #f9f9f9' };
const reactionStyle = (active) => ({ background: 'none', border: 'none', color: active ? '#fb4226' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: active ? 'bold' : 'normal' });
const emptyReviewStyle = { textAlign: 'center', padding: '50px', color: '#bbb' };