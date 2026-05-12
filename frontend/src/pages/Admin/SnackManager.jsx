import { useState, useEffect } from "react";
import axios from "../../api/axios"; // Sếp kiểm tra lại đường dẫn này nhé

export default function SnackManager() {
    const [snacks, setSnacks] = useState([]);
    const [editingSnack, setEditingSnack] = useState(null); // Lưu món đang chọn để sửa
    const [newSnack, setNewSnack] = useState({ name: "", price: "", description: "" });
    const [snackFile, setSnackFile] = useState(null); // Lưu file ảnh thật để upload
    const [preview, setPreview] = useState(null); // Để hiện ảnh nhỏ xem trước (preview)

    const fetchSnacks = () => {
        axios.get("/snacks").then(res => setSnacks(res.data));
    };

    useEffect(() => {
        fetchSnacks();
    }, []);

    // ➕/✏️ HÀM LƯU BẮP NƯỚC (Dùng chung cho cả Thêm và Sửa)
    const handleSaveSnack = async (e) => {
        e.preventDefault();

        // 🛡️ Kiểm tra nếu là THÊM MỚI mà quên chọn file
        if (!editingSnack && !snackFile) {
            return alert("Sếp ơi, món mới này chưa có ảnh! Chọn ảnh đã nhé.");
        }

        const formData = new FormData();
        const data = editingSnack || newSnack;

        formData.append("name", data.name);
        formData.append("price", data.price);
        formData.append("description", data.description || "");

        if (snackFile) formData.append("image", snackFile);

        try {
            if (editingSnack) {
                await axios.put(`/snacks/${editingSnack._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Cập nhật thành công!");
            } else {
                await axios.post("/snacks", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Thêm bắp nước mới thành công!");
            }

            // Reset form và file input sau khi thành công
            setNewSnack({ name: "", price: "", description: "" });
            setEditingSnack(null);
            setSnackFile(null);
            setPreview(null);
            e.target.reset(); // Reset cái ô chọn file trên giao diện

            fetchSnacks();
        } catch (err) {
            alert("❌ Lỗi xử lý bắp nước sếp ơi!");
        }
    };

    // ❌ HÀM XÓA BẮP NƯỚC
    const handleDeleteSnack = async (id) => {
        if (window.confirm("Xóa món này khỏi kho hả sếp?")) {
            await axios.delete(`/snacks/${id}`);
            fetchSnacks();
        }
    };

    return (
        <div>
            <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>{editingSnack ? "✏️ Sửa bắp nước" : "Thêm bắp nước mới"}</h3>
                <form onSubmit={handleSaveSnack} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                    <input placeholder="Tên món" style={inputStyle}
                        value={editingSnack ? editingSnack.name : newSnack.name}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, name: e.target.value }) : setNewSnack({ ...newSnack, name: e.target.value })} required />

                    <input placeholder="Giá tiền" type="number" style={inputStyle}
                        value={editingSnack ? editingSnack.price : newSnack.price}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, price: e.target.value }) : setNewSnack({ ...newSnack, price: e.target.value })} required />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setSnackFile(file);
                                setPreview(URL.createObjectURL(file));
                            }
                        }} />
                        {/* Hiện preview ảnh hoặc ảnh cũ từ server */}
                        {(preview || (editingSnack && editingSnack.image)) && (
                            <img src={preview || `http://localhost:5000${editingSnack.image}`} width="45" height="45" style={{ borderRadius: "5px", objectFit: "cover" }} />
                        )}
                    </div>

                    <textarea placeholder="Mô tả" style={{ ...inputStyle, gridColumn: "span 2" }}
                        value={editingSnack ? editingSnack.description : newSnack.description}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, description: e.target.value }) : setNewSnack({ ...newSnack, description: e.target.value })} />

                    <div style={{ gridColumn: "span 1", display: "flex", gap: "10px" }}>
                        <button type="submit" style={btnSubmitStyle}>{editingSnack ? "CẬP NHẬT" : "THÊM MỚI"}</button>
                        {editingSnack && <button type="button" onClick={() => { setEditingSnack(null); setPreview(null); }} style={btnCancelStyle}>HỦY</button>}
                    </div>
                </form>
            </div>

            <table style={tableStyle}>
                <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                        <th style={thStyle}>Ảnh</th>
                        <th style={thStyle}>Tên món</th>
                        <th style={thStyle}>Giá</th>
                        <th style={thStyle}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {snacks.map(s => (
                        <tr key={s._id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={tdStyle}>
                                <img src={`http://localhost:5000${s.image}`} width="55" height="55" style={{ borderRadius: "8px", objectFit: "cover" }}
                                    onError={(e) => e.target.src = "https://via.placeholder.com/50"} />
                            </td>
                            <td style={tdStyle}><b>{s.name}</b></td>
                            <td style={{ ...tdStyle, color: "#fb4226", fontWeight: "bold" }}>{s.price.toLocaleString()}đ</td>
                            <td style={tdStyle}>
                                <button onClick={() => { setEditingSnack(s); setPreview(null); }} style={{ ...btnEditStyle, marginRight: 10 }}>Sửa</button>
                                <button onClick={() => handleDeleteSnack(s._id)} style={btnDeleteStyle}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Styles giữ nguyên từ Admin.jsx của sếp ---
const cardStyle = { background: "#fdfcf0", padding: "25px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "30px" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "100%", boxSizing: "border-box" };
const btnSubmitStyle = { padding: "12px", background: "#fb4226", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", flex: 1 };
const btnCancelStyle = { background: '#888', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: "12px", flex: 1 };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "15px", textAlign: "left", color: "#666" };
const tdStyle = { padding: "15px", color: "#333" };
const btnDeleteStyle = { padding: "5px 12px", background: "none", border: "1px solid #e74c3c", color: "#e74c3c", borderRadius: "4px", cursor: "pointer" };
const btnEditStyle = { background: "none", border: "1px solid #3498db", color: "#3498db", padding: "5px 12px", borderRadius: "4px", cursor: "pointer" };