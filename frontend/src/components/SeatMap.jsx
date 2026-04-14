import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect, socket }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);
    // 📡 Danh sách tổng hợp tất cả ghế mà những người khác trong phòng đang chọn
    const [othersSelecting, setOthersSelecting] = useState([]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    useEffect(() => {
        // 1. Lấy dữ liệu ghế đã thanh toán từ Database
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));

        if (socket) {
            // 📡 2. Báo cho Server là tôi vào phòng này
            socket.emit("join-showtime", showtimeId);

            // 📥 3. NHẬN TRẠNG THÁI ĐẦU TIÊN (Fix lỗi người vào sau không thấy người vào trước)
            socket.on("initial-selections", (initialSeats) => {
                console.log("📥 Nhận danh sách ghế đang bị giữ từ những người vào trước:", initialSeats);
                setOthersSelecting(initialSeats);
            });

            // 📡 4. NGHE: Khi có người vừa thanh toán thành công
            socket.on("update-booked-seats", (updatedBookedSeats) => {
                setBookedSeats(updatedBookedSeats);
                setSelected((prev) => prev.filter(s => !updatedBookedSeats.includes(s.id)));
            });

            // 📡 5. NGHE: Khi người khác đang click chọn ghế (Real-time liên tục)
            socket.on("someone-clicking", (data) => {
                // Chỉ cập nhật nếu không phải chính mình
                if (data.userId !== localStorage.getItem("userId")) {
                    // Cập nhật lại danh sách những ghế người khác đang giữ (Server sẽ gửi mảng đã gộp)
                    // Hoặc sếp có thể xử lý gộp mảng ở đây nếu server chỉ gửi lẻ
                    setOthersSelecting(data.selectedSeats || []); 
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit("leave-showtime", showtimeId);
                socket.off("initial-selections");
                socket.off("update-booked-seats");
                socket.off("someone-clicking");
            }
        };
    }, [showtimeId, socket]);

    const toggleSeat = (seatId, row) => {
        // 🛑 Chặn click nếu ghế đã bán hoặc người khác đang chọn
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

        // 📡 PHÁT TÍN HIỆU: Gửi kèm cả showtimeId và userId để server lưu vào "Sổ cái"
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
                                {/* 🎯 HIỆN 1 DẤU X DUY NHẤT */}
                                {isBooked || isOthersSelecting ? "X" : seatId}
                            </div>
                        );
                    })}
                    <span className="row-label">{row}</span>
                </div>
            ))}

            <div className="legend">
                <div className="legend-item"><div className="legend-box standard"></div> Ghế thường</div>
                <div className="legend-item"><div className="legend-box vip"></div> Ghế VIP</div>
                <div className="legend-item"><div className="legend-box sweetbox"></div> Sweetbox</div>
                <div className="legend-item"><div className="legend-box selected"></div> Sếp chọn</div>
                <div className="legend-item"><div className="legend-box others-selecting"></div> Đang bị giữ (X)</div>
                <div className="legend-item"><div className="legend-box booked"></div> Đã bán (X)</div>
            </div>
        </div>
    );
}