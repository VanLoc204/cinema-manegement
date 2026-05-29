import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import io from "socket.io-client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Movies from "./pages/Movies";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MovieDetail from "./pages/MovieDetail";
import Admin from "./pages/Admin/Admin";
import Profile from "./pages/Profile";

// 🚩 Sếp thêm dòng này vào trên cùng file App.jsx nhé
import Staff from "./pages/Staff/Staff";

// --- 🛠️ COMPONENT SỬA LỖI CUỘN TRANG ---
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [pathname]);

    return null;
}

const socket = io("http://localhost:5000", { autoConnect: true });

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
};

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />

            <div style={{ background: "#fdfcf0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar />

                {/* Vùng nội dung chính với flex: 1 để đẩy Footer xuống đáy */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "80vh" }}>
                    <Routes>
                        {/* --- ROUTES CHO KHÁCH HÀNG --- */}
                        <Route path="/" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/watched-movies" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/membership" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/vouchers" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/booking/:id" element={<ProtectedRoute><Booking socket={socket} /></ProtectedRoute>} />

                        {/* --- 🚀 ROUTES CHO NHÂN VIÊN (STAFF POS) --- */}
                        <Route
                            path="/staff/*"
                            element={localStorage.getItem("role") === "staff" ? <Staff socket={socket} /> : <Navigate to="/login" />}
                        />
                        {/* --- ROUTE CHO ADMIN --- */}
                        <Route path="/admin/*" element={localStorage.getItem("role") === "admin" ? <Admin /> : <Navigate to="/login" />} />
                    </Routes>
                </div>

                <Footer />
            </div>
        </BrowserRouter>
    );
}