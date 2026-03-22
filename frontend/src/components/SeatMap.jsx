import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, onSelect }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        // Lấy danh sách ghế đã đặt từ Backend
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));
    }, [showtimeId]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const toggleSeat = (seatId) => {
        if (bookedSeats.includes(seatId)) return;
        const newSelection = selected.includes(seatId)
            ? selected.filter((s) => s !== seatId)
            : [...selected, seatId];
        setSelected(newSelection);
        onSelect(newSelection);
    };

    return (
        <div className="booking-container">
            {/* 📺 Phần màn hình */}
            <div className="screen-container">
                <div className="screen-arc"></div>
                <p className="screen-text">Màn hình</p>
            </div>

            {/* 💺 Hiển thị các hàng ghế */}
            {rows.map((row) => (
                <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    {cols.map((col) => {
                        const seatId = `${row}${col}`;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selected.includes(seatId);
                        
                        // Phân loại ghế dựa trên hàng (Giống mẫu CGV/Cinema Lux)
                        let type = "standard"; 
                        if (["D", "E", "F", "G"].includes(row)) type = "vip";
                        if (row === "I") type = "sweetbox";

                        return (
                            <div
                                key={seatId}
                                className={`seat-item ${type} ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                                onClick={() => toggleSeat(seatId)}
                            >
                                {/* ✅ Đã sửa: Hiện seatId (A1, A2...) thay vì chỉ hiện số cột */}
                                {isBooked ? "" : seatId}
                            </div>
                        );
                    })}
                    <span className="row-label">{row}</span>
                </div>
            ))}

            {/* 💡 Chú thích màu ghế */}
            <div className="legend">
                <div className="legend-item"><div className="legend-box" style={{background: "#7d7d7d"}}></div> Ghế thường</div>
                <div className="legend-item"><div className="legend-box" style={{background: "#fb4226"}}></div> Ghế VIP</div>
                <div className="legend-item"><div className="legend-box" style={{background: "#e91e63"}}></div> Sweetbox</div>
                <div className="legend-item"><div className="legend-box" style={{background: "#4b8df8"}}></div> Đang chọn</div>
                <div className="legend-item"><div className="legend-box" style={{background: "#e9e9e9", border: "1px solid #ddd"}}></div> Đã bán</div>
            </div>
        </div>
    );
}
