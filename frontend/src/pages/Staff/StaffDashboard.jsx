import React from 'react';

export default function StaffDashboard() {
    // Lấy tên từ localStorage để chào sếp cho thân thiện
    const userName = localStorage.getItem("name") || "Nhân viên";

    return (
        <div style={{ padding: '10px' }}>
            <div style={welcomeHeader}>
                <h1 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>Chào buổi làm việc, sếp {userName}! ☕</h1>
                <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Hôm nay là một ngày tuyệt vời để phục vụ khách hàng Cinema Lux.</p>
            </div>

            {/* 📊 CÁC CON SỐ THỐNG KÊ NHANH TRONG CA */}
            <div style={statsGrid}>
                <div style={{ ...statCard, background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                    <p style={cardLabel}>DOANH THU CA TRỰC</p>
                    <h2 style={cardValue}>1,450,000đ</h2>
                    <span style={cardSub}>+15% so với hôm qua</span>
                </div>
                <div style={{ ...statCard, background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                    <p style={cardLabel}>VÉ ĐÃ BÁN (HÔM NAY)</p>
                    <h2 style={cardValue}>24 Vé</h2>
                    <span style={cardSub}>Tập trung phim: Địa Đạo</span>
                </div>
                <div style={{ ...statCard, background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)' }}>
                    <p style={cardLabel}>COMBO BẮP NƯỚC</p>
                    <h2 style={cardValue}>12 Bộ</h2>
                    <span style={cardSub}>Tỉ lệ đính kèm: 50%</span>
                </div>
            </div>

            {/* 📝 GHI CHÚ NHẮC NHỞ NHÂN VIÊN */}
            <div style={infoBox}>
                <h3 style={{ marginTop: 0, color: '#27ae60' }}>📌 Ghi chú ca làm việc hôm nay:</h3>
                <ul style={{ color: '#555', lineHeight: '2', fontSize: '0.95rem' }}>
                    <li>Luôn kiểm tra lại máy in hóa đơn và giấy in nhiệt trước khi vào ca.</li>
                    <li>Phim <b>"Địa Đạo"</b> đang có lượng khách đặt tại quầy rất đông, sếp chú ý điều phối.</li>
                    <li>Nhắc nhở khách hàng quét mã QR để tích điểm thành viên <b>Cinema Lux</b>.</li>
                    <li>Vệ sinh khu vực quầy POS sau mỗi đợt khách dồn dập.</li>
                </ul>
            </div>
        </div>
    );
}

// --- 💄 STYLES DASHBOARD CỰC CHUẨN ---
const welcomeHeader = { marginBottom: '40px' };

const statsGrid = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '25px', 
    marginBottom: '40px' 
};

const statCard = { 
    padding: '30px', 
    borderRadius: '20px', 
    color: '#fff', 
    boxShadow: '0 8px 25px rgba(46, 204, 113, 0.2)',
    position: 'relative',
    overflow: 'hidden'
};

const cardLabel = { margin: 0, fontSize: '0.85rem', fontWeight: 'bold', opacity: 0.9, letterSpacing: '1px' };
const cardValue = { margin: '15px 0 5px 0', fontSize: '2.4rem', fontWeight: '900' };
const cardSub = { fontSize: '0.75rem', opacity: 0.8 };

const infoBox = { 
    background: '#fff', 
    padding: '30px', 
    borderRadius: '20px', 
    borderLeft: '8px solid #2ecc71',
    boxShadow: '0 5px 15px rgba(0,0,0,0.02)' 
};