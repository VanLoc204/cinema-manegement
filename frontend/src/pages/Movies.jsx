// src/pages/Movies.jsx
import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./movies.css";
import Banner from "../components/Banner";

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/movies").then(res => {
            setMovies(res.data);
        });
    }, []);

    return (
        <div style={{ background: "#fdfcf0", minHeight: "100vh" }}>

            {/* 🎞️ 1. Banner Slider sếp đã làm */}
            <Banner />

            {/* 📦 2. Toàn bộ danh sách phim bọc trong Container để căn giữa */}
            <div className="container">
                
                <div className="title-wrapper" style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 className="title">DANH SÁCH PHIM ĐANG CHIẾU</h2>
                    <div style={{ width: "80px", height: "4px", background: "#fb4226", margin: "10px auto" }}></div>
                </div>

                <div className="movie-grid">
                    {movies.map(m => (
                        /* 👆 CLICK VÀO ĐÂU TRÊN THẺ CŨNG VÀO XEM CHI TIẾT ĐƯỢC */
                        <div 
                            className="movie-card" 
                            key={m._id} 
                            onClick={() => navigate(`/movie/${m._id}`)}
                            title={`Nhấn để xem chi tiết phim ${m.title}`}
                        >
                            {/* 🖼️ Ảnh Poster phim */}
                            <div className="img-container" style={{ overflow: "hidden" }}>
                                <img
                                    src={m.image}
                                    alt={m.title}
                                    style={{ transition: "0.5s" }}
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com";
                                    }}
                                />
                            </div>

                            {/* 📝 Thông tin Phim */}
                            <div style={{ padding: "15px" }}>
                                <h3>{m.title}</h3>
                                <p>{m.description || "Chưa có mô tả cho bộ phim này..."}</p>
                                
                                <div style={{ 
                                    marginTop: "15px", 
                                    color: "#fb4226", 
                                    fontWeight: "bold", 
                                    fontSize: "0.9rem" 
                                }}>
                                    XEM CHI TIẾT ➔
                                </div>
                            </div>

                            {/* ❌ ĐÃ XÓA NÚT "XEM CHI TIẾT" THEO Ý SẾP */}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
