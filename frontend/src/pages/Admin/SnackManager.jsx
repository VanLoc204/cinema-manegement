import { useState, useEffect } from "react";
import axios from "../../api/axios"; // Sếp kiểm tra lại đường dẫn này nhé

export default function SnackManager() {
    const [snacks, setSnacks] = useState([]);
    const [editingSnack, setEditingSnack] = useState(null); // Lưu món đang chọn để sửa
    const [newSnack, setNewSnack] = useState({ name: "", price: "", description: "" });
    const [snackFile, setSnackFile] = useState(null); // Lưu file ảnh thật để upload
    const [preview, setPreview] = useState(null); // Để hiện ảnh nhỏ xem trước (preview)

    // 🔔 State quản lý thông báo tự tắt
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    const showNotify = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    const fetchSnacks = () => {
        axios.get("/snacks").then(res => setSnacks(res.data));
    };

    useEffect(() => {
        fetchSnacks();
    }, []);

    // ➕/✏️ HÀM LƯU BẮP NƯỚC (Dùng chung cho cả Thêm và Sửa)
    const handleSaveSnack = async (e) => {
        e.preventDefault();

        const data = editingSnack || newSnack;
        if (!data.name || !data.price || (!editingSnack && !snackFile)) {
            return showNotify("Vui lòng nhập đầy đủ thông tin", "error");
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("price", data.price);
        formData.append("description", data.description || "");

        if (snackFile) formData.append("image", snackFile);

        try {
            if (editingSnack) {
                await axios.put(`/snacks/${editingSnack._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                showNotify("Cập nhật thành công");
            } else {
                await axios.post("/snacks", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                showNotify("Thêm bắp nước mới thành công");
            }

            // Reset form và file input sau khi thành công
            setNewSnack({ name: "", price: "", description: "" });
            setEditingSnack(null);
            setSnackFile(null);
            setPreview(null);
            e.target.reset(); // Reset cái ô chọn file trên giao diện

            fetchSnacks();
        } catch (err) {
            if (editingSnack) {
                showNotify("Không thể cập nhật, vui lòng thử lại", "error");
            } else {
                showNotify("Không thể xử lý, vui lòng thử lại", "error");
            }
        }
    };

    // ❌ HÀM XÓA BẮP NƯỚC
    const handleDeleteSnack = async (id) => {
        if (window.confirm("Xóa món này khỏi kho")) {
            try {
                await axios.delete(`/snacks/${id}`);
                showNotify("Đã xóa bắp nước thành công");
                fetchSnacks();
            } catch (err) {
                showNotify("Không thể xóa, vui lòng thử lại", "error");
            }
        }
    };

    return (
        <div className="snack-manager-container" style={{ position: 'relative' }}>
            {/* 📢 THÔNG BÁO TỰ TẮT */}
            {notification.show && (
                <div style={{ ...toastStyle, backgroundColor: notification.type === "success" ? "#2ecc71" : "#e74c3c" }}>
                    {notification.message}
                </div>
            )}
            <style>{`
                .snack-manager-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                .snack-card-box {
                    background: #fdfcf0;
                    padding: 25px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    margin-bottom: 30px;
                }
                .snack-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                }
                .snack-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #eee;
                    margin-top: 15px;
                }
                .snack-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #fff;
                }

                @media (max-width: 992px) {
                    .snack-form-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .snack-form-grid textarea {
                        grid-column: span 2 !important;
                    }
                }

                @media (max-width: 768px) {
                    .snack-card-box {
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    .snack-form-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .snack-form-grid > div,
                    .snack-form-grid textarea {
                        grid-column: span 1 !important;
                    }
                    .snack-form-grid button {
                        width: 100%;
                    }
                }
            `}</style>
            
            <h2 style={{ color: "#333", marginBottom: 25, fontSize: "1.5rem", fontWeight: "800" }}>QUẢN LÝ BẮP NƯỚC & ĐỒ ĂN</h2>

            <div className="snack-card-box">
                <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#555", fontWeight: "bold" }}>{editingSnack ? "✏️ Sửa bắp nước" : "Thêm bắp nước mới"}</h3>
                <form onSubmit={handleSaveSnack} className="snack-form-grid">
                    <input placeholder="Tên món" style={inputStyle}
                        value={editingSnack ? editingSnack.name : newSnack.name}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, name: e.target.value }) : setNewSnack({ ...newSnack, name: e.target.value })} />

                    <input placeholder="Giá tiền" type="number" style={inputStyle}
                        value={editingSnack ? editingSnack.price : newSnack.price}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, price: e.target.value }) : setNewSnack({ ...newSnack, price: e.target.value })} />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: 'wrap' }}>
                        <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setSnackFile(file);
                                setPreview(URL.createObjectURL(file));
                            }
                        }} />
                        {/* Hiện preview ảnh hoặc ảnh cũ từ server */}
                        {(preview || (editingSnack && editingSnack.image)) && (
                            <img src={preview || `${import.meta.env.DEV ? "http://localhost:5000" : window.location.origin}${editingSnack.image}`} width="45" height="45" style={{ borderRadius: "5px", objectFit: "cover" }} />
                        )}
                    </div>

                    <textarea placeholder="Mô tả" style={{ ...inputStyle, gridColumn: "span 2", minHeight: '60px' }}
                        value={editingSnack ? editingSnack.description : newSnack.description}
                        onChange={e => editingSnack ? setEditingSnack({ ...editingSnack, description: e.target.value }) : setNewSnack({ ...newSnack, description: e.target.value })} />

                    <div style={{ gridColumn: "span 1", display: "flex", gap: "10px" }}>
                        <button type="submit" style={btnSubmitStyle}>{editingSnack ? "CẬP NHẬT" : "THÊM MỚI"}</button>
                        {editingSnack && <button type="button" onClick={() => { setEditingSnack(null); setPreview(null); }} style={btnCancelStyle}>Hủy bỏ</button>}
                    </div>
                </form>
            </div>

            <div className="snack-table-wrapper">
                <table className="snack-table">
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
                                    <img src={`${import.meta.env.DEV ? "http://localhost:5000" : window.location.origin}${s.image}`} width="50" height="50" style={{ borderRadius: "8px", objectFit: "cover" }}
                                        onError={(e) => e.target.src = "https://via.placeholder.com/50"} />
                                </td>
                                <td style={tdStyle}><b>{s.name}</b></td>
                                <td style={{ ...tdStyle, color: "#fb4226", fontWeight: "bold" }}>{s.price.toLocaleString()}đ</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setEditingSnack(s); setPreview(null); }} style={btnEditStyle}>Sửa</button>
                                        <button onClick={() => handleDeleteSnack(s._id)} style={btnDeleteStyle}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {snacks.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#999" }}>Không tìm thấy món nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
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
const toastStyle = { position: 'fixed', top: '20px', right: '20px', padding: '12px 25px', color: 'white', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };