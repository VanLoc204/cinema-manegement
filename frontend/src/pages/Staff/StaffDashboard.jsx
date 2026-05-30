// Trong file StaffDashboard.jsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";
import {
    FaWallet,
    FaTicketAlt,
    FaCoffee,
    FaUsers,
    FaChartLine,
    FaRegClock,
    FaUserCircle
} from "react-icons/fa";

export default function StaffDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ticketRevenue: 0,
        snackRevenue: 0,
        totalTickets: 0,
        totalSnacks: 0
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [warning, setWarning] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Cập nhật giờ thực tế mỗi phút
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        // Gọi API lấy dữ liệu thực tế
        axios.get("/bookings/staff-stats")
            .then(res => {
                setStats(res.data);
                setError("");
                // Kiểm tra 2.A1: Không có dữ liệu ca trực (doanh thu = 0 và vé = 0)
                if (res.data.totalRevenue === 0 && res.data.totalTickets === 0) {
                    setWarning("Chưa có dữ liệu ca làm này");
                } else {
                    setWarning("");
                }
            })
            .catch(err => {
                console.error("Lỗi hốt dữ liệu ca trực:", err);
                setError("Không thể tải dữ liệu, vui lòng thử lại");
                alert("Không thể tải dữ liệu, vui lòng thử lại");
            });

        return () => clearInterval(timer);
    }, []);

    const staffName = localStorage.getItem("name") || "Nhân viên";

    // Cấu hình các thẻ thông tin
    const cards = [
        {
            title: "DOANH THU CA TRỰC",
            value: `${stats.totalRevenue.toLocaleString()}đ`,
            icon: <FaWallet />,
            color: "#10b981",
            bg: "#ecfdf5",
            desc: "Tổng thu hôm nay"
        },
        {
            title: "TIỀN VÉ",
            value: `${stats.ticketRevenue.toLocaleString()}đ`,
            icon: <FaTicketAlt />,
            color: "#3b82f6",
            bg: "#eff6ff",
            desc: "Doanh thu bán vé"
        },
        {
            title: "TIỀN BẮP NƯỚC",
            value: `${stats.snackRevenue.toLocaleString()}đ`,
            icon: <FaCoffee />,
            color: "#f59e0b",
            bg: "#fffbeb",
            desc: "Doanh thu dịch vụ"
        },
        {
            title: "VÉ ĐÃ BÁN",
            value: `${stats.totalTickets}`,
            icon: <FaUsers />,
            color: "#ef4444",
            bg: "#fef2f2",
            desc: "Khách hàng đã đặt"
        },
        {
            title: "BẮP NƯỚC ĐÃ BÁN",
            value: `${stats.totalSnacks}`,
            icon: <FaChartLine />,
            color: "#8b5cf6",
            bg: "#f5f3ff",
            desc: "Số lượng combo"
        },
    ];

    return (
        <div style={{
            padding: "40px",
            background: "#f8fafc",
            minHeight: "100vh",
            fontFamily: "'Inter', sans-serif"
        }} className="dashboard-container">
            <style>{`
                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 15px !important;
                    }
                    .dashboard-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 20px !important;
                        margin-bottom: 25px !important;
                    }
                    .dashboard-time-card {
                        width: 100% !important;
                        justify-content: space-between !important;
                        box-sizing: border-box !important;
                    }
                    .dashboard-quick-action {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        text-align: center !important;
                        padding: 25px 20px !important;
                        gap: 20px !important;
                    }
                    .dashboard-quick-action button {
                        width: 100% !important;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 15px !important;
                    }
                    .stat-card {
                        padding: 20px !important;
                    }
                }
            `}</style>

            {/* --- HEADER --- */}
            <div className="dashboard-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '900',
                        color: '#1e293b',
                        margin: 0,
                        letterSpacing: '-0.5px',
                        lineHeight: '1.2'
                    }}>
                        Chào buổi làm việc, {staffName}!
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '5px', fontSize: '0.95rem' }}>
                        Chúc bạn có một ca trực thật hiệu quả và vui vẻ.
                    </p>
                </div>

                <div className="dashboard-time-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    background: '#fff',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                            <FaRegClock /> {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', color: '#3b82f6', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                        <FaUserCircle />
                    </div>
                </div>
            </div>

            {/* --- THÔNG BÁO CẢNH BÁO / LỖI --- */}
            {error && (
                <div style={{
                    padding: "15px 20px",
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: "12px",
                    color: "#ef4444",
                    fontWeight: "bold",
                    marginBottom: "30px",
                    fontSize: "0.95rem"
                }}>
                    ⚠️ {error}
                </div>
            )}

            {warning && !error && (
                <div style={{
                    padding: "15px 20px",
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    borderRadius: "12px",
                    color: "#d97706",
                    fontWeight: "bold",
                    marginBottom: "30px",
                    fontSize: "0.95rem"
                }}>
                    {warning}
                </div>
            )}

            {/* --- STATS GRID --- */}
            <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '25px'
            }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="stat-card"
                        style={{
                            background: '#fff',
                            padding: '30px',
                            borderRadius: '20px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9'
                        }}
                        onMouseEnter={(e) => {
                            if (window.innerWidth > 768) {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (window.innerWidth > 768) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.04)';
                            }
                        }}
                    >
                        {/* Biểu tượng trang trí mờ phía sau */}
                        <div style={{
                            position: 'absolute',
                            right: '-10px',
                            bottom: '-10px',
                            fontSize: '5rem',
                            color: card.color,
                            opacity: 0.05,
                            transform: 'rotate(-15deg)'
                        }}>
                            {card.icon}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{
                                background: card.bg,
                                color: card.color,
                                width: '50px',
                                height: '50px',
                                borderRadius: '14px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '1.4rem'
                            }}>
                                {card.icon}
                            </div>
                            <span style={{
                                fontSize: '0.85rem',
                                color: '#64748b',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {card.title}
                            </span>
                        </div>

                        <h2 style={{
                            color: '#1e293b',
                            margin: '0 0 5px 0',
                            fontSize: '1.75rem',
                            fontWeight: '800'
                        }}>
                            {card.value}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* --- QUICK ACTION SECTION --- */}
            <div style={{ marginTop: '40px' }}>
                <div className="dashboard-quick-action" style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Trạm Soát Vé Nhanh</h3>
                        <p style={{ margin: '10px 0 0 0', opacity: 0.8, fontSize: '0.95rem', lineHeight: '1.4' }}>Sử dụng QR Code để quét vé cho khách vào phòng chiếu nhanh chóng.</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/staff/checkin'}
                        style={{
                            background: '#fff',
                            color: '#1e293b',
                            padding: '15px 35px',
                            borderRadius: '14px',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: '0.3s',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                        Mở Máy Quét QR
                    </button>
                </div>
            </div>
        </div>
    );
}
