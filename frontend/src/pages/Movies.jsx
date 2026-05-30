import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./movies.css";
import Banner from "../components/Banner";

export default function Movies() {
    const [movies, setMovies] = useState([]); // Danh sách phim hoạt động (Không phải ended)
    const [displayMovies, setDisplayMovies] = useState([]); 
    const [activeFilter, setActiveFilter] = useState("all");
    
    const navigate = useNavigate();
    const API_URL = import.meta.env.DEV ? "http://localhost:5000" : window.location.origin;

    useEffect(() => {
        axios.get("/movies").then(res => {
            // 🚩 CHẶN PHIM ẨN: Loại bỏ toàn bộ phim có status là "ended"
            const activeMovies = res.data.filter(m => m.status !== "ended");
            
            setMovies(activeMovies);
            setDisplayMovies(activeMovies); // Mặc định hiện tất cả phim hoạt động
        });
    }, []);

    // Logic lọc theo đúng giá trị status sếp yêu cầu
    const handleFilter = (filterType) => {
        setActiveFilter(filterType);
        
        if (filterType === "all") {
            setDisplayMovies(movies);
        } else if (filterType === "nowPlaying") {
            // 🎬 Lọc theo giá trị: "now_showing"
            const filtered = movies.filter(m => m.status === "now_showing");
            setDisplayMovies(filtered);
        } else if (filterType === "upcoming") {
            // ⏳ Lọc theo giá trị: "coming_soon"
            const filtered = movies.filter(m => m.status === "coming_soon");
            setDisplayMovies(filtered);
        }
    };

    return (
        <div style={{ background: "#fdfcf0", minHeight: "100vh", paddingBottom: "50px" }}>
            <Banner />

            <div className="container">
                {/* BỘ LỌC NÚT BẤM */}
                <div className="filter-wrapper" style={{ textAlign: "center", margin: "40px 0" }}>
                    <div className="filter-tabs">
                        <button 
                            className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                            onClick={() => handleFilter("all")}
                        >
                            TẤT CẢ PHIM
                        </button>
                        <button 
                            className={`filter-btn ${activeFilter === "nowPlaying" ? "active" : ""}`}
                            onClick={() => handleFilter("nowPlaying")}
                        >
                            PHIM ĐANG CHIẾU
                        </button>
                        <button 
                            className={`filter-btn ${activeFilter === "upcoming" ? "active" : ""}`}
                            onClick={() => handleFilter("upcoming")}
                        >
                            PHIM SẮP CHIẾU
                        </button>
                    </div>
                    {/* Đường line trang trí */}
                    <div style={{ width: "80px", height: "4px", background: "#fb4226", margin: "20px auto" }}></div>
                </div>


                {/* HIỂN THỊ GRID PHIM */}
                <div className="movie-grid">
                    {displayMovies.length > 0 ? (
                        displayMovies.map(m => (
                            <div
                                className="movie-card"
                                key={m._id}
                                onClick={() => navigate(`/movie/${m._id}`)}
                            >
                                <div className="img-container">
                                    <img
                                        src={`${API_URL}${m.image}`}
                                        alt={m.title}
                                        onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/300x450?text=No+Poster";
                                        }}
                                    />
                                    
                                    <div className="movie-info-overlay">
                                        <h3 className="movie-title">{m.title}</h3>
                                        <div className="movie-hover-content">
                                            {/* Tag hiển thị trạng thái phim */}
                                            <p className="movie-status-tag" style={{ color: m.status === "now_showing" ? "#4caf50" : "#ff9800", fontWeight: "bold" }}>
                                                {m.status === "now_showing" ? "● Đang chiếu" : "○ Sắp chiếu"}
                                            </p>
                                            <p className="movie-description">
                                                {m.description || "Chưa có mô tả..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: "center", width: "100%", gridColumn: "1/-1", padding: "80px 0" }}>
                           <p style={{ fontSize: "1.2rem", color: "#888" }}>Hạng mục này hiện chưa có phim nào sếp ơi! 🎬</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}