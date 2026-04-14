import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import axios from "../api/axios";

// 📡 1. Nhận socket từ App.jsx qua Props
export default function Booking({ socket }) { 
    const { id } = useParams();
    const navigate = useNavigate();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]); // Mảng Object: [{id, price, type},...]
    const [showQR, setShowQR] = useState(false);
    const [bill, setBill] = useState(null);
    const [step, setStep] = useState(1);

    const [availableSnacks, setAvailableSnacks] = useState([]);
    const [selectedSnacks, setSelectedSnacks] = useState({});

    useEffect(() => {
        axios.get(`/showtimes/detail/${id}`).then(res => {
            setShowtime(res.data);
        });

        axios.get("/snacks").then(res => {
            setAvailableSnacks(res.data);
        }).catch(err => console.error("Lỗi lấy danh sách bắp nước:", err));
    }, [id]);

    const updateSnack = (snackId, delta) => {
        setSelectedSnacks(prev => {
            const currentQty = prev[snackId] || 0;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [snackId]: newQty };
        });
    };

    // 💰 2. TÍNH TIỀN VÉ REAL-TIME: Cộng dồn giá của từng ghế từ SeatMap trả về
    const roomPrice = showtime?.roomId?.price || 0;
    const ticketTotal = seats.reduce((sum, s) => sum + (s.price || 0), 0);

    const snackTotal = Object.entries(selectedSnacks).reduce((sum, [snackId, qty]) => {
        const snack = availableSnacks.find(s => s._id === snackId);
        return sum + (snack ? snack.price * qty : 0);
    }, 0);

    const totalAmount = ticketTotal + snackTotal;

    const handleConfirmPayment = async () => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("❌ Lỗi: Không tìm thấy ID người dùng. Hãy đăng nhập lại!");
                return;
            }

            const snackList = Object.entries(selectedSnacks)
                .filter(([_, qty]) => qty > 0)
                .map(([snackId, qty]) => {
                    const snack = availableSnacks.find(s => s._id === snackId);
                    return {
                        snackId: snack._id,
                        name: snack.name,
                        quantity: qty,
                        price: snack.price,
                        image: snack.image
                    };
                });

            const payload = {
                showtimeId: id,
                userId: userId,
                seats: seats.map(s => s.id), // Chuyển mảng Object thành mảng ID để lưu DB
                snacks: snackList,
                totalAmount: totalAmount
            };

            const res = await axios.post("/bookings/confirm", payload);
            
            // ✅ Sau khi thanh toán, Backend sẽ tự phát tín hiệu socket cập nhật ghế cho các máy khác
            setBill(res.data.booking);
            setShowQR(false);
            alert("✅ Thanh toán thành công! Chúc sếp xem phim vui vẻ.");
        } catch (err) {
            console.error("Lỗi đặt vé:", err);
            alert("❌ Có lỗi xảy ra khi lưu hóa đơn.");
        }
    };

    // --- 🧾 GIAO DIỆN HÓA ĐƠN XỊN ---
    if (bill) return (
        <div style={billContainerStyle}>
            <div style={billBoxStyle}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h2 style={{ color: "#fb4226", margin: 0, letterSpacing: "2px" }}>CINEMA LUX</h2>
                    <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "5px" }}>HÓA ĐƠN ĐẶT VÉ ĐIỆN TỬ</p>
                </div>

                <div style={billInfoStyle}>
                    <p><strong>Mã vé:</strong> <span style={{ color: "#fb4226" }}>{bill._id.toUpperCase()}</span></p>
                    <p><strong>Khách hàng:</strong> {localStorage.getItem("name") || "Khách hàng"}</p>
                    <p><strong>Phim:</strong> <b>{showtime?.movieId?.title}</b></p>

                    <p>
                        <strong>Suất chiếu:</strong> {
                            showtime?.time ? (
                                <>
                                    {new Date(showtime.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    {" | "}
                                    {new Date(showtime.time).toLocaleDateString('vi-VN')}
                                </>
                            ) : "Đang tải..."
                        }
                    </p>

                    <p><strong>Phòng:</strong> {showtime?.roomId?.name}</p>
                    <p><strong>Vị trí ghế:</strong> <b style={{ fontSize: "1.2rem", color: "#fb4226" }}>{bill.seats.join(", ")}</b></p>
                </div>

                <hr style={{ border: "none", borderTop: "1px dashed #ddd", margin: "20px 0" }} />

                {bill.snacks && bill.snacks.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#555" }}>🍿 CHI TIẾT BẮP NƯỚC:</p>
                        {bill.snacks.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "5px" }}>
                                <span>{item.name} (x{item.quantity})</span>
                                <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={billTotalSectionStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#777" }}>
                        <span>Tiền vé:</span>
                        <span>{ticketTotal.toLocaleString()}đ</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#777" }}>
                        <span>Tiền bắp nước:</span>
                        <span>{snackTotal.toLocaleString()}đ</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                        <strong style={{ fontSize: "1.1rem" }}>TỔNG CỘNG:</strong>
                        <strong style={{ fontSize: "1.3rem", color: "#fb4226" }}>{bill.totalAmount.toLocaleString()} VND</strong>
                    </div>
                </div>

                <button onClick={() => navigate("/")} style={{ ...btnStyle, marginTop: 25 }}>Quay về Trang chủ</button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#fdfcf0", minHeight: "100vh" }}>
            <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                {step === 1 ? (
                    <div>
                        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>🎬 CHỌN GHẾ NGỒI</h2>
                        {/* 📡 3. Truyền socket xuống cho SeatMap để lắng nghe cập nhật ghế */}
                        <SeatMap 
                            onSelect={setSeats} 
                            showtimeId={id} 
                            roomPrice={roomPrice} 
                            socket={socket} 
                        />
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: "#fb4226", marginBottom: 25 }}>🍿 THÊM BẮP NƯỚC CHO PHIM HAY HƠN</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            {availableSnacks.map(snack => (
                                <div key={snack._id} style={snackCardStyle}>
                                    <img src={snack.image ? `http://localhost:5000${snack.image}` : ""} width="80" height="80" style={{ borderRadius: "8px", objectFit: 'cover' }} />
                                    <div style={{ flex: 1, paddingLeft: "15px" }}>
                                        <b style={{ fontSize: "1rem" }}>{snack.name}</b>
                                        <p style={{ color: "#fb4226", margin: "5px 0" }}>{snack.price.toLocaleString()}đ</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <button onClick={() => updateSnack(snack._id, -1)} style={qtyBtnStyle}>-</button>
                                            <span style={{ fontWeight: "bold" }}>{selectedSnacks[snack._id] || 0}</span>
                                            <button onClick={() => updateSnack(snack._id, 1)} style={qtyBtnStyle}>+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div style={summaryBoxStyle}>
                <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 15 }}>TÓM TẮT ĐƠN HÀNG</h3>
                <p>Phim: <b>{showtime?.movieId?.title}</b></p>
                <p>Phòng: <b style={{ color: "#fb4226" }}>{showtime?.roomId?.name}</b></p>
                {/* HIỂN THỊ TÊN GHẾ TỪ MẢNG OBJECT */}
                <p>Ghế chọn: <b style={{ color: "#fb4226" }}>{seats.map(s => s.id).join(", ") || "Chưa chọn"}</b></p>

                {Object.values(selectedSnacks).some(q => q > 0) && (
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 10, borderLeft: '3px solid #fb4226', paddingLeft: 10 }}>
                        {Object.entries(selectedSnacks).map(([snackId, qty]) => {
                            if (qty === 0) return null;
                            const s = availableSnacks.find(item => item._id === snackId);
                            return <div key={snackId}>+ {s?.name} x{qty}</div>
                        })}
                    </div>
                )}

                <div style={{ marginTop: 30, borderTop: "1px dashed #ccc", paddingTop: 15 }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>TỔNG CỘNG</p>
                    <h2 style={{ color: "#fb4226", marginTop: 5 }}>{totalAmount.toLocaleString()} VND</h2>
                </div>

                {step === 1 ? (
                    <button disabled={seats.length === 0} onClick={() => setStep(2)}
                        style={{ ...btnStyle, background: seats.length > 0 ? "#fb4226" : "#ccc" }}>
                        CHỌN BẮP NƯỚC ➔
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button onClick={() => setShowQR(true)} style={btnStyle}>THANH TOÁN NGAY</button>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>Quay lại chọn ghế</button>
                    </div>
                )}
            </div>

            {showQR && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: 20 }}>QUÉT MÃ QR THANH TOÁN</h3>
                        <img src={`https://img.vietqr.io/image/momo-0829927690-compact2.jpg?amount=${totalAmount}&addInfo=CinemaLux%20${id.slice(-6)}&accountName=HO%20VAN%20LOC`}
                            style={{ width: "260px", height: "260px", display: "block", margin: "0 auto 20px" }} />
                        <button onClick={handleConfirmPayment} style={btnConfirmStyle}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</button>
                        <button onClick={() => setShowQR(false)} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 15, color: "#888" }}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles Nâng Cấp (Giữ nguyên của sếp) ---
const snackCardStyle = { display: "flex", alignItems: "center", border: "1px solid #eee", padding: "15px", borderRadius: "12px", background: "#fdfdfd" };
const qtyBtnStyle = { width: "30px", height: "30px", border: "1px solid #ddd", background: "#fff", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" };
const summaryBoxStyle = { width: 320, background: "#fff", padding: 25, borderRadius: 15, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", height: "fit-content" };
const btnStyle = { width: "100%", padding: 15, background: "#fb4226", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: 30, borderRadius: 15, textAlign: "center", width: 380 };
const btnConfirmStyle = { width: "100%", padding: 14, background: "#28a745", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 10 };
const billContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center", padding: "50px 0", background: "#fdfcf0", minHeight: "100vh" };
const billBoxStyle = { background: "#fff", padding: "40px 30px", borderRadius: 15, boxShadow: "0 15px 50px rgba(0,0,0,0.1)", width: 450, borderTop: "10px solid #fb4226" };
const billInfoStyle = { display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.95rem", color: "#444" };
const billTotalSectionStyle = { background: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #eee" };