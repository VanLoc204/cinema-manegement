export default function TicketTerms() {
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
                <h1 className="policy-title">ĐIỀU KHOẢN GIAO DỊCH VÉ</h1>
                <p className="policy-subtitle">Thông tin chi tiết về quy định giao dịch vé điện tử tại Cinema Lux</p>
            </div>

            <div className="policy-content">
                <div className="policy-section">
                    <h3 className="section-title">1. Quy trình mua vé trực tuyến</h3>
                    <p className="policy-text">
                        Khách hàng có thể thực hiện đặt mua vé trực tuyến thông qua trang web chính thức của Cinema Lux bằng các bước sau:
                    </p>
                    <ul className="policy-list">
                        <li>Bước 1: Chọn phim và suất chiếu mong muốn.</li>
                        <li>Bước 2: Lựa chọn vị trí ghế ngồi trên sơ đồ phòng chiếu trực quan.</li>
                        <li>Bước 3: Chọn thêm các combo bắp & nước ưu đãi (nếu có nhu cầu).</li>
                        <li>Bước 4: Nhập mã voucher khuyến mãi (nếu có).</li>
                        <li>Bước 5: Kiểm tra lại toàn bộ thông tin đơn hàng và thực hiện thanh toán trực tuyến qua cổng PayOS.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">2. Giới hạn giao dịch</h3>
                    <p className="policy-text">
                        Để đảm bảo cơ hội mua vé công bằng cho tất cả mọi người và phòng tránh các hoạt động mua đi bán lại bất hợp pháp (vé chợ đen), Cinema Lux áp dụng các giới hạn giao dịch sau:
                    </p>
                    <ul className="policy-list">
                        <li>Mỗi giao dịch trực tuyến khách hàng được phép đặt tối đa **8 ghế ngồi** trong một phòng chiếu.</li>
                        <li>Vé đặt trực tuyến chỉ được giữ chỗ thành công sau khi hệ thống nhận được phản hồi thanh toán hoàn tất từ cổng thanh toán đối tác.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">3. Nhận vé tại rạp</h3>
                    <p className="policy-text">
                        Sau khi hoàn tất giao dịch đặt vé thành công:
                    </p>
                    <ul className="policy-list">
                        <li>Hệ thống sẽ tự động gửi một email xác nhận kèm **mã QR Code giao dịch** độc duy nhất về hòm thư điện tử đăng ký của sếp.</li>
                        <li>Sếp có thể xem lại mã QR Code này bất kỳ lúc nào trong phần lịch sử giao dịch tại mục *"Hồ sơ cá nhân"*.</li>
                        <li>Khi đến rạp xem phim, sếp chỉ cần xuất trình mã QR Code này cho nhân viên soát vé quét mã để check-in vào phòng chiếu mà không cần phải in vé giấy.</li>
                    </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: 0 }}>
                    <h3 className="section-title">4. Chính sách đổi trả & hoàn tiền</h3>
                    <p className="policy-text">
                        Để bảo vệ quyền lợi chỗ ngồi của khách hàng và tính liên tục của các suất chiếu, Cinema Lux áp dụng chính sách **không hoàn tiền, không hủy bỏ và không thay đổi thông tin** đối với các vé xem phim đã được thanh toán thành công trực tuyến.
                    </p>
                    <p className="policy-text" style={{ marginBottom: 0 }}>
                        Trường hợp ngoại lệ duy nhất là khi suất chiếu bị hủy bỏ do sự cố kỹ thuật từ phía rạp phim. Khi đó, Cinema Lux sẽ chủ động liên hệ trực tiếp với khách hàng để giải quyết hoàn tiền hoặc đổi sang suất chiếu khác tương đương.
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
