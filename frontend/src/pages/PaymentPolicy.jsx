export default function PaymentPolicy() {
    return (
        <div style={containerStyle}>
            <style>{`
                .policy-header {
                    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                    color: #fff;
                    padding: 60px 20px;
                    text-align: center;
                    border-bottom: 5px solid #fb4226;
                    border-radius: 16px;
                    margin-bottom: 40px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }
                .policy-title {
                    font-size: 2.2rem;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                    margin: 0 0 10px 0;
                }
                .policy-subtitle {
                    color: #bbb;
                    font-size: 1rem;
                    margin: 0;
                    font-weight: 500;
                }
                .policy-content {
                    max-width: 900px;
                    margin: 0 auto;
                    background: #fff;
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 6px 25px rgba(0,0,0,0.02);
                    border: 1px solid #eee;
                }
                .policy-section {
                    margin-bottom: 35px;
                }
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #222;
                    border-left: 4px solid #fb4226;
                    padding-left: 15px;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                }
                .policy-text {
                    font-size: 0.92rem;
                    color: #555;
                    line-height: 1.8;
                    margin-bottom: 15px;
                }
                .policy-list {
                    margin-left: 20px;
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .policy-list li {
                    font-size: 0.92rem;
                    color: #555;
                    line-height: 1.6;
                }

                @media (max-width: 768px) {
                    .policy-header {
                        padding: 40px 15px;
                        margin-bottom: 25px;
                    }
                    .policy-title {
                        font-size: 1.6rem;
                    }
                    .policy-subtitle {
                        font-size: 0.85rem;
                    }
                    .policy-content {
                        padding: 25px 20px;
                    }
                    .section-title {
                        font-size: 1.1rem;
                    }
                }
            `}</style>

            <div className="policy-header">
                <h1 className="policy-title">CHÍNH SÁCH THANH TOÁN</h1>
                <p className="policy-subtitle">Hướng dẫn và chính sách bảo mật giao dịch tài chính tại Cinema Lux</p>
            </div>

            <div className="policy-content">
                <div className="policy-section">
                    <h3 className="section-title">1. Phương thức thanh toán được hỗ trợ</h3>
                    <p className="policy-text">
                        Cinema Lux tích hợp các giải pháp thanh toán bảo mật hiện đại nhất nhằm tạo sự tiện lợi tối đa cho sếp:
                    </p>
                    <ul className="policy-list">
                        <li><strong>Cổng thanh toán PayOS:</strong> Hỗ trợ quét mã chuyển khoản nhanh VietQR 24/7 của tất cả các ngân hàng nội địa tại Việt Nam. Xử lý xác nhận thanh toán realtime tức thì.</li>
                        <li><strong>Thanh toán trực tiếp tại quầy:</strong> Chấp nhận thanh toán bằng tiền mặt, quẹt thẻ POS hoặc quét mã ngân hàng trực tiếp tại quầy bán vé của rạp Cinema Lux.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">2. Chính sách bảo mật thông tin thanh toán</h3>
                    <p className="policy-text">
                        Chúng tôi hiểu tầm quan trọng của việc bảo mật dữ liệu giao dịch tài chính cá nhân của sếp:
                    </p>
                    <ul className="policy-list">
                        <li>Toàn bộ thông tin giao dịch được mã hóa chuẩn **SSL/TLS** bảo mật tuyệt đối từ trình duyệt của khách hàng đến cổng PayOS.</li>
                        <li>Hệ thống máy chủ Cinema Lux **không bao giờ lưu trữ** bất kỳ thông tin số tài khoản ngân hàng, thông tin thẻ tín dụng của sếp. Mọi quy trình xử lý thanh toán đều được ủy quyền bảo mật thông qua đối tác thanh toán chính thức có chứng chỉ quốc tế.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">3. Xử lý các sự cố thanh toán phát sinh</h3>
                    <p className="policy-text">
                        Nếu gặp sự cố trong quá trình giao dịch (Ví dụ: Tài khoản ngân hàng đã bị trừ tiền thành công nhưng hệ thống trang web báo lỗi hoặc không nhận được email/mã QR Code vé):
                    </p>
                    <ul className="policy-list">
                        <li>Sếp vui lòng giữ lại hóa đơn/tin nhắn trừ tiền của ngân hàng (Biên lai giao dịch).</li>
                        <li>Liên hệ ngay lập tức với bộ phận CSKH của Cinema Lux qua số Hotline **1900 1234** hoặc gửi email đính kèm ảnh chụp biên lai tới địa chỉ **hoidap@cinemalux.vn**.</li>
                        <li>Bộ phận kế toán sẽ thực hiện đối soát tài chính trên cổng PayOS và tiến hành kích hoạt vé thủ công hoặc hỗ trợ hoàn trả lại tiền cho sếp trong vòng **24 giờ làm việc**.</li>
                    </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: 0 }}>
                    <h3 className="section-title">4. Điều chỉnh giá vé & Dịch vụ</h3>
                    <p className="policy-text" style={{ marginBottom: 0 }}>
                        Mức giá vé xem phim, giá bắp nước và phụ thu hiển thị trên trang web đã bao gồm các loại thuế phí theo quy định pháp luật Việt Nam. Cinema Lux có quyền thay đổi giá niêm yết tùy thuộc vào chính sách kinh doanh từng thời điểm, nhưng cam kết sẽ luôn hiển thị minh bạch trước khi khách hàng nhấn nút xác nhận thanh toán.
                    </p>
                </div>
            </div>
        </div>
    );
}

const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif"
};
