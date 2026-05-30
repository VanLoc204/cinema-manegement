const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config(); // Load biến môi trường từ .env
const connectDB = require("./config/db");
const User = require("./models/User");

const resetAllPasswords = async () => {
    try {
        await connectDB();
        console.log("📡 Đã kết nối MongoDB. Đang tiến hành ĐẶT LẠI MẬT KHẨU...");

        // Thay vì băm 1 lần rồi dùng chung (tạo ra hash giống nhau), 
        // ta sẽ lặp qua từng user và băm riêng biệt để mỗi người có 1 chuỗi Salt (muối) khác nhau!
        const users = await User.find({});
        let updatedCount = 0;

        for (const user of users) {
            const uniqueHash = await bcrypt.hash("123456", 10);
            user.password = uniqueHash;
            await user.save();
            updatedCount++;
        }

        console.log(`✅ THÀNH CÔNG! Đã đặt lại mật khẩu về '123456' cho tổng cộng ${updatedCount} tài khoản (Mỗi tài khoản một chuỗi Hash riêng biệt).`);
        
        process.exit(0); // Thoát script sau khi hoàn thành
    } catch (err) {
        console.error("❌ Xảy ra lỗi trong quá trình đổi mật khẩu:", err);
        process.exit(1);
    }
};

resetAllPasswords();
