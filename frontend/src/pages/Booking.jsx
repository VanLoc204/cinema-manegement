import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import axios from "../api/axios";

export default function Booking() {
    const { id } = useParams();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/showtimes/detail/${id}`)
            .then((res) => {
                setShowtime(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi lấy chi tiết suất chiếu:", err);
                setLoading(false);
            });
    }, [id]);

    const handlePayment = async () => {
        try {
            const res = await axios.post("/payment/create", {
                amount: seats.length * 50000,
                showtimeId: id,
                seats: seats
            });
            if (res.data.url) window.location.href = res.data.url;
        } catch (err) {
            alert("Lỗi khi tạo giao dịch thanh toán!");
        }
    };

    if (loading) return <div style={{ color: "#333", padding: 20 }}>Đang tải...</div>;

    const movieTime = new Date(showtime.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{ padding: "40px 20px", background: "#fdfcf0", minHeight: "100vh", position: "relative" }}>
            
            {/* 🎥 Tiêu đề Phim luôn ở giữa */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ color: "#222", margin: 0, fontSize: "2.5rem", textTransform: "uppercase", fontWeight: "800" }}>
                    {showtime.movieId?.title}
                </h1>
                <p style={{ color: "#fb4226", fontSize: "1.3rem", fontWeight: "bold" }}>
                    {movieTime} | {showtime.roomId?.name}
                </p>
            </div>

            {/* 🚩 Khu vực chứa Seat Map căn giữa tuyệt đối */}
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                width: "100%"
            }}>
                {/* ⬅️ KHUNG SEAT MAP (Giữ nguyên vị trí chính giữa) */}
                <div style={{ 
                    width: "850px", 
                    background: "#fff", 
                    padding: "30px", 
                    borderRadius: "15px", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                }}>
                    <SeatMap onSelect={setSeats} showtimeId={id} />
                </div>
            </div>

            {/* ➡️ KHUNG THANH TOÁN (Làm nhỏ lại và đẩy sát lề phải, không đè lên ghế) */}
            <div style={{ 
                width: "260px", // ✅ Đã thu nhỏ lại từ 320px xuống 260px
                background: "#ffffff", 
                padding: "20px", 
                borderRadius: "12px", 
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)", 
                borderTop: "5px solid #fb4226",
                position: "absolute", // ✅ Dùng absolute để tách biệt khỏi luồng căn giữa của Seat Map
                right: "30px", // Cách lề phải 30px
                top: "180px", // Độ cao khớp với vị trí Seat Map
            }}>
                <h3 style={{ marginTop: 0, color: "#222", borderBottom: "1px solid #eee", paddingBottom: "10px", fontSize: "1rem" }}>
                    TÓM TẮT ĐƠN HÀNG
                </h3>
                
                <div style={{ margin: "15px 0" }}>
                    <p style={{ color: "#666", fontSize: "0.8rem", marginBottom: "8px" }}>Ghế bạn chọn:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", minHeight: "25px" }}>
                        {seats.length > 0 ? seats.map(s => (
                            <span key={s} style={{ background: "#fb4226", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "0.75rem" }}>
                                {s}
                            </span>
                        )) : <span style={{ color: "#999", fontStyle: "italic", fontSize: "0.8rem" }}>Chưa chọn ghế</span>}
                    </div>
                </div>

                <div style={{ margin: "15px 0", borderTop: "1px dashed #ddd", paddingTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "0.85rem" }}>
                        <span>Số lượng:</span>
                        <b>{seats.length}</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#777" }}>Tổng tiền:</span>
                        <span style={{ color: "#fb4226", fontSize: "1.2rem", fontWeight: "900" }}>
                            {(seats.length * 50000).toLocaleString()} <small style={{fontSize: "0.7rem"}}>VND</small>
                        </span>
                    </div>
                </div>

                <button 
                    disabled={seats.length === 0} 
                    onClick={handlePayment}
                    style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        background: seats.length > 0 ? "#fb4226" : "#ddd",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: seats.length > 0 ? "pointer" : "not-allowed",
                    }}
                >
                    {seats.length > 0 ? "THANH TOÁN" : "CHỌN GHẾ"}
                </button>

                <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "12px", textAlign: "center" }}>
                    * Giá vé đã bao gồm VAT
                </p>
            </div>

        </div>
    );
}
