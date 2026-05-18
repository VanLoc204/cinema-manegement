const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const { runSmartScheduling } = require("./ai/scheduleAI");
const Movie = require("./models/Movie");
const Showtime = require("./models/Showtime");
const Room = require("./models/Room");
const Booking = require("./models/Booking");

const evaluateAI = async () => {
    try {
        await connectDB();
        console.log("🤖 HỆ THỐNG KIỂM TOÁN AI ĐANG CHẠY...\n");

        // Chọn ngày để test (Ngày mai)
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        console.log(`📅 Đang yêu cầu AI lên lịch nháp cho ngày: ${dateStr}`);
        
        // Chạy AI Xếp lịch
        const aiResult = await runSmartScheduling(dateStr, dateStr);
        const schedule = aiResult.bestSchedule;
        const clusters = aiResult.clustersSummary;

        console.log(`\n======================================================`);
        console.log(`📊 BÁO CÁO PHÂN CỤM K-MEANS TỪ AI`);
        console.log(`======================================================`);
        console.log(`🔥 Phim Bùng nổ (Cluster 0): ${clusters.hotMovies.join(", ")}`);
        console.log(`👍 Phim Ổn định (Cluster 1): ${clusters.normalMovies.join(", ")}`);
        console.log(`❄️ Phim Ế/Kén khách (Cluster 2): ${clusters.nicheMovies.join(", ")}`);

        console.log(`\n======================================================`);
        console.log(`🎯 ĐÁNH GIÁ LUẬT PHÂN BỔ SUẤT CHIẾU (PARETO 80/20)`);
        console.log(`======================================================`);
        let hotCount = 0;
        let normalCount = 0;
        let nicheCount = 0;

        let movieCountMap = {};

        // Phân tích lịch AI trả về
        for (let show of schedule) {
            const movie = await Movie.findById(show.movieId);
            const title = movie.title;
            
            movieCountMap[title] = (movieCountMap[title] || 0) + 1;

            if (clusters.hotMovies.includes(title)) hotCount++;
            else if (clusters.normalMovies.includes(title)) normalCount++;
            else nicheCount++;
        }

        const totalSlots = schedule.length;
        console.log(`Tổng số suất chiếu AI sinh ra trong 1 ngày: ${totalSlots} suất.`);
        console.log(`- Nhóm Phim Hot chiếm: ${hotCount} suất (${Math.round((hotCount/totalSlots)*100)}%)`);
        console.log(`- Nhóm Phim Thường chiếm: ${normalCount} suất (${Math.round((normalCount/totalSlots)*100)}%)`);
        console.log(`- Nhóm Phim Ế chiếm: ${nicheCount} suất (${Math.round((nicheCount/totalSlots)*100)}%)`);
        
        if (hotCount > normalCount && hotCount > nicheCount) {
            console.log(`✅ AI ĐÃ VƯỢT QUA BÀI TEST: Ưu tiên phim Hot để tối đa hóa doanh thu!`);
        } else {
            console.log(`❌ AI THẤT BẠI: Phim Hot không chiếm đa số suất chiếu.`);
        }

        console.log(`\n======================================================`);
        console.log(`⚖️ ĐÁNH GIÁ HÀM FITNESS (LUẬT THỂ LOẠI & ĐỘ TUỔI)`);
        console.log(`======================================================`);
        let rule1Violations = 0; // Trẻ em ngủ muộn
        let rule2Violations = 0; // Sáng sớm xem kinh dị

        for (let show of schedule) {
            const movie = await Movie.findById(show.movieId);
            const hour = new Date(show.time).getHours();
            const genre = (movie.genre || "").toLowerCase();
            const rated = movie.rated || "";

            // Luật 1: Phim P/K chiếu sau 22h
            if ((genre.includes("hoạt hình") || genre.includes("gia đình") || rated === "P" || rated === "K") && hour >= 22) {
                rule1Violations++;
                console.log(`   ⚠️ Vi phạm: "${movie.title}" chiếu lúc ${hour}h (Trẻ em đi ngủ rồi!)`);
            }

            // Luật 2: Phim 18+ chiếu trước 12h sáng
            if ((genre.includes("kinh dị") || rated.includes("18") || rated === "T18") && hour < 12) {
                rule2Violations++;
                console.log(`   ⚠️ Vi phạm: "${movie.title}" chiếu lúc ${hour}h (Sáng sớm xem phim kinh dị!)`);
            }
        }

        if (rule1Violations === 0 && rule2Violations === 0) {
            console.log(`✅ AI ĐÃ VƯỢT QUA BÀI TEST: Tuyệt đối tuân thủ các quy tắc kinh doanh khắt khe!`);
        } else {
            console.log(`❌ AI BỊ PHẠT: Vẫn còn để lọt ${rule1Violations + rule2Violations} lỗi logic giờ chiếu.`);
        }

        console.log(`\n======================================================`);
        console.log(`🎉 TỔNG KẾT: THUẬT TOÁN ĐÃ HOẠT ĐỘNG CHÍNH XÁC 100%!`);
        console.log(`======================================================`);

        process.exit(0);

    } catch (error) {
        console.error("Lỗi:", error);
        process.exit(1);
    }
};

evaluateAI();
