import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// 🚀 Import CSS của Swiper để hiện nút bấm và dấu chấm
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Banner() {
    // 🖼️ Danh sách các Banner sếp muốn hiện (Sếp có thể thay link ảnh tùy ý)
    const bannerImages = [
        "https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg", // Godzilla x Kong
        "https://baokhanhhoa.vn/file/e7837c02857c8ca30185a8c39b582c03/042025/b_20250401144223.webp", // Dune 2
        "https://image.dienthoaivui.com.vn/x,webp,q90/https://dashboard.dienthoaivui.com.vn/uploads/dashboard/editor_upload/poster-phim-hoat-hinh-20.jpg", // Kung Fu Panda 4
        "https://aeonmall-review-rikkei.cdn.vccloud.vn/public/wp/21/news/eYMabpzR2xAghCdee11Fb1PRg2wSbzaG1tNZ0xfa.jpg"
    ];

    return (
        /* 📦 BƯỚC 1: TẠO CÁI LỒNG Ở GIỮA */
        <div style={{
            maxWidth: "1200px",
            margin: "20px auto",
            padding: "0 20px",
            overflow: "hidden"
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .banner-swiper { height: 220px !important; border-radius: 10px !important; }
                }
                @media (max-width: 480px) {
                    .banner-swiper { height: 180px !important; }
                }
            `}</style>

            {/* 🎞️ BƯỚC 2: CÁI SWIPER BÂY GIỜ SẼ NẰM GỌN TRONG LỒNG NÀY */}
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={true}
                pagination={{ clickable: true }}
                autoplay={{ delay: 3500 }}
                className="banner-swiper"
                style={{
                    height: "450px",
                    borderRadius: "15px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                }}
            >
                {bannerImages.map((url, index) => (
                    <SwiperSlide key={index}>
                        <div style={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url(${url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

// --- 💄 Styles cho đẹp ---
const overlayStyle = {
    width: "100%", height: "100%",
    background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
    display: "flex", alignItems: "flex-end", padding: "0 0 50px 60px"
};

const textStyle = {
    color: "#fff", fontSize: "2.5rem", fontWeight: "900",
    textShadow: "2px 2px 10px rgba(0,0,0,0.5)", margin: 0,
    letterSpacing: "2px"
};
