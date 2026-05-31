import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function RoomManager() {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ name: "", price: "", type: "2D", rows: 9, cols: 12 });
    const [editingRoom, setEditingRoom] = useState(null);

    // 🔔 State quản lý thông báo tự tắt
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    const showNotify = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    const fetchRooms = () => {
        axios.get("/rooms").then(res => setRooms(res.data));
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleCreateRoom = async () => {
        if (!newRoom.name || !newRoom.price) return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        try {
            await axios.post("/rooms", newRoom);
            showNotify("Đã tạo phòng thành công");
            setNewRoom({ name: "", price: "", type: "2D", rows: 9, cols: 12 });
            fetchRooms();
        } catch (err) { showNotify("Không thể xử lý, vui lòng thử lại", "error"); }
    };

    const handleUpdateRoom = async () => {
        if (!editingRoom.name || !editingRoom.price) return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        try {
            await axios.put(`/rooms/${editingRoom._id}`, editingRoom);
            showNotify("Cập nhật phòng thành công");
            setEditingRoom(null);
            fetchRooms();
        } catch (err) { showNotify("Không thể cập nhật, vui lòng thử lại", "error"); }
    };

    const handleDeleteRoom = async (id) => {
        if (window.confirm("Xóa phòng chiếu này")) {
            try {
                await axios.delete(`/rooms/${id}`);
                showNotify("Đã xóa phòng thành công");
                fetchRooms();
            } catch (err) { showNotify("Không thể xóa, vui lòng thử lại", "error"); }
        }
    };

    // 🕵️‍♂️ HÀM LẤY STYLE BADGE (ĐÃ CẬP NHẬT MÀU VÀNG ĐEN)
    const getBadgeStyle = (type) => {
        const baseStyle = {
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            display: "inline-block"
        };

        switch (type) {
            case 'IMAX':
                return { ...baseStyle, background: "#1e88e5", color: "#fff" }; // Xanh dương
            case 'GOLD CLASS':
                return { ...baseStyle, background: "#ffc107", color: "#000" }; // 🚩 VÀNG ĐEN: Sang trọng
            case '3D':
                return { ...baseStyle, background: "#827979", color: "#fff" }; // Tím cho 3D nếu sếp thích
            default:
                return { ...baseStyle, background: "#f0f0f0", color: "#555" }; // 2D mặc định
        }
    };

    return (
        <div className="room-manager-container" style={{ position: 'relative' }}>
            {/* 📢 THÔNG BÁO TỰ TẮT */}
            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === "success" ? "#2ecc71" : "#e74c3c" }}>
                    {notification.message}
                </div>
            )}
            <style>{`
                .room-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .room-card-box {
                    background: #fdfcf0;
                    padding: 25px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 30px;
                }
                .room-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 15px;
                }
                .room-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #eee;
                    margin-top: 15px;
                }
                .room-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                }
                .room-modal-content {
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    width: 400px;
                    max-width: 90%;
                    box-sizing: border-box;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                @media (max-width: 992px) {
                    .room-form-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (max-width: 576px) {
                    .room-card-box {
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    .room-form-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .room-form-grid button {
                        padding: 12px;
                    }
                }
            `}</style>
            <h2 style={{ color: "#333", marginBottom: 25, fontSize: "1.5rem", fontWeight: "800" }}>QUẢN LÝ PHÒNG CHIẾU & GIÁ VÉ</h2>

            <div className="room-card-box">
                <h4 style={{ marginTop: 0, marginBottom: "15px", color: "#555", fontWeight: "bold" }}>Tạo phòng mới</h4>
                <div className="room-form-grid">
                    <input placeholder="Tên phòng" style={inputStyle} value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} />
                    <select style={inputStyle} value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}>
                        <option value="2D">Loại: 2D</option>
                        <option value="3D">Loại: 3D</option>
                        <option value="IMAX">Loại: IMAX</option>
                        <option value="GOLD CLASS">Loại: GOLD CLASS</option>
                    </select>
                    <input placeholder="Giá vé" type="number" style={inputStyle} value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: e.target.value })} />
                    <button onClick={handleCreateRoom} style={btnSubmitStyle}>TẠO PHÒNG</button>
                </div>
            </div>

            <div className="room-table-wrapper">
                <table className="room-table">
                    <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                            <th style={thStyle}>Tên phòng</th>
                            <th style={thStyle}>Loại</th>
                            <th style={thStyle}>Giá vé gốc</th>
                            <th style={thStyle}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map(r => (
                            <tr key={r._id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={tdStyle}><b>{r.name}</b></td>
                                <td style={tdStyle}><span style={getBadgeStyle(r.type)}>{r.type}</span></td>
                                <td style={{ ...tdStyle, color: "#fb4226", fontWeight: "bold" }}>{r.price?.toLocaleString()}đ</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingRoom(r)} style={btnEditStyle}>Sửa</button>
                                        <button onClick={() => handleDeleteRoom(r._id)} style={btnDeleteStyle}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingRoom && (
                <div style={modalOverlayStyle}>
                    <div className="room-modal-content">
                        <h3 style={{ color: "#fb4226", marginTop: 0, fontWeight: "bold" }}>✏️ CHỈNH SỬA PHÒNG</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
                            <input style={inputStyle} value={editingRoom.name} onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })} />
                            <select style={inputStyle} value={editingRoom.type} onChange={e => setEditingRoom({ ...editingRoom, type: e.target.value })}>
                                <option value="2D">2D</option>
                                <option value="3D">3D</option>
                                <option value="IMAX">IMAX</option>
                                <option value="GOLD CLASS">GOLD CLASS</option>
                            </select>
                            <input type="number" style={inputStyle} value={editingRoom.price} onChange={e => setEditingRoom({ ...editingRoom, price: e.target.value })} />
                            <button onClick={handleUpdateRoom} style={{ ...btnSubmitStyle, marginTop: 10 }}>LƯU THAY ĐỔI</button>
                            <button onClick={() => setEditingRoom(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontWeight: "bold" }}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666", fontSize: '0.85rem', borderBottom: '2px solid #eee' };
const tdStyle = { padding: "15px", color: "#333", fontSize: '0.9rem' };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const toastStyle = { position: 'fixed', top: '20px', right: '20px', padding: '12px 25px', color: 'white', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };