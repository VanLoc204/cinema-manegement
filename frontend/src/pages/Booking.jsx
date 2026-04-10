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

    const roomPrice = showtime?.roomId?.price || 0;
    const ticketTotal = seats.length * roomPrice;

    const snackTotal = Object.entries(selectedSnacks).reduce((sum, [snackId, qty]) => {
        const snack = availableSnacks.find(s => s._id === snackId);
        return sum + (snack ? snack.price * qty : 0);
    }, 0);

    const totalAmount = ticketTotal + snackTotal;

    // 🚀 HÀM XỬ LÝ THANH TOÁN ĐÃ THÊM LOG BẮT BỆNH
    const handleConfirmPayment = async () => {
        try {
            const userId = localStorage.getItem("userId");
            
            // 🔍 Kiểm tra xem có UserId không
            if (!userId) {
                alert("❌ Lỗi: Không tìm thấy ID người dùng. Sếp thử đăng xuất rồi đăng nhập lại nhé!");
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
                seats: seats,
                snacks: snackList,
                totalAmount: totalAmount
            };

            // 📝 LOG DỮ LIỆU TRƯỚC KHI GỬI
            console.log(">>> Đang gửi dữ liệu đặt vé:", payload);

            const res = await axios.post("/bookings/confirm", payload);
            
            console.log(">>> Kết quả từ Backend:", res.data);
            
            setBill(res.data.booking);
            setShowQR(false);
            alert("✅ Thanh toán thành công! Chúc sếp xem phim vui vẻ.");
        } catch (err) {
            // 🚩 PHÂN TÍCH LỖI CHI TIẾT
            console.error("❌ LỖI BACKEND TRẢ VỀ:");
            if (err.response) {
                console.error("Data lỗi:", err.response.data);
                console.error("Status code:", err.response.status);
                alert(`❌ Lỗi từ server: ${err.response.data.message || "Lỗi lưu hóa đơn"}`);
            } else {
                console.error("Lỗi mạng hoặc lỗi code:", err.message);
                alert("❌ Không thể kết nối tới Server. Sếp kiểm tra lại Backend có đang chạy không nhé!");
            }
        }
    };

    // --- 🧾 GIAO DIỆN HÓA ĐƠN ---
    if (bill) return (
        <div style={billContainerStyle}>
            <div style={billBoxStyle}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>CINEMA LUX</h2>
                    <p style={{ fontSize: "0.8rem", color: "#888" }}>HÓA ĐƠN XÁC NHẬN ĐẶT VÉ</p>
                </div>
                <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "20px 0" }} />
                <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p><strong>Mã hóa đơn:</strong> <span style={{ fontSize: "0.8rem", color: "#666" }}>{bill._id}</span></p>
                    <p><strong>Khách hàng:</strong> {localStorage.getItem("name")}</p>
                    <p><strong>Phim:</strong> <b style={{ color: "#333" }}>{bill.showtimeId?.movieId?.title || showtime?.movieId?.title}</b></p>
                    <p><strong>Phòng:</strong> <span style={{ color: "#fb4226", fontWeight: "bold" }}>{bill.showtimeId?.roomId?.name || showtime?.roomId?.name}</span></p>
                    <p><strong>Vị trí ghế:</strong> <span style={{ color: "#fb4226", fontWeight: "bold", fontSize: "1.2rem" }}>{bill.seats.join(", ")}</span></p>
                    
                    {bill.snacks && bill.snacks.length > 0 && (
                        <div style={{ marginTop: "10px", padding: "15px", background: "#fdf2f0", borderRadius: "10px", border: "1px solid #fbd9d3" }}>
                            <strong style={{ display: "block", marginBottom: "10px", color: "#d6361e", fontSize: "0.9rem" }}>🍿 ĐỒ ĂN & THỨC UỐNG:</strong>
                            {bill.snacks.map((item, index) => (
                                <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <img src={`http://localhost:5000${item.image}`} width="35" height="35" style={{ borderRadius: "5px", objectFit: "cover" }} />
                                        <span style={{ fontSize: "0.85rem" }}>{item.name} (x{item.quantity})</span>
                                    </div>
                                    <b style={{ fontSize: "0.85rem" }}>{(item.price * item.quantity).toLocaleString()}đ</b>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginTop: "25px", textAlign: "center", border: "1px solid #eee" }}>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>TỔNG TIỀN ĐÃ THANH TOÁN</p>
                    <h2 style={{ margin: "5px 0", color: "#fb4226", fontSize: "1.8rem" }}>{bill.totalAmount.toLocaleString()} VND</h2>
                </div>
                <button onClick={() => navigate("/")} style={{ ...btnStyle, marginTop: 30 }}>Quay về Trang chủ</button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#fdfcf0", minHeight: "100vh" }}>
            <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                {step === 1 ? (
                    <div>
                        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>🎬 CHỌN GHẾ NGỒI</h2>
                        <SeatMap onSelect={setSeats} showtimeId={id} />
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: "#fb4226", marginBottom: 25 }}>🍿 THÊM BẮP NƯỚC CHO PHIM HAY HƠN</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            {availableSnacks.map(snack => (
                                <div key={snack._id} style={snackCardStyle}>
                                    <img
                                        src={snack.image ? `http://localhost:5000${snack.image}` : "https://cdn.tgdd.vn/Products/Images/2443/76467/bhx/nuoc-ngot-pepsi-lon-320ml-202308151445030248.jpg"}
                                        width="80" height="80" style={{ borderRadius: "8px", objectFit: 'cover' }}
                                        onError={(e) => e.target.src = "https://cdn.tgdd.vn/Products/Images/2443/76467/bhx/nuoc-ngot-pepsi-lon-320ml-202308151445030248.jpg"}
                                        alt={snack.name}
                                    />
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
                <p>Ghế chọn: <b style={{ color: "#fb4226" }}>{seats.join(", ") || "Chưa chọn"}</b></p>

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
                        <div style={{ textAlign: "left", fontSize: "0.85rem", background: "#f9f9f9", padding: "10px", borderRadius: "8px", marginBottom: 15 }}>
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

// --- Styles ---
const snackCardStyle = { display: "flex", alignItems: "center", border: "1px solid #eee", padding: "15px", borderRadius: "12px", background: "#fdfdfd" };
const qtyBtnStyle = { width: "30px", height: "30px", border: "1px solid #ddd", background: "#fff", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" };
const summaryBoxStyle = { width: 320, background: "#fff", padding: 25, borderRadius: 15, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", height: "fit-content" };
const btnStyle = { width: "100%", padding: 15, background: "#fb4226", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: 30, borderRadius: 15, textAlign: "center", width: 380 };
const btnConfirmStyle = { width: "100%", padding: 14, background: "#28a745", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 10 };
const billContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center", padding: "50px 0", background: "#fdfcf0", minHeight: "100vh" };
const billBoxStyle = { background: "#fff", padding: "40px 30px", borderRadius: 15, boxShadow: "0 15px 50px rgba(0,0,0,0.1)", width: 450, borderTop: "8px solid #fb4226" };