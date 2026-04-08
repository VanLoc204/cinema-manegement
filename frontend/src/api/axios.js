// src/api/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🚀 TỰ ĐỘNG GẮN TOKEN VÀO MỖI LẦN GỌI API
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- PHẦN THÊM MỚI ---

// 🎬 Lấy tất cả phim (danh sách chung)
export const getMovies = () => instance.get("/movies");

// 🔥 Lấy phim đang chiếu
export const getNowPlaying = () => instance.get("/movies/now-playing");

// ⏳ Lấy phim sắp chiếu
export const getUpcoming = () => instance.get("/movies/upcoming");

export default instance;