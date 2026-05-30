import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function VouchersTab({ history, info, loading, viewTitleStyle }) {
    const [activeSubTab, setActiveSubTab] = useState("unused"); // "unused" | "history"
    const [assignedVouchers, setAssignedVouchers] = useState([]);
    const [assignedLoading, setAssignedLoading] = useState(true);

    const currentTier = info.membershipTier || "NORMAL";

    // Lấy các voucher được admin phân phối riêng từ database
    useEffect(() => {
        const fetchMyAssignedVouchers = async () => {
            try {
                setAssignedLoading(true);
                const res = await axios.get("/vouchers/my-vouchers");
                setAssignedVouchers(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách voucher phân phối:", err);
            } finally {
                setAssignedLoading(false);
            }
        };
        fetchMyAssignedVouchers();
    }, []);

    // Tự động xác định danh sách Voucher dựa theo hạng thành viên hiện tại
    const getVouchersForTier = (tier) => {
        if (tier === "PLATINUM") {
            return [
                { id: "v1", code: "PLAT-SWEETBOX-2D", name: "Voucher Vé Đôi Ghế Sweetbox", type: "FreeTicket", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox", exp: "31/12/2026", qty: 4, used: 0 },
                { id: "v2", code: "PLAT-VIP-2D", name: "Voucher Vé Ghế VIP 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế VIP", exp: "31/12/2026", qty: 4, used: 0 },
                { id: "v3", code: "PLAT-STANDARD-2D", name: "Voucher Vé Ghế Thường 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế Thường", exp: "31/12/2026", qty: 6, used: 0 },
                { id: "v4", code: "PLAT-BIRTHDAY-COMBO", name: "Voucher Birthday Solo Combo", type: "FreeSnack", desc: "Nhận 1 bắp ngọt lớn + 1 nước ngọt 22oz dịp sinh nhật", exp: "31/12/2026", qty: 2, used: 0 }
            ];
        } else if (tier === "VIP") {
            return [
                { id: "v1", code: "VIP-SWEETBOX-2D", name: "Voucher Vé Đôi Ghế Sweetbox", type: "FreeTicket", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox", exp: "31/12/2026", qty: 2, used: 0 },
                { id: "v2", code: "VIP-VIP-2D", name: "Voucher Vé Ghế VIP 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế VIP", exp: "31/12/2026", qty: 2, used: 0 },
                { id: "v3", code: "VIP-STANDARD-2D", name: "Voucher Vé Ghế Thường 2D", type: "FreeTicket", desc: "Áp dụng miễn phí cho Ghế Thường", exp: "31/12/2026", qty: 2, used: 0 },
                { id: "v4", code: "VIP-BIRTHDAY-COMBO", name: "Voucher Birthday Solo Combo", type: "FreeSnack", desc: "Nhận 1 bắp ngọt lớn + 1 nước ngọt 22oz dịp sinh nhật", exp: "31/12/2026", qty: 1, used: 0 }
            ];
        }
        return [];
    };

    // Ánh xạ voucher phân phối (assignedVouchers) để đồng bộ giao diện hiển thị
    const mappedAssigned = assignedVouchers.map(v => {
        let voucherName = `Voucher ${v.code}`;
        let voucherDesc = "";
        let voucherQtyLabel = "1";
        let voucherType = v.discountType; // Percentage | FixedAmount | FreeTicket | FreeSnack

        if (v.discountType === "Percentage") {
            voucherName = `Voucher Giảm Giá ${v.discountValue}%`;
            voucherDesc = `Giảm ${v.discountValue}% cho tổng hóa đơn đặt vé.`;
            voucherQtyLabel = `${v.discountValue}%`;
        } else if (v.discountType === "FixedAmount") {
            voucherName = `Voucher Tiền Mặt ${v.discountValue.toLocaleString("vi-VN")}đ`;
            voucherDesc = `Giảm trực tiếp ${v.discountValue.toLocaleString("vi-VN")}đ vào hóa đơn đặt vé.`;
            voucherQtyLabel = `${v.discountValue >= 1000 ? `${v.discountValue / 1000}K` : v.discountValue}`;
        } else if (v.discountType === "FreeTicket") {
            voucherName = "Voucher Vé 2D Miễn Phí";
            voucherDesc = `Tặng ${v.discountValue} vé xem phim 2D Deluxe/Standard miễn phí.`;
            voucherQtyLabel = `${v.discountValue}`;
        } else if (v.discountType === "FreeSnack") {
            voucherName = "Voucher Combo Bắp Nước Miễn Phí";
            voucherDesc = `Nhận miễn phí ${v.discountValue} phần bắp ngọt lớn + nước ngọt 22oz.`;
            voucherQtyLabel = `${v.discountValue}`;
        }

        if (v.minSpend > 0) {
            voucherDesc += ` Áp dụng cho đơn tối thiểu ${v.minSpend.toLocaleString("vi-VN")}đ.`;
        }

        return {
            id: v._id,
            code: v.code,
            name: voucherName,
            type: voucherType,
            desc: voucherDesc,
            exp: new Date(v.expiryDate).toLocaleDateString("vi-VN"),
            qty: voucherQtyLabel,
            isUsed: v.used,
            isAssigned: true
        };
    });

    const usedVouchersList = [];
    const unusedVouchersList = [];

    // 1. Quét danh sách voucher mặc định theo hạng (membership)
    getVouchersForTier(currentTier).forEach(v => {
        let usedCount = history
            .filter(t => (t.status === "Paid" || t.status === "Checked-in") && t.appliedVoucher === v.code)
            .reduce((sum, t) => sum + (t.appliedVoucherQty || 1), 0);
        const remaining = Math.max(0, v.qty - usedCount);
        if (remaining > 0) {
            unusedVouchersList.push({ ...v, qty: remaining });
        }
        if (usedCount > 0) {
            usedVouchersList.push({ ...v, qty: usedCount, isUsed: true });
        }
    });

    // 2. Trộn thêm danh sách voucher phân phối thực tế từ database
    mappedAssigned.forEach(v => {
        if (v.isUsed) {
            usedVouchersList.push(v);
        } else {
            unusedVouchersList.push(v);
        }
    });

    const activeList = activeSubTab === "unused" ? unusedVouchersList : usedVouchersList;

    if (loading || assignedLoading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0", color: "#888", fontWeight: "700" }}>
                Đang tải danh sách voucher của sếp...
            </div>
        );
    }

    return (
        <div>
            <h2 style={viewTitleStyle}>VOUCHER CỦA TÔI</h2>

            {/* 🎛️ BỘ LỌC CHƯA DÙNG / ĐÃ DÙNG */}
            <div className="db-sub-tabs" style={{
                display: "flex",
                borderBottom: "2px solid #eee",
                marginBottom: "30px",
                gap: "25px"
            }}>
                <button
                    onClick={() => setActiveSubTab("unused")}
                    style={{
                        padding: "12px 10px",
                        border: "none",
                        background: "none",
                        fontSize: "0.9rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        color: activeSubTab === "unused" ? "#fb4226" : "#777",
                        borderBottom: activeSubTab === "unused" ? "3px solid #fb4226" : "3px solid transparent",
                        transition: "all 0.2s ease",
                        textTransform: "uppercase"
                    }}
                >
                    Chưa sử dụng ({unusedVouchersList.length})
                </button>
                <button
                    onClick={() => setActiveSubTab("history")}
                    style={{
                        padding: "12px 10px",
                        border: "none",
                        background: "none",
                        fontSize: "0.9rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        color: activeSubTab === "history" ? "#fb4226" : "#777",
                        borderBottom: activeSubTab === "history" ? "3px solid #fb4226" : "3px solid transparent",
                        transition: "all 0.2s ease",
                        textTransform: "uppercase"
                    }}
                >
                    Lịch sử ưu đãi ({usedVouchersList.length})
                </button>
            </div>

            {/* 🎟️ GRID DANH SÁCH VOUCHER */}
            {activeList.length > 0 ? (
                <div className="db-voucher-grid" style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "20px"
                }}>
                    {activeList.map((v, i) => (
                        <div
                            key={i}
                            className="db-voucher-card"
                            style={{
                                display: "flex",
                                background: "#fff",
                                border: "1px solid #e2e2e2",
                                borderRadius: "20px",
                                overflow: "hidden",
                                boxShadow: "0 6px 15px rgba(0,0,0,0.02)",
                                transition: "all 0.2s ease",
                                opacity: v.isUsed ? 0.75 : 1
                            }}
                        >
                            {/* 🎟️ PHẦN TRÁI VÉ (VÉ CÓ ĐỤC LỖ RĂNG CƯA) */}
                            <div className="db-voucher-left" style={{
                                width: "130px",
                                background: v.isUsed 
                                    ? "linear-gradient(135deg, #757575 0%, #9e9e9e 100%)" 
                                    : "linear-gradient(135deg, #fb4226 0%, #ff6b52 100%)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#fff",
                                padding: "20px",
                                position: "relative",
                                borderRight: "2px dashed #fdfcf0"
                            }}>
                                <span style={{
                                    fontSize: "0.65rem",
                                    fontWeight: "800",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    opacity: 0.85
                                }}>
                                    Cinema Lux
                                </span>
                                <h2 style={{
                                    margin: "8px 0 0 0",
                                    fontSize: "1.4rem",
                                    fontWeight: "900",
                                    textAlign: "center"
                                }}>
                                    {v.qty}
                                </h2>
                                <span style={{
                                    fontSize: "0.65rem",
                                    fontWeight: "800",
                                    marginTop: "2px",
                                    textTransform: "uppercase",
                                    textAlign: "center"
                                }}>
                                    {v.type === "FreeTicket" || v.type === "Percentage" || v.type === "FixedAmount" ? "VÉ FREE / GIẢM GIÁ" : "COMBO FREE"}
                                </span>
                                
                                {/* Nút tròn đục lỗ giả lập vé xem phim */}
                                <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "#fdfcf0" }}></div>
                                <div style={{ position: "absolute", bottom: "-10px", right: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "#fdfcf0" }}></div>
                            </div>

                            {/* 📄 PHẦN PHẢI (CHI TIẾT VOUCHER) */}
                            <div className="db-voucher-right" style={{
                                flex: 1,
                                padding: "25px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <div className="db-voucher-details">
                                    <span style={{
                                        fontSize: "0.65rem",
                                        fontWeight: "900",
                                        color: v.isUsed ? "#888" : "#fb4226",
                                        background: v.isUsed ? "rgba(0,0,0,0.05)" : "rgba(251,66,38,0.08)",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>
                                        Mã: {v.code}
                                    </span>
                                    <h3 style={{
                                        margin: "12px 0 6px 0",
                                        fontSize: "1.05rem",
                                        fontWeight: "800",
                                        color: "#333"
                                    }}>
                                        {v.name}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: "0.8rem",
                                        color: "#777",
                                        fontWeight: "600"
                                    }}>
                                        {v.desc}
                                    </p>
                                    <p style={{
                                        margin: "10px 0 0 0",
                                        fontSize: "0.75rem",
                                        color: "#bbb",
                                        fontWeight: "700"
                                    }}>
                                        Hạn dùng: {v.exp}
                                    </p>
                                </div>

                                <div className="db-voucher-btn-wrapper" style={{ textAlign: "right" }}>
                                    <span style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "800",
                                        padding: "8px 16px",
                                        borderRadius: "20px",
                                        background: v.isUsed ? "#e0e0e0" : "#2e7d32",
                                        color: v.isUsed ? "#777" : "#fff",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {v.isUsed ? "ĐÃ SỬ DỤNG" : "SẴN SÀNG"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    border: "1px dashed #ddd",
                    borderRadius: "24px",
                    background: "#fdfdfb",
                    color: "#999"
                }}>
                    <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>
                        {activeSubTab === "unused" 
                            ? "Sếp chưa có voucher ưu đãi khả dụng. Hãy tích lũy thêm chi tiêu hoặc chờ nhận quà sự kiện nhé!" 
                            : "Lịch sử dùng voucher của sếp trống trải."}
                    </p>
                </div>
            )}
        </div>
    );
}
