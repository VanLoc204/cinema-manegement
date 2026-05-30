import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import MembershipTab from "./MembershipTab";
import VouchersTab from "./VouchersTab";

export default function Profile() {
    const userId = localStorage.getItem("userId");
    const location = useLocation();
    const navigate = useNavigate();

    // --- 📊 STATES ---
    const [info, setInfo] = useState({
        name: "",        // Tên đăng nhập (Bảng User)
        fullName: "",    // Họ tên thật (Bảng ProfileDetail)
        birthday: "",
        address: "",
        phone: "",
        email: "",
        gender: "Khác",
        membershipTier: "NORMAL",
        yearlySpending: 0,
        luxPoints: 0,
        nextTierLimit: 2500000,
        spentNeeded: 2500000,
        percentToNext: 0,
        pointsRate: 0.05
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
    const [fieldErrors, setFieldErrors] = useState({});

    const now = new Date();
    const API_URL = "http://localhost:5000";

    // --- 📢 NOTIFICATION TOAST ---
    const showNotify = (msg, type = "success") => {
        setNotification({ show: true, message: msg, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    };

    // --- 🔄 1. FETCH DATA (PARALLEL) ---
    useEffect(() => {
        if (userId) {
            setLoading(true);
            Promise.all([
                axios.get(`/users/detail/${userId}`),
                axios.get(`/bookings/user/${userId}`)
            ])
                .then(([userRes, bookingRes]) => {
                    if (userRes.data) {
                        setInfo({
                            name: userRes.data.name || "",
                            fullName: userRes.data.fullName || userRes.data.name,
                            birthday: userRes.data.birthday ? userRes.data.birthday.split('T')[0] : "",
                            address: userRes.data.address || "",
                            phone: userRes.data.phone || "",
                            email: userRes.data.email || "",
                            gender: userRes.data.gender || "Khác",
                            membershipTier: userRes.data.membershipTier || "NORMAL",
                            yearlySpending: userRes.data.yearlySpending || 0,
                            luxPoints: userRes.data.luxPoints || 0,
                            nextTierLimit: userRes.data.nextTierLimit || 2500000,
                            spentNeeded: userRes.data.spentNeeded !== undefined ? userRes.data.spentNeeded : 2500000,
                            percentToNext: userRes.data.percentToNext || 0,
                            pointsRate: userRes.data.pointsRate || 0.05
                        });
                    }
                    if (bookingRes.data) {
                        setHistory(bookingRes.data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi tải thông tin tài khoản:", err);
                    showNotify("Không thể kết nối tới máy chủ!", "error");
                    setLoading(false);
                });
        }
    }, [userId]);

    // --- 💾 2. SAVE PROFILE HANDLER ---
    const handleSave = async () => {
        let errors = {};

        // 🚨 1. Kiểm tra Họ và Tên (Chỉ chứa chữ cái và khoảng trắng)
        if (info.fullName) {
            const nameRegex = /^[\p{L}\s]{2,50}$/u;
            if (!nameRegex.test(info.fullName)) {
                errors.fullName = "Chỉ nhập chữ cái và khoảng trắng!";
            }
        }

        // 🚨 2. Kiểm tra Số điện thoại (Bắt đầu bằng 0, đúng 10 số)
        if (info.phone) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(info.phone)) {
                errors.phone = "SĐT gồm 10 chữ số và bắt đầu bằng 0!";
            }
        }

        // 🚨 3. Kiểm tra Ngày sinh (Không được lớn hơn ngày hiện tại)
        if (info.birthday) {
            const today = new Date();
            const birthDate = new Date(info.birthday);
            if (birthDate > today) {
                errors.birthday = "Ngày sinh không được trước ngày hiện tại!";
            }
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return; // Stop if there are validation errors
        }

        if (isChangingPassword) {
            if (!passwordData.oldPassword) {
                return showNotify("Vui lòng nhập mật khẩu hiện tại!", "error");
            }
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                return showNotify("Mật khẩu nhập lại không khớp!", "error");
            }
            if (passwordData.newPassword !== "123456") {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
                if (!passwordRegex.test(passwordData.newPassword)) {
                    return showNotify("Mật khẩu 8-15 ký tự, có chữ HOA, chữ thường, số & ký tự đặc biệt!", "error");
                }
            }
        }

        try {
            const updatePayload = {
                ...info,
                ...(isChangingPassword ? { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword } : {})
            };
            await axios.put(`/users/update/${userId}`, updatePayload);
            localStorage.setItem("name", info.fullName || info.name);
            showNotify("Đã cập nhật hồ sơ thành công");
            setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || "Lỗi lưu thông tin rồi sếp ơi!";
            showNotify(typeof errorMsg === 'string' ? errorMsg : "Lỗi lưu thông tin!", "error");
        }
    };

    // --- 📑 FILTER LOGICS ---
    const unusedTickets = history.filter(t => t.status === "Paid" && new Date(t.showtimeId?.time) > now); 
    const watchedMovies = Array.from(new Set(
        history.filter(t => t.status === "Checked-in" || (t.status === "Paid" && new Date(t.showtimeId?.time) <= now))
               .map(t => JSON.stringify(t.showtimeId?.movieId))
    )).map(s => JSON.parse(s));

    // --- 🏆 MEMBERSHIP LOGICS (Lấy trực tiếp từ Backend bảo mật) ---
    const totalSpent = info.yearlySpending || 0;
    const currentTier = info.membershipTier || "NORMAL";
    const nextTierLimit = info.nextTierLimit || 2500000;
    const spentNeeded = info.spentNeeded !== undefined ? info.spentNeeded : 2500000;
    const percentToNext = info.percentToNext || 0;
    const pointsRate = info.pointsRate || 0.05;



    if (loading) {
        return (
            <div style={{ padding: "120px 20px", textAlign: "center", color: "#888", fontSize: "1rem", fontFamily: "'Inter', sans-serif" }}>
                <div className="spinner" style={spinnerStyle}></div>
                Đang tải thông tin tài khoản của sếp...
            </div>
        );
    }

    // --- ICONS ---
    const EyeIcon = ({ show }) => show ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    return (
        <div style={{ background: "#fdfcf0", minHeight: "100vh", padding: "40px 20px" }}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            {/* 📢 THÔNG BÁO TOAST */}
            {notification.show && (
                <div style={{
                    ...toastStyle,
                    background: notification.type === "error" ? "#e74c3c" : "#2ecc71"
                }}>
                    {notification.message}
                </div>
            )}

            <div style={dashboardContainer}>
                
                {/* 📂 BÊN TRÁI: SIDEBAR HỒ SƠ KIỂU CGV */}
                <div style={sidebarStyle}>
                    <h3 style={sidebarTitle}>Tài khoản của tôi</h3>
                    <ul style={menuList}>
                        <li 
                            style={menuItem(location.pathname === "/profile")}
                            onClick={() => navigate("/profile")}
                        >
                            <span>Hồ sơ cá nhân</span>
                        </li>
                        <li 
                            style={menuItem(location.pathname === "/history")}
                            onClick={() => navigate("/history")}
                        >
                            <span>Lịch sử đặt vé</span>
                        </li>
                        <li 
                            style={menuItem(location.pathname === "/watched-movies")}
                            onClick={() => navigate("/watched-movies")}
                        >
                            <span>Phim đã xem</span>
                        </li>
                        <li 
                            style={menuItem(location.pathname === "/vouchers")}
                            onClick={() => navigate("/vouchers")}
                        >
                            <span>Voucher của tôi</span>
                        </li>
                        <li 
                            style={menuItem(location.pathname === "/membership")}
                            onClick={() => navigate("/membership")}
                        >
                            <span>Chương trình thành viên</span>
                        </li>
                    </ul>
                    
                    <div style={sidebarFooter}>
                        <p style={{ margin: 0, fontWeight: "800", color: "#fb4226", fontSize: "0.8rem" }}>Cinema Lux Club</p>
                        <p style={{ margin: "5px 0 0 0", color: "#999", fontSize: "0.7rem" }}>Thành viên hạng {currentTier}</p>
                    </div>
                </div>

                {/* 📄 BÊN PHẢI: CHI TIẾT TỪNG TAB */}
                <div style={contentAreaStyle}>
                    
                    {/* TAB 1: HỒ SƠ CÁ NHÂN */}
                    {location.pathname === "/profile" && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                                <div style={avatarStyle}>{(info.fullName || info.name || "U").charAt(0).toUpperCase()}</div>
                                <h2 style={{ color: "#333", margin: "15px 0 5px 0", fontWeight: "900", fontSize: "1.6rem" }}>HỒ SƠ THÀNH VIÊN</h2>
                                <p style={{ color: "#888", fontSize: "0.9rem", margin: 0 }}>Xem và chỉnh sửa thông tin cá nhân của sếp</p>
                            </div>

                            <div style={formGrid}>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Tên đăng nhập (Nickname):</label>
                                    <input type="text" value={info.name} style={inputStyle} onChange={e => setInfo({...info, name: e.target.value})} placeholder="Tên đăng nhập" />
                                </div>

                                <div style={inputGroup}>
                                    <label style={labelStyle}>Họ và tên đầy đủ:</label>
                                    <input type="text" value={info.fullName} style={{...inputStyle, borderColor: fieldErrors.fullName ? "red" : "#ddd"}} onChange={e => {setInfo({...info, fullName: e.target.value}); setFieldErrors({...fieldErrors, fullName: ""})}} placeholder="Họ và tên" />
                                    {fieldErrors.fullName && <span style={{color: "red", fontSize: "0.85rem", marginTop: "5px", display: "block"}}>{fieldErrors.fullName}</span>}
                                </div>

                                <div style={inputGroup}>
                                    <label style={labelStyle}>Ngày sinh:</label>
                                    <input type="date" value={info.birthday} style={{...inputStyle, borderColor: fieldErrors.birthday ? "red" : "#ddd"}} onChange={e => {setInfo({...info, birthday: e.target.value}); setFieldErrors({...fieldErrors, birthday: ""})}} />
                                    {fieldErrors.birthday && <span style={{color: "red", fontSize: "0.85rem", marginTop: "5px", display: "block"}}>{fieldErrors.birthday}</span>}
                                </div>

                                <div style={inputGroup}>
                                    <label style={labelStyle}>Số điện thoại:</label>
                                    <input type="text" value={info.phone} style={{...inputStyle, borderColor: fieldErrors.phone ? "red" : "#ddd"}} onChange={e => {setInfo({...info, phone: e.target.value}); setFieldErrors({...fieldErrors, phone: ""})}} placeholder="Số điện thoại" />
                                    {fieldErrors.phone && <span style={{color: "red", fontSize: "0.85rem", marginTop: "5px", display: "block"}}>{fieldErrors.phone}</span>}
                                </div>

                                <div style={inputGroup}>
                                    <label style={labelStyle}>Giới tính:</label>
                                    <div style={{ display: "flex", gap: "15px", padding: "12px 0" }}>
                                        <label style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                                            <input type="radio" value="Nam" checked={info.gender === "Nam"} onChange={e => setInfo({...info, gender: e.target.value})} style={{ marginRight: "5px" }} /> Nam
                                        </label>
                                        <label style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                                            <input type="radio" value="Nữ" checked={info.gender === "Nữ"} onChange={e => setInfo({...info, gender: e.target.value})} style={{ marginRight: "5px" }} /> Nữ
                                        </label>
                                        <label style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                                            <input type="radio" value="Khác" checked={info.gender === "Khác"} onChange={e => setInfo({...info, gender: e.target.value})} style={{ marginRight: "5px" }} /> Khác
                                        </label>
                                    </div>
                                </div>

                                <div style={inputGroup}>
                                    <label style={labelStyle}>Địa chỉ email:</label>
                                    <input type="email" value={info.email} readOnly style={{...inputStyle, background: "#f0f0f0", color: "#888", cursor: "not-allowed"}} title="Không thể thay đổi email" />
                                </div>

                                <div style={{ ...inputGroup, gridColumn: "span 2" }}>
                                    <label style={labelStyle}>Địa chỉ nơi ở:</label>
                                    <input type="text" value={info.address} style={inputStyle} onChange={e => setInfo({...info, address: e.target.value})} placeholder="Địa chỉ của sếp" />
                                </div>

                                <div style={{ ...inputGroup, gridColumn: "span 2", marginTop: "10px", marginBottom: "10px" }}>
                                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.95rem", color: "#444", fontWeight: "600" }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isChangingPassword} 
                                            onChange={e => setIsChangingPassword(e.target.checked)} 
                                            style={{ marginRight: "10px", width: "18px", height: "18px", accentColor: "#fb4226", cursor: "pointer" }} 
                                        />
                                        Tôi muốn thay đổi mật khẩu
                                    </label>
                                </div>

                                {isChangingPassword && (
                                    <>
                                        <div style={{ ...inputGroup, gridColumn: "span 2" }}>
                                            <label style={labelStyle}>Mật khẩu hiện tại <span style={{color: "#fb4226"}}>*</span></label>
                                            <div style={{ position: "relative" }}>
                                                <input type={showPasswords.old ? "text" : "password"} value={passwordData.oldPassword} style={{...inputStyle, paddingRight: "45px"}} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} placeholder="Nhập mật khẩu hiện tại" autoComplete="new-password" />
                                                <div style={eyeBtnStyle} onClick={() => setShowPasswords({...showPasswords, old: !showPasswords.old})}>
                                                    <EyeIcon show={showPasswords.old} />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={inputGroup}>
                                            <label style={labelStyle}>Mật khẩu mới <span style={{color: "#fb4226"}}>*</span></label>
                                            <div style={{ position: "relative" }}>
                                                <input type={showPasswords.new ? "text" : "password"} value={passwordData.newPassword} style={{...inputStyle, paddingRight: "45px"}} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="Nhập mật khẩu mới" autoComplete="new-password" />
                                                <div style={eyeBtnStyle} onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}>
                                                    <EyeIcon show={showPasswords.new} />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={inputGroup}>
                                            <label style={labelStyle}>Nhập lại mật khẩu mới <span style={{color: "#fb4226"}}>*</span></label>
                                            <div style={{ position: "relative" }}>
                                                <input type={showPasswords.confirm ? "text" : "password"} value={passwordData.confirmPassword} style={{...inputStyle, paddingRight: "45px"}} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
                                                <div style={eyeBtnStyle} onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}>
                                                    <EyeIcon show={showPasswords.confirm} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button onClick={handleSave} style={btnSaveStyle}>
                                CẬP NHẬT THÔNG TIN
                            </button>

                            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#bbb", marginTop: "25px" }}>
                                Thông tin của sếp được bảo mật tuyệt đối tại hệ thống Cinema Lux.
                            </p>
                        </div>
                    )}

                    {/* TAB 2: LỊCH SỬ ĐẶT VÉ */}
                    {location.pathname === "/history" && (
                        <div>
                            {/* 📊 DASHBOARD TỐI GIẢN */}
                            <div style={dashboardStatsStyle}>
                                <div style={statBox}>
                                    <p style={statLabel}>VÉ CHƯA SỬ DỤNG</p>
                                    <h2 style={{...statNum, color: '#fb4226'}}>{unusedTickets.length}</h2>
                                </div>
                                <div style={{ width: '1px', background: '#eee', height: '40px' }}></div>
                                <div style={statBox}>
                                    <p style={statLabel}>PHIM ĐÃ XEM</p>
                                    <h2 style={{...statNum, color: '#333'}}>{watchedMovies.length}</h2>
                                </div>
                            </div>

                            <div style={collapseHeader} onClick={() => setShowAllHistory(!showAllHistory)}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.5px' }}>LỊCH SỬ GIAO DỊCH VÉ</span>
                                <span style={{ fontSize: '0.8rem', color: '#fb4226', fontWeight: 'bold' }}>
                                    {showAllHistory ? "THU GỌN VÉ CŨ" : "XEM TẤT CẢ GIAO DỊCH"}
                                </span>
                            </div>

                            <div style={{ marginTop: '30px' }}>
                                <h3 style={listSectionTitle}>
                                    {showAllHistory ? "TẤT CẢ GIAO DỊCH" : "VÉ CHƯA SỬ DỤNG"}
                                </h3>
                                
                                {(showAllHistory ? history : unusedTickets).map(ticket => (
                                    <div key={ticket._id} style={ticketRowSmall} onClick={() => setSelectedTicket(ticket)}>
                                        <div style={{ flex: 1, paddingRight: "15px" }}>
                                            <h4 style={{ margin: 0, color: '#333', fontSize: '1rem', fontWeight: "800" }}>{ticket.showtimeId?.movieId?.title}</h4>
                                            <p style={ticketTimeText}>
                                                {new Date(ticket.showtimeId?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(ticket.showtimeId?.time).toLocaleDateString('vi-VN')}
                                            </p>
                                            <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem", color: "#999", fontWeight: "600" }}>
                                                Phòng: {ticket.showtimeId?.roomId?.name} ({ticket.showtimeId?.roomId?.type || "Standard"})
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <b style={{ color: '#fb4226', fontSize: '1.1rem', fontWeight: "900" }}>{ticket.totalAmount?.toLocaleString()}đ</b>
                                            <p style={{
                                                ...paidStatusText,
                                                color: ticket.status === "Checked-in" ? "#2e7d32" : (new Date(ticket.showtimeId?.time) <= now ? "#999" : "#2e7d32")
                                            }}>
                                                {ticket.status === "Checked-in" ? "Đã soát vé" : (new Date(ticket.showtimeId?.time) <= now ? "Đã hết hạn" : "Chưa sử dụng")}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {(showAllHistory ? history : unusedTickets).length === 0 && (
                                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#ccc" }}>
                                        <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>Sếp chưa có giao dịch nào ở mục này.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PHIM ĐÃ XEM */}
                    {location.pathname === "/watched-movies" && (
                        <div>
                            <h2 style={viewTitleStyle}>DANH SÁCH PHIM ĐÃ XEM</h2>
                            
                            {watchedMovies.length > 0 ? (
                                <div style={gridStyle}>
                                    {watchedMovies.map(movie => (
                                        <div key={movie?._id} style={movieCardStyle}>
                                            <div style={posterWrapper}>
                                                <img src={`${API_URL}${movie?.image}`} style={posterImgStyle} alt={movie?.title} />
                                            </div>
                                            <h4 style={movieTitleStyle}>{movie?.title}</h4>
                                            <p style={movieSubTextStyle}>Cinema Lux Theater</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "80px 20px", color: "#ccc" }}>
                                    <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.95rem" }}>Sếp chưa có bộ phim nào đã xem tại hệ thống.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: CHƯƠNG TRÌNH THÀNH VIÊN */}
                    {location.pathname === "/membership" && (
                        <MembershipTab 
                            history={history}
                            info={info}
                            loading={loading}
                            viewTitleStyle={viewTitleStyle}
                        />
                    )}

                    {/* TAB 5: VOUCHER CỦA TÔI */}
                    {location.pathname === "/vouchers" && (
                        <VouchersTab 
                            history={history}
                            info={info}
                            loading={loading}
                            viewTitleStyle={viewTitleStyle}
                        />
                    )}

                </div>
            </div>

            {/* 📄 MODAL CHI TIẾT HÓA ĐƠN VÉ (TỰ ĐỘNG HIỆN KHI CLICK VÉ) */}
            {selectedTicket && (
                <div style={modalOverlay} onClick={() => setSelectedTicket(null)}>
                    <div style={invoiceContainer} onClick={e => e.stopPropagation()}>
                        <div style={invoiceHeaderRed}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', letterSpacing: '1px', fontWeight: '800' }}>THÔNG TIN VÉ XEM PHIM</h3>
                        </div>
                        <div style={invoiceBody}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                <div>
                                    <p style={cleanLabel}>Mã đặt vé</p>
                                    <h2 style={cleanIdText}>{selectedTicket._id.slice(-8).toUpperCase()}</h2>
                                    <p style={{ ...cleanLabel, marginTop: '12px' }}>Suất chiếu</p>
                                    <p style={cleanValueRed}>
                                        {new Date(selectedTicket.showtimeId?.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedTicket.showtimeId?.time).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div style={qrWrapper}>
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedTicket._id}`} 
                                        style={{ width: '75px', display: 'block' }} 
                                        alt="QR Code" 
                                    />
                                </div>
                            </div>
                            
                            <hr style={simpleLine} />
                            
                            <h3 style={movieTitleInvoice}>{selectedTicket.showtimeId?.movieId?.title}</h3>
                            
                            <div style={infoGrid}>
                                <div>
                                    <p style={cleanLabel}>Phòng</p>
                                    <p style={infoVal}>{selectedTicket.showtimeId?.roomId?.name}</p>
                                </div>
                                <div>
                                    <p style={cleanLabel}>Loại vé</p>
                                    <p style={infoVal}>{selectedTicket.showtimeId?.roomId?.type || "Standard"}</p>
                                </div>
                                <div>
                                    <p style={cleanLabel}>Ghế</p>
                                    <p style={{ ...infoVal, color: '#fb4226' }}>{selectedTicket.seats?.join(", ")}</p>
                                </div>
                            </div>

                            {/* COMBO BẮP NƯỚC */}
                            {selectedTicket.snacks && selectedTicket.snacks.length > 0 && (
                                <div style={snackWrapperStyle}>
                                    <p style={{ ...cleanLabel, marginBottom: '8px', color: '#fb4226' }}>COMBO ĐÃ ĐẶT:</p>
                                    {selectedTicket.snacks.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                                            <span>{item.name} x{item.quantity}</span>
                                            <span style={{ fontWeight: '750', color: '#333' }}>{(item.price * item.quantity).toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedTicket.appliedVoucher && (
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#777", fontSize: "0.85rem", marginTop: "15px" }}>
                                    <span>Voucher đã dùng:</span>
                                    <span style={{ textTransform: "uppercase", fontWeight: "700" }}>{selectedTicket.appliedVoucher}</span>
                                </div>
                            )}
                            {(selectedTicket.discountAmount > 0 || (selectedTicket.appliedVoucher && selectedTicket.appliedVoucher.includes("BIRTHDAY-COMBO")) || selectedTicket.snacks?.some(s => s.price === 0)) && (
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#777", fontSize: "0.85rem" }}>
                                    <span>Giảm giá voucher:</span>
                                    <span style={{ fontWeight: "700", color: "#fb4226" }}>
                                        {selectedTicket.discountAmount > 0 
                                            ? `-${selectedTicket.discountAmount.toLocaleString()}đ` 
                                            : "Quà tặng"}
                                    </span>
                                </div>
                            )}

                            <hr style={simpleLine} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'bold', letterSpacing: '0.5px' }}>TỔNG THANH TOÁN</span>
                                <b style={{ color: '#fb4226', fontSize: '1.4rem', fontWeight: '900' }}>{selectedTicket.totalAmount?.toLocaleString()}đ</b>
                            </div>
                        </div>
                        <button onClick={() => setSelectedTicket(null)} style={closeBtnClean}>ĐÓNG</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 💄 LUXURY MODERN STYLES ---
const dashboardContainer = { display: "flex", gap: "35px", maxWidth: "1150px", margin: "0 auto", minHeight: "80vh", alignItems: "flex-start", fontFamily: "'Inter', sans-serif" };
const sidebarStyle = { width: "270px", background: "#fff", padding: "30px 20px", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f2f2f2", flexShrink: 0 };
const sidebarTitle = { fontSize: "0.9rem", fontWeight: "900", color: "#333", borderBottom: "2px solid #fb4226", paddingBottom: "15px", marginBottom: "25px", letterSpacing: "1px", textTransform: "uppercase" };
const menuList = { display: "flex", flexDirection: "column", gap: "8px", padding: 0, margin: 0, listStyle: "none" };

const menuItem = (isActive) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "0.85rem",
    transition: "all 0.2s ease",
    background: isActive ? "#fb4226" : "transparent",
    color: isActive ? "#fff" : "#555",
    boxShadow: isActive ? "0 8px 20px rgba(251, 66, 38, 0.25)" : "none",
    border: "1px solid",
    borderColor: isActive ? "#fb4226" : "transparent"
});

const arrowIndicator = { fontSize: "0.8rem", fontWeight: "bold" };
const sidebarFooter = { marginTop: "40px", padding: "20px 15px 0 15px", borderTop: "1px dashed #eee", textAlign: "center" };
const contentAreaStyle = { flex: 1, background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid #f2f2f2", minHeight: "600px" };

// Styles cho Profile Form
const avatarStyle = { width: "80px", height: "80px", background: "#fb4226", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto", fontWeight: "bold", boxShadow: "0 5px 20px rgba(251, 66, 38, 0.3)" };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 30px", marginTop: "10px" };
const inputGroup = { marginBottom: "5px", textAlign: 'left' };
const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "800", color: "#444", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "12px 18px", borderRadius: "12px", border: "1px solid #ddd", outline: "none", fontSize: "0.95rem", boxSizing: "border-box", transition: "0.3s", background: "#fafafa", fontFamily: "'Inter', sans-serif" };
const eyeBtnStyle = { position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const btnSaveStyle = { width: "100%", padding: "16px", background: "#fb4226", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 5px 25px rgba(251, 66, 38, 0.35)", marginTop: "35px", letterSpacing: "1px", transition: "0.3s" };
const toastStyle = { position: 'fixed', top: '25px', right: '25px', color: '#fff', padding: '15px 30px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', fontSize: '0.9rem', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" };

// Styles cho Ticket History
const dashboardStatsStyle = { display: 'flex', background: '#fdfdfb', padding: '25px', borderRadius: '20px', border: '1px solid #f5f5f0', marginBottom: '35px', alignItems: 'center' };
const statBox = { flex: 1, textAlign: 'center' };
const statLabel = { margin: '0 0 6px 0', fontSize: '0.65rem', color: '#999', fontWeight: '800', letterSpacing: '1px' };
const statNum = { margin: 0, fontSize: '1.8rem', fontWeight: '900' };
const collapseHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdfcf0', padding: '18px 25px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f2eedb', transition: '0.2s' };
const listSectionTitle = { fontSize: '0.75rem', color: '#bbb', fontWeight: '800', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' };
const ticketRowSmall = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '22px 25px', borderRadius: '18px', marginBottom: '15px', border: '1px solid #f5f5f5', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' };
const ticketTimeText = { margin: '5px 0 0 0', fontSize: '0.85rem', color: '#777', fontWeight: '600' };
const paidStatusText = { margin: '5px 0 0 0', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' };

// Styles cho Watched Movies
const viewTitleStyle = { fontSize: '1.1rem', fontWeight: '900', color: '#333', marginBottom: '30px', paddingLeft: '10px', borderLeft: '4px solid #fb4226', textTransform: 'uppercase', letterSpacing: '0.5px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '25px', justifyContent: 'start' };
const movieCardStyle = { textAlign: 'center' };
const posterWrapper = { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', aspectRatio: '2 / 3', background: '#eee', transition: '0.3s' };
const posterImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const movieTitleStyle = { marginTop: '12px', fontSize: '0.85rem', fontWeight: '850', color: '#333', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const movieSubTextStyle = { margin: 0, fontSize: '0.7rem', color: '#bbb', fontWeight: '600' };

// Styles cho Invoice Modal
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' };
const invoiceContainer = { background: '#fff', width: '380px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' };
const invoiceHeaderRed = { background: '#fb4226', padding: '25px', textAlign: 'center' };
const invoiceBody = { padding: '30px' };
const cleanLabel = { margin: 0, fontSize: '0.65rem', color: '#bbb', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' };
const cleanIdText = { margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: '900', color: '#333' };
const cleanValueRed = { margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '800', color: '#fb4226' };
const qrWrapper = { padding: '8px', background: '#fff', border: '1px solid #eee', borderRadius: '15px' };
const simpleLine = { border: 'none', borderTop: '1px solid #f2f2f2', margin: '20px 0' };
const movieTitleInvoice = { margin: '0 0 20px 0', fontSize: '1.15rem', fontWeight: '900', color: '#333' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' };
const infoVal = { margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: '800', color: '#444' };
const snackWrapperStyle = { marginTop: '20px', padding: '15px', background: '#fafaf6', borderRadius: '14px', border: '1px solid #f2eedb' };
const closeBtnClean = { width: '100%', padding: '18px', border: 'none', background: '#f9f9f9', color: '#888', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem', borderTop: '1px solid #f0f0f0', letterSpacing: '0.5px' };

// Loading Spinner
const spinnerStyle = { width: "30px", height: "30px", border: "3px solid #f3f3f3", borderTop: "3px solid #fb4226", borderRadius: "50%", margin: "0 auto 15px auto", animation: "spin 1s linear infinite" };