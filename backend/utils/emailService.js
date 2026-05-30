const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendBookingConfirmation = async (userEmail, bookingData) => {
    try {
        if (!userEmail) {
            console.log("Không có email người dùng, bỏ qua gửi thư xác nhận.");
            return;
        }

        const { bookingId, showtime, seats, snacks, totalAmount, discountAmount, appliedVoucher } = bookingData;
        const movieTitle = showtime?.movieId?.title || "Phim không xác định";
        const roomName = showtime?.roomId?.name || "Phòng không xác định";
        const date = showtime?.time ? new Date(showtime.time).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa xác định";

        let snackTotal = 0;
        let snacksHtml = "";
        if (snacks && snacks.length > 0) {
            snacks.forEach(s => {
                snackTotal += (s.price * s.quantity);
            });
            snacksHtml = `
            <div style="margin-top: 15px;">
                <p style="margin-bottom: 5px;"><strong>Bắp nước đã đặt:</strong></p>
                <ul style="margin-top: 0; padding-left: 20px;">
                    ${snacks.map(s => `<li>${s.name} x ${s.quantity}</li>`).join("")}
                </ul>
            </div>`;
        }

        const mailOptions = {
            from: `"Cinema Lux" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: "Xác nhận đặt vé thành công - Cinema Lux",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #E50914; text-align: center;">Cảm ơn bạn đã đặt vé tại Cinema Lux!</h2>
                    <p>Chào bạn,</p>
                    <p>Đơn đặt vé của bạn đã được thanh toán thành công. Dưới đây là thông tin chi tiết:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Phim: <strong>${movieTitle}</strong></h3>
                        <p style="margin: 8px 0;"><strong>Rạp:</strong> Cinema Lux</p>
                        <p style="margin: 8px 0;"><strong>Phòng:</strong> ${roomName}</p>
                        <p style="margin: 8px 0;"><strong>Thời gian:</strong> ${date}</p>
                        <p style="margin: 8px 0;"><strong>Ghế:</strong> ${seats.join(", ")}</p>
                        
                        ${snacksHtml}

                        <hr style="border: none; border-top: 1px dashed #ccc; margin: 20px 0 15px 0;" />
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 5px 0; color: #555;">Tiền vé:</td>
                                <td style="padding: 5px 0; text-align: right; color: #555;">${(totalAmount + (discountAmount || 0) - snackTotal).toLocaleString("vi-VN")}đ</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #555;">Tiền bắp nước:</td>
                                <td style="padding: 5px 0; text-align: right; color: #555;">${snackTotal.toLocaleString("vi-VN")}đ</td>
                            </tr>
                            ${appliedVoucher ? `
                            <tr>
                                <td style="padding: 5px 0; color: #555;">Voucher đã dùng:</td>
                                <td style="padding: 5px 0; text-align: right; color: #555; text-transform: uppercase;">${appliedVoucher}</td>
                            </tr>
                            ` : ''}
                            ${((discountAmount || 0) > 0 || appliedVoucher || (snacks && snacks.some(s => s.price === 0))) ? `
                            <tr>
                                <td style="padding: 5px 0; color: #555;">Giảm giá voucher:</td>
                                <td style="padding: 5px 0; text-align: right; color: #E50914;">
                                    ${(discountAmount || 0) > 0 ? `-${(discountAmount || 0).toLocaleString("vi-VN")}đ` : 'Quà tặng'}
                                </td>
                            </tr>
                            ` : ''}
                        </table>

                        <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;" />
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 5px 0; font-size: 1.1rem; font-weight: bold;">TỔNG CỘNG:</td>
                                <td style="padding: 5px 0; text-align: right; color: #E50914; font-size: 1.3rem; font-weight: bold;">${totalAmount.toLocaleString("vi-VN")} VND</td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Mã QR Vé Của Bạn</p>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingId}" alt="Mã QR" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />
                        <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">Mã đặt vé: ${bookingId}</p>
                    </div>

                    <p style="margin-top: 30px;">Vui lòng đưa mã QR này cho nhân viên soát vé khi đến rạp.</p>
                    <p>Chúc bạn có một buổi xem phim vui vẻ!</p>
                    <p>Trân trọng,<br><strong>Đội ngũ Cinema Lux</strong></p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi email xác nhận đặt vé tới ${userEmail}`);
    } catch (error) {
        console.error("Lỗi khi gửi email xác nhận đặt vé:", error);
    }
};

// 📧 GỬI MÃ XÁC THỰC OTP QUA EMAIL
exports.sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Cinema Lux" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Mã xác thực đăng ký - Cinema Lux",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; text-align: center;">
                <h2 style="color: #E50914;">Cinema Lux</h2>
                <p>Mã xác thực của bạn là:</p>
                <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 8px; color: #E50914; margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">${otp}</div>
                <p style="color: #888; font-size: 0.9rem;">Mã có hiệu lực trong <strong>60 giây</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #aaa; font-size: 0.8rem;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi mã OTP tới ${email}`);
};
