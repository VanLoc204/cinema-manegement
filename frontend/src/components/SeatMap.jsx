import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));
    }, [showtimeId]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const toggleSeat = (seatId, row) => {
        if (bookedSeats.includes(seatId)) return;

        let newSelection = [...selected];
        
        // --- LOGIC GHẾ ĐÔI (SWEETBOX - Hàng I) ---
        if (row === "I") {
            const colNum = parseInt(seatId.replace("I", ""));
            // Xác định cặp ghế (1-2, 3-4, 5-6, ...)
            const partnerCol = colNum % 2 === 0 ? colNum - 1 : colNum + 1;
            const partnerId = `I${partnerCol}`;

            if (bookedSeats.includes(partnerId)) return; // Nếu 1 trong 2 đã bán thì không chọn được

            const isAlreadySelected = selected.some(s => s.id === seatId);

            if (isAlreadySelected) {
                newSelection = selected.filter(s => s.id !== seatId && s.id !== partnerId);
            } else {
                const pricePerSeat = (roomPrice + 50000) / 2; // Chia đôi phụ phí cho mỗi ghế trong cặp
                newSelection.push(
                    { id: seatId, type: "sweetbox", price: pricePerSeat },
                    { id: partnerId, type: "sweetbox", price: pricePerSeat }
                );
            }
        } 
        // --- LOGIC GHẾ THƯỜNG & VIP ---
        else {
            const isSelected = selected.some(s => s.id === seatId);
            if (isSelected) {
                newSelection = selected.filter(s => s.id !== seatId);
            } else {
                const type = ["D", "E", "F", "G"].includes(row) ? "vip" : "standard";
                // Ghế VIP sếp có muốn cộng thêm không? Nếu không thì mặc định bằng roomPrice
                const price = type === "vip" ? roomPrice + 10000 : roomPrice; 
                newSelection.push({ id: seatId, type, price });
            }
        }

        setSelected(newSelection);
        onSelect(newSelection); // Gửi mảng object lên cho Booking.jsx tính tổng
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
                        
                        let type = "standard"; 
                        if (["D", "E", "F", "G"].includes(row)) type = "vip";
                        if (row === "I") type = "sweetbox";

                        return (
                            <div
                                key={seatId}
                                className={`seat-item ${type} ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                                onClick={() => toggleSeat(seatId, row)}
                            >
                                {isBooked ? "" : seatId}
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
                <div className="legend-item"><div className="legend-box selected"></div> Đang chọn</div>
                <div className="legend-item"><div className="legend-box booked"></div> Đã bán</div>
            </div>
        </div>
    );
}