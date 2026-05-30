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

    // 💳 Các states hỗ trợ cổng thanh toán PayOS tự động
    const [checkoutUrl, setCheckoutUrl] = useState("");
    const [currentBookingId, setCurrentBookingId] = useState("");
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);
    const [holdCountdown, setHoldCountdown] = useState(null); // 5 phút giữ ghế (300 giây)
    const [payosBin, setPayosBin] = useState("");
    const [payosAccountNumber, setPayosAccountNumber] = useState("");
    const [payosAccountName, setPayosAccountName] = useState("");
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // 💥 Tự động tải thư viện Confetti (Pháo hoa giấy ăn mừng) chạy ngầm
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

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

    // 🔍 2B. Hàm xác thực giao dịch trực tiếp từ Backend kết nối PayOS SDK
    const verifyPaymentStatus = async (bId) => {
        try {
            const res = await axios.post("/bookings/verify-payment", { bookingId: bId });
            if (res.data.status === "Paid") {
                setIsCheckingPayment(false);
                setShowQR(false);
                setBill(res.data.booking);
                localStorage.removeItem("pendingBookingId");

                // 📡 Phát Socket thông báo cho toàn phòng chiếu cập nhật ghế đã bán
                if (socket) {
                    socket.emit("confirm_booking", {
                        showtimeId: id,
                        seats: seats.map(s => s.id)
                    });
                }

                // 💥 Bắn pháo hoa Confetti ăn mừng cực kỳ sang trọng
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                }
                showToast("Thanh toán thành công", "Thông tin vé đã được gửi về email của bạn.", "success");
                return true;
            } else if (res.data.status === "Cancelled") {
                setIsCheckingPayment(false);
                setShowQR(false);
                localStorage.removeItem("pendingBookingId");
                showToast("Giao dịch thất bại", "Hóa đơn thanh toán đã bị khách hàng hủy hoặc hết hạn sếp ơi!", "error");
                return true;
            }
            return false;
        } catch (err) {
            console.error("Lỗi xác nhận thanh toán:", err);
            return false;
        }
    };

    // 🔄 A. Tự động kiểm tra URL khi PayOS chuyển hướng (Redirect URL) quay về website
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get("status");
        const bookingIdParam = params.get("bookingId");

        if (statusParam && bookingIdParam) {
            // Xóa sạch Query Params trên thanh địa chỉ của trình duyệt để giữ thẩm mỹ
            window.history.replaceState({}, document.title, window.location.pathname);

            if (statusParam === "success") {
                setCurrentBookingId(bookingIdParam);
                setShowQR(true);
                setIsCheckingPayment(true);
                verifyPaymentStatus(bookingIdParam);
            } else {
                axios.post("/bookings/verify-payment", { bookingId: bookingIdParam }).catch(e => console.error(e));
            }
        }
    }, [id]);

    // ⏱️ B. Cơ chế đếm ngược thời gian thanh toán (5 phút giữ ghế xuyên suốt)
    // 1. Theo dõi thay đổi của danh sách ghế để reset hoặc tắt bộ đếm
    useEffect(() => {
        if (seats && seats.length > 0) {
            // Khi chọn ghế đầu tiên, đổi ghế hoặc thêm ghế: Tính thời gian lại (reset 5 phút)
            setHoldCountdown(300);
        } else {
            // Khi bỏ giữ ghế (không chọn ghế nào nữa): Tắt bộ đếm
            setHoldCountdown(null);
        }
    }, [seats]);

    // 2. Chạy đếm ngược mỗi giây và xử lý khi hết thời gian
    useEffect(() => {
        if (holdCountdown === null) return;

        if (holdCountdown === 0) {
            const handleHoldTimeout = async () => {
                try {
                    // Nếu đang thanh toán QR, hủy giao dịch trên server để nhả ghế
                    if (currentBookingId) {
                        await axios.post("/bookings/cancel", { bookingId: currentBookingId });
                    }
                } catch (err) {
                    console.error("Lỗi tự động hủy giao dịch khi hết hạn giữ ghế:", err);
                }

                // Nhả ghế cục bộ và quay về bước 1
                setSeats([]);
                setShowQR(false);
                setIsCheckingPayment(false);
                setStep(1);
                setHoldCountdown(null);
                localStorage.removeItem("pendingBookingId");

                // Phát tín hiệu Socket giải phóng màu ghế đang chọn cho những người dùng khác
                if (socket && id) {
                    socket.emit("selecting_seat", {
                        showtimeId: id,
                        userId: localStorage.getItem("userId"),
                        selectedSeats: []
                    });
                }

                // Hiện thông báo cao cấp (không dùng alert trình duyệt)
                showToast("⏰ Hết thời gian giữ ghế", "Đã hết thời gian giữ ghế 5 phút, phiên đặt vé của sếp đã bị hủy tự động!", "error");
            };

            handleHoldTimeout();
            return;
        }

        const timerId = setTimeout(() => {
            setHoldCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
        }, 1000);

        return () => clearTimeout(timerId);
    }, [holdCountdown, currentBookingId, id, socket]);

    // 📡 C. Vòng lặp Polling tự động gửi request kiểm tra trạng thái thanh toán mỗi 3 giây
    useEffect(() => {
        let intervalId;
        if (isCheckingPayment && currentBookingId) {
            intervalId = setInterval(() => {
                verifyPaymentStatus(currentBookingId);
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isCheckingPayment, currentBookingId]);

    useEffect(() => {
        const pendingId = localStorage.getItem("pendingBookingId");
        if (pendingId) {
            axios.post("/bookings/cancel", { bookingId: pendingId })
                .then(() => {
                    localStorage.removeItem("pendingBookingId");
                    if (socket && id) {
                        socket.emit("selecting_seat", {
                            showtimeId: id,
                            userId: localStorage.getItem("userId"),
                            selectedSeats: []
                        });
                    }
                })
                .catch(err => console.error("Lỗi tự động giải phóng đơn cũ khi reload:", err));
        }

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
    }, [id, socket]);

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
        fetchVoucherWallet();
    }, []);

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

            // Hiển thị modal chờ
            setShowQR(true);
            setCheckoutUrl("");
            setCurrentBookingId("");

            const res = await axios.post("/bookings/confirm", payload);
            console.log("📥 [FRONTEND] Nhận phản hồi đặt vé từ Backend:", res.data);

            // 🟢 Trường hợp vé miễn phí (Tổng tiền = 0đ)
            if (res.data.isFree) {
                setBill(res.data.booking);
                setShowQR(false);
                localStorage.removeItem("pendingBookingId");

                // 📡 Báo cho các máy khác cập nhật ghế thời gian thực
                if (socket) {
                    socket.emit("confirm_booking", {
                        showtimeId: id,
                        seats: seats.map(s => s.id)
                    });
                }

                // 💥 Bắn pháo hoa Confetti chúc mừng!
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                }
                showToast("Thanh toán thành công", "Vé miễn phí của sếp đã được xác nhận thành công!", "success");
            } else {
                // 🟢 Trường hợp thanh toán thông thường qua PayOS (Tổng tiền > 0)
                setCheckoutUrl(res.data.checkoutUrl);
                setPayosBin(res.data.bin || "");
                setPayosAccountNumber(res.data.accountNumber || "");
                setPayosAccountName(res.data.accountName || "");
                setCurrentBookingId(res.data.booking._id);
                localStorage.setItem("pendingBookingId", res.data.booking._id);
                setIsCheckingPayment(true);
            }

        } catch (err) {
            console.error("Lỗi đặt vé:", err);
            setShowQR(false);
            showToast("Lỗi hệ thống", "Có lỗi xảy ra khi tạo đơn đặt vé.", "error");
        }
    };

    // --- 🧾 GIAO DIỆN HÓA ĐƠN XỊN (GIỮ NGUYÊN TOÀN BỘ CHI TIẾT CỦA SẾP VÀ TRANG TRÍ VOUCHER) ---

    const toastElement = toastData && (
        <div className="cinema-custom-toast">
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
            <div style={billContainerStyle} className="booking-bill-container">
                <div style={billBoxStyle} className="booking-bill-box">
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
            <div style={{ padding: "40px", display: "flex", justifyContent: "center", gap: 30, background: "#fdfcf0", minHeight: "100vh" }} className="booking-page-container">
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleUp {
                        from { transform: scale(0.92); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes pulseGlow {
                        0% { box-shadow: 0 0 0 0 rgba(251, 66, 38, 0.45); }
                        70% { box-shadow: 0 0 0 10px rgba(251, 66, 38, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(251, 66, 38, 0); }
                    }
                    .cinema-custom-toast {
                        position: fixed;
                        top: 85px;
                        right: 30px;
                        background: rgba(30, 30, 30, 0.96);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #ffffff;
                        padding: 16px 24px;
                        border-radius: 16px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        z-index: 99999;
                        text-align: left;
                        width: 320px;
                        box-sizing: border-box;
                        animation: toastFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    @keyframes toastFadeIn {
                        from { transform: translateY(-20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @media (max-width: 768px) {
                        .cinema-custom-toast {
                            top: 20px !important;
                            left: 15px !important;
                            right: 15px !important;
                            width: calc(100% - 30px) !important;
                            max-width: none !important;
                            animation: toastFadeInMobile 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                        }
                        @keyframes toastFadeInMobile {
                            from { transform: translateY(-30px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                        .hold-timer-pill {
                            top: 12px !important;
                            left: 50% !important;
                            transform: translateX(-50%) !important;
                            right: auto !important;
                            box-shadow: 0 4px 12px rgba(251, 66, 38, 0.15) !important;
                            font-size: 11px !important;
                            padding: 6px 12px !important;
                            border-width: 1.5px !important;
                        }
                        .booking-page-container {
                            flex-direction: column !important;
                            padding: 15px 10px !important;
                            gap: 20px !important;
                        }
                        .booking-page-left {
                            padding: 20px 12px !important;
                            border-radius: 12px !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                        }
                        .booking-page-left h2 {
                            font-size: clamp(0.95rem, 4.2vw, 1.25rem) !important;
                            text-align: center !important;
                            white-space: nowrap !important;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-bottom: 20px !important;
                        }
                        .booking-page-summary {
                            width: 100% !important;
                            box-sizing: border-box !important;
                        }
                        .booking-snacks-grid {
                            grid-template-columns: 1fr !important;
                            gap: 15px !important;
                        }
                        .booking-snack-card {
                            padding: 10px !important;
                        }
                        
                        /* Responsive Bill & QR Modal */
                        .booking-bill-container {
                            padding: 20px 10px !important;
                        }
                        .booking-bill-box {
                            width: 100% !important;
                            max-width: 100% !important;
                            padding: 25px 15px !important;
                            box-sizing: border-box !important;
                        }
                        .booking-qr-modal-content {
                            width: 95% !important;
                            max-width: 95% !important;
                            padding: 20px 15px !important;
                            box-sizing: border-box !important;
                            overflow: hidden;
                        }
                    }
                `}</style>
                <div style={{ flex: 2, background: "#fff", padding: 30, borderRadius: 15, boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }} className="booking-page-left">
                    {step === 1 ? (
                        <div>
                            <h2 style={{ marginBottom: 20, textAlign: 'center' }}>CHỌN GHẾ NGỒI</h2>
                            <SeatMap onSelect={setSeats} selectedSeats={seats} showtimeId={id} roomPrice={roomPrice} socket={socket} />
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ color: "#fb4226", marginBottom: 25 }}>THÊM BẮP NƯỚC CHO PHIM HAY HƠN</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="booking-snacks-grid">
                                {availableSnacks.map(snack => (
                                    <div key={snack._id} style={snackCardStyle} className="booking-snack-card">
                                        <img src={snack.image ? `${import.meta.env.DEV ? "http://localhost:5000" : window.location.origin}${snack.image}` : ""} width="80" height="80" style={{ borderRadius: "8px", objectFit: 'cover' }} />
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

                <div style={summaryBoxStyle} className="booking-page-summary">
                    <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>TÓM TẮT ĐƠN HÀNG</span>
                        {holdCountdown !== null && !showQR && (
                            <span style={{
                                fontSize: "0.8rem",
                                color: holdCountdown < 60 ? "#d32f2f" : "#fb4226",
                                background: "rgba(251, 66, 38, 0.08)",
                                border: "1px solid rgba(251, 66, 38, 0.15)",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontWeight: "800"
                            }}>
                                Giữ: {Math.floor(holdCountdown / 60)}:{String(holdCountdown % 60).padStart(2, "0")}
                            </span>
                        )}
                    </h3>
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
                            {!appliedVoucher && (
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
                            <button onClick={handleConfirmPayment} style={btnStyle}>THANH TOÁN NGAY</button>
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>Quay lại chọn ghế</button>
                        </div>
                    )}
                </div>

                {showQR && (
                    <div style={modalOverlayStyle}>
                        <style>{`
                        @keyframes pulse {
                            0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(251, 66, 38, 0.4); }
                            70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(251, 66, 38, 0); }
                            100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(251, 66, 38, 0); }
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes blink {
                            50% { opacity: 0.4; }
                        }
                    `}</style>
                        <div style={{
                            ...modalContentStyle,
                            width: "480px",
                            padding: "30px 25px",
                            borderRadius: "24px",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                            background: "#ffffff",
                            border: "1px solid rgba(251, 66, 38, 0.15)",
                            position: "relative",
                            overflow: "hidden",
                            textAlign: "center"
                        }} className="booking-qr-modal-content">
                            {/* Hiệu ứng viền phát sáng nhẹ */}
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "6px",
                                background: "linear-gradient(90deg, #fb4226, #ff8a00)"
                            }}></div>

                            {/* Tiêu đề & Đồng hồ */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <span style={{ fontSize: "0.75rem", background: "rgba(251,66,38,0.1)", color: "#fb4226", padding: "4px 10px", borderRadius: "12px", fontWeight: "800" }}>
                                    CỔNG THANH TOÁN TỰ ĐỘNG
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>Giữ ghế:</span>
                                    <span style={{
                                        fontSize: "0.85rem",
                                        fontWeight: "800",
                                        color: holdCountdown < 60 ? "#d32f2f" : "#2e7d32",
                                        animation: holdCountdown < 60 ? "blink 1s infinite" : "none"
                                    }}>
                                        {holdCountdown !== null ? Math.floor(holdCountdown / 60) : 0}:
                                        {holdCountdown !== null ? String(holdCountdown % 60).padStart(2, "0") : "00"}
                                    </span>
                                </div>
                            </div>

                            <h3 style={{ margin: "0 0 15px 0", color: "#111", fontSize: "1.35rem", fontWeight: "900", letterSpacing: "-0.5px" }}>
                                QUÉT MÃ QR ĐỂ THANH TOÁN
                            </h3>

                            {/* HIỂN THỊ MÃ QR DỰA TRÊN THÔNG TIN PAYOS DYNAMIC */}
                            {payosBin && payosAccountNumber ? (
                                <div style={{ position: "relative", display: "inline-block", margin: "0 auto 15px" }}>
                                    <img
                                        src={`https://img.vietqr.io/image/${payosBin}-${payosAccountNumber}-compact2.png?amount=${discountedTotal}&addInfo=LUXCINEMA%20${String(currentBookingId).slice(-6)}&accountName=${encodeURIComponent(payosAccountName)}`}
                                        alt="Cổng thanh toán tự động VietQR"
                                        style={{
                                            width: "220px",
                                            height: "220px",
                                            display: "block",
                                            border: "4px solid rgba(251, 66, 38, 0.1)",
                                            borderRadius: "16px",
                                            padding: "8px",
                                            background: "#fff",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
                                        }}
                                    />
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-10px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "#fb4226",
                                        color: "#fff",
                                        fontSize: "0.68rem",
                                        fontWeight: "800",
                                        padding: "3px 10px",
                                        borderRadius: "10px",
                                        boxShadow: "0 4px 10px rgba(251,66,38,0.3)",
                                        whiteSpace: "nowrap"
                                    }}>
                                        QUÉT ĐỂ TỰ ĐỘNG CHUYỂN KHOẢN
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    height: "220px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    border: "2px dashed #eee",
                                    borderRadius: "16px",
                                    margin: "0 auto 15px",
                                    width: "220px"
                                }}>
                                    <span style={{
                                        width: "28px",
                                        height: "28px",
                                        border: "3px solid #eee",
                                        borderTop: "3px solid #fb4226",
                                        borderRadius: "50%",
                                        animation: "spin 0.8s linear infinite"
                                    }}></span>
                                    <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: "600" }}>Đang sinh mã QR...</span>
                                </div>
                            )}

                            {/* THÔNG TIN CHUYỂN KHOẢN CHI TIẾT ĐỂ COPY */}
                            <div style={{
                                background: "#f9f9fb",
                                padding: "15px",
                                borderRadius: "16px",
                                marginBottom: "20px",
                                border: "1px solid #f0f0f4",
                                textAlign: "left"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                                    <span style={{ color: "#777", fontWeight: "600" }}>Số tài khoản:</span>
                                    <span style={{ color: "#111", fontWeight: "800", letterSpacing: "0.5px" }}>
                                        {payosAccountNumber || "Đang tải..."}
                                        {payosAccountNumber && (
                                            <span
                                                onClick={() => {
                                                    navigator.clipboard.writeText(payosAccountNumber);
                                                    showToast("Đã sao chép", "Đã lưu số tài khoản vào khay nhớ tạm sếp ơi!", "success");
                                                }}
                                                style={{ color: "#fb4226", marginLeft: "6px", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }}
                                            >
                                                [Copy]
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                                    <span style={{ color: "#777", fontWeight: "600" }}>Tên người nhận:</span>
                                    <span style={{ color: "#111", fontWeight: "700" }}>{payosAccountName || "Đang tải..."}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                                    <span style={{ color: "#777", fontWeight: "600" }}>Số tiền:</span>
                                    <span style={{ color: "#fb4226", fontWeight: "900", fontSize: "0.9rem" }}>
                                        {discountedTotal.toLocaleString()} VND
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                                    <span style={{ color: "#777", fontWeight: "600" }}>Nội dung ck:</span>
                                    <span style={{ color: "#111", fontWeight: "800", color: "#2e7d32" }}>
                                        {currentBookingId ? `LUXCINEMA ${String(currentBookingId).slice(-6)}` : "Đang tải..."}
                                        {currentBookingId && (
                                            <span
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`LUXCINEMA ${String(currentBookingId).slice(-6)}`);
                                                    showToast("Đã sao chép", "Đã lưu nội dung chuyển khoản sếp ơi!", "success");
                                                }}
                                                style={{ color: "#fb4226", marginLeft: "6px", cursor: "pointer", textDecoration: "underline", fontSize: "0.75rem" }}
                                            >
                                                [Copy]
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Nút mở trực tiếp cổng liên kết cho điện thoại */}
                            {checkoutUrl && (
                                <a
                                    href={checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "block",
                                        textDecoration: "none",
                                        background: "linear-gradient(90deg, #fb4226, #ff6a00)",
                                        color: "#fff",
                                        borderRadius: "12px",
                                        fontWeight: "800",
                                        fontSize: "0.95rem",
                                        padding: "12px",
                                        boxShadow: "0 6px 20px rgba(251,66,38,0.25)",
                                        transition: "all 0.3s ease",
                                        marginBottom: "15px"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1.5px)"}
                                    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    MỞ APP NGÂN HÀNG THANH TOÁN ➔
                                </a>
                            )}

                            {/* Loader lắng nghe tự động chuyển khoản */}
                            <div style={{
                                paddingTop: "15px",
                                borderTop: "1px solid #eaeaea",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                color: "#666",
                                fontSize: "0.8rem",
                                fontWeight: "600"
                            }}>
                                <span style={{
                                    width: "14px",
                                    height: "14px",
                                    border: "2px solid #ddd",
                                    borderTop: "2px solid #fb4226",
                                    borderRadius: "50%",
                                    display: "inline-block",
                                    animation: "spin 0.8s linear infinite"
                                }}></span>
                                <span>Đang lắng nghe chuyển khoản tự động...</span>
                            </div>

                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    marginTop: "18px",
                                    color: "#999",
                                    fontSize: "0.82rem",
                                    fontWeight: "700",
                                    transition: "color 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = "#fb4226"}
                                onMouseOut={(e) => e.currentTarget.style.color = "#999"}
                            >
                                Quay lại trang đặt vé
                            </button>
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
                {/* 🛡️ Custom Premium Cancel Confirmation Modal */}
                {showCancelConfirm && (
                    <div style={customConfirmOverlayStyle}>
                        <div style={customConfirmBoxStyle}>
                            <div style={customConfirmHeaderStyle}>Xác nhận hủy</div>
                            <div style={customConfirmBodyStyle}>Bạn có chắc chắn muốn hủy giao dịch thanh toán vé này không?</div>
                            <div style={customConfirmFooterStyle}>
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    style={customConfirmCancelBtnStyle}
                                >
                                    Không
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowCancelConfirm(false);
                                        try {
                                            if (currentBookingId) {
                                                await axios.post("/bookings/cancel", { bookingId: currentBookingId });
                                            }
                                            setShowQR(false);
                                            setIsCheckingPayment(false);
                                            setStep(1);
                                        } catch (err) {
                                            console.error("Lỗi khi hủy giao dịch:", err);
                                        }
                                    }}
                                    style={customConfirmOkBtnStyle}
                                >
                                    Có
                                </button>
                            </div>
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

// 🛡️ Custom Premium Cancel Confirmation Modal Styles
const customConfirmOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    animation: "fadeIn 0.2s ease-out"
};

const customConfirmBoxStyle = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "380px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
    textAlign: "center",
    animation: "scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
};

const customConfirmHeaderStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "12px"
};

const customConfirmBodyStyle = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px",
    lineHeight: "1.5"
};

const customConfirmFooterStyle = {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
};

const customConfirmCancelBtnStyle = {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "#f5f5f5",
    color: "#555",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s"
};

const customConfirmOkBtnStyle = {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#fb4226",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s"
};

const holdTimerPillStyle = {
    position: "fixed",
    top: "100px",
    right: "30px",
    backgroundColor: "#ffffff",
    color: "#fb4226",
    border: "2px solid #fb4226",
    borderRadius: "30px",
    padding: "10px 20px",
    fontWeight: "bold",
    boxShadow: "0 8px 24px rgba(251, 66, 38, 0.2)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "14px",
    animation: "pulseGlow 2s infinite ease-in-out"
};