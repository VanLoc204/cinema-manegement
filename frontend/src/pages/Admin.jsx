import { useState } from "react";

export default function Admin() {
    const [activeTab, setActiveTab] = useState("dashboard");

    // 📝 Danh sách menu quản trị
    const menuItems = [
        { id: "dashboard", label: "📊 Dashboard", color: "#3498db" },
        { id: "movies", label: "🎬 Quản lý Phim", color: "#e74c3c" },
        { id: "rooms", label: "🏢 Quản lý Phòng chiếu", color: "#f1c40f" },
        { id: "showtimes", label: "🕒 Quản lý Suất chiếu", color: "#9b59b6" },
        { id: "users", label: "👥 Quản lý tài khoản", color: "#1abc9c" },
        { id: "revenue", label: "💰 Quản lý doanh thu", color: "#2ecc71" },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f6" }}>
            
            {/* 🏰 SIDEBAR (Menu bên trái) */}
            <div style={{
                width: "280px",
                background: "#2c3e50",
                color: "white",
                padding: "30px 0",
                display: "flex",
                flexDirection: "column",
                boxShadow: "4px 0 10px rgba(0,0,0,0.1)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ color: "#fb4226", margin: 0 }}>ADMIN PANEL</h2>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>CINEMA LUX SYSTEM</p>
                </div>

                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            padding: "15px 30px",
                            cursor: "pointer",
                            transition: "0.3s",
                            background: activeTab === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                            borderLeft: activeTab === item.id ? `5px solid ${item.color}` : "5px solid transparent",
                            fontWeight: activeTab === item.id ? "bold" : "normal",
                            display: "flex",
                            alignItems: "center",
                            gap: "15px"
                        }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* 🖥️ MAIN CONTENT (Nội dung bên phải) */}
            <div style={{ flex: 1, padding: "40px" }}>
                <div style={{ 
                    background: "#fff", 
                    padding: "30px", 
                    borderRadius: "15px", 
                    boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
                    minHeight: "80vh"
                }}>
                    <h1 style={{ color: "#333", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
                        {menuItems.find(i => i.id === activeTab).label}
                    </h1>

                    {/* ⚙️ Khu vực hiển thị nội dung từng mục */}
                    <div style={{ textAlign: "center", marginTop: "100px", color: "#aaa" }}>
                        <p style={{ fontSize: "1.5rem" }}>Nội dung mục <b>{activeTab}</b> đang được phát triển...</p>
                        <p>Vui lòng chọn mục khác hoặc đợi yêu cầu tiếp theo từ Sếp!</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
    