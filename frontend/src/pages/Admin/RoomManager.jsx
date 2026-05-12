import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function RoomManager() {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ name: "", price: "", type: "2D", rows: 9, cols: 12 });
    const [editingRoom, setEditingRoom] = useState(null);

    const fetchRooms = () => {
        axios.get("/rooms").then(res => setRooms(res.data));
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleCreateRoom = async () => {
        if (!newRoom.name || !newRoom.price) return alert("Sếp nhập thiếu tên hoặc giá rồi!");
        try {
            await axios.post("/rooms", newRoom);
            alert("Đã tạo phòng thành công sếp ơi!");
            setNewRoom({ name: "", price: "", type: "2D", rows: 9, cols: 12 });
            fetchRooms();
        } catch (err) { alert("❌ Lỗi khi tạo phòng!"); }
    };

    const handleUpdateRoom = async () => {
        try {
            await axios.put(`/rooms/${editingRoom._id}`, editingRoom);
            alert("✅ Cập nhật phòng thành công!");
            setEditingRoom(null);
            fetchRooms();
        } catch (err) { alert("❌ Lỗi cập nhật phòng!"); }
    };

    const handleDeleteRoom = async (id) => {
        if (window.confirm("Xóa phòng này hả sếp?")) {
            try {
                await axios.delete(`/rooms/${id}`);
                fetchRooms();
            } catch (err) { alert("❌ Lỗi khi xóa phòng!"); }
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
        <div>
            <h2 style={{ color: "#333", marginBottom: 25 }}>QUẢN LÝ PHÒNG CHIẾU & GIÁ VÉ</h2>

            <div style={cardStyle}>
                <h4 style={{ marginTop: 0 }}>Tạo phòng mới</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px" }}>
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

            <table style={tableStyle}>
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
                                <button onClick={() => setEditingRoom(r)} style={{ ...btnEditStyle, marginRight: 10 }}>Sửa</button>
                                <button onClick={() => handleDeleteRoom(r._id)} style={btnDeleteStyle}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingRoom && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: "#fb4226", marginTop: 0 }}>✏️ CHỈNH SỬA PHÒNG</h3>
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
                            <button onClick={() => setEditingRoom(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: '100%', boxSizing: 'border-box' };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "#fff", padding: "30px", borderRadius: "15px", width: "400px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };