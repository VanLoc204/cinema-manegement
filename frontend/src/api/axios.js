import axios from "axios";

// 🌐 Cấu hình địa chỉ Backend
const API_URL = "/api";

const instance = axios.create({
    baseURL: API_URL,
    headers: {
        "ngrok-skip-browser-warning": "true"
    }
});

// 🚀 1. TỰ ĐỘNG GẮN TOKEN VÀO REQUEST
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; 
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🚔 2. TỰ ĐỘNG XỬ LÝ KHI TOKEN HẾT HẠN (401)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token hết hạn. Đang đăng xuất...");
            localStorage.clear(); // Dọn sạch localStorage cho gọn
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// --- 🎬 CÁC HÀM API CHO PHIM ---
export const getMovies = () => instance.get("/movies");
export const getNowPlaying = () => instance.get("/movies/now-playing");
export const getUpcoming = () => instance.get("/movies/upcoming");
export const getMovieDetail = (id) => instance.get(`/movies/${id}`);

// --- 📅 CÁC HÀM API CHO SUẤT CHIẾU (Dùng cho Booking) ---
export const getShowtimeDetail = (id) => instance.get(`/showtimes/detail/${id}`);
export const getBookedSeats = (showtimeId) => instance.get(`/bookings/${showtimeId}`);

// --- 🍿 CÁC HÀM API CHO BẮP NƯỚC ---
export const getSnacks = () => instance.get("/snacks");

// --- 💳 CÁC HÀM API CHO ĐẶT VÉ ---
export const confirmBooking = (payload) => instance.post("/bookings/confirm", payload);

export default instance;