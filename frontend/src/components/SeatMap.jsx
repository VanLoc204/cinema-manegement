import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import "./seat.css";

export default function SeatMap({ showtimeId, roomPrice, onSelect, socket, selectedSeats = [] }) {
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selected, setSelected] = useState(selectedSeats);
    const [othersSelecting, setOthersSelecting] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: "" });
    const [zoomScale, setZoomScale] = useState(1);
    const [isReady, setIsReady] = useState(false);

    const scrollWrapperRef = useRef(null);
    const touchStartDistRef = useRef(0);
    const touchStartScaleRef = useRef(1);
    const zoomScaleRef = useRef(1);

    // Đồng bộ ref với state để tránh stale closures
    useEffect(() => {
        zoomScaleRef.current = zoomScale;
    }, [zoomScale]);

    const selectedSeatsRef = useRef(selectedSeats);
    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
    }, [selectedSeats]);

    // Đồng bộ state selected với prop selectedSeats từ cha
    useEffect(() => {
        setSelected(selectedSeats);
    }, [selectedSeats]);

    // 👆 Đăng ký sự kiện touch với option { passive: false } để chặn zoom mặc định của trình duyệt web mobile
    useEffect(() => {
        const wrapper = scrollWrapperRef.current;
        if (!wrapper) return;

        const handleStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault(); // Chặn hành vi zoom toàn trang của trình duyệt
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                touchStartDistRef.current = dist;
                touchStartScaleRef.current = zoomScaleRef.current;
            }
        };

        const handleMove = (e) => {
            if (e.touches.length === 2 && touchStartDistRef.current > 0) {
                e.preventDefault(); // Chặn hành vi zoom toàn trang của trình duyệt
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = dist / touchStartDistRef.current;
                const newScale = Math.min(Math.max(touchStartScaleRef.current * factor, 0.7), 1.6);
                setZoomScale(newScale);
            }
        };

        const handleEnd = () => {
            touchStartDistRef.current = 0;
        };

        wrapper.addEventListener("touchstart", handleStart, { passive: false });
        wrapper.addEventListener("touchmove", handleMove, { passive: false });
        wrapper.addEventListener("touchend", handleEnd);

        return () => {
            wrapper.removeEventListener("touchstart", handleStart);
            wrapper.removeEventListener("touchmove", handleMove);
            wrapper.removeEventListener("touchend", handleEnd);
        };
    }, []);

    // 🎯 Tự động cuộn sơ đồ ghế ra GIỮA màn hình trên điện thoại khi tải xong sơ đồ
    useEffect(() => {
        const wrapper = scrollWrapperRef.current;
        if (wrapper) {
            setIsReady(false); // Reset trước khi căn lề
            const timer = setTimeout(() => {
                const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
                if (maxScroll > 0) {
                    wrapper.scrollLeft = maxScroll / 2;
                }
                setIsReady(true); // Căn giữa xong, sẵn sàng hiển thị mượt mà
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [bookedSeats]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // 🚩 Sửa lại useEffect trong SeatMap.jsx để chạy 1 lần duy nhất khi mount
    useEffect(() => {
        // 1. Lấy dữ liệu ghế đã bán từ Database (Dữ liệu cứng)
        axios.get(`/bookings/${showtimeId}`)
            .then((res) => setBookedSeats(res.data))
            .catch(err => {
                console.error("Lỗi lấy ghế:", err);
            });

        if (socket) {
            const myUserId = localStorage.getItem("userId");
            const filterOthersSeats = (selectionsObj) => {
                if (!selectionsObj) return [];
                const othersSeats = [];
                for (const [uid, seatsList] of Object.entries(selectionsObj)) {
                    if (uid !== myUserId && Array.isArray(seatsList)) {
                        othersSeats.push(...seatsList);
                    }
                }
                return othersSeats;
            };

            // 🚩 2. Gia nhập phòng suất chiếu
            socket.emit("join_showtime", showtimeId);

            // 🚩 MỚI: Nhận danh sách ghế mà những người vào TRƯỚC sếp đang giữ
            socket.on("initial_selections", (selectionsObj) => {
                console.log("Hứng dữ liệu người vào trước:", selectionsObj);
                setOthersSelecting(filterOthersSeats(selectionsObj));
            });

            // 🚩 Lắng nghe cập nhật danh sách ghế đã bán chính thức (từ các nguồn khác hoặc khi hủy vé)
            socket.on("update-booked-seats", (updatedSeats) => {
                setBookedSeats(updatedSeats);
            });

            // 🚩 Phát tín hiệu đang chọn ghế ban đầu lên socket cho các clients khác thấy realtime ngay lập tức
            const currentInitialSeats = selectedSeatsRef.current;
            if (currentInitialSeats && currentInitialSeats.length > 0) {
                socket.emit("selecting_seat", {
                    showtimeId,
                    userId: myUserId,
                    selectedSeats: currentInitialSeats.map(s => s.id)
                });
            }

            // 🚩 Lắng nghe khi có người khác đang click chọn ghế (Realtime)
            socket.on("someone_clicking", (selectionsObj) => {
                setOthersSelecting(filterOthersSeats(selectionsObj));
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

            // 🚩 Khôi phục lại logic Hết giờ giữ ghế (5 phút)
            socket.on("hold_timeout", () => {
                setNotification({ show: true, message: "Hết 5 phút rồi sếp ơi, em nhả ghế ra cho người khác chọn nhé!" });
                setTimeout(() => setNotification({ show: false, message: "" }), 4000);
                setSelected([]);
                onSelect([]);
            });
        }

        // 🧹 Hàm Cleanup: Tránh việc đăng ký lặp lại nhiều lần gây lag
        return () => {
            if (socket) {
                socket.off("initial_selections");
                socket.off("update-booked-seats");
                socket.off("someone_clicking");
                socket.off("confirm_booking");
                socket.off("hold_timeout");
            }
        };
    }, [showtimeId, socket]);

    const toggleSeat = (seatId, row) => {
        // Chỉ coi là Đã bán nếu ghế đó có trong bookedSeats và KHÔNG phải là ghế chính sếp đang chọn
        const isActuallyBookedByOthers = bookedSeats.includes(seatId) && !selected.some(s => s.id === seatId);
        if (isActuallyBookedByOthers || othersSelecting.includes(seatId)) return;

        let newSelection = [...selected];

        if (row === "I") {
            const colNum = parseInt(seatId.replace("I", ""));
            const partnerCol = colNum % 2 === 0 ? colNum - 1 : colNum + 1;
            const partnerId = `I${partnerCol}`;

            const isPartnerActuallyBookedByOthers = bookedSeats.includes(partnerId) && !selected.some(s => s.id === partnerId);
            if (isPartnerActuallyBookedByOthers || othersSelecting.includes(partnerId)) return;

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
        <div className="booking-container" style={{ position: "relative" }}>
            {notification.show && (
                <div className="timeout-notification">
                    {notification.message}
                </div>
            )}

            {/* 🔍 Bộ công cụ thu phóng nổi kiểu MoMo */}
            <div className="zoom-toolbar">
                <button 
                    type="button" 
                    className="zoom-btn" 
                    onClick={() => setZoomScale(prev => Math.min(prev + 0.15, 1.6))} 
                    title="Phóng to"
                >
                    ＋
                </button>
                <button 
                    type="button" 
                    className="zoom-btn reset-btn" 
                    onClick={() => setZoomScale(1)} 
                    title="Mặc định"
                >
                    100%
                </button>
                <button 
                    type="button" 
                    className="zoom-btn" 
                    onClick={() => setZoomScale(prev => Math.max(prev - 0.15, 0.6))} 
                    title="Thu nhỏ"
                >
                    －
                </button>
            </div>

            <div className="screen-container">
                <div className="screen-arc"></div>
                <p className="screen-text">MÀN HÌNH</p>
            </div>

            {/* Container cuộn cho hàng ghế */}
            <div 
                className="seat-scroll-wrapper"
                ref={scrollWrapperRef}
                style={{
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.25s ease-in-out"
                }}
            >
                <div 
                    className="seat-zoom-container"
                    style={{ 
                        transform: `scale(${zoomScale})`, 
                        transformOrigin: "top center",
                        marginBottom: zoomScale > 1 ? `${(zoomScale - 1) * 360}px` : "0px",
                        transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
                    }}
                >
                    <div className={`seat-map-grid ${selected.length > 0 ? "has-selected" : ""}`}>
                        {rows.map((row) => (
                            <div key={row} className="seat-row">
                                <span className="row-label">{row}</span>
                                {cols.map((col) => {
                                    const seatId = `${row}${col}`;
                                    const isBooked = bookedSeats.includes(seatId) && !selected.some(s => s.id === seatId);
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
                    </div>
                </div>
            </div>

            <div className="legend">
                <div className="legend-row">
                    <div className="legend-item">
                        <div className="legend-box booked-legend-box">X</div>
                        <span>Đã đặt</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box" style={{ backgroundColor: "#7d7d7d" }}></div>
                        <span>Ghế thường</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box" style={{ backgroundColor: "#fb4226" }}></div>
                        <span>Ghế VIP</span>
                    </div>
                </div>
                <div className="legend-row">
                    <div className="legend-item">
                        <div className="legend-box" style={{ backgroundColor: "#e91e63" }}></div>
                        <span>Sweetbox</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-box" style={{ backgroundColor: "#4b8df8" }}></div>
                        <span>Đang chọn</span>
                    </div>
                </div>
            </div>
        </div>
    );
}