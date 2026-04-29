import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect, socket }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);
    const [othersSelecting, setOthersSelecting] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: "" });

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // 🚩 Sửa lại useEffect trong SeatMap.jsx
    useEffect(() => {
        // 1. Lấy dữ liệu ghế đã bán từ Database (Dữ liệu cứng)
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));

        if (socket) {
            // 🚩 2. Gia nhập phòng suất chiếu
            socket.emit("join_showtime", showtimeId);

            // 🚩 MỚI: Nhận danh sách ghế mà những người vào TRƯỚC sếp đang giữ
            socket.on("initial_selections", (initialSeats) => {
                console.log("Hứng dữ liệu người vào trước:", initialSeats);
                setOthersSelecting(initialSeats);
            });

            // 🚩 Lắng nghe khi có người khác đang click chọn ghế (Realtime)
            socket.on("someone_clicking", (data) => {
                if (data.userId !== localStorage.getItem("userId")) {
                    setOthersSelecting(data.selectedSeats || []);
                }
            });

            // 🚩 Lắng nghe khi có người THANH TOÁN THÀNH CÔNG (Chốt ghế xám)
            socket.on("confirm_booking", (data) => {
                const newlyBooked = data.seats;

                // Cập nhật danh sách ghế đã bán ngay lập tức
                setBookedSeats((prev) => [...new Set([...prev, ...newlyBooked])]);

                // Nếu sếp đang chọn trúng ghế người ta vừa mua xong, thì tự nhả ra cho sếp chọn ghế khác
                setSelected((prev) => {
                    const filtered = prev.filter(s => !newlyBooked.includes(s.id));
                    onSelect(filtered);
                    return filtered;
                });

                // Xóa khỏi danh sách "người khác đang chọn" vì họ đã mua xong rồi
                setOthersSelecting((prev) => prev.filter(id => !newlyBooked.includes(id)));
            });

            // 🚩 Khôi phục lại logic Hết giờ giữ ghế (3 phút)
            socket.on("hold_timeout", () => {
                setNotification({ show: true, message: "Hết 3 phút rồi sếp ơi, em nhả ghế ra cho người khác chọn nhé!" });
                setTimeout(() => setNotification({ show: false, message: "" }), 4000);
                setSelected([]);
                onSelect([]);
            });
        }

        // 🧹 Hàm Cleanup: Tránh việc đăng ký lặp lại nhiều lần gây lag
        return () => {
            if (socket) {
                socket.emit("leave_showtime", showtimeId);
                socket.off("initial_selections");
                socket.off("someone_clicking");
                socket.off("confirm_booking");
                socket.off("hold_timeout");
            }
        };
    }, [showtimeId, socket]);

    const toggleSeat = (seatId, row) => {
        if (bookedSeats.includes(seatId) || othersSelecting.includes(seatId)) return;

        let newSelection = [...selected];

        if (row === "I") {
            const colNum = parseInt(seatId.replace("I", ""));
            const partnerCol = colNum % 2 === 0 ? colNum - 1 : colNum + 1;
            const partnerId = `I${partnerCol}`;

            if (bookedSeats.includes(partnerId) || othersSelecting.includes(partnerId)) return;

            const isAlreadySelected = selected.some(s => s.id === seatId);
            if (isAlreadySelected) {
                newSelection = selected.filter(s => s.id !== seatId && s.id !== partnerId);
            } else {
                const pricePerSeat = (roomPrice + 50000) / 2;
                newSelection.push(
                    { id: seatId, type: "sweetbox", price: pricePerSeat },
                    { id: partnerId, type: "sweetbox", price: pricePerSeat }
                );
            }
        } else {
            const isSelected = selected.some(s => s.id === seatId);
            if (isSelected) {
                newSelection = selected.filter(s => s.id !== seatId);
            } else {
                const type = ["D", "E", "F", "G"].includes(row) ? "vip" : "standard";
                const price = type === "vip" ? roomPrice + 10000 : roomPrice;
                newSelection.push({ id: seatId, type, price });
            }
        }

        setSelected(newSelection);
        onSelect(newSelection);

        if (socket) {
            // 🚩 Đồng bộ tên sự kiện "selecting_seat"
            socket.emit("selecting_seat", {
                showtimeId,
                userId: localStorage.getItem("userId"),
                selectedSeats: newSelection.map(s => s.id)
            });
        }
    };

    return (
        <div className="booking-container">
            {notification.show && (
                <div className="timeout-notification">
                    {notification.message}
                </div>
            )}

            <div className="screen-container">
                <div className="screen-arc"></div>
                <p className="screen-text">MÀN HÌNH</p>
            </div>

            {rows.map((row) => (
                <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    {cols.map((col) => {
                        const seatId = `${row}${col}`;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selected.some(s => s.id === seatId);
                        const isOthersSelecting = othersSelecting.includes(seatId);

                        let type = "standard";
                        if (["D", "E", "F", "G"].includes(row)) type = "vip";
                        if (row === "I") type = "sweetbox";

                        return (
                            <div
                                key={seatId}
                                className={`seat-item ${type} 
                                    ${isBooked ? "booked" : ""} 
                                    ${isSelected ? "selected" : ""} 
                                    ${isOthersSelecting ? "others-selecting" : ""}`}
                                onClick={() => toggleSeat(seatId, row)}
                            >
                                {isBooked ? "X" : isOthersSelecting ? "X" : seatId}
                            </div>
                        );
                    })}
                    <span className="row-label">{row}</span>
                </div>
            ))}

            <div className="legend">
                <div className="legend-item">
                    <div className="legend-box" style={{ backgroundColor: "#7d7d7d" }}></div>
                    Ghế thường
                </div>
                <div className="legend-item">
                    <div className="legend-box" style={{ backgroundColor: "#fb4226" }}></div>
                    Ghế VIP
                </div>
                <div className="legend-item">
                    <div className="legend-box" style={{ backgroundColor: "#e91e63" }}></div>
                    Sweetbox
                </div>
                <div className="legend-item">
                    <div className="legend-box" style={{ backgroundColor: "#ff9800" }}></div>
                    Đang chọn
                </div>
            </div>
        </div>
    );
}