import { useEffect, useState } from "react";

export default function MembershipTab({ history, info, loading, viewTitleStyle }) {
    const [previewTier, setPreviewTier] = useState("");

    const totalSpent = info.yearlySpending || 0;
    const currentTier = info.membershipTier || "NORMAL";
    const nextTierLimit = info.nextTierLimit || 2500000;
    const spentNeeded = info.spentNeeded !== undefined ? info.spentNeeded : 2500000;
    const percentToNext = info.percentToNext || 0;
    const pointsRate = info.pointsRate || 0.05;
    const currentPoints = info.luxPoints || 0;

    useEffect(() => {
        if (!loading && info) {
            setPreviewTier(info.membershipTier || "NORMAL");
        }
    }, [loading, info]);

    const getPreviewDetails = (tier) => {
        switch (tier) {
            case "PLATINUM":
                return {
                    title: "PLATINUM",
                    description: "Chi tiêu từ 6.000.000 VND trở lên trong năm 2026",
                    gradient: "linear-gradient(135deg, #0b0b0b 0%, #222222 100%)",
                    fontColor: "#dfb76c",
                    borderColor: "#dfb76c",
                    badgeBg: "rgba(223, 183, 108, 0.15)",
                    badgeBorder: "1px solid #dfb76c",
                    ticketRate: "10%",
                    snackRate: "12%",
                    vouchers: [
                        { name: "Vé đôi Ghế Sweetbox 2D", qty: "4 VÉ", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox" },
                        { name: "Vé Ghế VIP 2D", qty: "4 VÉ", desc: "Áp dụng miễn phí cho Ghế VIP" },
                        { name: "Vé Ghế Thường 2D", qty: "6 VÉ", desc: "Áp dụng miễn phí cho Ghế Thường" },
                        { name: "Birthday Solo Combo", qty: "2 COMBO", desc: "Quà tặng bắp nước miễn phí nhân dịp sinh nhật" }
                    ]
                };
            case "VIP":
                return {
                    title: "VIP",
                    description: "Chi tiêu từ 2.500.000 VND trở lên trong năm 2026",
                    gradient: "linear-gradient(135deg, #780000 0%, #b71c1c 100%)",
                    fontColor: "#dfb76c",
                    borderColor: "#dfb76c",
                    badgeBg: "rgba(223, 183, 108, 0.15)",
                    badgeBorder: "1px solid #dfb76c",
                    ticketRate: "7%",
                    snackRate: "8%",
                    vouchers: [
                        { name: "Vé đôi Ghế Sweetbox 2D", qty: "2 VÉ", desc: "Áp dụng miễn phí cho ghế đôi Sweetbox" },
                        { name: "Vé Ghế VIP 2D", qty: "2 VÉ", desc: "Áp dụng miễn phí cho Ghế VIP" },
                        { name: "Vé Ghế Thường 2D", qty: "2 VÉ", desc: "Áp dụng miễn phí cho Ghế Thường" },
                        { name: "Birthday Solo Combo", qty: "1 COMBO", desc: "Quà tặng bắp nước miễn phí nhân dịp sinh nhật" }
                    ]
                };
            default:
                return {
                    title: "NORMAL",
                    description: "Hạng tiêu chuẩn cho tất cả thành viên thuộc hệ thống Cinema Lux",
                    gradient: "linear-gradient(135deg, #dfdfe0 0%, #ffffff 100%)",
                    fontColor: "#333333",
                    borderColor: "rgba(0,0,0,0.1)",
                    badgeBg: "rgba(0, 0, 0, 0.05)",
                    badgeBorder: "1px solid rgba(0, 0, 0, 0.15)",
                    ticketRate: "5%",
                    snackRate: "5%",
                    vouchers: []
                };
        }
    };

    const previewData = getPreviewDetails(previewTier || currentTier);

    return (
        <div>
            <h2 style={viewTitleStyle}>CHƯƠNG TRÌNH THÀNH VIÊN</h2>

            {/* 💳 THÈ THÀNH VIÊN SẢN PHẨM */}
            <div className="db-member-card" style={{
                background: previewData.gradient,
                color: previewData.fontColor,
                padding: "35px",
                borderRadius: "24px",
                position: "relative",
                overflow: "hidden",
                boxShadow: previewData.title === "NORMAL" ? "0 15px 35px rgba(0,0,0,0.05)" : "0 15px 35px rgba(223, 183, 108, 0.15)",
                minHeight: "180px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                border: `2px solid ${previewData.borderColor}`
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <span style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "1px", opacity: 0.9 }}>CINEMA LUX</span>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7 }}>Thẻ Thành Viên Số</p>
                    </div>
                    <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        background: previewData.badgeBg,
                        border: previewData.badgeBorder,
                        color: previewData.fontColor
                    }}>
                        {previewData.title === currentTier ? "HẠNG HIỆN TẠI" : "BẢN XEM TRƯỚC"}
                    </span>
                </div>

                <div style={{ marginTop: "20px" }}>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: "2.2rem", 
                        fontWeight: "900", 
                        letterSpacing: "2px", 
                        textTransform: "uppercase",
                        color: previewData.fontColor,
                        textShadow: previewData.title === "NORMAL" ? "none" : "0 2px 5px rgba(0,0,0,0.6)"
                    }}>
                        {previewData.title}
                    </h1>
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                        Chủ thẻ: <strong style={{ color: previewData.fontColor }}>{info.fullName || info.name}</strong>
                    </p>
                </div>
            </div>

            {/* 📈 THANH TIẾN TRÌNH LÊN HẠNG VÀ ĐIỂM TÍCH LŨY */}
            <div style={{
                background: "#fafaf8",
                border: "1px solid #f2eedb",
                padding: "25px",
                borderRadius: "20px",
                marginTop: "30px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "flex-end" }}>
                    <div>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#888", fontWeight: "800", textTransform: "uppercase" }}>Tổng chi tiêu năm 2026</p>
                        <h3 style={{ margin: "4px 0 0 0", color: "#333", fontSize: "1.3rem", fontWeight: "900" }}>{totalSpent.toLocaleString()}đ</h3>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#888", fontWeight: "800", textTransform: "uppercase" }}>Điểm Lux-Points</p>
                        <h3 style={{ margin: "4px 0 0 0", color: "#fb4226", fontSize: "1.3rem", fontWeight: "900" }}>{currentPoints.toLocaleString()}đ</h3>
                    </div>
                </div>

                {currentTier !== "PLATINUM" ? (
                    <div>
                        <div style={{ height: "8px", width: "100%", background: "#e5e5e0", borderRadius: "4px", overflow: "hidden", margin: "12px 0" }}>
                            <div style={{ height: "100%", width: `${percentToNext}%`, background: "#fb4226", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666", fontWeight: "600" }}>
                            Sếp cần tích lũy thêm <strong style={{ color: "#fb4226" }}>{spentNeeded.toLocaleString()}đ</strong> để thăng hạng lên <strong>{currentTier === "NORMAL" ? "VIP" : "PLATINUM"}</strong>.
                        </p>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#2e7d32", fontWeight: "700" }}>
                        Sếp đang sở hữu hạng thành viên PLATINUM cao cấp nhất của Cinema Lux! Xin kính chúc sếp có những giây phút xem phim tuyệt vời.
                    </p>
                )}
            </div>

            {/* 🎛️ BỘ LỌC TABS TƯƠNG TÁC XEM TRƯỚC */}
            <div className="db-sub-tabs" style={{
                display: "flex",
                background: "#f2eedb",
                padding: "5px",
                borderRadius: "14px",
                marginTop: "35px",
                gap: "5px"
            }}>
                {["NORMAL", "VIP", "PLATINUM"].map(t => (
                    <button
                        key={t}
                        onClick={() => setPreviewTier(t)}
                        style={{
                            flex: 1,
                            padding: "12px 0",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "0.8rem",
                            fontWeight: "900",
                            cursor: "pointer",
                            transition: "0.2s",
                            background: previewTier === t ? "#fb4226" : "transparent",
                            color: previewTier === t ? "#fff" : "#555",
                            boxShadow: previewTier === t ? "0 4px 10px rgba(251, 66, 38, 0.2)" : "none"
                        }}
                    >
                        {t} {t === currentTier && "(Hiện tại)"}
                    </button>
                ))}
            </div>

            {/* 📊 TÍCH LŨY ĐIỂM */}
            <div style={{ marginTop: "35px" }}>
                <h3 style={{ fontSize: "0.8rem", color: "#bbb", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Tích lũy Lux-Points</h3>
                <div className="db-member-rates" style={{ display: "flex", gap: "20px" }}>
                    <div style={{
                        flex: 1,
                        background: "#fff",
                        border: "1px solid #eee",
                        padding: "20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.01)"
                    }}>
                        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "900", color: "#fb4226" }}>{previewData.ticketRate}</h2>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem", color: "#777", fontWeight: "700" }}>Tích Lũy Mua Vé</p>
                    </div>
                    <div style={{
                        flex: 1,
                        background: "#fff",
                        border: "1px solid #eee",
                        padding: "20px",
                        borderRadius: "16px",
                        textAlign: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.01)"
                    }}>
                        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "900", color: "#fb4226" }}>{previewData.snackRate}</h2>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem", color: "#777", fontWeight: "700" }}>Tích Lũy Bắp Nước</p>
                    </div>
                </div>
            </div>

            {/* 🎟️ VOUCHER ƯU ĐÃI THÀNH VIÊN */}
            <div style={{ marginTop: "35px" }}>
                <h3 style={{ fontSize: "0.8rem", color: "#bbb", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Voucher Ưu Đãi</h3>
                
                {previewData.vouchers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        {previewData.vouchers.map((v, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#fff",
                                    border: "1px solid #eee",
                                    borderRadius: "18px",
                                    padding: "20px 25px",
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.01)",
                                    position: "relative"
                                }}
                            >
                                <div style={{ flex: 1, paddingRight: "20px" }}>
                                    <h4 style={{ margin: 0, color: "#333", fontSize: "0.95rem", fontWeight: "800" }}>{v.name}</h4>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#999", fontWeight: "600" }}>{v.desc}</p>
                                </div>
                                <div style={{
                                    background: "#fb4226",
                                    color: "#fff",
                                    fontWeight: "900",
                                    fontSize: "0.8rem",
                                    padding: "8px 16px",
                                    borderRadius: "12px",
                                    minWidth: "70px",
                                    textAlign: "center",
                                    boxShadow: "0 4px 10px rgba(251, 66, 38, 0.2)"
                                }}
                                >
                                    {v.qty}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        border: "1px dashed #ddd",
                        borderRadius: "18px",
                        color: "#aaa"
                    }}>
                        <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem" }}>
                            Nâng cấp tài khoản của sếp lên VIP hoặc Platinum để tự động nhận gói Voucher ưu đãi hấp dẫn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
