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
            console.log(res.data);
            setMovies(res.data);
        });
    }, []);

    return (
        <div>

            {/* 🎬 Banner */}
            <Banner />

            <div className="container">
                <h2 className="title">🎬 Danh sách phim</h2>

                <div className="movie-grid">
                    {movies.map(m => (
                        <div className="movie-card" key={m._id}>

                            <img
                                src={m.image}
                                alt={m.title}
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/200x300";
                                }}
                            />

                            <h3>{m.title}</h3>
                            <p>{m.description}</p>

                            <button onClick={() => navigate(`/movie/${m._id}`)}>
                                Xem chi tiết
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}