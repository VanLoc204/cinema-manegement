import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../api/axios";

export default function TicketHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    
    const location = useLocation();
    const isWatchedView = location.pathname === "/watched-movies";
    const userId = localStorage.getItem("userId");
    const now = new Date();
    const API_URL = "http://localhost:5000"; 

    useEffect(() => {
        if (userId) {
            axios.get(`/bookings/user/${userId}`).then(res => {
                setHistory(res.data);
                setLoading(false);
            }).catch(err => {
                console.error("Lỗi lấy dữ liệu:", err);
                setLoading(false);
            });
        }
    }, [userId]);

    const unusedTickets = history.filter(t => new Date(t.showtimeId?.time) > now);
    const watchedMovies = Array.from(new Set(
        history.filter(t => new Date(t.showtimeId?.time) <= now)
               .map(t => JSON.stringify(t.showtimeId?.movieId))
    )).map(s => JSON.parse(s));

    if (loading) return <div style={{padding: 100, textAlign: 'center', color: '#999', fontSize: '0.9rem'}}>Đang tải dữ liệu của sếp...</div>;

    return (
        // ✅ Tăng maxWidth lên 1100px để khung rộng rãi hơn
        <div style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", minHeight: "80vh", fontFamily: "'Inter', sans-serif" }}>
            
            {/* 📊 DASHBOARD TỐI GIẢN */}
            {!isWatchedView && (
                <div style={dashboardStyle}>
                    <div style={statBox}>
                        <p style={statLabel}>VÉ ĐÃ MUA</p>
                        <h2 style={{...statNum, color: '#fb4226'}}>{unusedTickets.length}</h2>
                    </div>
                    <div style={{width: '1px', background: '#eee', height: '40px'}}></div>
                    <div style={statBox}>
                        <p style={statLabel}>PHIM ĐÃ XEM</p>
                        <h2 style={{...statNum, color: '#333'}}>{watchedMovies.length}</h2>
                    </div>
                </div>
            )}

            {isWatchedView ? (
                /* --- MÀN HÌNH: PHIM ĐÃ XEM (Căn trái, 4 phim/hàng) --- */
                <div style={{ textAlign: 'left' }}>
                    <h2 style={viewTitleStyle}>DANH SÁCH PHIM ĐÃ XEM</h2>
                    <div style={gridStyle}>
                        {watchedMovies.map(movie => (
                            <div key={movie?._id} style={{textAlign: 'center'}}>
                                <div style={posterWrapper}>
                                    <img src={`${API_URL}${movie?.image}`} style={posterImgStyle} alt={movie?.title}/>
                                </div>
                                <h4 style={movieTitleStyle}>{movie?.title}</h4>
                                <p style={movieSubTextStyle}>Cinema Lux Theater</p>
                            </div>
                        ))}
                    </div>
                    {watchedMovies.length === 0 && <p style={emptyTextStyle}>Sếp chưa có phim nào đã xem.</p>}
                </div>
            ) : (
                /* --- MÀN HÌNH: VÉ ĐÃ MUA (Khung rộng) --- */
                <div>
                    <div style={collapseHeader} onClick={() => setShowAllHistory(!showAllHistory)}>
                        <span style={{fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.5px'}}>LỊCH SỬ ĐẶT CHỖ</span>
                        <span style={{fontSize: '0.8rem', color: '#fb4226', fontWeight: 'bold'}}>
                            {showAllHistory ? "THU GỌN" : "XEM TẤT CẢ"}
                        </span>
                    </div>

                    <div style={{marginTop: '30px'}}>
                        <h3 style={listSectionTitle}>
                            {showAllHistory ? "TẤT CẢ GIAO DỊCH" : "VÉ CHƯA SỬ DỤNG"}
                        </h3>
                        {(showAllHistory ? history : unusedTickets).map(ticket => (
                            <div key={ticket._id} style={ticketRowSmall} onClick={() => setSelectedTicket(ticket)}>
                                <div style={{flex: 1}}>
                                    <h4 style={{margin: 0, color: '#333', fontSize: '1rem'}}>{ticket.showtimeId?.movieId?.title}</h4>
                                    <p style={ticketTimeText}>
                                        {new Date(ticket.showtimeId?.time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} • {new Date(ticket.showtimeId?.time).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <b style={{color: '#fb4226', fontSize: '1.1rem'}}>{ticket.totalAmount?.toLocaleString()}đ</b>
                                    <p style={paidStatusText}>Đã thanh toán</p>
                                </div>
                            </div>
                        ))}
                        {(showAllHistory ? history : unusedTickets).length === 0 && (
                            <p style={emptyTextStyle}>Không có dữ liệu hiển thị.</p>
                        )}
                    </div>
                </div>
            )}

            {/* 📄 MODAL THÔNG TIN VÉ (Giữ nguyên logic) */}
            {selectedTicket && (
                <div style={modalOverlay} onClick={() => setSelectedTicket(null)}>
                    <div style={invoiceContainer} onClick={e => e.stopPropagation()}>
                        <div style={invoiceHeaderRed}>
                            <h3 style={{margin: 0, fontSize: '1rem', color: '#fff', letterSpacing: '1px', fontWeight: '800'}}>THÔNG TIN VÉ XEM PHIM</h3>
                        </div>
                        <div style={invoiceBody}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px'}}>
                                <div>
                                    <p style={cleanLabel}>Mã đặt vé</p>
                                    <h2 style={cleanIdText}>{selectedTicket._id.slice(-8).toUpperCase()}</h2>
                                    <p style={{...cleanLabel, marginTop: '10px'}}>Thời gian chiếu</p>
                                    <p style={cleanValueRed}>
                                        {new Date(selectedTicket.showtimeId?.time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - {new Date(selectedTicket.showtimeId?.time).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div style={qrWrapper}>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedTicket._id}`} style={{width: '70px', display: 'block'}}/>
                                </div>
                            </div>
                            <hr style={simpleLine}/>
                            <h3 style={movieTitleInvoice}>{selectedTicket.showtimeId?.movieId?.title}</h3>
                            <div style={infoGrid}>
                                <div><p style={cleanLabel}>Phòng chiếu</p><p style={infoVal}>{selectedTicket.showtimeId?.roomId?.name}</p></div>
                                <div><p style={cleanLabel}>Số vé</p><p style={infoVal}>0{selectedTicket.seats?.length}</p></div>
                                <div><p style={cleanLabel}>Số ghế</p><p style={{...infoVal, color: '#fb4226'}}>{selectedTicket.seats?.join(", ")}</p></div>
                            </div>
                            <hr style={simpleLine}/>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                <span style={{fontSize: '0.85rem', color: '#999', fontWeight: 'bold'}}>TỔNG TIỀN</span>
                                <b style={{color: '#fb4226', fontSize: '1.3rem', fontWeight: '900'}}>{selectedTicket.totalAmount?.toLocaleString()}đ</b>
                            </div>
                        </div>
                        <button onClick={() => setSelectedTicket(null)} style={closeBtnClean}>ĐÓNG</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 💄 STYLES REFINED ---
const dashboardStyle = { display: 'flex', background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', marginBottom: '40px', alignItems: 'center' };
const statBox = { flex: 1, textAlign: 'center' };
const statLabel = { margin: '0 0 8px 0', fontSize: '0.7rem', color: '#999', fontWeight: '800', letterSpacing: '1px' };
const statNum = { margin: 0, fontSize: '2rem', fontWeight: '900' };

// Chỉnh lại tiêu đề sát lề trái
const viewTitleStyle = { fontSize: '1.4rem', fontWeight: '900', color: '#333', marginBottom: '30px', paddingLeft: '5px', borderLeft: '5px solid #fb4226' };

// ✅ Ép đúng 4 phim mỗi hàng, dàn từ trái sang
const gridStyle = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '30px',
    justifyContent: 'start'
};

const posterWrapper = { 
    borderRadius: '16px', 
    overflow: 'hidden', 
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
    aspectRatio: '2 / 3', 
    background: '#eee' 
};

const posterImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const movieTitleStyle = { marginTop: '12px', fontSize: '0.95rem', fontWeight: '800', color: '#333', marginBottom: '4px' };
const movieSubTextStyle = { margin: 0, fontSize: '0.7rem', color: '#bbb', fontWeight: '600' };

const collapseHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f0f0f0', gap: '400px' };
const listSectionTitle = { fontSize: '0.85rem', color: '#bbb', fontWeight: '800', marginBottom: '20px', letterSpacing: '1px' };

// Làm hàng vé dài ra và đẹp hơn
const ticketRowSmall = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: '#fff', 
    padding: '25px', 
    borderRadius: '16px', 
    marginBottom: '15px', 
    border: '1px solid #f2f2f2', 
    cursor: 'pointer', 
    transition: '0.3s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
};

const ticketTimeText = { margin: '5px 0 0 0', fontSize: '0.85rem', color: '#aaa', fontWeight: '500' };
const paidStatusText = { margin: 0, fontSize: '0.7rem', color: '#2e7d32', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' };
const invoiceContainer = { background: '#fff', width: '380px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.2)' };
const invoiceHeaderRed = { background: '#fb4226', padding: '25px', textAlign: 'center' };
const invoiceBody = { padding: '30px' };
const cleanLabel = { margin: 0, fontSize: '0.65rem', color: '#bbb', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' };
const cleanIdText = { margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: '900', color: '#333' };
const cleanValueRed = { margin: '4px 0 0 0', fontSize: '1rem', fontWeight: '700', color: '#fb4226' };
const qrWrapper = { padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '15px' };
const simpleLine = { border: 'none', borderTop: '1px solid #f0f0f0', margin: '20px 0' };
const movieTitleInvoice = { margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '900', color: '#333' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' };
const infoVal = { margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: '700', color: '#444' };
const closeBtnClean = { width: '100%', padding: '20px', border: 'none', background: '#fcfcfc', color: '#999', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', borderTop: '1px solid #f0f0f0' };
const emptyTextStyle = { textAlign: 'center', color: '#ccc', padding: '50px', fontSize: '0.9rem', fontStyle: 'italic' };