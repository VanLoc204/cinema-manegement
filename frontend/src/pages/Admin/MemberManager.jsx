import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function MemberManager() {
    const [members, setMembers] = useState([]);
    const [newMem, setNewMem] = useState({ name: "", email: "", role: "customer" });
    const [editingMem, setEditingMem] = useState(null);

    // 🔍 States cho bộ lọc
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    // 🔄 Lấy danh sách thành viên (có thể lọc)
    const fetchMembers = async () => {
        try {
            const res = await axios.get("/users/admin/list");
            setMembers(res.data);
        } catch (err) { console.error("Lỗi lấy danh sách:", err); }
    };

    useEffect(() => { fetchMembers(); }, []);

    const showNotify = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    // 🎯 Logic lọc tại Frontend cho mượt
    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === "all" ? true : m.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // ➕ HÀM TẠO NHANH
    const handleQuickAdd = async (e) => {
        e.preventDefault();
        const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!newMem.name || !newMem.email || !emailRegex.test(newMem.email)) {
            return showNotify("Lỗi thêm thành viên. Vui lòng nhập đúng họ tên và định dạng email!", "error");
        }
        try {
            await axios.post("/users/admin/create", newMem);
            showNotify("Tạo thành viên thành công!");
            setNewMem({ name: "", email: "", role: "customer" });
            fetchMembers();
        } catch (err) { 
            showNotify("Không thể xử lý, vui lòng thử lại", "error"); 
        }
    };

    // 👁️ HÀM XEM CHI TIẾT
    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`/users/detail/${id}`);
            setEditingMem(res.data);
        } catch (err) { showNotify("Không lấy được chi tiết sếp ơi!", "error"); }
    };

    // ✏️ HÀM CẬP NHẬT
    const handleUpdate = async () => {
        const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!editingMem.name || !editingMem.email || !emailRegex.test(editingMem.email)) {
            return showNotify("Không thể cập nhật. Vui lòng điền đúng họ tên và email!", "error");
        }
        try {
            await axios.put(`/users/update/${editingMem._id}`, editingMem);
            showNotify("Đã cập nhật thành công");
            setEditingMem(null);
            fetchMembers();
        } catch (err) { 
            showNotify("Không thể cập nhật, vui lòng thử lại", "error"); 
        }
    };

    // ❌ HÀM XÓA THÀNH VIÊN
    const handleDeleteMember = async (id) => {
        if (window.confirm("Xóa thành viên này")) {
            try {
                await axios.delete(`/users/admin/delete/${id}`);
                showNotify("Đã xóa thành viên thành công");
                fetchMembers();
            } catch (err) {
                showNotify("Không thể xóa, vui lòng thử lại", "error");
            }
        }
    };

    return (
        <div className="member-manager-container">
            <style>{`
                .member-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .mem-card-box {
                    background: #fdfcf0;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 20px;
                }
                .mem-form-inline {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .mem-filter-bar {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    background: #fff;
                    padding: 15px;
                    border-radius: 10px;
                    border: 1px solid #eee;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    flex-wrap: wrap;
                }
                .mem-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 10px;
                    border: 1px solid #eee;
                    background: #fff;
                }
                .mem-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .mem-modal-content {
                    background: #fff;
                    padding: 30px;
                    border-radius: 12px;
                    width: 600px;
                    max-width: 90%;
                    box-sizing: border-box;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .mem-modal-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    text-align: left;
                }

                @media (max-width: 768px) {
                    .mem-form-inline {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .mem-form-inline input,
                    .mem-form-inline select,
                    .mem-form-inline button {
                        width: 100% !important;
                    }
                    .mem-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                        padding: 15px;
                    }
                    .mem-filter-bar input,
                    .mem-filter-bar select,
                    .mem-filter-bar button {
                        width: 100% !important;
                        flex: none !important;
                    }
                    .mem-modal-content {
                        padding: 20px;
                    }
                    .mem-modal-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }
            `}</style>

            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === "success" ? "#2ecc71" : "#e74c3c" }}>
                    {notification.message}
                </div>
            )}

            <h2 style={{ color: "#333", marginBottom: 25, fontSize: "1.5rem", fontWeight: "800" }}>QUẢN LÝ THÀNH VIÊN</h2>

            {/* ➕ KHU VỰC TẠO NHANH */}
            <div className="mem-card-box">
                <h3 style={{marginTop: 0, marginBottom: "15px", fontSize: '0.9rem', color: '#666', fontWeight: "bold"}}>THÊM TÀI KHOẢN NHANH</h3>
                <form onSubmit={handleQuickAdd} className="mem-form-inline">
                    <input placeholder="Họ tên hiển thị" style={inputStyle} value={newMem.name} onChange={e => setNewMem({...newMem, name: e.target.value})} />
                    <input placeholder="Email" style={inputStyle} value={newMem.email} onChange={e => setNewMem({...newMem, email: e.target.value})} />
                    <select style={inputStyle} value={newMem.role} onChange={e => setNewMem({...newMem, role: e.target.value})}>
                        <option value="customer">Khách hàng</option>
                        <option value="staff">Nhân viên</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                    <button type="submit" style={btnSubmitStyle}>Tạo ngay</button>
                </form>
            </div>

            {/* 🔍 THANH TÌM KIẾM & BỘ LỌC */}
            <div className="mem-filter-bar">
                <input
                    placeholder="🔍 Tìm theo tên hoặc email..."
                    style={{ ...inputStyle, flex: 2 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select style={{ ...inputStyle, flex: 1 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="all">Tất cả quyền</option>
                    <option value="customer">Khách hàng</option>
                    <option value="staff">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                </select>
                <button onClick={() => { setSearchTerm(""); setFilterRole("all"); }} style={btnResetStyle}>LÀM MỚI</button>
            </div>

            {/* 📋 BẢNG DANH SÁCH */}
            <div className="mem-table-wrapper">
                <table className="mem-table">
                    <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                            <th style={thStyle}>Tên hiển thị</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Quyền</th>
                            <th style={thStyle}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(m => (
                            <tr key={m._id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={tdStyle}><b>{m.name}</b></td>
                                <td style={tdStyle}>{m.email}</td>
                                <td style={tdStyle}>
                                    <span style={m.role === 'admin' ? adminBadge : userBadge}>{m.role.toUpperCase()}</span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleViewDetail(m._id)} style={btnDetailStyle}>Sửa</button>
                                        <button onClick={() => handleDeleteMember(m._id)} style={btnDeleteStyle}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                            <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center', color: '#999'}}>Không tìm thấy thành viên</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🟦 MODAL CHỈNH SỬA CHI TIẾT */}
            {editingMem && (
                <div style={modalOverlayStyle}>
                    <div className="mem-modal-content">
                        <h3 style={{ color: "#fb4226", marginTop: 0, fontWeight: "bold", marginBottom: "20px" }}>THÔNG TIN CHI TIẾT</h3>
                        <div className="mem-modal-grid">
                            <div><label style={labelStyle}>Tên đăng nhập:</label><input style={inputStyle} value={editingMem.name} onChange={e => setEditingMem({ ...editingMem, name: e.target.value })} /></div>
                            <div><label style={labelStyle}>Email:</label><input style={inputStyle} value={editingMem.email} onChange={e => setEditingMem({ ...editingMem, email: e.target.value })} /></div>
                            <div><label style={labelStyle}>Họ và tên thật:</label><input style={inputStyle} value={editingMem.fullName} onChange={e => setEditingMem({ ...editingMem, fullName: e.target.value })} /></div>
                            <div><label style={labelStyle}>Số điện thoại:</label><input style={inputStyle} value={editingMem.phone} onChange={e => setEditingMem({ ...editingMem, phone: e.target.value })} /></div>
                            <div><label style={labelStyle}>Ngày sinh:</label><input type="date" style={inputStyle} value={editingMem.birthday} onChange={e => setEditingMem({ ...editingMem, birthday: e.target.value })} /></div>
                            <div><label style={labelStyle}>Địa chỉ:</label><input style={inputStyle} value={editingMem.address} onChange={e => setEditingMem({ ...editingMem, address: e.target.value })} /></div>
                            <div>
                                <label style={labelStyle}>Giới tính:</label>
                                <select style={inputStyle} value={editingMem.gender || ""} onChange={e => setEditingMem({ ...editingMem, gender: e.target.value })}>
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>
                        <div style={{marginTop: '25px', display: 'flex', gap: '10px'}}>
                            <button onClick={handleUpdate} style={btnSubmitStyle}>Cập nhật ngay</button>
                            <button onClick={() => setEditingMem(null)} style={{...btnSubmitStyle, background: '#ccc'}}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (Cinema Lux Style) ---
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };
const btnSubmitStyle = { padding: "12px 20px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" };
const btnResetStyle = { padding: "12px 20px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666", fontSize: '0.85rem', borderBottom: '2px solid #eee' };
const tdStyle = { padding: "15px", fontSize: '0.9rem', color: '#333' };
const btnDetailStyle = { background: 'none', border: '1px solid #3498db', color: '#3498db', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: "bold", fontSize: '0.8rem' };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer", display: "inline-block", fontWeight: "bold", fontSize: '0.8rem' };
const toastStyle = { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const adminBadge = { background: '#fff0f0', color: '#fb4226', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: "1px solid #fb4226" };
const userBadge = { background: '#f0f7ff', color: '#3498db', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: "1px solid #3498db" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '5px', display: 'block' };