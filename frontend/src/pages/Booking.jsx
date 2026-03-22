import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import axios from "../api/axios";

export default function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [bill, setBill] = useState(null);

    useEffect(() => {
        axios.get(`/showtimes/detail/${id}`).then(res => {
            setShowtime(res.data);
            console.log("Dữ liệu suất chiếu:", res.data); // Sếp F12 để kiểm tra xem có roomId chưa nhé
        });
    }, [id]);

    // 💰 Tính toán giá tiền dựa theo SETUP PHÒNG của sếp
    const roomPrice = showtime?.roomId?.price || 0;
    const totalAmount = seats.length * roomPrice;

    const handleConfirmPayment = async () => {
        try {
            const res = await axios.post("/bookings/confirm", {
                showtimeId: id,
                userId: localStorage.getItem("userId"),
                seats: seats,
                totalAmount: totalAmount // Lưu đúng tổng tiền theo giá phòng
            });
            setBill(res.data.booking);
            setShowQR(false);
            alert("Thanh toán thành công! Đã ghi nhận hóa đơn.");
        } catch (err) {
            alert("Lỗi lưu hóa đơn! Sếp kiểm tra lại Backend nhé.");
        }
    };

    // 📄 GIAO DIỆN HÓA ĐƠN (CẬP NHẬT TÊN PHÒNG VÀ GIÁ)
    if (bill) return (
        <div style={billContainerStyle}>
            <div style={billBoxStyle}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>CINEMA LUX</h2>
                    <p style={{ fontSize: "0.8rem", color: "#888" }}>HÓA ĐƠN XÁC NHẬN ĐẶT VÉ</p>
                </div>
                <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "20px 0" }} />
                <p><strong>Mã hóa đơn:</strong> <span style={{ fontSize: "0.8rem" }}>{bill._id}</span></p>
                <p><strong>Khách hàng:</strong> {localStorage.getItem("name")}</p>
                <p><strong>Phim:</strong> {showtime?.movieId?.title}</p>
                
                {/* 🏢 Hiện Tên Phòng và Loại Phòng trên Hóa đơn */}
                <p><strong>Phòng:</strong> {showtime?.roomId?.name} ({showtime?.roomId?.type})</p>
                
                <p><strong>Số ghế:</strong> <span style={{ color: "#fb4226", fontWeight: "bold", fontSize: "1.2rem" }}>{bill.seats.join(", ")}</span></p>
                <p><strong>Thời gian:</strong> {new Date(showtime?.time).toLocaleString('vi-VN')}</p>
                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginTop: "20px", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#666" }}>TỔNG TIỀN THANH TOÁN</p>
                    <h2 style={{ margin: "5px 0", color: "#fb4226" }}>{bill.totalAmount.toLocaleString()} VND</h2>
                </div>
                <button onClick={() => navigate("/")} style={{ ...btnStyle, marginTop: 30 }}>Quay về Trang chủ</button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#fdfcf0", minHeight: "100vh" }}>
            <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                <SeatMap onSelect={setSeats} showtimeId={id} />
            </div>

            <div style={summaryBoxStyle}>
                <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 15 }}>TÓM TẮT ĐƠN HÀNG</h3>
                <p>Phim: <b>{showtime?.movieId?.title}</b></p>
                
                {/* 🏢 HIỂN THỊ TÊN PHÒNG VÀ LOẠI PHÒNG */}
                <p>Phòng: <b style={{ color: "#fb4226" }}>{showtime?.roomId?.name || "Đang tải..."}</b></p>
                <p>Loại rạp: <span style={badgeStyle}>{showtime?.roomId?.type || "2D"}</span></p>
                
                <p>Ghế chọn: <b style={{ color: "#fb4226" }}>{seats.join(", ") || "Chưa chọn"}</b></p>
                
                <div style={{ marginTop: 30, borderTop: "1px dashed #ccc", paddingTop: 15 }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
                        Đơn giá: {roomPrice.toLocaleString()}đ / ghế
                    </p>
                    <h2 style={{ color: "#fb4226", marginTop: 5 }}>{totalAmount.toLocaleString()} VND</h2>
                </div>
                <button
                    disabled={seats.length === 0}
                    onClick={() => setShowQR(true)}
                    style={{ ...btnStyle, background: seats.length > 0 ? "#fb4226" : "#ccc" }}
                >
                    TIẾP TỤC THANH TOÁN
                </button>
            </div>

            {/* 🟦 MODAL HIỆN MÃ QR (ĐÃ CẬP NHẬT GIÁ VÀ THÔNG TIN) */}
            {showQR && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: 20 }}>QUÉT MÃ QR THANH TOÁN</h3>
                        <img
                            src={`https://img.vietqr.io{totalAmount}&addInfo=CinemaLux%20${id.slice(-6)}&accountName=HO%20VAN%20LOC`}
                            alt="QR MoMo Cinema Lux"
                            style={{ width: "260px", height: "260px", display: "block", margin: "0 auto 20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                            onError={(e) => { e.target.src = "https://via.placeholder.com"; }}
                        />

                        <div style={{ textAlign: "left", fontSize: "0.85rem", background: "#f9f9f9", padding: "10px", borderRadius: "8px", marginBottom: 15 }}>
                            <p style={{ margin: "5px 0" }}>Nội dung: <b>CinemaLux {id.slice(-6)}</b></p>
                            <p style={{ margin: "5px 0" }}>Số tiền: <b>{totalAmount.toLocaleString()}đ</b></p>
                        </div>

                        <button onClick={handleConfirmPayment} style={btnConfirmStyle}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</button>
                        <button onClick={() => setShowQR(false)} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 15, color: "#888" }}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 💄 Styles ---
const badgeStyle = { background: "#eee", padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold", color: "#555" };
const summaryBoxStyle = { width: 320, background: "#fff", padding: 25, borderRadius: 15, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", height: "fit-content" };
const btnStyle = { width: "100%", padding: 15, background: "#fb4226", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", transition: "0.3s" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: 30, borderRadius: 15, textAlign: "center", width: 380 };
const btnConfirmStyle = { width: "100%", padding: 14, background: "#28a745", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 10 };
const billContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center", padding: "50px 0", background: "#fdfcf0", minHeight: "100vh" };
const billBoxStyle = { background: "#fff", padding: "40px 30px", borderRadius: 15, boxShadow: "0 15px 50px rgba(0,0,0,0.1)", width: 450, borderTop: "8px solid #fb4226" };
