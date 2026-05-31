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

    // 🔍 THÊM MỚI: Các State hỗ trợ tìm Khách hàng và áp Voucher tại quầy
    const [searchKeyword, setSearchKeyword] = useState("");
    const [customer, setCustomer] = useState(null);
    const [myVouchers, setMyVouchers] = useState([]);
    const [userTier, setUserTier] = useState("NORMAL");
    const [userHistory, setUserHistory] = useState([]);
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [showVoucherModal, setShowVoucherModal] = useState(false);

    // 💳 Các states hỗ trợ cổng thanh toán PayOS tự động cho nhân viên
    const [showQR, setShowQR] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState("");
    const [currentBookingId, setCurrentBookingId] = useState("");
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);
    const [paymentCountdown, setPaymentCountdown] = useState(300);
    const [payosBin, setPayosBin] = useState("");
    const [payosAccountNumber, setPayosAccountNumber] = useState("");
    const [payosAccountName, setPayosAccountName] = useState("");

    // 🪟 State quản lý modal xác nhận tùy chỉnh (thay thế window.confirm)
    const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

    // 🔔 State và hàm quản lý thông báo Toast Custom thay thế alert()
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });
    const showToast = (message, type = "info") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => {
                if (prev.message === message) {
                    return { ...prev, show: false };
                }
                return prev;
            });
        }, 3500);
    };

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

    // ⏱️ Bộ đếm thời gian giữ ghế và tự động kiểm tra giao dịch PayOS dành cho nhân viên
    useEffect(() => {
        let timer;
        if (showQR && paymentCountdown > 0) {
            timer = setInterval(() => {
                setPaymentCountdown(prev => prev - 1);
            }, 1000);
        } else if (paymentCountdown === 0 && showQR) {
            if (currentBookingId) {
                axios.post("/bookings/cancel", { bookingId: currentBookingId })
                    .catch(err => console.error("Lỗi tự động hủy đơn hết hạn:", err));
            }
            showToast("Hết thời gian giữ vé! Ghế của khách đã tự động được giải phóng.", "warning");
            setShowQR(false);
            setIsCheckingPayment(false);
        }
        return () => clearInterval(timer);
    }, [showQR, paymentCountdown, currentBookingId]);

    useEffect(() => {
        let interval;
        if (isCheckingPayment && currentBookingId) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.post("/bookings/verify-payment", { bookingId: currentBookingId });
                    if (res.data.status === "Paid") {
                        clearInterval(interval);
                        setIsCheckingPayment(false);
                        setShowQR(false);
                        setBill(res.data.booking);

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
                    }
                } catch (err) {
                    console.error("Lỗi kiểm tra thanh toán:", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isCheckingPayment, currentBookingId]);

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
                discountType: v.type,
                discountValue: remaining,
                minSpend: 0,
                expiryDate: new Date("2026-12-31"),
                isTier: true,
                name: v.name,
                desc: v.desc
            });
        }
    });

    const allAvailableVouchers = [...unusedTierVouchers, ...myVouchers];

    const handleSearchCustomer = async () => {
        if (!searchKeyword.trim()) return showToast("Vui lòng nhập SĐT hoặc Email khách hàng sếp ơi!", "warning");
        try {
            const res = await axios.get(`/users/find-customer?keyword=${searchKeyword}`);
            setCustomer(res.data);
            setUserTier(res.data.membershipTier || "NORMAL");

            const [voucherRes, bookingRes] = await Promise.all([
                axios.get(`/vouchers/my-vouchers?userId=${res.data._id}`),
                axios.get(`/bookings/user/${res.data._id}`)
            ]);
            setMyVouchers(voucherRes.data.filter(v => !v.used));
            setUserHistory(bookingRes.data || []);
            showToast(`Tìm thấy khách hàng: ${res.data.name} (${res.data.membershipTier})`, "success");
        } catch (err) {
            console.error("Lỗi tìm khách hàng:", err);
            showToast(err.response?.data || "Không tìm thấy khách hàng này!", "error");
            setCustomer(null);
            setMyVouchers([]);
            setUserHistory([]);
            setUserTier("NORMAL");
        }
    };

    const handleApplyVoucher = async (codeToApply) => {
        const targetCode = codeToApply || voucherCode;
        if (!targetCode) {
            setVoucherError("Vui lòng nhập mã voucher sếp ơi!");
            return;
        }
        if (!customer) {
            setVoucherError("Vui lòng tìm kiếm Khách hàng trước khi áp dụng voucher!");
            return;
        }

        try {
            setVoucherError("");
            const res = await axios.post("/vouchers/apply", {
                code: targetCode,
                totalAmount: totalAmount,
                ticketTotal: ticketTotal,
                snackTotal: snackTotal,
                seatsCount: seats.length,
                seats: seats,
                userId: customer._id
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

    const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
    const discountedTotal = Math.max(0, totalAmount - discountAmount);

    const handleConfirmCash = async () => {
        const finalPrice = appliedVoucher ? discountedTotal : totalAmount;
        setConfirmModal({
            show: true,
            message: `Xác nhận đã thu ${finalPrice.toLocaleString()}đ tiền mặt từ khách chứ?`,
            onConfirm: () => _doCashPayment(finalPrice)
        });
        return;
    };

    const _doCashPayment = async (finalPrice) => {

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
                    price: 0
                });
            }

            const payload = {
                showtimeId: id,
                userId: customer ? customer._id : staffId,
                seats: seats.map(s => s.id),
                snacks: snackList,
                totalAmount: finalPrice,
                appliedVoucher: appliedVoucher ? appliedVoucher.code : undefined,
                discountAmount: discountAmount,
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


        } catch (err) {
            console.error("Lỗi bán vé tại quầy:", err);
            showToast("❌ Lỗi hệ thống khi tạo vé!", "error");
        }
    };

    const handleConfirmTransfer = async () => {
        const finalPrice = appliedVoucher ? discountedTotal : totalAmount;
        if (finalPrice === 0) {
            // Nếu vé 0đ thì cho phép nhận vé luôn không cần QR
            return handleConfirmCash();
        }

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
                    price: 0
                });
            }

            const payload = {
                showtimeId: id,
                userId: customer ? customer._id : staffId,
                seats: seats.map(s => s.id),
                snacks: snackList,
                totalAmount: finalPrice,
                appliedVoucher: appliedVoucher ? appliedVoucher.code : undefined,
                discountAmount: discountAmount
            };

            // Hiển thị modal chờ và reset bộ đếm thời gian
            setPaymentCountdown(300);
            setShowQR(true);
            setCheckoutUrl("");
            setCurrentBookingId("");

            const res = await axios.post("/bookings/confirm", payload);

            // Gán thông tin ngân hàng ảo PayOS
            setCheckoutUrl(res.data.checkoutUrl);
            setPayosBin(res.data.bin || "");
            setPayosAccountNumber(res.data.accountNumber || "");
            setPayosAccountName(res.data.accountName || "");
            setCurrentBookingId(res.data.booking._id);
            setIsCheckingPayment(true);
        } catch (err) {
            console.error("Lỗi tạo liên kết chuyển khoản:", err);
            setShowQR(false);
            showToast("❌ Lỗi hệ thống khi tạo liên kết PayOS QR!", "error");
        }
    };

    const handlePrint = () => {
        if (!bill || !showtime) return;

        const ticketHTML = `
            <html>
                <head>
                    <title>In vé - Cinema Lux</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800;900&display=swap');
                        body { 
                            margin: 0; padding: 20px; 
                            font-family: 'Be Vietnam Pro', sans-serif; 
                            color: #1a1a1a;
                            width: 385px; 
                            height: 96vh;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            overflow: hidden;
                            background: #fff;
                        }
                        .header-banner { background: #fb4226; color: #fff; padding: 12px 10px; text-align: center; border-radius: 10px; }
                        .header-brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
                        .header-sub { font-size: 8px; opacity: 0.8; font-weight: 600; margin-top: 3px; }
                        .id-section { text-align: center; margin: 10px 0; }
                        .label-id { font-size: 9px; color: #888; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                        .booking-id { font-size: 26px; font-weight: 900; color: #000; margin: 2px 0; letter-spacing: 1px; }
                        .divider { border-top: 2px dashed #eee; margin: 8px 0; }
                        .movie-info { margin-bottom: 5px; }
                        .movie-title { font-size: 16px; font-weight: 900; line-height: 1.2; color: #000; margin-bottom: 8px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                        .info-item .label { font-size: 9px; color: #999; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
                        .info-item .value { font-size: 13px; font-weight: 700; color: #333; }
                        .seats-area { margin-top: 8px; padding: 8px; background: #fff5f5; border-radius: 6px; border-left: 4px solid #fb4226; }
                        .seats-label { font-size: 9px; color: #fb4226; font-weight: 800; margin-bottom: 2px; }
                        .seats-value { font-size: 16px; font-weight: 900; color: #fb4226; }
                        .snacks-section { margin-top: 8px; }
                        .snack-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; font-weight: 600; color: #444; }
                        .total-area { margin-top: 8px; display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 2px solid #000; }
                        .total-label { font-size: 12px; font-weight: 800; color: #000; }
                        .total-value { font-size: 20px; font-weight: 900; color: #000; }
                        .footer { text-align: center; padding-top: 10px; border-top: 1px dashed #eee; margin-top: auto; }
                        .footer-msg { font-weight: 800; font-size: 10px; color: #000; letter-spacing: 0.2px; }
                        .footer-time { font-size: 8px; color: #999; margin-top: 3px; font-weight: 600; }
                        @page { margin: 0; size: auto; }
                    </style>
                </head>
                <body>
                    <div class="header-banner">
                        <div class="header-brand">CINEMA LUX</div>
                        <div class="header-sub">PREMIUM CINEMA EXPERIENCE</div>
                    </div>
                    <div class="id-section">
                        <div class="label-id">BOOKING ID</div>
                        <div class="booking-id">${bill._id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div class="movie-info">
                        <div class="movie-title">${showtime?.movieId?.title?.toUpperCase()}</div>
                        <div class="info-grid">
                            <div class="info-item"><span class="label">TIME:</span><span class="value">${new Date(showtime?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div class="info-item"><span class="label">ROOM:</span><span class="value">${showtime?.roomId?.name}</span></div>
                            <div class="info-item"><span class="label">DATE:</span><span class="value">${new Date(showtime?.time).toLocaleDateString('vi-VN')}</span></div>
                            <div class="info-item"><span class="label">TYPE:</span><span class="value">${showtime?.roomId?.type || "STANDARD"}</span></div>
                        </div>
                        <div class="seats-area"><div class="seats-label">SEATS / GHẾ</div><div class="seats-value">${bill.seats?.join(", ")}</div></div>
                    </div>
                    ${bill.snacks?.length > 0 ? `
                        <div class="snacks-section">
                            <div class="divider"></div>
                            <div class="label-id" style="margin-bottom: 8px;">CONCESSIONS</div>
                            ${bill.snacks.map(s => `
                                <div class="snack-row"><span>${s.name} x${s.quantity}</span><span>${s.price === 0 ? "Quà tặng" : (s.price * s.quantity).toLocaleString() + 'đ'}</span></div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${bill.appliedVoucher ? `
                        <div class="divider"></div>
                        <div class="snack-row" style="color: #777; font-size: 11px; font-weight: 500;"><span>Voucher đã dùng:</span><span style="text-transform: uppercase;">${bill.appliedVoucher}</span></div>
                        <div class="snack-row" style="color: #777; font-size: 11px; font-weight: 500;"><span>Giảm giá voucher:</span><span>${bill.discountAmount > 0 ? '-' + bill.discountAmount.toLocaleString() + 'đ' : 'Quà tặng'}</span></div>
                    ` : ''}
                    <div class="total-area"><div class="total-label">TOTAL AMOUNT</div><div class="total-value">${bill.totalAmount?.toLocaleString()}đ</div></div>
                    <div class="footer"><div class="footer-msg">CHÚC SẾP XEM PHIM VUI VẺ TẠI CINEMA LUX!</div><div class="footer-time">Printed at: ${new Date().toLocaleString('vi-VN')}</div></div>
                </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0'; iframe.style.bottom = '0';
        iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open(); doc.write(ticketHTML); doc.close();

        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }, 500);
    };

    if (bill) return (
        <div style={{ ...billContainerStyle, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            <div className="fade-in-up" style={{ ...webCardStyle, width: '450px' }}>
                <div style={ticketHeaderRedWeb}>
                    <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#fff', fontWeight: '800', letterSpacing: '1.5px' }}>THÔNG TIN VÉ XEM PHIM</h3>
                </div>

                <div style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <p style={labelSmallWeb}>MÃ ĐẶT VÉ</p>
                            <h2 style={{ margin: '2px 0 0 0', fontWeight: '900', color: '#fb4226', fontSize: '1.8rem' }}>{bill._id.slice(-8).toUpperCase()}</h2>
                            <p style={{ ...labelSmallWeb, marginTop: '15px' }}>SUẤT CHIẾU</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1a1a1a', margin: '2px 0' }}>
                                {new Date(showtime?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(showtime?.time).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        <div style={qrBoxStyleWeb}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${bill._id}`} style={{ width: '80px', borderRadius: '8px' }} alt="QR" />
                        </div>
                    </div>

                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
                        <p style={labelSmallWeb}>PHIM ĐANG CHIẾU</p>
                        <h3 style={{ margin: '5px 0 15px 0', fontSize: '1.4rem', fontWeight: '900', color: '#000', lineHeight: '1.2' }}>{showtime?.movieId?.title?.toUpperCase()}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            <div><p style={labelSmallWeb}>PHÒNG</p><p style={infoValueWeb}>{showtime?.roomId?.name}</p></div>
                            <div><p style={labelSmallWeb}>LOẠI</p><p style={infoValueWeb}>{showtime?.roomId?.type || "Standard"}</p></div>
                            <div><p style={labelSmallWeb}>GHẾ</p><p style={{ ...infoValueWeb, color: '#fb4226' }}>{bill.seats?.join(", ")}</p></div>
                        </div>
                    </div>

                    {bill.snacks?.length > 0 && (
                        <div style={snackBoxStyleWeb}>
                            <p style={{ ...labelSmallWeb, color: '#666', marginBottom: '10px' }}>BẮP NƯỚC ĐÃ ĐẶT:</p>
                            {bill.snacks.map((s, i) => (
                                <div key={i} style={snackRowWeb}>
                                    <span>{s.name} x{s.quantity}</span>
                                    <b>{s.price === 0 ? "Quà tặng" : `${(s.price * s.quantity).toLocaleString()}đ`}</b>
                                </div>
                            ))}
                        </div>
                    )}

                    {bill.appliedVoucher && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#777", fontSize: "0.9rem", marginTop: "15px" }}>
                            <span>Voucher đã dùng:</span>
                            <span style={{ textTransform: "uppercase" }}>{bill.appliedVoucher}</span>
                        </div>
                    )}
                    {(bill.discountAmount > 0 || (bill.appliedVoucher && bill.appliedVoucher.includes("BIRTHDAY-COMBO")) || bill.snacks?.some(s => s.price === 0)) && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#777", fontSize: "0.9rem" }}>
                            <span>Giảm giá voucher:</span>
                            <span>
                                {bill.discountAmount > 0
                                    ? `-${bill.discountAmount.toLocaleString()}đ`
                                    : "Quà tặng"}
                            </span>
                        </div>
                    )}

                    <div style={{ borderTop: '2px solid #1a1a1a', marginTop: '25px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#888' }}>TỔNG THANH TOÁN</span>
                        <b style={{ color: '#fb4226', fontSize: '2rem', fontWeight: '900' }}>{bill.totalAmount?.toLocaleString()}đ</b>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '15px', padding: '0 30px 30px 30px' }}>
                    <button onClick={handlePrint} style={printBtnStyleWeb}>IN VÉ GIẤY</button>
                    <button onClick={() => navigate("/staff/pos")} style={resetBtnStyleWeb}>HOÀN TẤT</button>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.6; } }
                .fade-in-up { animation: fadeInUp 0.4s ease-out; }
                @media print { .no-print { display: none !important; } }
            `}</style>
        </div>
    );


    return (
        <div className="staff-booking-wrapper">
            <style>{`
                /* --- HỆ THỐNG CSS RESPONSIVE BÁN VÉ TẠI QUẦY --- */
                .checkout-btn-cash,
                .checkout-btn-qr {
                    transition: all 0.25s ease-in-out !important;
                }
                .checkout-btn-cash:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35) !important;
                    filter: brightness(1.05);
                }
                .checkout-btn-cash:active {
                    transform: translateY(0);
                }
                .checkout-btn-qr:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35) !important;
                    filter: brightness(1.05);
                }
                .checkout-btn-qr:active {
                    transform: translateY(0);
                }

                .staff-booking-wrapper {
                    padding: 40px;
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    background: #f5f5f5;
                    min-height: 100vh;
                    box-sizing: border-box;
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .staff-booking-left {
                    flex: 2;
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    box-sizing: border-box;
                    min-width: 0;
                    width: 100%;
                }

                .staff-booking-right {
                    width: 300px;
                    background: #fff;
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    height: fit-content;
                    box-sizing: border-box;
                    flex-shrink: 0;
                }

                .staff-booking-header {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    margin-bottom: 20px;
                    width: 100%;
                }

                .staff-booking-back-btn {
                    justify-self: start;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    color: #475569;
                    fontWeight: 700;
                    fontSize: 0.88rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                .staff-booking-back-btn:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .staff-booking-title {
                    margin: 0;
                    color: #fb4226;
                    font-size: 1.4rem;
                    font-weight: 900;
                    text-align: center;
                    justify-self: center;
                }

                .staff-booking-step-badge {
                    justify-self: end;
                    padding: 5px 15px;
                    background: #eee;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .staff-snacks-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    width: 100%;
                }

                /* --- 📱 CSS RESPONSIVE TRANG ĐẶT GHẾ MOBILE CỰC MẠNH --- */
                @media (max-width: 768px) {
                    /* Khóa cứng main area của Staff bằng vw chống phình tuyệt đối */
                    .staff-main {
                        padding: 8px !important;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        box-sizing: border-box !important;
                        overflow-x: hidden !important;
                    }

                    /* Khóa cứng hộp trắng content box ngoài cùng bằng vw */
                    .staff-content-box {
                        padding: 10px !important;
                        width: calc(100vw - 16px) !important;
                        max-width: calc(100vw - 16px) !important;
                        box-sizing: border-box !important;
                        overflow-x: hidden !important;
                        border-radius: 8px !important;
                        background: #fff !important;
                        box-shadow: none !important;
                    }

                    /* Khóa cứng wrapper của booking, triệt tiêu padding thừa */
                    .staff-booking-wrapper {
                        padding: 0 !important;
                        margin: 0 !important;
                        flex-direction: column !important;
                        gap: 15px !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        background: transparent !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }

                    /* Khóa cứng hộp trắng booking bên trong, loại bỏ nền trắng trùng lặp */
                    .staff-booking-left {
                        padding: 5px 0 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        min-width: 0 !important;
                        overflow: hidden !important;
                    }

                    /* Khóa cứng container của SeatMap */
                    .booking-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 15px 5px !important;
                        box-sizing: border-box !important;
                        background: #fdfcf0 !important;
                        border-radius: 8px !important;
                        margin: 0 auto !important;
                        overflow: hidden !important;
                    }

                    .staff-booking-right {
                        width: 100% !important;
                        padding: 20px 15px !important;
                        border-radius: 12px !important;
                        margin-top: 5px !important;
                        box-sizing: border-box !important;
                    }

                    .staff-booking-header {
                        display: grid !important;
                        grid-template-columns: 1fr auto 1fr !important;
                        align-items: center !important;
                        margin-bottom: 15px !important;
                        padding: 0 2px !important;
                        width: 100% !important;
                    }

                    .staff-booking-title {
                        font-size: 1.0rem !important;
                        white-space: nowrap !important;
                        text-align: center !important;
                        justify-self: center !important;
                    }

                    .staff-booking-back-btn {
                        justify-self: start !important;
                        padding: 6px 8px !important;
                        font-size: 0.75rem !important;
                        border-radius: 8px !important;
                        white-space: nowrap !important;
                        gap: 4px !important;
                    }

                    .staff-booking-step-badge {
                        justify-self: end !important;
                        padding: 4px 8px !important;
                        font-size: 0.7rem !important;
                        white-space: nowrap !important;
                    }

                    .staff-snacks-grid {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }

                    .staff-qr-modal-content {
                        width: 95% !important;
                        max-width: 95% !important;
                        padding: 20px 15px !important;
                        border-radius: 16px !important;
                        box-sizing: border-box !important;
                    }

                    .custom-toast {
                        right: auto !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        width: calc(100% - 32px) !important;
                        max-width: 340px !important;
                        text-align: center !important;
                        justify-content: center !important;
                        padding: 12px 20px !important;
                        font-size: 0.85rem !important;
                        top: 20px !important;
                    }
                }
            `}</style>

            <div className="staff-booking-left">
                <div className="staff-booking-header">
                    <button
                        onClick={() => navigate("/staff/pos")}
                        className="staff-booking-back-btn"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Quay lại
                    </button>

                    <h2 className="staff-booking-title">BÁN VÉ TẠI QUẦY</h2>

                    <span className="staff-booking-step-badge">Bước {step}/2</span>
                </div>

                {step === 1 ? (
                    <SeatMap
                        onSelect={setSeats}
                        selectedSeats={seats}
                        showtimeId={id}
                        roomPrice={showtime?.roomId?.price || 0}
                        socket={socket}
                    />
                ) : (
                    <div className="staff-snacks-grid">
                        {availableSnacks.map(snack => (
                            <div key={snack._id} style={snackCardStyle}>
                                <img src={`${import.meta.env.DEV ? "http://localhost:5000" : window.location.origin}${snack.image}`} width="60" height="60" style={{ borderRadius: "8px", objectFit: 'cover' }} />
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

            <div className="staff-booking-right">
                <h3 style={{ borderBottom: "2px solid #fb4226", paddingBottom: 10 }}>ĐƠN HÀNG MỚI</h3>
                <p style={{ fontSize: '0.9rem' }}>Phim: <b>{showtime?.movieId?.title}</b></p>
                <p style={{ fontSize: '0.9rem' }}>Ghế: <b style={{ color: "#fb4226" }}>{seats.map(s => s.id).join(", ") || "Chưa chọn"}</b></p>

                {/* 🔍 TÌM KIẾM KHÁCH HÀNG & ÁP VOUCHER TẠI QUẦY */}
                <div style={{ borderTop: "1px dashed #ddd", paddingTop: 15, marginTop: 15 }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}>KHÁCH HÀNG (THÀNH VIÊN)</p>
                    {customer ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "8px 12px", borderRadius: 8, border: "1px solid #bbf7d0", marginBottom: 10 }}>
                            <div>
                                <b style={{ fontSize: "0.85rem", color: "#166534" }}>{customer.name}</b>
                                <div style={{ fontSize: "0.75rem", color: "#15803d" }}>Hạng: {customer.membershipTier}</div>
                            </div>
                            <button onClick={() => { setCustomer(null); setMyVouchers([]); setUserTier("NORMAL"); setUserHistory([]); handleRemoveVoucher(); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Hủy</button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                            <input
                                type="text"
                                placeholder="SĐT hoặc Email..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: "0.8rem" }}
                            />
                            <button onClick={handleSearchCustomer} style={{ padding: "6px 12px", background: "#333", color: "#fff", border: "none", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer", fontWeight: "bold" }}>Tìm</button>
                        </div>
                    )}
                </div>

                {customer && (
                    <div style={{ borderTop: "1px dashed #ddd", paddingTop: 15, marginTop: 15 }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}>MÃ GIẢM GIÁ / VOUCHER</p>
                        {appliedVoucher ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef9c3", padding: "8px 12px", borderRadius: 8, border: "1px solid #fef08a", marginBottom: 10 }}>
                                <div>
                                    <b style={{ fontSize: "0.85rem", color: "#854d0e", textTransform: "uppercase" }}>{appliedVoucher.code}</b>
                                    <div style={{ fontSize: "0.75rem", color: "#a16207" }}>
                                        {appliedVoucher.discountType === "FreeTicket" ? "Miễn phí vé" : appliedVoucher.discountType === "FreeSnack" ? "Tặng bắp nước" : `Giảm -${appliedVoucher.discountAmount.toLocaleString()}đ`}
                                    </div>
                                </div>
                                <button onClick={handleRemoveVoucher} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Hủy</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã voucher..."
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                        style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: "0.8rem", textTransform: "uppercase" }}
                                    />
                                    <button onClick={() => handleApplyVoucher()} style={{ padding: "6px 12px", background: "#fb4226", color: "#fff", border: "none", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer", fontWeight: "bold" }}>Áp</button>
                                </div>
                                {voucherError && <p style={{ color: "#dc2626", fontSize: "0.75rem", margin: "4px 0" }}>{voucherError}</p>}

                                {allAvailableVouchers.length > 0 && (
                                    <button onClick={() => setShowVoucherModal(true)} style={{ width: "100%", padding: "6px", background: "#eee", color: "#333", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold", marginTop: 5 }}>
                                        Chọn từ kho voucher ({allAvailableVouchers.length})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 20, background: '#f9f9f9', padding: 15, borderRadius: 10 }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>THÀNH TIỀN</p>
                    {appliedVoucher ? (
                        <>
                            <h5 style={{ color: "#888", textDecoration: "line-through", margin: "5px 0 0 0", fontSize: "0.95rem" }}>
                                {totalAmount.toLocaleString()}đ
                            </h5>
                            <h5 style={{ color: "#fb4226", margin: "2px 0 0 0", fontSize: "0.8rem", fontWeight: "800" }}>
                                Giảm giá voucher: -{discountAmount.toLocaleString()}đ
                            </h5>
                            <h2 style={{ color: "#fb4226", margin: 0 }}>{discountedTotal.toLocaleString()}đ</h2>
                        </>
                    ) : (
                        <h2 style={{ color: "#fb4226", margin: 0 }}>{totalAmount.toLocaleString()}đ</h2>
                    )}
                </div>

                {step === 1 ? (
                    <button disabled={seats.length === 0} onClick={() => setStep(2)}
                        style={{ ...btnStyle, marginTop: 20, opacity: seats.length > 0 ? 1 : 0.5 }}>
                        CHỌN BẮP NƯỚC ➔
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                        <button 
                            onClick={handleConfirmCash} 
                            style={{ 
                                ...btnStyle, 
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                                padding: "14px", 
                                fontSize: "0.9rem", 
                                fontWeight: "800", 
                                borderRadius: "12px",
                                border: "none",
                                color: "#fff",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                            }}
                            className="checkout-btn-cash"
                        >
                            THANH TOÁN TIỀN MẶT
                        </button>
                        <button 
                            onClick={handleConfirmTransfer} 
                            style={{ 
                                ...btnStyle, 
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                                padding: "14px", 
                                fontSize: "0.9rem", 
                                fontWeight: "800", 
                                borderRadius: "12px",
                                border: "none",
                                color: "#fff",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                            }}
                            className="checkout-btn-qr"
                        >
                            QUÉT MÃ CHUYỂN KHOẢN (QR)
                        </button>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontWeight: "bold", fontSize: "0.8rem", marginTop: 5 }}>
                            Quay lại chọn ghế
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Chọn Kho Voucher của Khách */}
            {showVoucherModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", padding: 25, borderRadius: 15, width: "92%", maxWidth: "400px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 10px 35px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 15 }}>
                            <h3 style={{ margin: 0, color: "#333" }}>Kho Voucher Khách Hàng</h3>
                            <button onClick={() => setShowVoucherModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold", color: "#999" }}>&times;</button>
                        </div>
                        {allAvailableVouchers.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#888", fontSize: "0.9rem" }}>Khách hàng chưa có voucher nào!</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {allAvailableVouchers.map(v => (
                                    <div key={v._id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" }}>
                                        <div style={{ flex: 1, paddingRight: 10 }}>
                                            <b style={{ color: "#fb4226", fontSize: "0.85rem", textTransform: "uppercase" }}>{v.code}</b>
                                            <div style={{ fontSize: "0.8rem", fontWeight: "bold", margin: "2px 0", color: "#333" }}>{v.name || "Voucher cá nhân"}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#666" }}>{v.desc || `Đơn tối thiểu từ ${(v.minSpend || 0).toLocaleString()}đ`}</div>
                                            <div style={{ fontSize: "0.7rem", color: "#999", marginTop: 4 }}>Hạn dùng: {new Date(v.expiryDate).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <button
                                            onClick={() => handleApplyVoucher(v.code)}
                                            style={{ padding: "6px 12px", background: "#fb4226", color: "#fff", border: "none", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer", fontWeight: "bold" }}
                                        >
                                            Chọn
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🖥️ CỔNG THANH TOÁN TỰ ĐỘNG PAYOS (DYNAMIC DUAL-QR) CHO NHÂN VIÊN */}
            {showQR && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 2000,
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    <div className="staff-qr-modal-content" style={{
                        background: "#ffffff",
                        width: "440px",
                        borderRadius: "24px",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                        padding: "30px",
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.8)"
                    }}>
                        {/* Thanh chỉ màu phong cách Lux */}
                        <div style={{
                            position: "absolute",
                            top: 0, left: 0, right: 0,
                            height: "6px",
                            background: "linear-gradient(90deg, #fb4226, #ff8a00)"
                        }}></div>

                        {/* Tiêu đề & Đồng hồ */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <span style={{ fontSize: "0.72rem", background: "rgba(251,66,38,0.1)", color: "#fb4226", padding: "4px 10px", borderRadius: "12px", fontWeight: "800" }}>
                                THANH TOÁN TẠI QUẦY (PAYOS)
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.72rem", color: "#666", fontWeight: "600" }}>Giữ ghế:</span>
                                <span style={{
                                    fontSize: "0.82rem",
                                    fontWeight: "800",
                                    color: paymentCountdown < 60 ? "#d32f2f" : "#2e7d32"
                                }}>
                                    {Math.floor(paymentCountdown / 60)}:
                                    {String(paymentCountdown % 60).padStart(2, "0")}
                                </span>
                            </div>
                        </div>

                        <h3 style={{ margin: "0 0 15px 0", color: "#111", fontSize: "1.25rem", fontWeight: "900", letterSpacing: "-0.5px" }}>
                            MÃ QR CHUYỂN KHOẢN ĐỘNG
                        </h3>

                        {/* HIỂN THỊ MÃ QR */}
                        {payosBin && payosAccountNumber ? (
                            <div style={{ position: "relative", display: "inline-block", margin: "0 auto 15px" }}>
                                <img
                                    src={`https://img.vietqr.io/image/${payosBin}-${payosAccountNumber}-compact2.png?amount=${appliedVoucher ? discountedTotal : totalAmount}&addInfo=LUXCINEMA%20${String(currentBookingId).slice(-6)}&accountName=${encodeURIComponent(payosAccountName)}`}
                                    alt="VietQR PayOS"
                                    style={{
                                        width: "210px",
                                        height: "210px",
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
                                    fontSize: "0.65rem",
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
                                height: "210px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                border: "2px dashed #eee",
                                borderRadius: "16px",
                                margin: "0 auto 15px",
                                width: "210px"
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

                        {/* THÔNG TIN CHUYỂN KHOẢN CHI TIẾT */}
                        <div style={{
                            background: "#f9f9fb",
                            padding: "15px",
                            borderRadius: "16px",
                            marginBottom: "20px",
                            border: "1px solid #f0f0f4",
                            textAlign: "left"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.8rem" }}>
                                <span style={{ color: "#777", fontWeight: "600" }}>Số tài khoản:</span>
                                <span style={{ color: "#111", fontWeight: "800", letterSpacing: "0.5px" }}>
                                    {payosAccountNumber || "Đang tải..."}
                                    {payosAccountNumber && (
                                        <span
                                            onClick={() => {
                                                navigator.clipboard.writeText(payosAccountNumber);
                                                showToast("Đã sao chép Số tài khoản thành công!", "success");
                                            }}
                                            style={{ color: "#fb4226", marginLeft: "8px", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                                        >
                                            Copy
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.8rem" }}>
                                <span style={{ color: "#777", fontWeight: "600" }}>Tên người nhận:</span>
                                <span style={{ color: "#111", fontWeight: "800" }}>
                                    {payosAccountName || "Đang tải..."}
                                </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.8rem" }}>
                                <span style={{ color: "#777", fontWeight: "600" }}>Số tiền:</span>
                                <span style={{ color: "#fb4226", fontWeight: "900" }}>
                                    {(appliedVoucher ? discountedTotal : totalAmount).toLocaleString()} VND
                                </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                                <span style={{ color: "#777", fontWeight: "600" }}>Nội dung ck:</span>
                                <span style={{ color: "#111", fontWeight: "800" }}>
                                    {currentBookingId ? `LUXCINEMA ${String(currentBookingId).slice(-6)}` : "Đang tải..."}
                                    {currentBookingId && (
                                        <span
                                            onClick={() => {
                                                navigator.clipboard.writeText(`LUXCINEMA ${String(currentBookingId).slice(-6)}`);
                                                showToast("Đã sao chép Nội dung chuyển khoản thành công!", "success");
                                            }}
                                            style={{ color: "#fb4226", marginLeft: "8px", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                                        >
                                            Copy
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* LẮNG NGHE CHUYỂN KHOẢN */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "0.8rem", color: "#666", marginBottom: "20px" }}>
                            <span style={{
                                width: "8px", height: "8px", borderRadius: "50%", background: "#2e7d32",
                                animation: "pulse 1.2s infinite ease-in-out"
                            }}></span>
                            <span>Hệ thống đang kiểm tra giao dịch tự động...</span>
                        </div>

                        {/* HỦY GIAO DỊCH */}
                        <button
                            onClick={() => {
                                setConfirmModal({
                                    show: true,
                                    message: "Bạn có chắc chắn muốn hủy giao dịch chuyển khoản này không?",
                                    onConfirm: async () => {
                                        try {
                                            if (currentBookingId) {
                                                await axios.post("/bookings/cancel", { bookingId: currentBookingId });
                                            }
                                            setShowQR(false);
                                            setIsCheckingPayment(false);
                                        } catch (err) {
                                            console.error("Lỗi khi hủy giao dịch:", err);
                                        }
                                    }
                                });
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                background: "#f5f5f7",
                                color: "#555",
                                border: "none",
                                borderRadius: "12px",
                                fontWeight: "800",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                transition: "all 0.2s"
                            }}
                        >
                            Quay lại trang đặt vé
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MODAL XÁC NHẬN NỔI - Thay thế window.confirm() */}
            {confirmModal.show && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(6px)",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    zIndex: 9999,
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "20px",
                        padding: "35px 30px",
                        width: "92%",
                        maxWidth: "400px",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                        textAlign: "center",
                        position: "relative",
                        animation: "scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                            display: "flex", justifyContent: "center", alignItems: "center",
                            margin: "0 auto 20px auto", fontSize: "1.8rem"
                        }}>
                            ⚠️
                        </div>

                        <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", fontWeight: "900", color: "#1e293b" }}>
                            Xác nhận
                        </h3>
                        <p style={{ margin: "0 0 28px 0", color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6" }}>
                            {confirmModal.message}
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => setConfirmModal({ show: false, message: "", onConfirm: null })}
                                style={{
                                    flex: 1, padding: "13px",
                                    background: "#f1f5f9", color: "#475569",
                                    border: "none", borderRadius: "12px",
                                    fontWeight: "800", fontSize: "0.95rem", cursor: "pointer"
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => {
                                    const fn = confirmModal.onConfirm;
                                    setConfirmModal({ show: false, message: "", onConfirm: null });
                                    if (fn) fn();
                                }}
                                style={{
                                    flex: 1, padding: "13px",
                                    background: "linear-gradient(135deg, #fb4226, #e03014)",
                                    color: "#fff",
                                    border: "none", borderRadius: "12px",
                                    fontWeight: "800", fontSize: "0.95rem", cursor: "pointer",
                                    boxShadow: "0 4px 15px rgba(251,66,38,0.3)"
                                }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔔 CUSTOM PREMIUM GLASSMORPHISM TOAST */}
            {toast.show && (
                <div 
                    className={`custom-toast ${toast.type}`}
                    style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        padding: "16px 24px",
                        borderRadius: "16px",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.88rem",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.18)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: toast.type === "success" 
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))"
                            : toast.type === "error"
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))"
                            : toast.type === "warning"
                            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))"
                            : "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(29, 78, 216, 0.95))"
                    }}
                >
                    {toast.type === "success" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                    {toast.type === "error" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    )}
                    {toast.type === "warning" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    )}
                    {toast.type === "info" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    )}
                    <span style={{ letterSpacing: "0.2px" }}>{toast.message}</span>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const webCardStyle = { background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', height: 'fit-content', border: '1px solid #f0f0f0' };
const ticketHeaderRedWeb = { background: '#fb4226', padding: '15px', textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: '14px' };
const labelSmallWeb = { margin: 0, fontSize: '10px', color: '#999', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' };
const infoValueWeb = { margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '800', color: '#333' };
const snackBoxStyleWeb = { marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '15px', border: '1px solid #eee' };
const snackRowWeb = { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '700' };
const qrBoxStyleWeb = { padding: '8px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' };
const printBtnStyleWeb = { flex: 1.5, padding: "14px", background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "900", fontSize: '0.85rem' };
const resetBtnStyleWeb = { flex: 1, padding: "14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "900", fontSize: '0.85rem' };
const snackCardStyle = { display: "flex", alignItems: "center", border: "1px solid #eee", padding: "10px", borderRadius: "10px" };
const qtyBtnStyle = { width: "25px", height: "25px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const summaryBoxStyle = { width: 300, background: "#fff", padding: 20, borderRadius: 15, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", height: "fit-content" };
const btnStyle = { width: "100%", padding: 12, background: "#fb4226", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const billContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center", padding: "50px 0", background: "#f5f5f5", minHeight: "100vh" };
