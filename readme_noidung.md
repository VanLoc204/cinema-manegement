# TÀI LIỆU HƯỚNG DẪN HỆ THỐNG CINEMA LUX
*(Dùng để cung cấp cho AI viết báo cáo chuẩn hóa theo Rubric học thuật)*

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO GEMINI VIẾT BÁO CÁO (PROMPT CHỦ ĐẠO):**
> Bạn là một chuyên gia viết báo cáo khoa học và đồ án tốt nghiệp công nghệ thông tin. Hãy sử dụng toàn bộ thông tin chi tiết về mã nguồn và kiến trúc của hệ thống quản lý rạp phim **Cinema Lux** dưới đây để hoàn thiện báo cáo Word theo đúng cấu trúc 5 Chương. 
> 
> **QUY TẮC VIẾT PHẢI TUÂN THỦ TUYỆT ĐỐI (RUBRIC ĐẠT & TỐT):**
> 1. **Cấu trúc đoạn văn (3 - 4 câu):** Mỗi đoạn văn chỉ được dài từ 3 đến 4 câu. Câu thứ nhất hoặc câu thứ hai **bắt buộc** phải là câu chủ đề (nêu bật nội dung chính của toàn đoạn).
> 2. **Độ dài câu:** Mỗi câu phải ngắn gọn, súc tích, tối đa không quá 2 dòng trên trang giấy, đúng ngữ pháp tiếng Việt.
> 3. **Tính liên kết (Mức Tốt):** Phải có ít nhất một câu chuyển tiếp (transition sentence) ở cuối mỗi đoạn văn hoặc ở cuối mỗi chương để dẫn dắt sang đoạn/chương kế tiếp một cách mượt mà.
> 4. **Tính nhất quán:** Các ý trong các đoạn của cùng một mục nhỏ phải phục vụ chung một chủ đề duy nhất.
> 5. **Chính tả:** Đảm bảo không có bất kỳ lỗi chính tả nào. Sử dụng thuật ngữ công nghệ chính xác theo mô tả.
> 6. **Mô hình hóa:** Sử dụng sơ đồ Mermaid hoặc mô tả quy trình dạng bảng để mô hình hóa cấu trúc và luồng dữ liệu.

---

# PHẦN I: DANH SÁCH CÁC CÔNG NGHỆ CỐT LÕI TRONG ĐỒ ÁN

Đồ án **Cinema Lux** được tích hợp 4 công nghệ đột phá chính cần báo cáo chi tiết:
1. **Socket.io:** Đồng bộ sơ đồ chọn ghế theo thời gian thực (Real-time Seat Selection).
2. **Cổng thanh toán PayOS (PayOS SDK):** Xử lý thanh toán trực tuyến tự động qua mã QR ngân hàng và webhook.
3. **Nodemailer:** Gửi email xác nhận đặt vé kèm mã QR check-in và mã OTP xác thực đăng ký/quên mật khẩu.
4. **Mô hình tối ưu hóa lịch chiếu tích hợp (Gom cụm K-Means & Giải thuật Di truyền):** Tự động tối ưu hóa lịch chiếu phim dựa trên dữ liệu doanh thu quá khứ, thể loại, độ tuổi và khung giờ vàng.


---

# PHẦN II: THÔNG TIN CHI TIẾT TỪNG CÔNG NGHỆ ĐỂ ĐƯA VÀO BÁO CÁO

## CÔNG NGHỆ 1: SOCKET.IO (ĐỒNG BỘ THỜI GIAN THỰC)

### CHƯƠNG 1: GIỚI THIỆU CÔNG NGHỆ
* **Công nghệ là gì:** Socket.io là một thư viện JavaScript cho phép truyền thông tin hai chiều, có độ trễ cực thấp giữa trình duyệt (Client) và máy chủ (Server). Socket.io hoạt động dựa trên giao thức WebSocket nhưng cung cấp thêm các tính năng dự phòng như HTTP long-polling và tự động kết nối lại khi mất mạng.
* **Tại sao chọn:** Trong hệ thống đặt vé xem phim, việc nhiều khách hàng cùng chọn một ghế tại một thời điểm rất dễ xảy ra lỗi trùng lặp. Socket.io giúp đồng bộ hóa sơ đồ ghế ngay lập tức, giúp người dùng khác nhìn thấy ghế nào đang bị chọn để tránh ấn trùng. Điều này nâng cao trải nghiệm người dùng và đảm bảo tính nhất quán dữ liệu của hệ thống.
* **Ứng dụng thực tế:** Socket.io được ứng dụng rộng rãi trong các ứng dụng nhắn tin trực tuyến (chat), ứng dụng theo dõi bản đồ trực tiếp của tài xế công nghệ hoặc các sàn giao dịch tài chính thời gian thực.

### CHƯƠNG 2: CÀI ĐẶT MÔI TRƯỜNG
* **Yêu cầu hệ thống:** NodeJS phiên bản 16.0 trở lên và môi trường chạy JavaScript phía Client (React/Vite).
* **Cài đặt:**
  * Backend: `npm install socket.io`
  * Frontend: `npm install socket.io-client`
* **Cấu hình:**
  * **Backend (`server.js`):**
    ```javascript
    const express = require("express");
    const http = require("http");
    const { Server } = require("socket.io");
    
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: "*" }
    });
    
    app.set("socketio", io); // Đăng ký io vào app để sử dụng trong controller
    ```
  * **Frontend (`App.jsx`):**
    ```javascript
    import io from "socket.io-client";
    const socket = io(window.location.origin, { autoConnect: true });
    ```

### CHƯƠNG 3: KIẾN THỨC CƠ BẢN
* **Cú pháp lắng nghe và gửi sự kiện:**
  * `socket.emit("eventName", data)`: Gửi sự kiện kèm dữ liệu đi.
  * `socket.on("eventName", callback)`: Lắng nghe sự kiện truyền về từ phía bên kia.
* **Thành phần chính:** 
  * `io.on("connection")`: Lắng nghe kết nối mới từ Client.
  * `socket.join(roomName)`: Đưa một kết nối vào một phòng riêng biệt (ví dụ: phòng của suất chiếu cụ thể).
  * `socket.to(roomName).emit()`: Phát tín hiệu tới toàn bộ các kết nối nằm trong phòng đó.
* **Ví dụ đơn giản:**
  ```javascript
  // Server lắng nghe và phát lại
  io.on("connection", (socket) => {
      socket.on("join-room", (roomId) => {
          socket.join(roomId);
      });
  });
  ```

### CHƯƠNG 4: SỬ DỤNG CÔNG NGHỆ TRONG ĐỒ ÁN
* **Các chức năng chính:** Đồng bộ sơ đồ ghế khi chọn ghế, giải phóng ghế khi hết thời gian giữ ghế (hold timer) hoặc khi giao dịch bị hủy.
* **Quy trình luồng dữ liệu (Sơ đồ Mermaid):**
  ```mermaid
  sequenceDiagram
      actor UserA as Khách Hàng A
      participant ClientA as Trình duyệt A
      participant Server as NodeJS Server (Socket.io)
      participant ClientB as Trình duyệt B
      
      UserA->>ClientA: Chọn ghế "D5"
      ClientA->>Server: emit("hold-seat", { showtimeId, seat: "D5" })
      Server->>Server: Lưu danh sách ghế tạm giữ vào bộ nhớ
      Server->>ClientB: to(showtimeId).emit("update-seats", allBookedSeats)
      Note over ClientB: Ghế "D5" trên màn hình B biến thành màu xám (Đã chọn)
  ```
* **Mã nguồn thực tế trong đồ án:**
  * **Frontend (`Booking.jsx`):**
    ```javascript
    // Khi mở trang đặt vé, client tham gia vào phòng của suất chiếu đó
    useEffect(() => {
        socket.emit("join-showtime", id);
        
        socket.on("update-booked-seats", (seats) => {
            setBookedSeats(seats); // Cập nhật danh sách ghế đã bị chọn
        });
        
        return () => {
            socket.emit("leave-showtime", id);
            socket.off("update-booked-seats");
        };
    }, [id]);
    ```

### CHƯƠNG 5: ỨNG DỤNG VÀO ĐỒ ÁN
* **Vị trí tích hợp:** Màn hình sơ đồ chọn ghế (`Booking.jsx`) của khách hàng và bộ điều khiển đặt vé (`bookingController.js`) của backend.
* **Cách tích hợp:** Socket kết hợp chặt chẽ với Database. Khi thanh toán thành công thông qua PayOS hoặc webhook, backend cập nhật trạng thái đơn vé là `Paid` và lập tức phát sự kiện `update-booked-seats` để giải phóng bộ đếm thời gian tạm giữ, đồng thời hiển thị ghế đó là ghế đã đặt vĩnh viễn trên thiết bị của các khách hàng khác.

---

## CÔNG NGHỆ 2: CỔNG THANH TOÁN PAYOS (PAYOS SDK)

### CHƯƠNG 1: GIỚI THIỆU CÔNG NGHỆ
* **Công nghệ là gì:** PayOS là cổng thanh toán mở thế hệ mới của Casso, hỗ trợ tạo liên kết và nhận diện giao dịch chuyển khoản ngân hàng hoàn toàn tự động qua mã QR động (VietQR). Mọi giao dịch được xác thực tức thời nhờ công nghệ Webhook bắt sự kiện từ tài khoản ngân hàng.
* **Tại sao chọn:** Khác với các cổng thanh toán truyền thống yêu cầu ký quỹ phức tạp, PayOS cung cấp SDK miễn phí, dễ tích hợp và tiền chuyển thẳng về tài khoản ngân hàng cá nhân của chủ rạp. Quá trình thanh toán bằng QR Code giúp khách hàng thao tác cực kỳ nhanh gọn trên điện thoại mà không cần nhập số tài khoản thủ công.
* **Ứng dụng thực tế:** PayOS được tích hợp vào các website thương mại điện tử, ứng dụng bán vé sự kiện, hoặc các hệ thống bán hàng tự động để xử lý dòng tiền nhanh chóng.

### CHƯƠNG 2: CÀI ĐẶT MÔI TRƯỜNG
* **Yêu cầu hệ thống:** NodeJS 14.0 trở lên, một tài khoản phát triển của PayOS để lấy các khóa bảo mật và ứng dụng ngân hàng hỗ trợ VietQR.
* **Cài đặt:** `npm install @payos/node` tại thư mục backend.
* **Cấu hình:**
  * Cấu hình biến môi trường (`.env`):
    ```env
    PAYOS_CLIENT_ID=mã_client_id_của_sếp
    PAYOS_API_KEY=mã_api_key_của_sếp
    PAYOS_CHECKSUM_KEY=mã_checksum_key_của_sếp
    ```
  * Khởi tạo đối tượng (`bookingController.js`):
    ```javascript
    const { PayOS } = require("@payos/node");
    const payos = new PayOS({
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY
    });
    ```

### CHƯƠNG 3: KIẾN THỨC CƠ BẢN
* **Các khái niệm cốt lõi:**
  * `paymentRequest`: Yêu cầu thanh toán chứa số tiền, mã đơn hàng, nội dung chuyển khoản và các đường link điều hướng khi thành công/hủy bỏ.
  * `checkoutUrl`: Đường dẫn dẫn tới cổng hiển thị mã QR động do PayOS sinh ra để khách hàng quét.
  * `webhook`: Một địa chỉ URL trên server của chúng ta đăng ký với PayOS nhằm nhận thông báo tự động từ ngân hàng ngay khi khách chuyển khoản thành công.
* **Quy trình hoạt động của mã QR động:**
  ```mermaid
  graph TD
      A[Khách bấm Đặt Vé] --> B[Server gọi PayOS tạo Link Thanh Toán]
      B --> C[Trả về checkoutUrl chứa mã QR ngân hàng]
      C --> D[Khách dùng App Ngân hàng quét mã QR]
      D --> E[Giao dịch hoàn tất]
      E --> F[PayOS gọi Webhook của Server báo thành công]
      F --> G[Hệ thống cập nhật trạng thái Paid và xuất vé]
  ```

### CHƯƠNG 4: SỬ DỤNG CÔNG NGHỆ TRONG ĐỒ ÁN
* **Các chức năng chính:** Tạo link thanh toán ngân hàng tự động cho hóa đơn đặt vé; Kiểm tra tình trạng giao dịch thời gian thực; Xử lý Webhook xác thực giao dịch để tránh gian lận.
* **Mã nguồn thực tế khởi tạo giao dịch (`bookingController.js`):**
  ```javascript
  const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));
  const paymentData = {
      orderCode: orderCode,
      amount: totalAmount,
      description: `LUXCINEMA ${String(booking._id).slice(-6)}`,
      cancelUrl: `http://localhost:5173/booking/${showtimeId}?status=cancelled&bookingId=${booking._id}`,
      returnUrl: `http://localhost:5173/booking/${showtimeId}?status=success&bookingId=${booking._id}`,
      items: [{ name: `Vé xem phim ${seats.join(", ")}`, quantity: 1, price: totalAmount }]
  };
  const paymentLink = await payos.paymentRequests.create(paymentData);
  ```
* **Mã nguồn xác thực Webhook chống giả mạo:**
  ```javascript
  exports.payosWebhook = async (req, res) => {
      try {
          const webhookData = await payos.webhooks.verify(req.body); // Xác thực chữ ký mã hóa
          if (req.body.code === "00") { // Mã 00 là thành công
              const booking = await Booking.findOne({ orderCode: webhookData.orderCode });
              if (booking && booking.status === "Pending") {
                  booking.status = "Paid";
                  await booking.save();
              }
          }
          return res.json({ success: true });
      } catch (err) {
          return res.json({ success: false });
      }
  };
  ```

### CHƯƠNG 5: ỨNG DỤNG VÀO ĐỒ ÁN
* **Vị trí tích hợp:** Hàm `createBooking` (Tạo thanh toán), `verifyPayment` (Kiểm tra thủ công khi khách quay lại web), và `payosWebhook` (Cập nhật tự động) thuộc file `bookingController.js`.
* **Cách tích hợp:** Kết nối chặt chẽ giữa React (Frontend) và Express (Backend). Khi khách hàng chọn xong ghế và bắp nước, nhấn nút thanh toán, React sẽ gọi API backend để sinh link QR. Hệ thống hiển thị giao diện cổng thanh toán PayOS. Ngay khi khách hàng chuyển tiền bằng điện thoại, Webhook tự động bắt tín hiệu, cập nhật trạng thái vé vào cơ sở dữ liệu MongoDB và gửi tín hiệu Socket.io thông báo cho các thiết bị khác cập nhật sơ đồ ghế.

---

## CÔNG NGHỆ 3: NODEMAILER (HỆ THỐNG EMAIL TỰ ĐỘNG & OTP XÁC THỰC)

### CHƯƠNG 1: GIỚI THIỆU CÔNG NGHỆ
* **Công nghệ là gì:** Nodemailer là một thư viện mã nguồn mở dành cho các ứng dụng NodeJS, cho phép thực hiện việc gửi email từ máy chủ một cách dễ dàng và bảo mật thông qua giao thức SMTP.
* **Tại sao chọn:** Hệ thống quản lý rạp phim cần gửi vé điện tử (e-ticket) ngay sau khi giao dịch thành công. Đồng thời, tính năng đăng ký tài khoản cần mã OTP để xác thực email chính chủ, tránh các tài khoản ảo gây rác hệ thống. Nodemailer hỗ trợ cấu hình gửi email qua dịch vụ Gmail SMTP của Google cực kỳ nhanh chóng, miễn phí và ổn định.
* **Ứng dụng thực tế:** Gửi thư kích hoạt tài khoản, email quảng cáo chiến dịch marketing, báo cáo doanh thu tự động định kỳ, gửi hóa đơn thanh toán điện tử.

### CHƯƠNG 2: CÀI ĐẶT MÔI TRƯỜNG
* **Yêu cầu hệ thống:** NodeJS 14.0 trở lên, một tài khoản Gmail cá nhân đã được kích hoạt tính năng **Mật khẩu ứng dụng (App Password)** từ cài đặt bảo mật 2 lớp của Google.
* **Cài đặt:** `npm install nodemailer`
* **Cấu hình (`emailService.js`):**
  ```javascript
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
          user: process.env.EMAIL_USER, // Địa chỉ email gửi thư
          pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng của Gmail
      }
  });
  ```

### CHƯƠNG 3: KIẾN THỨC CƠ BẢN
* **Các đối tượng cấu hình chính trong Nodemailer:**
  * `transporter`: Đối tượng chịu trách nhiệm kết nối và vận chuyển thư qua cổng SMTP.
  * `mailOptions`: Định nghĩa các thông tin của bức thư bao gồm người gửi (`from`), người nhận (`to`), tiêu đề (`subject`), nội dung dạng văn bản (`text`) hoặc nội dung dạng thiết kế HTML (`html`).
  * `sendMail`: Hàm kích hoạt tiến trình gửi email bất đồng bộ.
* **Ví dụ gửi thư cơ bản:**
  ```javascript
  const mailOptions = {
      from: '"Cinema Lux" <cinema@gmail.com>',
      to: "khachhang@gmail.com",
      subject: "Xin chào",
      html: "<b>Chúc bạn xem phim vui vẻ!</b>"
  };
  await transporter.sendMail(mailOptions);
  ```

### CHƯƠNG 4: SỬ DỤNG CÔNG NGHỆ TRONG ĐỒ ÁN
* **Các chức năng chính:** 
  1. Gửi mã OTP xác thực 6 số có thời hạn hiệu lực 60 giây khi đăng ký tài khoản mới hoặc khi khôi phục mật khẩu đã quên.
  2. Gửi email xác nhận đặt vé thành công chứa đầy đủ thông tin chi tiết hóa đơn (Tên phim, suất chiếu, số ghế, combo bắp nước) kèm mã QR Code chứa ID đơn hàng để nhân viên quét quét vé tại quầy (Check-in).
* **Mã nguồn thực tế gửi email xác nhận đặt vé kèm QR code:**
  ```javascript
  exports.sendBookingConfirmation = async (userEmail, bookingData) => {
      const { bookingId, showtime, seats, snacks, totalAmount } = bookingData;
      const movieTitle = showtime?.movieId?.title;
      
      const mailOptions = {
          from: `"Cinema Lux" <${process.env.EMAIL_USER}>`,
          to: userEmail,
          subject: "Xác nhận đặt vé thành công - Cinema Lux",
          html: `
              <div style="font-family: Arial; padding: 20px; max-width: 600px;">
                  <h2>Cảm ơn bạn đã đặt vé tại Cinema Lux!</h2>
                  <p>Phim: <strong>${movieTitle}</strong> - Ghế: ${seats.join(", ")}</p>
                  <p>Tổng cộng: <strong>${totalAmount.toLocaleString()} VND</strong></p>
                  <div style="text-align: center; margin: 20px;">
                      <p><strong>Mã QR Vé Của Bạn (Dùng để check-in tại rạp):</strong></p>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingId}" />
                  </div>
              </div>
          `
      };
      await transporter.sendMail(mailOptions);
  };
  ```

### CHƯƠNG 5: ỨNG DỤNG VÀO ĐỒ ÁN
* **Vị trí tích hợp:** Module dịch vụ email riêng biệt tại `backend/utils/emailService.js`. Được gọi gián tiếp trong `authController.js` (khi người dùng yêu cầu gửi mã OTP để đăng ký hoặc quên mật khẩu) và `bookingController.js` (khi thanh toán hoàn tất).
* **Cách tích hợp:** Nodemailer hoạt động như một tiến trình chạy ngầm bất đồng bộ (Asynchronous Background Process). Khi hệ thống bắt được sự kiện thanh toán thành công, luồng xử lý chính vẫn trả kết quả phản hồi nhanh cho khách hàng, đồng thời kích hoạt gửi email ngầm. Điều này giúp nâng cao tốc độ tải trang mà không làm nghẽn luồng xử lý giao dịch.

---

## CÔNG NGHỆ 4: MÔ HÌNH TỐI ƯU HÓA LỊCH CHIẾU (K-MEANS CLUSTERING & GENETIC ALGORITHM)

### CHƯƠNG 1: GIỚI THIỆU CÔNG NGHỆ
* **Công nghệ là gì:** Đây là một mô hình lai kết hợp giữa máy học không giám sát (**K-Means Clustering**), giải thuật tìm kiếm tối ưu hóa sinh học (**Genetic Algorithm**) và giải thuật heuristics (**Greedy Search**) cùng với hệ số suy giảm thời gian (**Time Decay Factor**).
* **Tại sao chọn:** Việc tự lên lịch chiếu phim cho rạp đòi hỏi sự kết hợp phức tạp giữa doanh thu phòng vé, tối ưu công suất phòng chiếu, giờ sinh học của khách hàng và thể loại phim. Nếu làm thủ công sẽ mất nhiều thời gian và dễ xảy ra xung đột. Giải thuật tự động phân tích thị hiếu người dùng, xếp phim siêu phẩm vào khung giờ vàng, đưa phim hoạt hình gia đình vào ban ngày cuối tuần, và xếp phim kinh dị/18+ vào ban đêm để tối ưu hóa lợi nhuận.
* **Ứng dụng thực tế:** Hệ thống gợi ý của Netflix, tối ưu hóa tuyến đường giao hàng của Grab/Uber, quản lý chuỗi cung ứng logistics hoặc xếp lịch bay tại các sân bay quốc tế.

### CHƯƠNG 2: CÀI ĐẶT MÔI TRƯỜNG
* **Yêu cầu hệ thống:** NodeJS 14.0 trở lên và cơ sở dữ liệu MongoDB chứa sẵn dữ liệu đặt vé lịch sử của khách hàng.
* **Cài đặt:** Không cần cài đặt thư viện bên thứ ba vì thuật toán được viết bằng ngôn ngữ JavaScript nguyên bản (Vanilla JS) từ đầu để tối ưu hóa tốc độ tính toán.
* **Cấu hình:** Tích hợp trực tiếp tại thư mục `backend/ai/scheduleAI.js` và điều phối qua `showtimeController.js`.

### CHƯƠNG 3: KIẾN THỨC CƠ BẢN
1. **Time Decay Factor (Hệ số phân rã thời gian):** Đánh giá mức độ "Hot" của một bộ phim. Doanh thu của phim ngày hôm nay có trọng số là `1.0`, phim chiếu từ 30 ngày trước sẽ suy giảm trọng số về gần `0.1`. Điều này giúp mô hình tự động phản ứng nhanh nhạy với các phim mới phát hành cực HOT và hạ nhiệt các phim cũ đã giảm sức hút.
2. **K-Means Clustering (Gom cụm K-Means):** Gom toàn bộ các phim đang chiếu thành 3 cụm riêng biệt: Cụm 0 (Phim cực HOT có điểm số cao nhất), Cụm 1 (Phim trung bình), Cụm 2 (Phim ít khách/phim ngách).
3. **Genetic Algorithm (Giải thuật di truyền - GA):** 
   * **Cá thể (Individual):** Một bản thảo lịch chiếu hoàn chỉnh cho toàn bộ các phòng chiếu trong khoảng ngày được chọn.
   * **Quần thể (Population):** Gồm 20 bản thảo lịch chiếu được sinh ra đồng thời.
   * **Hàm thích nghi (Fitness Function):** Hệ thống thang điểm đánh giá mức độ khôn ngoan của lịch chiếu (Phim Hot giờ vàng được thưởng lớn, phim kinh dị chiếu sáng sớm bị phạt nặng...).
   * **Lai ghép (Crossover):** Kết hợp hai lịch chiếu điểm cao để sinh ra lịch con tốt hơn.
   * **Đột biến (Mutation):** Tỷ lệ 10% để xóa ngẫu nhiên một ngày chiếu của một phòng và xếp lại từ đầu nhằm tìm kiếm giải pháp đột phá mới.
4. **Greedy Search (Giải thuật tham lam):** Điền phim liên tục vào một phòng chiếu từ 8:30 sáng đến 23:50 đêm, thời gian bắt đầu của phim sau bằng thời gian kết thúc phim trước cộng thêm 15 phút dọn dẹp phòng, đảm bảo phòng chiếu luôn được khai thác tối đa công suất mà không bị trống lịch.

### CHƯƠNG 4: SỬ DỤNG CÔNG NGHỆ TRONG ĐỒ ÁN
* **Các chức năng chính:** Tự động tạo bản nháp lịch chiếu thông minh chỉ bằng một cú click; Báo cáo chi tiết phân cụm phim gửi về Frontend; Phê duyệt/Hủy bỏ lịch nháp hàng loạt.
* **Quy trình hoạt động tổng quan (Sơ đồ Mermaid):**
  ```mermaid
  graph TD
      A[Lấy dữ liệu mua vé 30 ngày qua] --> B[Áp dụng Time Decay tính điểm cho từng Phim]
      B --> C[Chạy K-Means gom phim thành 3 nhóm: Hot, Thường, Ế]
      C --> D[Chạy GA: Tạo 20 lịch ngẫu nhiên bằng Greedy Search]
      D --> E[Chạy vòng lặp Tiến hóa 50 thế hệ: Chấm điểm - Chọn lọc - Lai ghép - Đột biến]
      E --> F[Chọn ra Lịch chiếu có điểm Fitness cao nhất]
      F --> G[Lưu vào Database dưới dạng Bản nháp Draft]
  ```

* **Mã nguồn thực tế thuật toán Gom cụm K-Means (`scheduleAI.js`):**
  ```javascript
  function kMeans(movies, k = 3, maxIterations = 20) {
      if (movies.length < k) return [[...movies], [], []];
      let centroids = [];
      for (let i = 0; i < k; i++) centroids.push(movies[Math.floor(Math.random() * movies.length)].score);
      let clusters = [];
      for (let iter = 0; iter < maxIterations; iter++) {
          clusters = Array.from({ length: k }, () => []);
          for (let m of movies) {
              let minDiff = Infinity, clusterIdx = 0;
              for (let i = 0; i < k; i++) {
                  let diff = Math.abs(m.score - centroids[i]);
                  if (diff < minDiff) { minDiff = diff; clusterIdx = i; }
              }
              clusters[clusterIdx].push(m);
          }
          for (let i = 0; i < k; i++) {
              if (clusters[i].length > 0) {
                  let sum = clusters[i].reduce((a, b) => a + b.score, 0);
                  centroids[i] = sum / clusters[i].length;
              }
          }
      }
      let sortedIndices = centroids.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c).map(x => x.i);
      return [clusters[sortedIndices[0]], clusters[sortedIndices[1]], clusters[sortedIndices[2]]];
  }
  ```

* **Mã nguồn thực tế Hàm Đánh giá Thích nghi (Fitness Function):**
  ```javascript
  calculateFitness(schedule) {
      let score = 0;
      for (let show of schedule) {
          let hour = show.time.getHours();
          let isGoldenHour = (hour >= 17 && hour <= 21);
          let m = show.movieRaw;
          
          // Phân loại cụm phim
          let clusterIdx = getClusterIndex(m);

          // CHIỀU 1: DOANH THU & GIỜ VÀNG
          if (clusterIdx === 0 && isGoldenHour) score += 50;  // Phim Hot + Giờ Vàng
          if (clusterIdx === 2 && isGoldenHour) score -= 20;  // Phim Ế + Giờ Vàng (Phạt)

          // CHIỀU 2: THỂ LOẠI VÀ ĐỘ TUỔI (NGHIỆP VỤ RẠP PHIM)
          const genre = (m.genre || "").toLowerCase();
          const rated = m.rated || "P";

          if ((genre.includes("hoạt hình") || genre.includes("gia đình")) && hour >= 22) score -= 30; // Trẻ em đi ngủ sớm
          if (rated.includes("18") && hour >= 22) score += 15; // Phim 18+ chiếu đêm khuya
          if ((rated.includes("18") || genre.includes("kinh dị")) && hour < 12) score -= 30; // Tránh chiếu kinh dị buổi sáng
      }
      return score;
  }
  ```

### CHƯƠNG 5: ỨNG DỤNG VÀO ĐỒ ÁN
* **Vị trí tích hợp:** File lõi tính toán tại `backend/ai/scheduleAI.js`, tích hợp với bộ API tại `showtimeController.js` và giao diện Dashboard dành cho Admin quản trị tại `ShowtimeManager.jsx`.
* **Cách tích hợp:** Khi Admin chọn khoảng ngày và nhấn "Tự động xếp lịch bằng AI", hệ thống sẽ gửi yêu cầu lên Backend. Backend tự động thu thập lịch sử bán vé 30 ngày qua, tính toán hệ số Time Decay, chạy gom cụm K-Means và tiến hóa lịch chiếu bằng giải thuật di truyền qua 50 thế hệ. Lịch chiếu tối ưu nhất sau đó được trả về dưới dạng các bản ghi có trạng thái bản nháp (`isDraft: true`). Admin có thể xem trực quan lịch nháp trên bảng phân phối giờ chiếu, nếu ưng ý thì bấm "Duyệt xuất bản lịch" để mở bán cho khách hàng, hoặc bấm "Hủy bỏ bản nháp" để hệ thống tự động xóa toàn bộ bản nháp và tính toán lại phương án khác.

---

# PHẦN IV: HƯỚNG DẪN VIẾT BÁO CÁO CỤ THỂ THEO CHƯƠNG
*(Sếp hãy đưa phần này kèm các thông tin công nghệ ở trên cho Gemini, nó sẽ tự động triển khai thành văn bản hoàn chỉnh đáp ứng 100% Rubric học thuật)*

## MÔ HÌNH VĂN BẢN VÍ DỤ ĐẠT CHUẨN RUBRIC (DÙNG ĐỂ THAM KHẢO)

> [!TIP]
> **Đoạn văn mẫu 1 (Chương 1 - Giới thiệu Socket.io) - Đạt chuẩn 4 câu, câu đầu là chủ đề, câu cuối chuyển tiếp:**
> Socket.io là một công nghệ truyền thông tin hai chiều thời gian thực cực kỳ hiệu quả hiện nay. Thư viện này hỗ trợ thiết lập một kết nối liên tục, ổn định giữa máy chủ và các trình duyệt của người dùng. Việc truyền tin tức thời giúp giải quyết triệt để bài toán đồng bộ hóa dữ liệu trên giao diện đồ họa. Nhờ những đặc điểm ưu việt này, công nghệ Socket.io đã được chúng tôi lựa chọn để ứng dụng vào hệ thống đặt vé Cinema Lux.
>
> **Đoạn văn mẫu 2 (Chương 5 - Ứng dụng PayOS) - Đạt chuẩn 4 câu, câu đầu là chủ đề, câu cuối chuyển tiếp:**
> Cổng thanh toán PayOS được tích hợp trực tiếp tại module xử lý hóa đơn đặt vé xem phim của dự án. Hệ thống sẽ tiếp nhận yêu cầu từ client, kết nối với SDK PayOS tại backend để sinh mã VietQR động tương ứng với số tiền cần thanh toán. Khách hàng thực hiện quét mã bằng app ngân hàng để hoàn thành giao dịch mà không cần nhập thủ công các thông tin chuyển khoản. Sau khi dòng tiền được xử lý thành công, hệ thống sẽ tự động kích hoạt tính năng gửi email xác nhận đặt vé cho người dùng.

---

## BẢNG TỔNG HỢP MÔ HÌNH HÓA QUY TRÌNH HỆ THỐNG
Dưới đây là bảng mô hình hóa sự luân chuyển thông tin của 4 công nghệ trong quy trình mua vé:

| Bước | Hành Động | Công Nghệ Sử Dụng | Vai Trò Trong Hệ Thống |
| :--- | :--- | :--- | :--- |
| **1** | Chọn ghế trên sơ đồ | **Socket.io** | Đồng bộ trạng thái ghế đang giữ thời gian thực giữa các khách hàng khác nhau. |
| **2** | Bấm Đặt vé & Thanh toán | **PayOS SDK** | Khởi tạo link giao dịch ngân hàng và hiển thị mã QR Code quét tiền nhanh. |
| **3** | Xử lý giao dịch | **PayOS Webhook** | Backend bắt sự kiện thanh toán thành công tự động từ ngân hàng, cập nhật DB MongoDB. |
| **4** | Phát hành vé điện tử | **Nodemailer** | Gửi email xác nhận đặt vé thành công kèm mã QR Code check-in và chi tiết hóa đơn. |
| **5** | Vận hành lịch chiếu | **Thuật toán gom cụm K-Means & Giải thuật GA** | Quét lịch sử đặt vé của các chu kỳ trước để mô hình học tập, tối ưu hóa phân phối lịch chiếu cho ngày tiếp theo. |
