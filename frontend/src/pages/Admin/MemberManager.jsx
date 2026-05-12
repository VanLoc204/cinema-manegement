import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function MemberManager() {
    const [members, setMembers] = useState([]);
    const [newMem, setNewMem] = useState({ name: "", email: "", role: "customer" });
    const [editingMem, setEditingMem] = useState(null); 
    
    // 🔍 States cho bộ lọc
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    
    const [notification, setNotification] = useState({ show: false, message: "" });

    // 🔄 Lấy danh sách thành viên (có thể lọc)
    const fetchMembers = async () => {
        try {
            const res = await axios.get("/users/admin/list");
            setMembers(res.data);
        } catch (err) { console.error("Lỗi lấy danh sách:", err); }
    };

    useEffect(() => { fetchMembers(); }, []);

    const showNotify = (msg) => {
        setNotification({ show: true, message: msg });
        setTimeout(() => setNotification({ show: false, message: "" }), 3000);
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
        try {
            const res = await axios.post("/users/admin/create", newMem);
            showNotify(res.data); // Hiện câu: MK mặc định 123456
            setNewMem({ name: "", email: "", role: "customer" });
            fetchMembers();
        } catch (err) { alert(err.response?.data || "Lỗi rồi sếp!"); }
    };

    // 👁️ HÀM XEM CHI TIẾT
    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`/users/detail/${id}`);
            setEditingMem(res.data); 
        } catch (err) { alert("Không lấy được chi tiết sếp ơi!"); }
    };

    // ✏️ HÀM CẬP NHẬT
    const handleUpdate = async () => {
        try {
            await axios.put(`/users/update/${editingMem._id}`, editingMem);
            showNotify("✅ Đã cập nhật thông tin thành công!");
            setEditingMem(null);
            fetchMembers();
        } catch (err) { alert("Lỗi cập nhật!"); }
    };

    return (
        <div style={{ padding: "20px" }}>
            {notification.show && <div style={toastStyle}>{notification.message}</div>}
            
            <h2 style={{ color: "#333", marginBottom: 25 }}>QUẢN LÝ THÀNH VIÊN</h2>

            {/* ➕ KHU VỰC TẠO NHANH */}
            <div style={cardStyle}>
                <h3 style={{marginTop: 0, fontSize: '0.9rem', color: '#666'}}>THÊM TÀI KHOẢN NHANH</h3>
                <form onSubmit={handleQuickAdd} style={{display: 'flex', gap: '15px'}}>
                    <input placeholder="Họ tên hiển thị" style={inputStyle} value={newMem.name} onChange={e => setNewMem({...newMem, name: e.target.value})} required />
                    <input placeholder="Email" style={inputStyle} value={newMem.email} onChange={e => setNewMem({...newMem, email: e.target.value})} required />
                    <select style={inputStyle} value={newMem.role} onChange={e => setNewMem({...newMem, role: e.target.value})}>
                        <option value="customer">Khách hàng</option>
                        <option value="staff">Nhân viên</option> {/* ✨ Thêm dòng này */}
                        <option value="admin">Quản trị viên</option>
                    </select>
                    <button type="submit" style={btnSubmitStyle}>TẠO NGAY</button>
                </form>
            </div>

            {/* 🔍 THANH TÌM KIẾM & BỘ LỌC */}
            <div style={filterContainerStyle}>
                <input 
                    placeholder="🔍 Tìm theo tên hoặc email..." 
                    style={{...inputStyle, flex: 2}} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select style={{...inputStyle, flex: 1}} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="all">Tất cả quyền</option>
                    <option value="customer">Khách hàng</option>
                    <option value="staff">Nhân viên</option> {/* ✨ Thêm dòng này */}
                    <option value="admin">Quản trị viên</option>
                </select>
                <button onClick={() => {setSearchTerm(""); setFilterRole("all");}} style={btnResetStyle}>LÀM MỚI</button>
            </div>

            {/* 📋 BẢNG DANH SÁCH */}
            <table style={tableStyle}>
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
                                <button onClick={() => handleViewDetail(m._id)} style={btnDetailStyle}>Chi tiết / Sửa</button>
                            </td>
                        </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                        <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center', color: '#999'}}>Không tìm thấy thành viên nào sếp ơi!</td></tr>
                    )}
                </tbody>
            </table>

            {/* 🟦 MODAL CHỈNH SỬA CHI TIẾT */}
            {editingMem && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>THÔNG TIN CHI TIẾT</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left' }}>
                            <div><label style={labelStyle}>Tên đăng nhập:</label><input style={inputStyle} value={editingMem.name} onChange={e => setEditingMem({...editingMem, name: e.target.value})} /></div>
                            <div><label style={labelStyle}>Email:</label><input style={inputStyle} value={editingMem.email} onChange={e => setEditingMem({...editingMem, email: e.target.value})} /></div>
                            <div><label style={labelStyle}>Họ và tên thật:</label><input style={inputStyle} value={editingMem.fullName} onChange={e => setEditingMem({...editingMem, fullName: e.target.value})} /></div>
                            <div><label style={labelStyle}>Số điện thoại:</label><input style={inputStyle} value={editingMem.phone} onChange={e => setEditingMem({...editingMem, phone: e.target.value})} /></div>
                            <div><label style={labelStyle}>Ngày sinh:</label><input type="date" style={inputStyle} value={editingMem.birthday} onChange={e => setEditingMem({...editingMem, birthday: e.target.value})} /></div>
                            <div><label style={labelStyle}>Địa chỉ:</label><input style={inputStyle} value={editingMem.address} onChange={e => setEditingMem({...editingMem, address: e.target.value})} /></div>
                        </div>
                        <div style={{marginTop: '25px', display: 'flex', gap: '10px'}}>
                            <button onClick={handleUpdate} style={btnSubmitStyle}>LƯU THAY ĐỔI</button>
                            <button onClick={() => setEditingMem(null)} style={{...btnSubmitStyle, background: '#ccc'}}>ĐÓNG</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (Cinema Lux Style) ---
const cardStyle = { background: "#fdfcf0", padding: "15px", borderRadius: "10px", border: "1px solid #eee", marginBottom: "20px" };
const filterContainerStyle = { display: "flex", gap: "15px", marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #eee", boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const inputStyle = { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", width: '100%', boxSizing: 'border-box' };
const btnSubmitStyle = { padding: "10px 20px", background: "#fb4226", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnResetStyle = { padding: "10px 15px", background: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const tableStyle = { width: "100%", borderCollapse: "collapse", background: '#fff', borderRadius: '10px', overflow: 'hidden' };
const thStyle = { padding: "15px", textAlign: "left", color: "#666", fontSize: '0.85rem' };
const tdStyle = { padding: "15px" };
const btnDetailStyle = { background: 'none', border: '1px solid #3498db', color: '#3498db', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' };
const toastStyle = { position: 'fixed', top: '20px', right: '20px', background: '#2ecc71', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' };
const adminBadge = { background: '#fff0f0', color: '#fb4226', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' };
const userBadge = { background: '#f0f7ff', color: '#3498db', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "12px", width: '600px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' };
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '5px', display: 'block' };