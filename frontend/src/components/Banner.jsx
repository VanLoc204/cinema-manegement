import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

// 🚀 Import CSS của Swiper cho hiệu ứng 3D Coverflow
import 'swiper/css';
import 'swiper/css/effect-coverflow';

export default function Banner({ movies = [] }) {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const [swiperRef, setSwiperRef] = useState(null);
    const API_URL = import.meta.env.DEV ? "http://localhost:5000" : window.location.origin;

    // Lọc các phim đang chiếu (now_showing) và phim sắp chiếu (coming_soon) để đưa lên banner (Tối đa 12 phim Hot)
    const activeBannerMovies = movies.filter(m => m.status === "now_showing" || m.status === "coming_soon").slice(0, 12);
    const baseMovies = activeBannerMovies.length > 0 ? activeBannerMovies : movies.slice(0, 12);

    // 🔄 Nhân bản danh sách phim để tạo thành vòng tròn vô tận thực sự (ENDLESS END-TO-END LOOP)
    // Giúp Swiper có đủ slide nhân bản, lướt 1 vòng tròn mượt mà sẽ quay lại đúng số 1
    let moviesToRender = [...baseMovies];
    if (baseMovies.length > 0 && baseMovies.length < 24) {
        moviesToRender = [...baseMovies, ...baseMovies, ...baseMovies];
    }

    // 🎯 Lắp đặt hệ thống lắng nghe khởi tạo - Chỉ chạy DUY NHẤT 1 lần khi load trang
    // Bằng cách liên kết dependency ổn định với movies.length thay vì array reference
    useEffect(() => {
        if (swiperRef && movies.length > 0) {
            const timer = setTimeout(() => {
                // Snaps Swiper về loop của phim số 1
                swiperRef.slideToLoop(0, 0);
                // Cập nhật lại toàn bộ kích thước, tọa độ và hiệu ứng 3D Coverflow
                swiperRef.update();
                setActiveIndex(0);
            }, 180); // Độ trễ 180ms cực kỳ an toàn để DOM hoàn thành quá trình kết xuất 3D
            return () => clearTimeout(timer);
        }
    }, [swiperRef, movies.length]);

    // Xử lý định dạng thời lượng phim (Ví dụ: 107 phút -> 1giờ 47phút)
    const formatDuration = (minutes) => {
        if (!minutes) return "";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}giờ ${mins}phút` : `${mins}phút`;
    };

    // Xử lý định dạng ngày khởi chiếu (Ví dụ: 22 thg 5 2026)
    const formatReleaseDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return `${date.getDate()} thg ${date.getMonth() + 1} ${date.getFullYear()}`;
    };

    const activeMovie = moviesToRender[activeIndex];

    // Khung chờ Skeleton khi dữ liệu đang tải
    if (movies.length === 0) {
        return (
            <div style={{ width: "100%", height: "550px", background: "#09090b" }}>
                <div style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, #1f1f23 25%, #2a2a30 50%, #1f1f23 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                }}>
                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="cinema-coverflow-container">
            <style>{`
                .cinema-coverflow-container {
                    width: 100%;
                    max-width: 100%;
                    padding: 40px 0 35px 0;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    background: #070708;
                    border-radius: 0;
                    margin: 0 0 30px 0;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                
                /* Lớp nền mờ rực rỡ đồng bộ theo poster đang chọn */
                .coverflow-backdrop-blur {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(55px) brightness(0.48) saturate(1.6);
                    opacity: 0.75;
                    transform: scale(1.12);
                    transition: background-image 0.7s cubic-bezier(0.25, 0.8, 0.25, 1);
                    z-index: 1;
                }

                .coverflow-content-wrapper {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    box-sizing: border-box;
                }

                /* Tùy biến Swiper Coverflow đối xứng tuyệt đối */
                .coverflow-swiper {
                    width: 100%;
                    max-width: 1060px; /* Khống chế khung Swiper trên PC để ẩn đi phim số 6 dư thừa, giữ đúng 2 trái - 2 phải */
                    margin: 0 auto;
                    padding-top: 15px;
                    padding-bottom: 45px;
                    overflow: hidden !important; 
                }
                
                .coverflow-swiper .swiper-slide {
                    height: 350px;
                    position: relative;
                    overflow: visible !important;
                    display: flex;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                /* Khung poster 3D bo góc nghệ thuật */
                .poster-card-3d {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.7);
                    border: 2px solid rgba(255,255,255,0.15);
                    background: #141416;
                    box-sizing: border-box;
                }
                
                .poster-card-3d img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Số xếp hạng lớn tràn viền chuẩn CGV */
                .banner-rank-number {
                    position: absolute;
                    bottom: -28px;
                    left: -10px;
                    font-size: 6.8rem;
                    font-weight: 900;
                    line-height: 0.8;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    color: transparent;
                    -webkit-text-stroke: 1.8px rgba(255,255,255,0.95);
                    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.85));
                    z-index: 5;
                    user-select: none;
                    pointer-events: none;
                }

                /* Bảng thông tin phim phía dưới banner */
                .active-movie-info-panel {
                    width: 100%;
                    max-width: 600px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                    color: #fff;
                    box-sizing: border-box;
                    padding: 0 10px;
                }

                .info-left {
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    overflow: hidden;
                    margin-right: 15px;
                }

                /* HÀNG TIÊU ĐỀ: BẮT BUỘC ĐỨNG CÙNG 1 HÀNG KHÔNG XÊ DỊCH */
                .title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: nowrap;
                }

                .active-title {
                    font-size: 1.45rem;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: 0.2px;
                    text-shadow: 2px 2px 8px rgba(0,0,0,0.9);
                    color: #ffffff !important;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 420px;
                }

                .active-rated-badge {
                    border: 1px solid #fb4226;
                    color: #fb4226 !important;
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 4px;
                    background: rgba(251, 66, 38, 0.15);
                    letter-spacing: 0.5px;
                    flex-shrink: 0;
                }

                .active-meta-text {
                    font-size: 0.88rem;
                    color: #eeeeee !important;
                    margin: 0;
                    text-shadow: 1px 1px 6px rgba(0,0,0,0.8);
                }

                .active-book-btn {
                    background: #fb4226;
                    color: #fff;
                    border: none;
                    padding: 10px 28px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 15px rgba(251,66,38,0.4);
                    flex-shrink: 0;
                    letter-spacing: 0.5px;
                }

                .active-book-btn:hover {
                    background: #ff573d;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(251,66,38,0.6);
                }

                @media (max-width: 992px) {
                    .coverflow-swiper {
                        max-width: 100%; /* Trả lại full width trên các màn hình nhỏ */
                    }
                    .coverflow-swiper .swiper-slide {
                        height: 270px;
                    }
                    .banner-rank-number {
                        font-size: 6.2rem;
                        bottom: -30px;
                        left: -12px;
                    }
                    .active-title {
                        max-width: 300px;
                    }
                }

                @media (max-width: 768px) {
                    .coverflow-swiper {
                        overflow: visible !important; /* Mở lại overflow trên mobile để hiệu ứng tràn lề trông đẹp mắt */
                    }
                    .coverflow-swiper .swiper-slide {
                        height: 290px;
                    }
                    .banner-rank-number {
                        font-size: 5.5rem;
                        bottom: -22px;
                        left: -8px;
                    }
                    .active-movie-info-panel {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                        margin-top: 15px;
                    }
                    .active-book-btn {
                        width: 100%;
                        padding: 12px;
                        text-align: center;
                    }
                    .active-title {
                        max-width: 250px;
                    }
                }
            `}</style>

            {/* Background mờ ảo đồng bộ rực rỡ sắc màu */}
            <div
                className="coverflow-backdrop-blur"
                style={{
                    backgroundImage: activeMovie ? `url(${API_URL}${activeMovie.image})` : 'none'
                }}
            ></div>

            <div className="coverflow-content-wrapper">
                {/* Swiper cấu hình số slide JS chuẩn hóa đối xứng hoàn mỹ 100% */}
                <Swiper
                    key={moviesToRender.length} /* Force fresh Swiper remount when movies list loads */
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    loopAdditionalSlides={3}
                    breakpoints={{
                        0: {
                            slidesPerView: 1.8, /* Mobile: Hiện 1 phim giữa và 1/2 phim mỗi bên */
                        },
                        768: {
                            slidesPerView: 3, /* Tablet: Hiện 3 phim */
                        },
                        992: {
                            slidesPerView: 5, /* PC: Hiện đúng 5 phim đối xứng (2 trái - 1 giữa - 2 phải) */
                        }
                    }}
                    coverflowEffect={{
                        rotate: 20,
                        stretch: 0,
                        depth: 140,
                        modifier: 1.2,
                        slideShadows: true,
                    }}
                    autoplay={{
                        delay: 4500,
                        disableOnInteraction: false,
                    }}
                    modules={[EffectCoverflow, Autoplay]}
                    className="coverflow-swiper"
                    onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                    onSwiper={setSwiperRef} /* Save Swiper instance dynamically to React state */
                >
                    {moviesToRender.map((m, index) => (
                        <SwiperSlide key={`${m._id}-${index}`} onClick={() => navigate(`/movie/${m._id}`)}>
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                {/* Tấm Poster 3D */}
                                <div className="poster-card-3d">
                                    <img
                                        src={`${API_URL}${m.image}`}
                                        alt={m.title}
                                        onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/300x450?text=No+Poster";
                                        }}
                                    />
                                </div>
                                {/* Số xếp hạng lớn tràn viền chuẩn CGV */}
                                <span className="banner-rank-number">{(index % baseMovies.length) + 1}</span>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Bảng chi tiết phim phía dưới cho phim Active */}
                <div className="active-movie-info-panel">
                    <div className="info-left">
                        <div className="title-row">
                            <h2 className="active-title">{activeMovie?.title}</h2>
                            {activeMovie?.rated && <span className="active-rated-badge">{activeMovie.rated}</span>}
                        </div>
                        <p className="active-meta-text">
                            {activeMovie ? formatDuration(activeMovie.duration) : ""} &bull; {activeMovie ? formatReleaseDate(activeMovie.releaseDate) : ""}
                        </p>
                    </div>
                    <button className="active-book-btn" onClick={() => navigate(`/movie/${activeMovie?._id}`)}>
                        ĐẶT VÉ
                    </button>
                </div>
            </div>
        </div>
    );
}
