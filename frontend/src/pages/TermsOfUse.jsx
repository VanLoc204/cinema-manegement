export default function TermsOfUse() {
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
                <h1 className="policy-title">QUY ĐỊNH VÀ ĐIỀU KHOẢN SỬ DỤNG</h1>
                <p className="policy-subtitle">Chào mừng sếp đến với hệ thống đặt vé điện ảnh thông minh Cinema Lux</p>
            </div>

            <div className="policy-content">
                <div className="policy-section">
                    <h3 className="section-title">1. Chấp thuận điều khoản</h3>
                    <p className="policy-text">
                        Bằng việc truy cập, đăng ký tài khoản hoặc mua vé trên trang web của Cinema Lux, sếp đã đồng ý tuân thủ toàn bộ các quy định và điều khoản sử dụng được nêu tại đây. Nếu không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ của hệ thống.
                    </p>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">2. Tài khoản hội viên & Bảo mật</h3>
                    <p className="policy-text">
                        Khi đăng ký tài khoản hội viên Cinema Lux, sếp có trách nhiệm cung cấp thông tin chính xác, đầy đủ và tự bảo mật thông tin đăng nhập của mình:
                    </p>
                    <ul className="policy-list">
                        <li>Không chia sẻ tài khoản đăng nhập hoặc mật khẩu cho người khác sử dụng.</li>
                        <li>Chịu trách nhiệm hoàn toàn đối với mọi hoạt động phát sinh từ tài khoản của mình.</li>
                        <li>Hệ thống có quyền khóa tài khoản nếu phát hiện hành vi gian lận hoặc vi phạm các quy định bảo mật chung.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">3. Hành vi bị nghiêm cấm</h3>
                    <p className="policy-text">
                        Để xây dựng một cộng đồng người yêu điện ảnh văn minh, lịch sự, Cinema Lux nghiêm cấm tuyệt đối các hành vi sau:
                    </p>
                    <ul className="policy-list">
                        <li><strong>Sao chép nội dung:</strong> Sử dụng mọi hình thức máy quay, máy chụp ảnh, điện thoại để ghi hình hoặc thu âm bộ phim đang chiếu trong rạp (vi phạm luật sở hữu trí tuệ).</li>
                        <li><strong>Tấn công hệ thống:</strong> Sử dụng phần mềm độc hại, robot hoặc các công cụ can thiệp trái phép vào cơ sở dữ liệu và hệ thống web của Cinema Lux.</li>
                        <li><strong>Mất trật tự công cộng:</strong> Gây ồn ào, mất trật tự hoặc có các hành vi thiếu văn hóa làm ảnh hưởng đến trải nghiệm xem phim của các khách hàng khác trong phòng chiếu.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3 className="section-title">4. Giới hạn trách nhiệm</h3>
                    <p className="policy-text">
                        Hệ thống Cinema Lux nỗ lực tối đa để đảm bảo sự ổn định của dịch vụ trực tuyến. Tuy nhiên, trong các sự cố bất khả kháng do nhà mạng cung cấp dịch vụ Internet, thiên tai hoặc các lỗi kỹ thuật ngoài tầm kiểm soát, Cinema Lux sẽ hỗ trợ khắc phục nhanh nhất nhưng không chịu trách nhiệm bồi thường thiệt hại gián tiếp phát sinh từ sự cố đó.
                    </p>
                </div>

                <div className="policy-section" style={{ marginBottom: 0 }}>
                    <h3 className="section-title">5. Thay đổi điều khoản</h3>
                    <p className="policy-text" style={{ marginBottom: 0 }}>
                        Ban quản trị Cinema Lux có quyền cập nhật, chỉnh sửa các điều khoản này bất kỳ lúc nào mà không cần thông báo trước. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải công khai lên trang web chính thức này.
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
