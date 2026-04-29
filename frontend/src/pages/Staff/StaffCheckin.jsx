import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "../../api/axios";

export default function StaffCheckin() {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10, 
            qrbox: { width: 220, height: 220 }, 
            aspectRatio: 1.0 
        });

        scanner.render(onScanSuccess, onScanError);

        async function onScanSuccess(decodedText) {
            if (loading) return; 
            setLoading(true);

            try {
                const res = await axios.patch(`/bookings/checkin/${decodedText}`);
                setScanResult(res.data.booking);
                setError(null);
                new Audio("https://www.soundjay.com/buttons/beep-07a.mp3").play();
            } catch (err) {
                const msg = err.response?.data?.message || "Vé không hợp lệ hoặc đã sử dụng!";
                setError(msg);
                setScanResult(null);
            } finally {
                setLoading(false);
            }
        }

        function onScanError(err) {}

        return () => scanner.clear(); 
    }, [loading]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            
            <div className="no-print-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: '30px' }}>
                
                {/* 🔍 BÊN TRÁI: MÁY QUÉT */}
                <div className="no-print" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: "20px", fontWeight: "900", color: "#333", fontSize: '1.4rem' }}>🎟️ SOÁT VÉ QR SYSTEM</h2>
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                        <div id="reader"></div>
                        <div style={{ marginTop: '15px', color: '#999', fontSize: '0.8rem', fontWeight: '700' }}>
                            {loading ? "ĐANG XÁC THỰC..." : "SẴN SÀNG QUÉT MÃ"}
                        </div>
                    </div>
                </div>

                {/* 🧾 BÊN PHẢI: CHI TIẾT VÉ TRÊN WEB */}
                <div style={webCardStyle}>
                    {/* BANNER THÔNG BÁO TRẠNG THÁI */}
                    {error && (
                        <div style={{ ...statusBanner, background: '#fff5f5', color: '#e74c3c', border: '1px solid #fed7d7' }}>
                            <b>❌ THẤT BẠI: {error}</b>
                        </div>
                    )}
                    {scanResult && !error && (
                        <div style={{ ...statusBanner, background: '#f0fff4', color: '#2ecc71', border: '1px solid #c6f6d5' }}>
                            <b>✅ XÁC NHẬN THÀNH CÔNG</b>
                        </div>
                    )}

                    {scanResult ? (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            <div style={ticketHeaderRed}>
                                <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#fff', fontWeight: '800' }}>THÔNG TIN CHI TIẾT</h3>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={labelStyle}>MÃ ĐẶT VÉ</p>
                                        <h2 style={idTextStyle}>{scanResult._id.slice(-8).toUpperCase()}</h2>
                                        <p style={{ ...labelStyle, marginTop: '8px' }}>SUẤT CHIẾU</p>
                                        <p style={redValueStyle}>
                                            {new Date(scanResult.showtimeId?.time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - {new Date(scanResult.showtimeId?.time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="no-print" style={qrBoxStyle}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${scanResult._id}`} style={{ width: '60px' }} alt="QR" />
                                    </div>
                                </div>

                                <hr style={lineStyle} />
                                <h3 style={movieTitleStyle}>{scanResult.showtimeId?.movieId?.title}</h3>
                                
                                <div style={infoGridStyle}>
                                    <div><p style={labelStyle}>PHÒNG</p><p style={infoValueStyle}>{scanResult.showtimeId?.roomId?.name}</p></div>
                                    <div><p style={labelStyle}>LOẠI</p><p style={infoValueStyle}>{scanResult.showtimeId?.roomId?.type || "Standard"}</p></div>
                                    <div><p style={labelStyle}>GHẾ</p><p style={{ ...infoValueStyle, color: '#fb4226' }}>{scanResult.seats?.join(", ")}</p></div>
                                </div>

                                {scanResult.snacks?.length > 0 && (
                                    <div style={snackBoxStyle}>
                                        <p style={{ ...labelStyle, marginBottom: '5px' }}>🍿 BẮP NƯỚC:</p>
                                        {scanResult.snacks.map((s, i) => (
                                            <div key={i} style={snackRowStyle}>
                                                <span>{s.name} x{s.quantity}</span>
                                                <b>{(s.price * s.quantity).toLocaleString()}đ</b>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <hr style={lineStyle} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={labelStyle}>TỔNG TIỀN</span>
                                    <b style={{ color: '#fb4226', fontSize: '1.3rem', fontWeight: '900' }}>{scanResult.totalAmount?.toLocaleString()}đ</b>
                                </div>
                            </div>

                            <div className="no-print" style={{ display: 'flex', gap: '8px', padding: '0 20px 20px 20px' }}>
                                <button onClick={handlePrint} style={printBtnStyle}>🖨️ IN VÉ GIẤY</button>
                                <button onClick={() => {setScanResult(null); setError(null)}} style={resetBtnStyle}>XONG</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#ccc' }}>
                            <p style={{ fontSize: '2.5rem', margin: 0 }}>🎟️</p>
                            <p style={{fontSize: '0.85rem'}}>Vui lòng quét vé để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 🚩 KHU VỰC IN VÉ (CÔ LẬP HOÀN TOÀN) */}
            {scanResult && (
                <div id="print-ticket-target" className="print-only">
                    <div style={printContainerStyle}>
                        <div style={ticketHeaderRed}>VÉ XEM PHIM - CINEMA LUX</div>
                        <div style={{ padding: '20px' }}>
                            <div style={{textAlign: 'center', marginBottom: '15px'}}>
                                <p style={labelStyle}>MÃ ĐẶT VÉ</p>
                                <h2 style={{margin: 0, fontSize: '24px'}}>{scanResult._id.slice(-8).toUpperCase()}</h2>
                            </div>
                            <p style={printText}>Phim: <b>{scanResult.showtimeId?.movieId?.title}</b></p>
                            <p style={printText}>Suất: <b>{new Date(scanResult.showtimeId?.time).toLocaleTimeString('vi-VN')} - {new Date(scanResult.showtimeId?.time).toLocaleDateString('vi-VN')}</b></p>
                            <p style={printText}>Phòng: <b>{scanResult.showtimeId?.roomId?.name} ({scanResult.showtimeId?.roomId?.type || "Standard"})</b></p>
                            <p style={printText}>Ghế: <b style={{fontSize: '18px'}}>{scanResult.seats?.join(", ")}</b></p>
                            
                            {scanResult.snacks?.length > 0 && (
                                <div style={{marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px'}}>
                                    <p style={labelStyle}>BẮP NƯỚC:</p>
                                    {scanResult.snacks.map((s, i) => (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                                            <span>{s.name} x{s.quantity}</span>
                                            <span>{(s.price * s.quantity).toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{marginTop: '15px', borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between'}}>
                                <b>TỔNG CỘNG:</b>
                                <b style={{fontSize: '20px'}}>{scanResult.totalAmount?.toLocaleString()}đ</b>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .print-only { display: none; }
                @media print {
                    /* 1. Giấu toàn bộ thế giới trừ cái Target */
                    body * { visibility: hidden !important; }
                    #print-ticket-target, #print-ticket-target * { 
                        visibility: visible !important; 
                        display: block !important;
                    }
                    /* 2. Ép nó về góc trên trái */
                    #print-ticket-target {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                    }
                    @page { size: auto; margin: 0; }
                    div { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}

// --- 💄 STYLES LUXURY ---
const webCardStyle = { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', height: 'fit-content', border: '1px solid #f0f0f0' };
const ticketHeaderRed = { background: '#fb4226', padding: '12px', textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: '14px' };
const statusBanner = { padding: '12px', borderRadius: '12px', margin: '15px', textAlign: 'center', fontSize: '0.85rem' };
const labelStyle = { margin: 0, fontSize: '10px', color: '#bbb', fontWeight: '800', textTransform: 'uppercase' };
const idTextStyle = { margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: '900', color: '#333' };
const redValueStyle = { margin: '2px 0 0 0', fontSize: '1rem', fontWeight: '700', color: '#fb4226' };
const qrBoxStyle = { padding: '5px', background: '#fff', border: '1px solid #eee', borderRadius: '10px' };
const lineStyle = { border: 'none', borderTop: '1px solid #f2f2f2', margin: '12px 0' };
const movieTitleStyle = { margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: '900', color: '#333' };
const infoGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const infoValueStyle = { margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: '700', color: '#444' };
const snackBoxStyle = { marginTop: '12px', padding: '12px', background: '#fcfcfc', borderRadius: '12px', border: '1px solid #f2f2f2' };
const snackRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px', fontWeight: '600' };
const printBtnStyle = { flex: 1.5, padding: "12px", background: "#2ecc71", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: '0.85rem' };
const resetBtnStyle = { flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: '0.85rem' };
const printContainerStyle = { background: '#fff', width: '380px', margin: '0 auto', border: '1px solid #000' };
const printText = { margin: '5px 0', fontSize: '14px' };