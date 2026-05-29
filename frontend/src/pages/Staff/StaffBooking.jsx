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
        if (!searchKeyword.trim()) return alert("Vui lòng nhập SĐT hoặc Email khách hàng sếp ơi!");
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
            alert(`Tìm thấy khách hàng: ${res.data.name} (${res.data.membershipTier})`);
        } catch (err) {
            console.error("Lỗi tìm khách hàng:", err);
            alert(err.response?.data || "Không tìm thấy khách hàng này!");
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
        if (!window.confirm(`Sếp xác nhận đã thu ${finalPrice.toLocaleString()}đ tiền mặt từ khách chứ?`)) return;

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

            alert("✅ Đã xác nhận thu tiền và tạo vé thành công!");
        } catch (err) {
            console.error("Lỗi bán vé tại quầy:", err);
            alert("❌ Lỗi hệ thống khi tạo vé!");
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
                            <p style={{ ...labelSmallWeb, color: '#666', marginBottom: '10px' }}>🍿 BẮP NƯỚC ĐÃ ĐẶT:</p>
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
                .fade-in-up { animation: fadeInUp 0.4s ease-out; }
                @media print { .no-print { display: none !important; } }
            `}</style>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                        <button onClick={handleConfirmCash} style={{ ...btnStyle, background: "#28a745" }}>XÁC NHẬN THU TIỀN</button>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>Quay lại chọn ghế</button>
                    </div>
                )}
            </div>

            {/* Modal Chọn Kho Voucher của Khách */}
            {showVoucherModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", padding: 25, borderRadius: 15, width: 400, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 10px 35px rgba(0,0,0,0.2)" }}>
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
