import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatMap from "../../components/SeatMap"; 
import axios from "../../api/axios";

export default function StaffBooking({ socket }) { 
    const { id } = useParams(); // id này chính là showtimeId
    const navigate = useNavigate();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]); 
    const [bill, setBill] = useState(null);
    const [step, setStep] = useState(1);
    const [availableSnacks, setAvailableSnacks] = useState([]);
    const [selectedSnacks, setSelectedSnacks] = useState({});

    // 🚩 REALTIME: Tham gia vào phòng của suất chiếu ngay khi vào trang
    useEffect(() => {
        if (socket && id) {
            // Báo với server: "Tôi là nhân viên, tôi vào phòng suất chiếu này để hóng biến"
            socket.emit("join_showtime", id);

            // Khi nhân viên rời trang (back lại hoặc sang trang khác) thì rời phòng luôn
            return () => {
                socket.emit("leave_showtime", id);
            };
        }
    }, [socket, id]);

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

    const ticketTotal = seats.reduce((sum, s) => sum + (s.price || 0), 0);
    const snackTotal = Object.entries(selectedSnacks).reduce((sum, [snackId, qty]) => {
        const snack = availableSnacks.find(s => s._id === snackId);
        return sum + (snack ? snack.price * qty : 0);
    }, 0);
    const totalAmount = ticketTotal + snackTotal;

    const handleConfirmCash = async () => {
        if (!window.confirm(`Sếp xác nhận đã thu ${totalAmount.toLocaleString()}đ tiền mặt từ khách chứ?`)) return;

        try {
            const staffId = localStorage.getItem("userId");
            const snackList = Object.entries(selectedSnacks)
                .filter(([_, qty]) => qty > 0)
                .map(([snackId, qty]) => {
                    const snack = availableSnacks.find(s => s._id === snackId);
                    return {
                        snackId: snack._id,
                        name: snack.name,
                        quantity: qty,
                        price: snack.price
                    };
                });

            const payload = {
                showtimeId: id,
                userId: staffId, 
                seats: seats.map(s => s.id),
                snacks: snackList,
                totalAmount: totalAmount,
                paymentMethod: "Cash", 
                isPaid: true
            };

            const res = await axios.post("/bookings/confirm", payload);
            setBill(res.data.booking);

            // 🚩 REALTIME: Báo cho tất cả mọi người là ghế này đã CHÍNH THỨC ĐƯỢC BÁN
            if (socket) {
                socket.emit("confirm_booking", { 
                    showtimeId: id, 
                    seats: seats.map(s => s.id) 
                });
            }

            alert("✅ Đã xác nhận thu tiền và tạo vé thành công!");
        } catch (err) {
            console.error("Lỗi bán vé tại quầy:", err);
            alert("❌ Lỗi hệ thống khi tạo vé!");
        }
    };

    const handlePrint = () => { window.print(); };

    if (bill) return (
        <div style={billContainerStyle}>
            <div id="printable-ticket" style={billBoxStyle}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>CINEMA LUX</h2>
                    <p style={{ fontSize: "0.7rem", color: "#888" }}>VÉ XEM PHIM TẠI QUẦY</p>
                </div>
                <div style={billInfoStyle}>
                    <p><strong>Mã vé:</strong> {bill._id.toUpperCase()}</p>
                    <p><strong>Nhân viên:</strong> {localStorage.getItem("name")}</p>
                    <p><strong>Phim:</strong> <b>{showtime?.movieId?.title}</b></p>
                    <p><strong>Suất:</strong> {new Date(showtime?.time).toLocaleString('vi-VN')}</p>
                    <p><strong>Phòng:</strong> {showtime?.roomId?.name}</p>
                    <p><strong>Ghế:</strong> <b style={{ fontSize: "1.2rem", color: "#fb4226" }}>{bill.seats.join(", ")}</b></p>
                </div>
                <div style={{ marginTop: 20, borderTop: "1px dashed #ddd", paddingTop: 15 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>TỔNG TIỀN:</strong>
                        <strong style={{ color: "#fb4226" }}>{bill.totalAmount.toLocaleString()}đ</strong>
                    </div>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 30 }}>
                    <button onClick={handlePrint} style={{ ...btnStyle, background: "#28a745" }}>🖨️ IN VÉ</button>
                    <button onClick={() => navigate("/staff/pos")} style={{ ...btnStyle, background: "#333" }}>XONG</button>
                </div>
            </div>
            <style>{`@media print {.no-print { display: none !important; } #printable-ticket { box-shadow: none !important; border: 1px solid #000 !important; }}`}</style>
        </div>
    );

    return (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#f5f5f5", minHeight: "100vh" }}>
            <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, color: '#fb4226' }}>BÁN VÉ TẠI QUẦY (POS)</h2>
                    <span style={{ padding: '5px 15px', background: '#eee', borderRadius: '20px', fontSize: '0.8rem' }}>Bước {step}/2</span>
                </div>

                {step === 1 ? (
                    <SeatMap 
                        onSelect={setSeats} 
                        showtimeId={id} 
                        roomPrice={showtime?.roomId?.price || 0} 
                        socket={socket} 
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {availableSnacks.map(snack => (
                            <div key={snack._id} style={snackCardStyle}>
                                <img src={`http://localhost:5000${snack.image}`} width="60" height="60" style={{ borderRadius: "8px", objectFit: 'cover' }} />
                                <div style={{ flex: 1, paddingLeft: "15px" }}>
                                    <b style={{ fontSize: "0.9rem" }}>{snack.name}</b>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: 5 }}>
                                        <button onClick={() => updateSnack(snack._id, -1)} style={qtyBtnStyle}>-</button>
                                        <span>{selectedSnacks[snack._id] || 0}</span>
                                        <button onClick={() => updateSnack(snack._id, 1)} style={qtyBtnStyle}>+</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={summaryBoxStyle}>
                <h3 style={{ borderBottom: "2px solid #fb4226", paddingBottom: 10 }}>ĐƠN HÀNG MỚI</h3>
                <p style={{fontSize: '0.9rem'}}>Phim: <b>{showtime?.movieId?.title}</b></p>
                <p style={{fontSize: '0.9rem'}}>Ghế: <b style={{ color: "#fb4226" }}>{seats.map(s => s.id).join(", ") || "Chưa chọn"}</b></p>
                <div style={{ marginTop: 20, background: '#f9f9f9', padding: 15, borderRadius: 10 }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>THÀNH TIỀN</p>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>{totalAmount.toLocaleString()}đ</h2>
                </div>

                {step === 1 ? (
                    <button disabled={seats.length === 0} onClick={() => setStep(2)}
                        style={{ ...btnStyle, marginTop: 20, opacity: seats.length > 0 ? 1 : 0.5 }}>
                        CHỌN BẮP NƯỚC ➔
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                        <button onClick={handleConfirmCash} style={{ ...btnStyle, background: "#28a745" }}>XÁC NHẬN THU TIỀN</button>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>Quay lại chọn ghế</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Styles ---
const snackCardStyle = { display: "flex", alignItems: "center", border: "1px solid #eee", padding: "10px", borderRadius: "10px" };
const qtyBtnStyle = { width: "25px", height: "25px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const summaryBoxStyle = { width: 300, background: "#fff", padding: 20, borderRadius: 15, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", height: "fit-content" };
const btnStyle = { width: "100%", padding: 12, background: "#fb4226", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const billContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center", padding: "50px 0", background: "#f5f5f5", minHeight: "100vh" };
const billBoxStyle = { background: "#fff", padding: "30px", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: 400 };
const billInfoStyle = { display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" };