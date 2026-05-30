import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import axios from "../api/axios";

export default function Booking({ socket }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [bill, setBill] = useState(null);
    const [step, setStep] = useState(1);
    const [toastData, setToastData] = useState(null);

    const showToast = (title, desc, type = "success") => {
        setToastData({ title, desc, type });
        setTimeout(() => setToastData(null), 5000);
    };

    const [availableSnacks, setAvailableSnacks] = useState([]);
    const [selectedSnacks, setSelectedSnacks] = useState({});

    // 🎟️ STATES PHỤC VỤ ÁP DỤNG VOUCHER
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [myVouchers, setMyVouchers] = useState([]);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [voucherError, setVoucherError] = useState("");

    // 🏆 THÔNG TIN THÀNH VIÊN VÀ LỊCH SỬ ĐỂ TÍNH VOUCHER HẠNG
    const [userTier, setUserTier] = useState("NORMAL");
    const [userHistory, setUserHistory] = useState([]);

    // 📡 1. THÊM MỚI: Logic vào phòng Realtime (Không xóa gì của sếp)
    useEffect(() => {
        if (socket && id) {
            socket.emit("join_showtime", id);
            return () => {
                socket.emit("leave_showtime", id);
            };
        }
    }, [socket, id]);

    useEffect(() => {
        axios.get(`/showtimes/detail/${id}`).then(res => {
            setShowtime(res.data);
        }).catch(err => {
            console.error("Lỗi lấy chi tiết suất chiếu:", err);
            showToast("Lỗi tải dữ liệu", "Không thể tải dữ liệu, vui lòng thử lại", "error");
        });

        axios.get("/snacks").then(res => {
            setAvailableSnacks(res.data);
        }).catch(err => {
            console.error("Lỗi lấy danh sách bắp nước:", err);
            showToast("Lỗi tải dữ liệu", "Không thể tải dữ liệu, vui lòng thử lại", "error");
        });
    }, [id]);

    // Tải thông tin tài khoản, lịch sử đặt vé và ví voucher cá nhân để xử lý đồng bộ
    useEffect(() => {
        const fetchVoucherWallet = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) return;
            try {
                const [voucherRes, userRes, bookingRes] = await Promise.all([
                    axios.get("/vouchers/my-vouchers"),
                    axios.get(`/users/detail/${userId}`),
                    axios.get(`/bookings/user/${userId}`)
                ]);

                setMyVouchers(voucherRes.data.filter(v => !v.used));
                if (userRes.data) {
                    setUserTier(userRes.data.membershipTier || "NORMAL");
                }
                if (bookingRes.data) {
                    setUserHistory(bookingRes.data);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin ví voucher và tài khoản:", err);
            }
        };
        if (step === 2) {
            fetchVoucherWallet();
        }
    }, [step]);

    const updateSnack = (snackId, delta) => {
        setSelectedSnacks(prev => {
            const currentQty = prev[snackId] || 0;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [snackId]: newQty };
        });
    };

    const roomPrice = showtime?.roomId?.price || 0;
    const ticketTotal = seats.reduce((sum, s) => sum + (s.price || 0), 0);
    const snackTotal = Object.entries(selectedSnacks).reduce((sum, [snackId, qty]) => {
        const snack = availableSnacks.find(s => s._id === snackId);
        return sum + (snack ? snack.price * qty : 0);
    }, 0);

    const totalAmount = ticketTotal + snackTotal;

    // --- 🏆 PHẦN QUY ĐỊNH VÀ DỰNG VOUCHER DÀNH CHO HẠNG THÀNH VIÊN ---
    const getVouchersForTier = (tier) => {
        if (tier === "PLATINUM") {
            return [
                { id: "v1", code: "PLAT-SWEETBOX-2D", name: "Voucher Vé Đôi Ghế Sweetbox", type: "FreeTicket", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox", exp: "31/12/2026", qty: 4 },
                { id: "v2", code: "PLAT-VIP-2D", name: "Voucher Vé Ghế VIP 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế VIP", exp: "31/12/2026", qty: 4 },
                { id: "v3", code: "PLAT-STANDARD-2D", name: "Voucher Vé Ghế Thường 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế Thường", exp: "31/12/2026", qty: 6 },
                { id: "v4", code: "PLAT-BIRTHDAY-COMBO", name: "Voucher Birthday Solo Combo", type: "FreeSnack", desc: "Nhận 1 bắp ngọt lớn + 1 nước ngọt 22oz dịp sinh nhật", exp: "31/12/2026", qty: 2 }
            ];
        } else if (tier === "VIP") {
            return [
                { id: "v1", code: "VIP-SWEETBOX-2D", name: "Voucher Vé Đôi Ghế Sweetbox", type: "FreeTicket", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox", exp: "31/12/2026", qty: 2 },
                { id: "v2", code: "VIP-VIP-2D", name: "Voucher Vé Ghế VIP 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế VIP", exp: "31/12/2026", qty: 2 },
                { id: "v3", code: "VIP-STANDARD-2D", name: "Voucher Vé Ghế Thường 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế Thường", exp: "31/12/2026", qty: 2 },
                { id: "v4", code: "VIP-BIRTHDAY-COMBO", name: "Voucher Birthday Solo Combo", type: "FreeSnack", desc: "Nhận 1 bắp ngọt lớn + 1 nước ngọt 22oz dịp sinh nhật", exp: "31/12/2026", qty: 1 }
            ];
        }
        return [];
    };

    // Tự động kiểm tra xem user đã dùng bao nhiêu voucher hạng trong lịch sử vé
    const unusedTierVouchers = [];
    getVouchersForTier(userTier).forEach(v => {
        const usedCount = userHistory
            .filter(t => (t.status === "Paid" || t.status === "Checked-in") && t.appliedVoucher === v.code)
            .reduce((sum, t) => sum + (t.appliedVoucherQty || 1), 0);
        const remaining = Math.max(0, v.qty - usedCount);
        if (remaining > 0) {
            unusedTierVouchers.push({
                _id: v.id,
                code: v.code,
                discountType: v.type, // FreeTicket | FreeSnack
                discountValue: remaining, // Số lượng lượt dùng còn lại
                minSpend: 0,
                expiryDate: new Date("2026-12-31"),
                isTier: true,
                name: v.name,
                desc: v.desc
            });
        }
    });

    // Trộn lẫn các voucher hạng thành viên và các voucher cá nhân do Admin gửi tặng thành một danh sách ví duy nhất!
    const allAvailableVouchers = [...unusedTierVouchers, ...myVouchers];

    const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
    const discountedTotal = Math.max(0, totalAmount - discountAmount);

    const handleApplyVoucher = async (codeToApply) => {
        const targetCode = codeToApply || voucherCode;
        if (!targetCode) {
            setVoucherError("Vui lòng nhập mã voucher sếp ơi!");
            return;
        }

        try {
            setVoucherError("");
            const userId = localStorage.getItem("userId");
            const res = await axios.post("/vouchers/apply", {
                code: targetCode,
                totalAmount: totalAmount,
                ticketTotal: ticketTotal,
                snackTotal: snackTotal,
                seatsCount: seats.length,
                seats: seats,
                userId: userId
            });

            setAppliedVoucher(res.data);
            setVoucherCode(res.data.code);
            setShowVoucherModal(false);
            setVoucherError("");
        } catch (err) {
            console.error("Lỗi áp dụng voucher:", err);
            setVoucherError(err.response?.data?.message || "Lỗi áp dụng voucher!");
            setAppliedVoucher(null);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode("");
        setVoucherError("");
    };

    const handleConfirmPayment = async () => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) return showToast("Lỗi đăng nhập", "Hãy đăng nhập lại!", "error");

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

            if (appliedVoucher && appliedVoucher.discountType === "FreeSnack") {
                const isBirthday = appliedVoucher.code.includes("BIRTHDAY-COMBO");
                const name = isBirthday ? "Birthday Solo Combo" : "Combo Bắp Nước";
                const qty = isBirthday 
                    ? (appliedVoucher.code.startsWith("PLAT") ? 2 : 1)
                    : (appliedVoucher.discountValue || 1);
                
                snackList.push({
                    snackId: "free_snack_gift",
                    name: name,
                    quantity: qty,
                    price: 0,
                    image: ""
                });
            }

            const payload = {
                showtimeId: id,
                userId: userId,
                seats: seats.map(s => s.id),
                snacks: snackList,
                totalAmount: discountedTotal, // Gửi số tiền thực tế đã áp dụng voucher
                appliedVoucher: appliedVoucher ? appliedVoucher.code : undefined,
                discountAmount: discountAmount
            };

            const res = await axios.post("/bookings/confirm", payload);

            // 📡 2. THÊM MỚI: Báo cho Staff và các khách khác là ghế đã CHỐT (Realtime)
            if (socket) {
                socket.emit("confirm_booking", {
                    showtimeId: id,
                    seats: seats.map(s => s.id)
                });
            }

            setBill(res.data.booking);
            setShowQR(false);
            showToast("Thanh toán thành công", "Thông tin vé chi tiết đã được gửi về email của bạn.", "success");
        } catch (err) {
            console.error("Lỗi đặt vé:", err);
            showToast("Lỗi hệ thống", "Có lỗi xảy ra khi lưu hóa đơn.", "error");
        }
    };

    // --- 🧾 GIAO DIỆN HÓA ĐƠN XỊN (GIỮ NGUYÊN TOÀN BỘ CHI TIẾT CỦA SẾP VÀ TRANG TRÍ VOUCHER) ---
    
    const toastElement = toastData && (
        <div style={{
            position: "fixed",
            top: "80px",
            right: "30px",
            background: "#333333",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 9999,
            textAlign: "left",
            minWidth: "280px",
            maxWidth: "350px",
            animation: "fadeInRight 0.3s ease-out"
        }}>
            <h2 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: "bold", color: toastData.type === "success" ? "#4ade80" : "#f87171" }}>
                {toastData.title}
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "normal", opacity: 0.9 }}>
                {toastData.desc}
            </p>
        </div>
    );

    if (bill) return (
        <>
            {toastElement}
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
                    <p><strong>Suất chiếu:</strong> {showtime?.time ? (
                        <>
                            {new Date(showtime.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {" | "}
                            {new Date(showtime.time).toLocaleDateString('vi-VN')}
                        </>
                    ) : "Đang tải..."}</p>
                    <p><strong>Phòng:</strong> {showtime?.roomId?.name}</p>
                    <p><strong>Vị trí ghế:</strong> <b style={{ fontSize: "1.2rem", color: "#fb4226" }}>{bill.seats.join(", ")}</b></p>
                </div>

                <hr style={{ border: "none", borderTop: "1px dashed #ddd", margin: "20px 0" }} />

                {bill.snacks && bill.snacks.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#555" }}>CHI TIẾT BẮP NƯỚC:</p>
                        {bill.snacks.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "5px" }}>
                                <span>{item.name} (x{item.quantity})</span>
                                <span>
                                    {item.price === 0 
                                        ? <span style={{ color: "#333" }}>Quà tặng</span> 
                                        : `${(item.price * item.quantity).toLocaleString()}đ`}
                                </span>
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
                    {bill.appliedVoucher && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#777" }}>
                            <span>Voucher đã dùng:</span>
                            <span style={{ textTransform: "uppercase" }}>{bill.appliedVoucher}</span>
                        </div>
                    )}
                    {(bill.discountAmount > 0 || (bill.appliedVoucher && bill.appliedVoucher.includes("BIRTHDAY-COMBO")) || bill.snacks?.some(s => s.price === 0)) && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#777" }}>
                            <span>Giảm giá voucher:</span>
                            <span>
                                {bill.discountAmount > 0 
                                    ? `-${bill.discountAmount.toLocaleString()}đ` 
                                    : "Quà tặng"}
                            </span>
                        </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                        <strong style={{ fontSize: "1.1rem" }}>TỔNG CỘNG:</strong>
                        <strong style={{ fontSize: "1.3rem", color: "#fb4226" }}>{bill.totalAmount.toLocaleString()} VND</strong>
                    </div>
                </div>

                <button onClick={() => navigate("/")} style={{ ...btnStyle, marginTop: 25 }}>Quay về Trang chủ</button>
            </div>
            </div>
        </>
    );

    return (
        <>
            {toastElement}
            <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#fdfcf0", minHeight: "100vh" }}>
                <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
                {step === 1 ? (
                    <div>
                        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>CHỌN GHẾ NGỒI</h2>
                        <SeatMap onSelect={setSeats} showtimeId={id} roomPrice={roomPrice} socket={socket} />
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: "#fb4226", marginBottom: 25 }}>THÊM BẮP NƯỚC CHO PHIM HAY HƠN</h2>
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
                <p>Ghế chọn: <b style={{ color: "#fb4226" }}>{seats.map(s => s.id).join(", ") || "Chưa chọn"}</b></p>

                {(Object.values(selectedSnacks).some(q => q > 0) || (appliedVoucher && appliedVoucher.discountType === "FreeSnack")) && (
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 10, borderLeft: '3px solid #fb4226', paddingLeft: 10 }}>
                        {Object.entries(selectedSnacks).map(([snackId, qty]) => {
                            if (qty === 0) return null;
                            const s = availableSnacks.find(item => item._id === snackId);
                            return <div key={snackId}>+ {s?.name} x{qty}</div>
                        })}
                        {appliedVoucher && appliedVoucher.discountType === "FreeSnack" && (
                            <div>
                                + {appliedVoucher.code.includes("BIRTHDAY-COMBO") 
                                    ? `Birthday Solo Combo x${appliedVoucher.code.startsWith("PLAT") ? 2 : 1}` 
                                    : `Combo Bắp Nước x${appliedVoucher.discountValue || 1}`} <span style={{ color: "#fb4226", fontWeight: "bold" }}>(Quà tặng)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🎟️ PHẦN NHẬP VÀ ÁP DỤNG VOUCHER (CHỈ HIỂN THỊ TẠI BƯỚC XÁC NHẬN THANH TOÁN) */}
                {step === 2 && (
                    <div style={{ marginTop: 20, borderTop: "1px dashed #eee", paddingTop: 15 }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "900", color: "#333", display: "block", marginBottom: 8 }}>
                            VOUCHER ƯU ĐÃI
                        </label>

                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <input
                                type="text"
                                placeholder="Nhập mã voucher..."
                                value={voucherCode}
                                onChange={e => {
                                    setVoucherCode(e.target.value);
                                    setVoucherError("");
                                }}
                                disabled={!!appliedVoucher}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    border: "1px solid #ddd",
                                    borderRadius: 6,
                                    fontSize: "0.85rem",
                                    textTransform: "uppercase",
                                    fontWeight: "700"
                                }}
                            />
                            {appliedVoucher ? (
                                <button
                                    onClick={handleRemoveVoucher}
                                    style={{
                                        padding: "8px 12px",
                                        background: "rgba(198,40,40,0.08)",
                                        color: "#c62828",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontWeight: "800",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    HỦY
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleApplyVoucher()}
                                    style={{
                                        padding: "8px 12px",
                                        background: "#fb4226",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontWeight: "800",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    DÙNG
                                </button>
                            )}
                        </div>

                        {/* 🎟️ Nút chọn nhanh từ ví voucher cá nhân trộn lẫn */}
                        {!appliedVoucher && allAvailableVouchers.length > 0 && (
                            <span
                                onClick={() => setShowVoucherModal(true)}
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#fb4226",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    display: "inline-block",
                                    textDecoration: "underline",
                                    marginBottom: 8
                                }}
                            >
                                [ Chọn từ ví voucher của tôi ({allAvailableVouchers.length}) ]
                            </span>
                        )}

                        {voucherError && (
                            <p style={{ color: "#c62828", fontSize: "0.75rem", margin: "5px 0 0 0", fontWeight: "700" }}>
                                {voucherError}
                            </p>
                        )}
                        {appliedVoucher && (
                            <p style={{ color: "#fb4226", fontSize: "0.75rem", margin: "5px 0 0 0", fontWeight: "700" }}>
                                Áp dụng thành công mã {appliedVoucher.code}!
                            </p>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 20, borderTop: "1px dashed #ccc", paddingTop: 15 }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>TỔNG CỘNG</p>
                    {appliedVoucher ? (
                        <>
                            <h5 style={{ color: "#888", textDecoration: "line-through", margin: "5px 0 0 0", fontSize: "0.95rem" }}>
                                {totalAmount.toLocaleString()} VND
                            </h5>
                            <h5 style={{ color: "#fb4226", margin: "2px 0 0 0", fontSize: "0.8rem", fontWeight: "800" }}>
                                Giảm giá voucher: -{discountAmount.toLocaleString()}đ
                            </h5>
                            <h2 style={{ color: "#fb4226", marginTop: 5 }}>
                                {discountedTotal.toLocaleString()} VND
                            </h2>
                        </>
                    ) : (
                        <h2 style={{ color: "#fb4226", marginTop: 5 }}>
                            {totalAmount.toLocaleString()} VND
                        </h2>
                    )}
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
                        <img src={`https://img.vietqr.io/image/momo-0829927690-compact2.jpg?amount=${discountedTotal}&addInfo=CinemaLux%20${id.slice(-6)}&accountName=HO%20VAN%20LOC`}
                            style={{ width: "260px", height: "260px", display: "block", margin: "0 auto 20px" }} />
                        <button onClick={handleConfirmPayment} style={btnConfirmStyle}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</button>
                        <button onClick={() => setShowQR(false)} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 15, color: "#888" }}>Đóng</button>
                    </div>
                </div>
            )}

            {/* 🎟️ MODAL CHỌN VOUCHER TỪ VÍ CÁ NHÂN TRỘN LẪN CẢ HAI LOẠI VOUCHER */}
            {showVoucherModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: "420px", maxHeight: "80vh", overflowY: "auto", textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3 style={{ margin: 0, color: "#333", fontWeight: "900" }}>VÍ VOUCHER CỦA BẠN</h3>
                            <button
                                onClick={() => setShowVoucherModal(false)}
                                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#888", fontWeight: "800" }}
                            >
                                ✕
                            </button>
                        </div>

                        {allAvailableVouchers.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {allAvailableVouchers.map((v, idx) => (
                                    <div
                                        key={v._id || idx}
                                        onClick={() => handleApplyVoucher(v.code)}
                                        style={{
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 12,
                                            padding: 15,
                                            cursor: "pointer",
                                            background: "#fff",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#fb4226"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e0e0"}
                                    >
                                        <div style={{ flex: 1, paddingRight: 10 }}>
                                            <span style={{
                                                fontSize: "0.6rem",
                                                fontWeight: "900",
                                                color: v.isTier ? "#e67e22" : "#fb4226",
                                                background: v.isTier ? "rgba(230,126,34,0.08)" : "rgba(251,66,38,0.08)",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                textTransform: "uppercase"
                                            }}>
                                                {v.isTier ? "HẠNG THÀNH VIÊN" : `VÍ QUÀ TẶNG`}
                                            </span>
                                            <h4 style={{ margin: "10px 0 5px 0", fontSize: "0.9rem", fontWeight: "800", color: "#333" }}>
                                                {v.isTier ? v.name : (
                                                    v.discountType === "Percentage" ? `Giảm giá ${v.discountValue}%` :
                                                        v.discountType === "FixedAmount" ? `Giảm giá ${v.discountValue.toLocaleString("vi-VN")}đ` :
                                                            v.discountType === "FreeTicket" ? `Tặng ${v.discountValue} Vé 2D Miễn Phí` : `Tặng ${v.discountValue} Combo Bắp Nước`
                                                )}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: "0.75rem", color: "#777", fontWeight: "600" }}>
                                                {v.isTier ? v.desc : `Đơn tối thiểu: ${v.minSpend.toLocaleString("vi-VN")}đ`}
                                            </p>
                                            <p style={{ margin: "5px 0 0 0", fontSize: "0.7rem", color: "#bbb", fontWeight: "700" }}>
                                                Hạn dùng: {new Date(v.expiryDate).toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                        <button
                                            style={{
                                                padding: "6px 12px",
                                                background: "#2e7d32",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 6,
                                                fontWeight: "800",
                                                fontSize: "0.75rem",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            CHỌN
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "#888", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                                Ví voucher của sếp hiện đang trống.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

// --- 💄 HỆ THỐNG STYLES LUXURY (GIỮ NGUYÊN 100% CỦA SẾP) ---
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