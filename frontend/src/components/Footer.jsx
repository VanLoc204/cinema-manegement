import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer style={footerStyle}>
            <style>{`
                .ft-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 40px;
                    text-align: left;
                    padding-bottom: 40px;
                    border-bottom: 1px solid #2d2d2d;
                }
                .ft-column {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .ft-title {
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-bottom: 8px;
                    border-left: 3px solid #fb4226;
                    padding-left: 10px;
                }
                .ft-link {
                    color: #999;
                    font-size: 0.82rem;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    display: inline-block;
                }
                .ft-link:hover {
                    color: #fb4226;
                    transform: translateX(4px);
                }
                .ft-info-text {
                    color: #999;
                    font-size: 0.82rem;
                    line-height: 1.6;
                }
                .ft-info-text strong {
                    color: #ccc;
                }
                .ft-social-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 5px;
                }
                .ft-social-icon {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .ft-social-icon:hover {
                    transform: translateY(-3px);
                    filter: brightness(1.15);
                }
                .ft-bottom {
                    max-width: 1200px;
                    margin: 30px auto 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #777;
                    font-size: 0.78rem;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                @media (max-width: 992px) {
                    .ft-container {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 30px;
                    }
                }
                @media (max-width: 576px) {
                    .ft-container {
                        grid-template-columns: 1fr;
                        gap: 25px;
                        padding-left: 15px;
                        padding-right: 15px;
                    }
                    .ft-bottom {
                        flex-direction: column;
                        text-align: center;
                        gap: 10px;
                    }
                }
            `}</style>

            {/* PHẦN TRÊN: CÁC CỘT THÔNG TIN */}
            <div className="ft-container">
                {/* Cột 1: Giới thiệu hệ thống */}
                <div className="ft-column">
                    <h4 className="ft-title">CINEMA LUX VIỆT NAM</h4>
                    <Link to="/terms-of-use" className="ft-link">Giới Thiệu Hệ Thống</Link>
                    <span className="ft-link">Tiện Ích Online VIP</span>
                    <span className="ft-link">Thẻ Quà Tặng & Ưu Đãi</span>
                    <span className="ft-link">Tuyển Dụng Nhân Sự</span>
                    <span className="ft-link">Liên Hệ Quảng Cáo</span>
                    <span className="ft-link">Dành Cho Đối Tác</span>
                </div>

                {/* Cột 2: Quy định & Điều khoản */}
                <div className="ft-column">
                    <h4 className="ft-title">ĐIỀU KHOẢN SỬ DỤNG</h4>
                    <Link to="/terms-of-use" className="ft-link">Quy Định & Điều Khoản Chung</Link>
                    <Link to="/ticket-terms" className="ft-link">Điều Khoản Giao Dịch Vé</Link>
                    <Link to="/payment-policy" className="ft-link">Chính Sách Thanh Toán CRM</Link>
                    <span className="ft-link">Chính Sách Bảo Mật Thông Tin</span>
                    <span className="ft-link">Nội Quy Phòng Chiếu Cinema</span>
                    <span className="ft-link">Câu Hỏi Thường Gặp (FAQs)</span>
                </div>

                {/* Cột 3: Chăm sóc khách hàng */}
                <div className="ft-column">
                    <h4 className="ft-title">CHĂM SÓC KHÁCH HÀNG</h4>
                    <div className="ft-info-text">
                        <strong>Hotline:</strong> 1900 1234<br />
                        <strong>Giờ làm việc:</strong> 8:00 - 22:00<br />
                        <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '2px', marginBottom: '8px' }}>
                            (Tất cả các ngày bao gồm cả Lễ Tết)
                        </span>
                        <strong>Email hỗ trợ:</strong> <span style={{ color: '#fb4226', fontWeight: 'bold' }}>hoidap@cinemalux.vn</span>
                    </div>
                </div>

                {/* Cột 4: Kết nối & Bộ công thương */}
                <div className="ft-column">
                    <h4 className="ft-title">KẾT NỐI VỚI CHÚNG TÔI</h4>
                    <div className="ft-social-group">
                        <a href="#facebook" className="ft-social-icon" title="Facebook">
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <rect width="36" height="36" rx="6" fill="#3a589e" />
                                <path d="M22 17h-3v9h-4v-9h-2v-3.5h2v-2c0-2.5 1.5-4 4-4h3v3.5h-2c-1 0-1 .5-1 1v1.5h3z" fill="#ffffff" />
                            </svg>
                        </a>
                        <a href="#youtube" className="ft-social-icon" title="YouTube">
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <rect width="36" height="36" rx="6" fill="#df2a2a" />
                                <rect x="7" y="10" width="22" height="16" rx="4" fill="#ffffff" />
                                <polygon points="16,14 22,18 16,22" fill="#df2a2a" />
                            </svg>
                        </a>
                        <a href="#instagram" className="ft-social-icon" title="Instagram">
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <defs>
                                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stop-color="#ffd521" />
                                        <stop offset="25%" stop-color="#f56040" />
                                        <stop offset="50%" stop-color="#e1306c" />
                                        <stop offset="100%" stop-color="#833ab4" />
                                    </linearGradient>
                                </defs>
                                <rect width="36" height="36" rx="6" fill="url(#ig-grad)" />
                                <rect x="9" y="9" width="18" height="18" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" />
                                <circle cx="18" cy="18" r="4.5" fill="none" stroke="#ffffff" strokeWidth="2" />
                                <circle cx="22.5" cy="13.5" r="1.2" fill="#ffffff" />
                            </svg>
                        </a>
                        <a href="#zalo" className="ft-social-icon" title="Zalo">
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <rect width="36" height="36" rx="6" fill="#0088cc" />
                                <path d="M18,9 C11.5,9 7,12.5 7,16.5 C7,19.2 9.5,21.5 13,22.8 L12.5,26.5 L16.5,24.2 C17,24.3 17.5,24.3 18,24.3 C24.5,24.3 29,20.8 29,16.8 C29,12.8 24.5,9 18,9 Z" fill="#ffffff" />
                                <text x="18" y="19.5" fill="#0088cc" fontFamily="'Inter', sans-serif" fontSize="6.5" fontWeight="900" textAnchor="middle">Zalo</text>
                            </svg>
                        </a>
                    </div>

                    {/* Logo Đã Thông Báo Bộ Công Thương */}
                    <div style={{ marginTop: '15px' }}>
                        <svg width="140" height="45" viewBox="0 0 150 50" style={{ cursor: 'pointer' }}>
                            <rect x="2" y="2" width="146" height="46" rx="8" fill="#007dce" stroke="#ffffff" strokeWidth="1.5"/>
                            <circle cx="24" cy="25" r="13" fill="#ffffff"/>
                            <path d="M17 25 l5 5 l11 -11" fill="none" stroke="#007dce" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            <text x="45" y="22" fill="#ffffff" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.2">ĐÃ THÔNG BÁO</text>
                            <text x="45" y="35" fill="#ffffff" fontFamily="'Inter', sans-serif" fontSize="8.5" fontWeight="700" letterSpacing="0.1">BỘ CÔNG THƯƠNG</text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* PHẦN DƯỚI: COPYRIGHT */}
            <div className="ft-bottom">
                <div>
                    <strong>CÔNG TY CỔ PHẦN TRUYỀN THÔNG & GIẢI TRÍ CINEMA LUX VIỆT NAM</strong>
                </div>
                <div>
                    © 2026 Cinema Lux. Dự án của sếp Hồ Văn Lộc & Huỳnh Bảo Duy. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

const footerStyle = {
    background: "#121212",
    color: "#888",
    padding: "60px 20px 40px 20px",
    marginTop: "80px",
    borderTop: "5px solid #fb4226"
};