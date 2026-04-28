export default function Footer() {
    return (
        <footer style={footerStyle}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <h2 style={{ color: "#fb4226", marginBottom: "15px", fontWeight: '900' }}>CINEMA LUX</h2>
                <p>Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam.</p>
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', fontSize: '0.9rem'}}>
                    <span>Điều khoản sử dụng</span>
                    <span>Chính sách bảo mật</span>
                    <span>Chăm sóc khách hàng: 1900 1234</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: '#777' }}>© 2026 Cinema Lux. Dự án của sếp Hồ Văn Lộc.</p>
            </div>
        </footer>
    );
}
const footerStyle = { background: "#1a1a1a", color: "#bbb", padding: "50px 20px", marginTop: "60px", textAlign: "center", borderTop: "5px solid #fb4226" };