import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; // ✅ Đã thêm useLocation
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
import TicketHistory from "./pages/TicketHistory";
import Profile from "./pages/Profile";

// --- 🛠️ COMPONENT SỬA LỖI CUỘN TRANG ---
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Ép trình duyệt nhảy lên đầu trang ngay lập tức khi pathname thay đổi
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
            {/* ✅ Đặt ScrollToTop ở đây để nó quản lý toàn bộ các Routes bên dưới */}
            <ScrollToTop /> 

            <div style={{ background: "#fdfcf0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar />
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<Movies />} />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        
                        {/* 🎯 Cả 2 đường dẫn đều dùng TicketHistory nhưng xử lý nội dung khác nhau */}
                        <Route path="/history" element={<ProtectedRoute><TicketHistory /></ProtectedRoute>} />
                        <Route path="/watched-movies" element={<ProtectedRoute><TicketHistory /></ProtectedRoute>} />
                        
                        <Route path="/booking/:id" element={<ProtectedRoute><Booking socket={socket} /></ProtectedRoute>} />
                        <Route path="/admin/*" element={localStorage.getItem("role") === "admin" ? <Admin /> : <Navigate to="/login" />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </BrowserRouter>
    );
}