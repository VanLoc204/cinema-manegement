import { useEffect, useState } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect, socket }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState([]);
    const [othersSelecting, setOthersSelecting] = useState([]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    useEffect(() => {
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => console.error("Lỗi lấy ghế:", err));

        if (socket) {
            socket.emit("join-showtime", showtimeId);

            socket.on("initial-selections", (initialSeats) => {
                setOthersSelecting(initialSeats);
            });

            socket.on("update-booked-seats", (updatedBookedSeats) => {
                setBookedSeats(updatedBookedSeats);
                setSelected((prev) => prev.filter(s => !updatedBookedSeats.includes(s.id)));
            });

            socket.on("someone-clicking", (data) => {
                if (data.userId !== localStorage.getItem("userId")) {
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
                                {isBooked || isOthersSelecting ? "X" : seatId}
                            </div>
                        );
                    })}
                    <span className="row-label">{row}</span>
                </div>
            ))}

            {/* 🎯 PHẦN CHÚ THÍCH ĐÃ ĐƯỢC TINH GỈAN VÀ FIX MÀU */}
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
            </div>
        </div>
    );
}