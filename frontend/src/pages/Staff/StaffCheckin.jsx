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
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        });

        scanner.render(onScanSuccess, onScanError);

        async function onScanSuccess(decodedText) {
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

        function onScanError(err) { }

        return () => {
            try {
                scanner.clear();
            } catch (e) {
                console.warn("Scanner cleanup warning", e);
            }
        };
    }, []);

    const handleReset = () => {
        setScanResult(null);
        setError(null);
    };

    const handlePrint = () => {
        if (!scanResult) return;

        const ticketHTML = `
            <html>
                <head>
                    <title>In vé - Cinema Lux</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800;900&display=swap');
                        body { 
                            margin: 0; padding: 25px; 
                            font-family: 'Be Vietnam Pro', sans-serif; 
                            color: #1a1a1a;
                            width: 380px; 
                            min-height: 82vh; 
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                            background: #fff;
                        }
                        .header-banner { background: #fb4226; color: #fff; padding: 18px 10px; text-align: center; border-radius: 12px; margin-bottom: 20px; }
                        .header-brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
                        .header-sub { font-size: 8px; opacity: 0.8; font-weight: 600; margin-top: 3px; }
                        .id-section { text-align: center; margin-bottom: 20px; }
                        .label-id { font-size: 10px; color: #888; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                        .booking-id { font-size: 30px; font-weight: 900; color: #000; margin: 3px 0; letter-spacing: 1px; }
                        .divider { border-top: 2px dashed #eee; margin: 12px 0; }
                        .movie-info { margin-bottom: 15px; }
                        .movie-title { font-size: 20px; font-weight: 900; line-height: 1.2; color: #000; margin-bottom: 12px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                        .info-item .label { font-size: 9px; color: #999; font-weight: 800; text-transform: uppercase; margin-bottom: 3px; }
                        .info-item .value { font-size: 14px; font-weight: 700; color: #333; }
                        .seats-area { margin-top: 12px; padding: 10px; background: #fff5f5; border-radius: 8px; border-left: 4px solid #fb4226; }
                        .seats-label { font-size: 9px; color: #fb4226; font-weight: 800; margin-bottom: 2px; }
                        .seats-value { font-size: 18px; font-weight: 900; color: #fb4226; }
                        .snacks-section { margin-top: 15px; }
                        .snack-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; font-weight: 600; color: #444; }
                        .total-area { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid #000; }
                        .total-label { font-size: 13px; font-weight: 800; color: #000; }
                        .total-value { font-size: 22px; font-weight: 900; color: #000; }
                        .footer { margin-top: auto; text-align: center; padding-top: 20px; }
                        .footer-msg { font-weight: 800; font-size: 11px; color: #000; letter-spacing: 0.2px; }
                        .footer-time { font-size: 9px; color: #999; margin-top: 4px; font-weight: 600; }
                        @page { margin: 0; size: auto; }
                    </style>
                </head>
                <body>
                    <div class="header-banner">
                        <div class="header-brand">CINEMA LUX</div>
                        <div class="header-sub">PREMIUM CINEMA EXPERIENCE</div>
                    </div>
                    <div class="id-section">
                        <div class="label-id">BOOKING ID</div>
                        <div class="booking-id">${scanResult._id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div class="movie-info">
                        <div class="movie-title">${scanResult.showtimeId?.movieId?.title?.toUpperCase()}</div>
                        <div class="info-grid">
                            <div class="info-item"><span class="label">TIME:</span><span class="value">${new Date(scanResult.showtimeId?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div class="info-item"><span class="label">ROOM:</span><span class="value">${scanResult.showtimeId?.roomId?.name}</span></div>
                            <div class="info-item"><span class="label">DATE:</span><span class="value">${new Date(scanResult.showtimeId?.time).toLocaleDateString('vi-VN')}</span></div>
                            <div class="info-item"><span class="label">TYPE:</span><span class="value">${scanResult.showtimeId?.roomId?.type || "STANDARD"}</span></div>
                        </div>
                        <div class="seats-area"><div class="seats-label">SEATS / GHẾ</div><div class="seats-value">${scanResult.seats?.join(", ")}</div></div>
                    </div>
                    ${scanResult.snacks?.length > 0 ? `
                        <div class="snacks-section">
                            <div class="divider"></div>
                            <div class="label-id" style="margin-bottom: 8px;">CONCESSIONS</div>
                            ${scanResult.snacks.map(s => `
                                <div class="snack-row"><span>${s.name} x${s.quantity}</span><span>${(s.price * s.quantity).toLocaleString()}đ</span></div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="total-area"><div class="total-label">TOTAL AMOUNT</div><div class="total-value">${scanResult.totalAmount?.toLocaleString()}đ</div></div>
                    <div class="footer"><div class="footer-msg">CHÚC SẾP XEM PHIM VUI VẺ TẠI CINEMA LUX!</div><div class="footer-time">Printed at: ${new Date().toLocaleString('vi-VN')}</div></div>
                </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0'; iframe.style.bottom = '0';
        iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open(); doc.write(ticketHTML); doc.close();

        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }, 500);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Be Vietnam Pro', sans-serif" }}>

            <div className="no-print-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: '30px' }}>

                {/* BÊN TRÁI: MÁY QUÉT */}
                <div className="no-print" style={{ textAlign: 'center' }}>
                    <div style={{ position: 'sticky', top: '20px' }}>
                        <h2 style={{ marginBottom: "20px", fontWeight: "900", color: "#1a1a1a", fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
                            SOÁT VÉ QR SYSTEM
                        </h2>
                        <div style={scannerContainerStyle}>
                            <div id="reader" style={{ border: 'none !important' }}></div>
                            <div className="scan-line"></div>
                            <div style={{ marginTop: '15px', color: '#666', fontSize: '0.85rem', fontWeight: '600' }}>
                                {loading ? (
                                    <span className="shimmer" style={{ color: '#fb4226' }}>ĐANG XÁC THỰC...</span>
                                ) : (
                                    <span style={{ color: '#2ecc71' }}>● HỆ THỐNG SẴN SÀNG</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BÊN PHẢI: CHI TIẾT VÉ */}
                <div style={webCardStyle}>
                    {error && (
                        <div className="fade-in" style={{ ...statusBanner, background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)', color: '#e74c3c', border: '1px solid #ffccd5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <b style={{ fontSize: '0.9rem' }}>THẤT BẠI: {error}</b>
                            <button onClick={handleReset} style={{ ...resetBtnStyleWeb, padding: '6px 15px', fontSize: '0.75rem', background: '#e74c3c' }}>QUÉT LẠI</button>
                        </div>
                    )}
                    {scanResult && !error && (
                        <div className="fade-in" style={{ ...statusBanner, background: 'linear-gradient(135deg, #f0fff4 0%, #dcffe4 100%)', color: '#2ecc71', border: '1px solid #c6f6d5' }}>
                            <b style={{ fontSize: '0.9rem' }}>XÁC NHẬN THÀNH CÔNG</b>
                        </div>
                    )}

                    {scanResult ? (
                        <div className="fade-in-up">
                            <div style={ticketHeaderRedWeb}>
                                <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#fff', fontWeight: '800', letterSpacing: '1.5px' }}>THÔNG TIN CHI TIẾT</h3>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <p style={labelSmallWeb}>BOOKING ID</p>
                                        <h2 style={{ margin: '2px 0 0 0', fontWeight: '900', color: '#fb4226', fontSize: '1.6rem' }}>{scanResult._id.slice(-8).toUpperCase()}</h2>
                                        <p style={{ ...labelSmallWeb, marginTop: '12px' }}>SUẤT CHIẾU</p>
                                        <p style={{ fontSize: '1rem', fontWeight: '800', color: '#1a1a1a', margin: '2px 0' }}>
                                            {new Date(scanResult.showtimeId?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(scanResult.showtimeId?.time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="no-print" style={qrBoxStyleWeb}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${scanResult._id}`} style={{ width: '60px', borderRadius: '6px' }} alt="QR" />
                                    </div>
                                </div>

                                <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
                                    <p style={labelSmallWeb}>PHIM ĐANG CHIẾU</p>
                                    <h3 style={{ margin: '5px 0 15px 0', fontSize: '1.2rem', fontWeight: '900', color: '#000', lineHeight: '1.2' }}>{scanResult.showtimeId?.movieId?.title?.toUpperCase()}</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                        <div><p style={labelSmallWeb}>PHÒNG</p><p style={infoValueWeb}>{scanResult.showtimeId?.roomId?.name}</p></div>
                                        <div><p style={labelSmallWeb}>LOẠI</p><p style={infoValueWeb}>{scanResult.showtimeId?.roomId?.type || "Standard"}</p></div>
                                        <div><p style={labelSmallWeb}>GHẾ</p><p style={{ ...infoValueWeb, color: '#fb4226' }}>{scanResult.seats?.join(", ")}</p></div>
                                    </div>
                                </div>

                                {scanResult.snacks?.length > 0 && (
                                    <div style={snackBoxStyleWeb}>
                                        <p style={{ ...labelSmallWeb, color: '#666', marginBottom: '10px' }}>DỊCH VỤ ĐI KÈM</p>
                                        {scanResult.snacks.map((s, i) => (
                                            <div key={i} style={snackRowWeb}>
                                                <span>{s.name} x{s.quantity}</span>
                                                <b>{(s.price * s.quantity).toLocaleString()}đ</b>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ borderTop: '2px solid #1a1a1a', marginTop: '20px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#888' }}>TỔNG THANH TOÁN</span>
                                    <b style={{ color: '#000', fontSize: '1.6rem', fontWeight: '900' }}>{scanResult.totalAmount?.toLocaleString()}đ</b>
                                </div>
                            </div>

                            <div className="no-print" style={{ display: 'flex', gap: '10px', padding: '0 20px 20px 20px' }}>
                                <button onClick={handlePrint} style={printBtnStyleWeb}>IN VÉ GIẤY</button>
                                <button onClick={handleReset} style={resetBtnStyleWeb}>HOÀN TẤT</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ddd' }}>
                            <div className="pulse-icon" style={{ fontSize: '4rem', marginBottom: '20px', color: '#eee' }}>●</div>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#bbb' }}>VUI LÒNG QUÉT MÃ QR</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
                @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                .scan-line { position: absolute; width: 100%; height: 2px; background: linear-gradient(to right, transparent, #fb4226, transparent); box-shadow: 0 0 15px #fb4226; top: 0; left: 0; animation: scanMove 2.5s linear infinite; z-index: 10; pointer-events: none; }
                .fade-in-up { animation: fadeInUp 0.4s ease-out; }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                .pulse-icon { animation: pulse 2.5s infinite ease-in-out; }
                .shimmer { animation: shimmer 1.5s infinite ease-in-out; }
                #reader__scan_region { border: none !important; }
                #reader__dashboard_section_csr button { background: #fb4226 !important; color: white !important; border: none !important; padding: 8px 15px !important; border-radius: 8px !important; font-weight: 800 !important; cursor: pointer !important; text-transform: uppercase !important; font-size: 10px !important; }
            `}</style>
        </div>
    );
}

// --- 💄 STYLES WEB PREMIUM (COMPACT) ---
const webCardStyle = { background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', height: 'fit-content', border: '1px solid #f0f0f0' };
const scannerContainerStyle = { background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', border: '1px solid #eee', position: 'relative', overflow: 'hidden' };
const ticketHeaderRedWeb = { background: '#fb4226', padding: '15px', textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: '14px' };
const statusBanner = { padding: '15px', borderRadius: '12px', margin: '15px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '800' };
const labelSmallWeb = { margin: 0, fontSize: '10px', color: '#999', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' };
const infoValueWeb = { margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '800', color: '#333' };
const snackBoxStyleWeb = { marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '15px', border: '1px solid #eee' };
const snackRowWeb = { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '700' };
const qrBoxStyleWeb = { padding: '8px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' };
const printBtnStyleWeb = { flex: 1.5, padding: "14px", background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "900", fontSize: '0.85rem' };
const resetBtnStyleWeb = { flex: 1, padding: "14px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "900", fontSize: '0.85rem' };