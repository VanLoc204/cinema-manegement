// Trong file StaffDashboard.jsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function StaffDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ticketRevenue: 0,
        snackRevenue: 0,
        totalTickets: 0,
        totalSnacks: 0
    });

    useEffect(() => {
        // Gọi API lấy dữ liệu thực tế của ngày hôm nay
        axios.get("/bookings/staff-stats")
            .then(res => {
                setStats(res.data);
            })
            .catch(err => console.error("Lỗi hốt dữ liệu ca trực:", err));
    }, []);

    // Gán dữ liệu vào các thẻ Card
    const cards = [
        { title: "DOANH THU CA TRỰC", value: `${stats.totalRevenue.toLocaleString()}đ`, color: "#2ecc71" },
        { title: "TIỀN VÉ", value: `${stats.ticketRevenue.toLocaleString()}đ`, color: "#3498db" },
        { title: "TIỀN BẮP NƯỚC", value: `${stats.snackRevenue.toLocaleString()}đ`, color: "#f1c40f" },
        { title: "VÉ ĐÃ BÁN", value: `${stats.totalTickets} Vé`, color: "#e74c3c" },
        { title: "COMBO BẮP NƯỚC", value: `${stats.totalSnacks} Bộ`, color: "#9b59b6" },
    ];

    return (
        <div style={{ padding: "30px" }}>
            <h2 style={{fontWeight: '900'}}>Chào buổi làm việc, sếp staff01! ☕</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '30px' }}>
                {cards.map((card, i) => (
                    <div key={i} style={{ background: '#fff', padding: '25px', borderRadius: '15px', borderTop: `5px solid ${card.color}`, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>{card.title}</p>
                        <h2 style={{ color: card.color, margin: '10px 0' }}>{card.value}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
}