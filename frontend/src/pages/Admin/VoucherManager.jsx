import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function VoucherManager() {
    const [vouchers, setVouchers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notify, setNotify] = useState({ show: false, message: "", type: "success" });

    // States cho Form Thêm/Sửa
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState("Percentage"); // Percentage | FixedAmount | FreeTicket | FreeSnack
    const [discountValue, setDiscountValue] = useState("");
    const [minSpend, setMinSpend] = useState("0");
    const [expiryDate, setExpiryDate] = useState("");

    // States cho Modal Phân Phối
    const [showDistribute, setShowDistribute] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [targetType, setTargetType] = useState("ALL"); // ALL | NORMAL | VIP | PLATINUM | MANUAL
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [userSearch, setUserSearch] = useState("");

    const showToast = (msg, type = "success") => {
        setNotify({ show: true, message: msg, type });
        setTimeout(() => setNotify({ show: false, message: "", type: "success" }), 3500);
    };

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/vouchers");
            setVouchers(res.data);
            setLoading(false);
        } catch (err) {
            showToast("Lỗi lấy danh sách voucher sếp ơi!", "error");
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/users");
            const customers = res.data.filter(u => u.role === "customer");
            setUsers(customers);
        } catch (err) {
            console.error("Lỗi lấy danh sách thành viên:", err);
        }
    };

    useEffect(() => {
        fetchVouchers();
        fetchUsers();
    }, []);

    const handleOpenCreate = () => {
        setEditingId(null);
        setCode("");
        setDiscountType("Percentage");
        setDiscountValue("");
        setMinSpend("0");
        setExpiryDate("");
        setShowForm(true);
    };

    const handleOpenEdit = (v) => {
        setEditingId(v._id);
        setCode(v.code);
        setDiscountType(v.discountType);
        setDiscountValue(v.discountValue);
        setMinSpend(v.minSpend);
        setExpiryDate(v.expiryDate ? v.expiryDate.split("T")[0] : "");
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!code || !discountValue || !expiryDate) {
            return showToast("Vui lòng nhập đầy đủ các trường bắt buộc sếp ơi!", "error");
        }

        const payload = {
            code: code.toUpperCase().trim(),
            discountType,
            discountValue: Number(discountValue),
            minSpend: Number(minSpend || 0),
            expiryDate
        };

        try {
            if (editingId) {
                await axios.put(`/vouchers/${editingId}`, payload);
                showToast("Cập nhật Voucher thành công!");
            } else {
                await axios.post("/vouchers", payload);
                showToast("Tạo Voucher mới thành công!");
            }
            setShowForm(false);
            fetchVouchers();
        } catch (err) {
            showToast(err.response?.data?.message || "Lỗi lưu thông tin rồi sếp!", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sếp có chắc chắn muốn xóa voucher này khỏi hệ thống không? Khách hàng sẽ không thể sử dụng nữa!")) return;

        try {
            await axios.delete(`/vouchers/${id}`);
            showToast("Đã xóa Voucher thành công!");
            fetchVouchers();
        } catch (err) {
            showToast("Lỗi xóa voucher sếp ơi!", "error");
        }
    };

    const handleOpenDistribute = (v) => {
        setSelectedVoucher(v);
        setTargetType("ALL");
        setSelectedUserIds([]);
        setUserSearch("");
        setShowDistribute(true);
    };

    const handleToggleUser = (userId) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const handleConfirmDistribute = async () => {
        try {
            const payload = {
                targetType,
                userIds: targetType === "MANUAL" ? selectedUserIds : []
            };

            await axios.post(`/vouchers/${selectedVoucher._id}/distribute`, payload);
            showToast(`Đã phân phối mã [${selectedVoucher.code}] thành công sếp ơi!`);
            setShowDistribute(false);
            fetchVouchers();
        } catch (err) {
            showToast(err.response?.data?.message || "Lỗi phân phối voucher!", "error");
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", padding: "10px" }}>
            
            {/* THÔNG BÁO TOAST */}
            {notify.show && (
                <div style={{
                    position: "fixed",
                    top: "30px",
                    right: "30px",
                    zIndex: 9999,
                    background: notify.type === "success" ? "#2e7d32" : "#c62828",
                    color: "#fff",
                    padding: "16px 28px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "0.9rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    transition: "all 0.3s ease"
                }}>
                    {notify.message}
                </div>
            )}

            {/* HEADER TRANG */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "35px"
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "900", color: "#222" }}>QUẢN LÝ VOUCHER KHUYẾN MÃI</h2>
                    <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.85rem", fontWeight: "600" }}>Tạo, sửa đổi và phân phối voucher trực tiếp tới khách hàng thân thiết</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    style={{
                        padding: "12px 24px",
                        background: "#fb4226",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "900",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(251,66,38,0.15)",
                        whiteSpace: "nowrap"
                    }}
                >
                    TẠO VOUCHER MỚI
                </button>
            </div>

            {/* GRID DANH SÁCH VOUCHER */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0", color: "#888", fontWeight: "700" }}>Đang tải danh sách voucher sếp ơi...</div>
            ) : vouchers.length > 0 ? (
                <div style={{
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 6px 25px rgba(0,0,0,0.02)",
                    border: "1px solid #eee",
                    overflow: "hidden"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                        <thead>
                            <tr style={{ background: "#f9f9f7", borderBottom: "1px solid #eee" }}>
                                <th style={{ ...thStyle, width: "15%" }}>MÃ VOUCHER</th>
                                <th style={{ ...thStyle, width: "12%" }}>LOẠI ƯU ĐÃI</th>
                                <th style={{ ...thStyle, width: "10%" }}>GIÁ TRỊ GIẢM</th>
                                <th style={{ ...thStyle, width: "10%" }}>ĐƠN TỐI THIỂU</th>
                                <th style={{ ...thStyle, width: "10%" }}>HẠN SỬ DỤNG</th>
                                <th style={{ ...thStyle, width: "20%" }}>ĐÃ PHÂN PHỐI / SỬ DỤNG</th>
                                <th style={{ ...thStyle, width: "23%", textAlign: "center" }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map((v) => {
                                const usedCount = v.assignedUsers.filter(au => au.used).length;
                                return (
                                    <tr key={v._id} style={{ borderBottom: "1px solid #f5f5f5", transition: "all 0.2s ease" }}>
                                        <td style={{ ...tdStyle, fontWeight: "900", color: "#fb4226", wordBreak: "break-all" }}>{v.code}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                fontSize: "0.75rem",
                                                fontWeight: "800",
                                                background: v.discountType === "Percentage" || v.discountType === "FixedAmount" ? "rgba(46,125,50,0.08)" : "rgba(251,66,38,0.08)",
                                                color: v.discountType === "Percentage" || v.discountType === "FixedAmount" ? "#2e7d32" : "#fb4226",
                                                display: "inline-block",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {v.discountType === "Percentage" ? "% Giảm Giá" : 
                                                 v.discountType === "FixedAmount" ? "Tiền Mặt" : 
                                                 v.discountType === "FreeTicket" ? "Vé Free" : "Snack Free"}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: "800", color: "#333", whiteSpace: "nowrap" }}>
                                            {v.discountType === "Percentage" ? `${v.discountValue}%` : 
                                             v.discountType === "FixedAmount" ? `${v.discountValue.toLocaleString("vi-VN")}đ` : 
                                             `${v.discountValue} Phần`}
                                        </td>
                                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{v.minSpend ? `${v.minSpend.toLocaleString("vi-VN")}đ` : "0đ"}</td>
                                        <td style={{ ...tdStyle, fontWeight: "700", color: "#777", whiteSpace: "nowrap" }}>
                                            {new Date(v.expiryDate).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                            <span style={{ fontWeight: "800", color: "#333" }}>{v.assignedUsers.length}</span> Khách nhận / <span style={{ fontWeight: "800", color: "#2e7d32" }}>{usedCount}</span> Đã dùng
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                                <button
                                                    onClick={() => handleOpenDistribute(v)}
                                                    style={{ ...actionBtn, background: "#2e7d32", color: "#fff" }}
                                                >
                                                    GỬI TẶNG
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(v)}
                                                    style={{ ...actionBtn, background: "#f5f5f5", color: "#333" }}
                                                >
                                                    SỬA
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v._id)}
                                                    style={{ ...actionBtn, background: "rgba(198,40,40,0.08)", color: "#c62828" }}
                                                >
                                                    XÓA
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    border: "1px dashed #ddd",
                    borderRadius: "16px",
                    background: "#fff",
                    color: "#999"
                }}>
                    <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>Sếp chưa tạo mã voucher nào trong hệ thống cả.</p>
                </div>
            )}

            {/* MODAL THÊM / SỬA VOUCHER */}
            {showForm && (
                <div style={modalOverlayStyle}>
                    <div style={modalContainerStyle}>
                        <h3 style={{ margin: "0 0 25px 0", fontSize: "1.3rem", fontWeight: "900", color: "#222" }}>
                            {editingId ? "CẬP NHẬT VOUCHER KHUYẾN MÃI" : "TẠO VOUCHER MỚI"}
                        </h3>
                        <form onSubmit={handleSave}>
                            <div style={formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Mã Voucher (Viết hoa không dấu):</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={e => setCode(e.target.value.toUpperCase())}
                                        style={inputStyle}
                                        placeholder="VD: LUX50K, EVENT2026"
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Loại ưu đãi:</label>
                                    <select
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="Percentage">Giảm theo phần trăm (%)</option>
                                        <option value="FixedAmount">Giảm tiền mặt mặc định (đ)</option>
                                        <option value="FreeTicket">Tặng Vé 2D Miễn Phí</option>
                                        <option value="FreeSnack">Tặng Bắp Nước Miễn Phí</option>
                                    </select>
                                </div>
                            </div>

                            <div style={formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Giá trị ưu đãi (% hoặc tiền hoặc số lượng):</label>
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value)}
                                        style={inputStyle}
                                        placeholder="VD: 20 đối với 20%, hoặc 50000 đối với 50k"
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Giá trị đơn hàng tối thiểu (Min Spend):</label>
                                    <input
                                        type="number"
                                        value={minSpend}
                                        onChange={e => setMinSpend(e.target.value)}
                                        style={inputStyle}
                                        placeholder="VD: 150000"
                                    />
                                </div>
                            </div>

                            <div style={formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Hạn sử dụng (Expiry Date):</label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "35px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    style={{ ...formBtnStyle, background: "#f5f5f5", color: "#333" }}
                                >
                                    HỦY BỎ
                                </button>
                                <button
                                    type="submit"
                                    style={{ ...formBtnStyle, background: "#fb4226", color: "#fff" }}
                                >
                                    LƯU LAI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PHÂN PHỐI CRM BLAST */}
            {showDistribute && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContainerStyle, width: "600px" }}>
                        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem", fontWeight: "900", color: "#222" }}>
                            PHÂN PHỐI VOUCHER MỤC TIÊU
                        </h3>
                        <p style={{ margin: "0 0 25px 0", color: "#666", fontSize: "0.8rem", fontWeight: "600" }}>
                            Mã ưu đãi đang chọn: <strong style={{ color: "#fb4226" }}>{selectedVoucher?.code}</strong>
                        </p>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Chọn nhóm khách hàng nhận quà:</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                                {[
                                    { value: "ALL", label: "Tất cả khách hàng" },
                                    { value: "NORMAL", label: "Hạng Tiêu Chuẩn (NORMAL)" },
                                    { value: "VIP", label: "Hạng VIP" },
                                    { value: "PLATINUM", label: "Hạng PLATINUM" },
                                    { value: "MANUAL", label: "Lựa chọn thủ công từng người" }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTargetType(opt.value)}
                                        style={{
                                            padding: "10px 16px",
                                            background: targetType === opt.value ? "rgba(251,66,38,0.08)" : "#fff",
                                            border: targetType === opt.value ? "2px solid #fb4226" : "1px solid #ccc",
                                            borderRadius: "8px",
                                            fontSize: "0.8rem",
                                            fontWeight: "800",
                                            color: targetType === opt.value ? "#fb4226" : "#555",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* HIỂN THỊ CHỌN THỦ CÔNG TỪNG NGƯỜI */}
                        {targetType === "MANUAL" && (
                            <div style={{
                                border: "1px solid #eee",
                                borderRadius: "12px",
                                padding: "15px",
                                background: "#fafaf8",
                                marginBottom: "20px"
                            }}>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Tìm kiếm thành viên theo tên hoặc email..."
                                    style={{ ...inputStyle, marginBottom: "15px" }}
                                />

                                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <label
                                                key={user._id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "10px 12px",
                                                    background: "#fff",
                                                    border: "1px solid #eee",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600",
                                                    color: "#333",
                                                    gap: "10px"
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(user._id)}
                                                    onChange={() => handleToggleUser(user._id)}
                                                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div>{user.name} <span style={{ fontSize: "0.7rem", color: "#fb4226", background: "rgba(251,66,38,0.05)", padding: "2px 6px", borderRadius: "4px", marginLeft: "6px" }}>{user.membershipTier || "NORMAL"}</span></div>
                                                    <div style={{ fontSize: "0.7rem", color: "#888" }}>{user.email}</div>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "0.8rem" }}>Không tìm thấy thành viên!</div>
                                    )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#777", fontWeight: "700", marginTop: "12px" }}>
                                    Đã chọn: {selectedUserIds.length} người dùng
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "35px" }}>
                            <button
                                onClick={() => setShowDistribute(false)}
                                style={{ ...formBtnStyle, background: "#f5f5f5", color: "#333" }}
                            >
                                HỦY BỎ
                            </button>
                            <button
                                onClick={handleConfirmDistribute}
                                style={{ ...formBtnStyle, background: "#2e7d32", color: "#fff" }}
                            >
                                PHÂN PHỐI NGAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// INLINE STYLES CHO ĐỒ GIAO DIỆN PREMIUM
const thStyle = {
    padding: "16px 20px",
    fontSize: "0.75rem",
    fontWeight: "900",
    color: "#666",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
};

const tdStyle = {
    padding: "18px 20px",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#555"
};

const actionBtn = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "900",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap"
};

const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)"
};

const modalContainerStyle = {
    width: "550px",
    background: "#fff",
    borderRadius: "24px",
    padding: "35px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)"
};

const formRow = {
    display: "flex",
    gap: "15px",
    marginBottom: "15px"
};

const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "#444",
    textTransform: "uppercase"
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    background: "#fff",
    fontFamily: "'Inter', sans-serif"
};

const formBtnStyle = {
    padding: "12px 28px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "900",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.2s ease"
};
