import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect, socket }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);
    // 📡 Quản lý danh sách ghế mà NGƯỜI KHÁC đang click
    const [othersSelecting, setOthersSelecting] = useState([]);

    // 🚩 ĐỊNH NGHĨA HÀNG VÀ CỘT
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    useEffect(() => {
        // 1. Lấy dữ liệu ghế đã bán ban đầu
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));

        if (socket) {
            socket.emit("join-showtime", showtimeId);

            // 📡 NGHE: Khi có người vừa thanh toán thành công (Ghế biến thành ĐỎ)
            socket.on("update-booked-seats", (updatedBookedSeats) => {
                setBookedSeats(updatedBookedSeats);
                // Tự động bỏ chọn nếu ghế mình đang nhắm bị người ta mua mất
                setSelected((prev) => prev.filter(s => !updatedBookedSeats.includes(s.id)));
            });

            // 📡 NGHE: Khi người khác đang click chọn ghế (Ghế biến thành VÀNG)
            socket.on("someone-clicking", (data) => {
                // Chỉ cập nhật nếu là của suất chiếu này và không phải chính mình
                if (data.userId !== localStorage.getItem("userId")) {
                    setOthersSelecting(data.selectedSeats);
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit("leave-showtime", showtimeId);
                socket.off("update-booked-seats");
                socket.off("someone-clicking");
            }
        };
    }, [showtimeId, socket]);

    const toggleSeat = (seatId, row) => {
        // 🛑 KHÓA GHẾ: Nếu ghế đã bán HOẶC có người khác đang chọn -> Cấm click
        if (bookedSeats.includes(seatId) || othersSelecting.includes(seatId)) return;

        let newSelection = [...selected];

        if (row === "I") {
            const colNum = parseInt(seatId.replace("I", ""));
            const partnerCol = colNum % 2 === 0 ? colNum - 1 : colNum + 1;
            const partnerId = `I${partnerCol}`;

            // Chặn luôn nếu ghế đối tác của Sweetbox đang bị người khác giữ
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

        // 📡 PHÁT TÍN HIỆU: Báo cho máy khác "Tôi đang click ghế này"
        if (socket) {
            socket.emit("selecting-seat", {
                showtimeId,
                userId: localStorage.getItem("userId"),
                selectedSeats: newSelection.map(s => s.id)
            });
        }
    };

    return (
        <div className="booking-container">
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
                                {/* ✨ CHỈNH LẠI: Hiện đúng 1 dấu X duy nhất */}
                                {isBooked || isOthersSelecting ? "X" : seatId}
                            </div>
                        );
                    })}
                    <span className="row-label">{row}</span>
                </div>
            ))}

            <div className="legend">
                <div className="legend-item"><div className="legend-box standard"></div> Ghế thường ({roomPrice.toLocaleString()}đ)</div>
                <div className="legend-item"><div className="legend-box vip"></div> Ghế VIP ({(roomPrice + 10000).toLocaleString()}đ)</div>
                <div className="legend-item"><div className="legend-box sweetbox"></div> Sweetbox ({(roomPrice + 50000).toLocaleString()}đ/cặp)</div>
                <div className="legend-item"><div className="legend-box selected"></div> Sếp đang chọn</div>
                <div className="legend-item"><div className="legend-box others-selecting"></div> Người khác đang giữ</div>
                <div className="legend-item"><div className="legend-box booked"></div> Đã bán</div>
            </div>
        </div>
    );
}