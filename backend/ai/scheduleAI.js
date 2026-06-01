const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");

// ============================================================================
// 🧠 1. THUẬT TOÁN K-MEANS KẾT HỢP HỆ SỐ PHÂN RÃ THỜI GIAN (TIME DECAY FACTOR)
// ============================================================================
// Nhiệm vụ của K-Means là tự động gom nhóm (cluster) các bộ phim thành 3 nhóm:
// - Cụm 0: Phim cực HOT (điểm cao nhất)
// - Cụm 1: Phim Bình thường (điểm trung bình)
// - Cụm 2: Phim Ế (điểm thấp nhất)
function kMeans(movies, k = 3, maxIterations = 20) {
    // Nếu rạp có quá ít phim (ít hơn 3), thì không cần gom nhóm, gán hết vào nhóm HOT.
    if (movies.length < k) return [[...movies], [], []];

    // B1: Chọn ngẫu nhiên k=3 "điểm trung tâm" (centroid) ban đầu từ danh sách điểm của các phim.
    let centroids = [];
    for (let i = 0; i < k; i++) centroids.push(movies[Math.floor(Math.random() * movies.length)].score);

    let clusters = [];
    // Vòng lặp tối ưu hóa (chạy tối đa 20 lần để thuật toán "học" và tự điều chỉnh)
    for (let iter = 0; iter < maxIterations; iter++) {
        // Tạo 3 giỏ trống đại diện cho 3 cụm (Cluster 0, 1, 2)
        clusters = Array.from({ length: k }, () => []);

        // B2: Cầm từng bộ phim lên, so sánh xem điểm của phim đó GẦN VỚI TRUNG TÂM NÀO NHẤT.
        for (let m of movies) {
            let minDiff = Infinity;
            let clusterIdx = 0;
            for (let i = 0; i < k; i++) {
                let diff = Math.abs(m.score - centroids[i]); // Đo khoảng cách (sự chênh lệch điểm)
                if (diff < minDiff) { minDiff = diff; clusterIdx = i; } // Gần trung tâm nào thì chui vào cụm đó
            }
            clusters[clusterIdx].push(m);
        }

        // B3: Tính lại trọng tâm mới cho 3 cụm. 
        // VD: Cụm 1 đang có 5 phim, lấy trung bình cộng điểm của 5 phim đó làm trọng tâm mới.
        for (let i = 0; i < k; i++) {
            if (clusters[i].length > 0) {
                let sum = clusters[i].reduce((a, b) => a + b.score, 0);
                centroids[i] = sum / clusters[i].length;
            }
        }
    }

    // B4: Sắp xếp lại 3 cụm theo thứ tự: Cụm điểm to nhất đứng đầu (Hot), rồi đến Bình Thường, rồi đến Ế.
    let sortedIndices = centroids.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c).map(x => x.i);
    return [clusters[sortedIndices[0]], clusters[sortedIndices[1]], clusters[sortedIndices[2]]];
}

// ============================================================================
// 🧬 2. THUẬT TOÁN DI TRUYỀN (GA) + THAM LAM (GREEDY)
// ============================================================================
class GeneticAlgorithm {
    constructor(moviesByCluster, rooms, targetDates) {
        this.moviesByCluster = moviesByCluster; // 3 cụm phim (Hot, Thường, Ế) do K-Means trả về
        this.rooms = rooms;
        this.targetDates = targetDates;
        this.populationSize = 20; // 1 Thế hệ sẽ có 20 bản nháp lịch chiếu ngẫu nhiên
        this.generations = 50;    // Cho tiến hóa qua 50 vòng đời để tìm ra lịch tối ưu nhất
    }

    // Lọc ra các phim đã khởi chiếu tính tới ngày 'date'
    getEligibleMovies(moviesList, targetDate) {
        if (!moviesList) return [];
        return moviesList.filter(m => {
            if (!m.releaseDate) return true;
            const release = new Date(m.releaseDate);
            const current = new Date(targetDate);
            release.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);
            return release <= current;
        });
    }

    // TÍNH NĂNG ĐỘT PHÁ 1: Thuật toán THAM LAM (Greedy) Lấp đầy liên tục 1 ngày cho 1 phòng
    generateDailyRoomSchedule(date, room) {
        let dailySch = [];
        let currentTime = new Date(date);
        currentTime.setHours(8, 30, 0, 0); // Rạp luôn mở cửa lúc 8:30 sáng

        const endTimeOfDay = new Date(date);
        endTimeOfDay.setHours(23, 50, 0, 0); // Hạn chót chiếu phim là 23:50 đêm

        // Vòng lặp: Chừng nào chưa tới đêm khuya thì cứ nhét phim vào phòng liên tục
        while (currentTime < endTimeOfDay) {
            let hour = currentTime.getHours();

            // QUY LUẬT BỐC PHIM THEO GIỜ THỰC TẾ CỦA RẠP:
            let clusterIdx = 0;
            let rand = Math.random();
            if (hour >= 17 && hour <= 21) {
                // Giờ vàng (5h chiều - 9h tối): Có 85% xác suất buộc phải chiếu Phim HOT (Cụm 0)
                clusterIdx = rand < 0.85 ? 0 : 1;
            } else if (hour === 12 || hour >= 22) {
                // Buổi trưa buồn ngủ hoặc Khuya muộn: Nhường rạp cho Phim Ế (Cụm 2)
                clusterIdx = rand < 0.6 ? 2 : 1;
            } else {
                // Giờ bình thường (Sáng, Đầu giờ chiều): Bốc ngẫu nhiên cả 3 cụm
                clusterIdx = Math.floor(Math.random() * 3);
            }

            let eligibleMovies = this.getEligibleMovies(this.moviesByCluster[clusterIdx], date);
            
            // Nếu không có phim phù hợp trong cụm này, thử tìm ở cụm khác
            if (eligibleMovies.length === 0) {
                eligibleMovies = this.getEligibleMovies(this.moviesByCluster[0], date);
                if (eligibleMovies.length === 0) {
                    eligibleMovies = this.getEligibleMovies(this.moviesByCluster[1], date);
                    if (eligibleMovies.length === 0) {
                        eligibleMovies = this.getEligibleMovies(this.moviesByCluster[2], date);
                    }
                }
            }

            if (eligibleMovies && eligibleMovies.length > 0) {
                // Bốc ngẫu nhiên 1 bộ phim hợp lệ đã khởi chiếu
                let randomMovie = eligibleMovies[Math.floor(Math.random() * eligibleMovies.length)];

                dailySch.push({
                    movieId: randomMovie._id,
                    movieRaw: randomMovie, // Lưu giữ liệu nguyên bản để tí nữa đem đi "Chấm điểm"
                    roomId: room._id,
                    time: new Date(currentTime)
                });

                // CƠ CHẾ LẤP ĐẦY LIÊN TỤC: Giờ chiếu phim sau = Thời lượng phim hiện tại + 15 phút dọn dẹp
                let duration = randomMovie.duration || 120;
                currentTime.setMinutes(currentTime.getMinutes() + duration + 15);
            } else {
                break;
            }
        }
        return dailySch;
    }

    // Khởi tạo 1 Lịch chiếu ngẫu nhiên (Một "Cá thể" trong quần thể Di truyền)
    createRandomIndividual() {
        let schedule = [];
        for (let date of this.targetDates) {
            for (let room of this.rooms) {
                schedule.push(...this.generateDailyRoomSchedule(date, room));
            }
        }
        return schedule;
    }

    // TÍNH NĂNG ĐỘT PHÁ 2: HÀM ĐÁNH GIÁ (CHẤM ĐIỂM) ĐA CHIỀU (Fitness Function)
    // Lịch nào càng khôn ngoan, hợp lý thì điểm càng cao. Lịch nào ngu ngốc thì bị trừ điểm âm.
    calculateFitness(schedule) {
        let score = 0;
        for (let show of schedule) {
            let hour = show.time.getHours();
            let isGoldenHour = (hour >= 17 && hour <= 21); // Giờ vàng (17h - 21h)
            let m = show.movieRaw;

            // Xác định xem bộ phim này đang nằm ở Cụm nào (Hot, Thường, Ế)
            let clusterIdx = -1;
            for (let i = 0; i < 3; i++) {
                if (this.moviesByCluster[i] && this.moviesByCluster[i].find(x => x._id.toString() === m._id.toString())) {
                    clusterIdx = i; break;
                }
            }

            // [CHIỀU ĐÁNH GIÁ 1]: DOANH THU & GIỜ VÀNG
            if (clusterIdx === 0 && isGoldenHour) score += 50;  // Phim Hot mà chiếu giờ Vàng -> Thưởng to (+50đ)
            if (clusterIdx === 0 && !isGoldenHour) score += 10; // Phim Hot chiếu giờ thường -> Vẫn được thưởng (+10đ)
            if (clusterIdx === 2 && isGoldenHour) score -= 20;  // Phim Ế mà dám chiếm rạp Giờ Vàng -> Phạt nặng (-20đ)
            if (clusterIdx === 1) score += 5; // Phim bình thường luôn được +5đ khích lệ

            // [CHIỀU ĐÁNH GIÁ 2]: NGHIỆP VỤ RẠP PHIM (THỂ LOẠI VÀ ĐỘ TUỔI)
            const genre = (m.genre || "").toLowerCase();
            const rated = m.rated || "P";

            // LUẬT 1: Trẻ em đi ngủ sớm!
            // Phim Hoạt hình/Gia đình mà bị AI xếp chiếu sau 10h đêm -> Bị trừ 30 điểm
            if ((genre.includes("hoạt hình") || genre.includes("gia đình")) && hour >= 22) {
                score -= 30;
            }

            // LUẬT 2: Phục vụ gia đình đi chơi cuối tuần!
            // Phim Hoạt hình chiếu ban ngày (8h-16h) vào Thứ 7, Chủ Nhật -> Cộng ngay 20 điểm
            if ((genre.includes("hoạt hình") || genre.includes("gia đình")) && hour >= 8 && hour <= 16 && (show.time.getDay() === 0 || show.time.getDay() === 6)) {
                score += 20;
            }

            // LUẬT 3: Sáng sớm không ai xem ma quỷ!
            // Phim 18+ hoặc Kinh dị mà đem chiếu buổi sáng -> Bị trừ 30 điểm
            if ((rated.includes("18") || genre.includes("kinh dị")) && hour < 12) {
                score -= 30;
            }

            // LUẬT 4: Ma quỷ lộng hành ban đêm!
            // Phim 18+ chiếu đêm khuya (sau 22h) -> Rất hợp lý, thưởng 15 điểm
            if (rated.includes("18") && hour >= 22) {
                score += 15;
            }
        }
        return score; // Trả về tổng điểm cho cái bản nháp lịch chiếu này
    }

    // THUẬT TOÁN TIẾN HÓA CỦA DI TRUYỀN (EVOLUTION)
    evolve() {
        let population = [];
        // Khởi tạo 20 bản nháp lịch ngẫu nhiên
        for (let i = 0; i < this.populationSize; i++) population.push(this.createRandomIndividual());

        // Tiến hóa qua 50 vòng đời
        for (let gen = 0; gen < this.generations; gen++) {
            // Chấm điểm cho 20 bản nháp
            let scoredPop = population.map(ind => ({ ind, score: this.calculateFitness(ind) }));
            // Sắp xếp lịch từ Điểm cao xuống Điểm thấp
            scoredPop.sort((a, b) => b.score - a.score);

            // Giữ lại 4 bản nháp thông minh nhất (Elite) để làm Bố Mẹ cho thế hệ sau
            let nextGen = scoredPop.slice(0, 4).map(x => x.ind);

            // Lai ghép để sinh ra 16 bản nháp con cháu
            while (nextGen.length < this.populationSize) {
                // Chọn ngẫu nhiên 2 Bố Mẹ trong Top 10 lịch giỏi nhất
                let p1 = scoredPop[Math.floor(Math.random() * 10)].ind;
                let p2 = scoredPop[Math.floor(Math.random() * 10)].ind;

                // LAI GHÉP (Crossover): Cắt đôi lịch của Bố, ghép với nửa cuối lịch của Mẹ
                let mid = Math.floor(p1.length / 2);
                let child = [...p1.slice(0, mid), ...p2.slice(mid)];

                // ĐỘT BIẾN (Mutation): Tỷ lệ 10%
                // Thay vì đổi 1 phim lẻ tẻ dễ dẫn đến trùng giờ (đè lịch lên nhau), AI sẽ xóa trắng luôn 1 ngày của 1 phòng và bốc lại từ đầu
                if (Math.random() < 0.1) {
                    let randomDate = this.targetDates[Math.floor(Math.random() * this.targetDates.length)];
                    let randomRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];

                    // Xóa sạch lịch của phòng đó vào ngày đó
                    child = child.filter(s => !(s.roomId === randomRoom._id && s.time.getDate() === randomDate.getDate()));
                    // Dùng thuật toán Tham lam lấp lại đầy kín phòng đó
                    child.push(...this.generateDailyRoomSchedule(randomDate, randomRoom));
                }
                nextGen.push(child); // Đưa con cháu vào quần thể mới
            }
            population = nextGen; // Bắt đầu vòng đời tiếp theo
        }

        // Sau 50 đời tiến hóa, chọn ra "KẺ MẠNH NHẤT" (Lịch có điểm cao nhất)
        let finalScored = population.map(ind => ({ ind, score: this.calculateFitness(ind) }));
        finalScored.sort((a, b) => b.score - a.score);

        // Cắt bỏ đi dữ liệu Raw (thuộc tính rác) chỉ giữ lại 3 thông tin quan trọng nhất để nạp vào DB
        let bestSchedule = finalScored[0].ind.map(s => ({
            movieId: s.movieId,
            roomId: s.roomId,
            time: s.time
        }));

        return bestSchedule; // Trả về lịch hoàn hảo!
    }
}

// ============================================================================
// 🚀 3. HÀM KHỞI CHẠY AI CẤP CAO (Giao tiếp với Controller)
// ============================================================================
exports.runSmartScheduling = async (startDateStr, endDateStr) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    // BƯỚC 1: Thu thập Lịch sử bán vé 30 ngày qua
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const bookings = await Booking.find({ createdAt: { $gte: thirtyDaysAgo } }).populate("showtimeId");

    const movieScores = {};

    // TÍNH NĂNG ĐỘT PHÁ 3: HỆ SỐ PHÂN RÃ THỜI GIAN (Time Decay)
    bookings.forEach(b => {
        if (b.showtimeId && b.showtimeId.movieId) {
            let mId = b.showtimeId.movieId.toString();
            let numTickets = b.seats ? b.seats.length : 1;

            // Vé mua hôm nay sẽ được x1 (trọn vẹn 100% điểm sức mạnh). 
            // Vé càng cũ, sức mạnh giảm dần. Cũ trên 30 ngày thì sức mạnh chỉ còn x0.1
            let daysOld = (today - new Date(b.createdAt)) / (1000 * 60 * 60 * 24);
            let decayWeight = Math.max(0.1, 1 - (daysOld * 0.03));

            // Tính tổng điểm cho phim = Số vé bán ra * Sức nặng của thời gian
            movieScores[mId] = (movieScores[mId] || 0) + (numTickets * decayWeight);
        }
    });

    // Tìm điểm lớn nhất hiện tại làm mốc để boost cho phim mới
    const maxRealScore = Math.max(...Object.values(movieScores), 30); // tối thiểu là 30 điểm

    // KHÔNG đề xuất phim đã ngừng chiếu (status: "ended")
    const activeMovies = await Movie.find({ status: { $ne: "ended" } });
    
    // Đóng gói thông tin Phim + Điểm doanh thu + Thể loại/Độ tuổi gửi cho AI K-Means
    const movieDataList = activeMovies.map(m => {
        const mId = m._id.toString();
        let score = movieScores[mId] || 0;

        // 🚀 THUẬT TOÁN ƯU ÁI PHIM MỚI & THỜI GIAN ĐỌ ĐỘ HOT (Grace Period: 10 ngày)
        const release = m.releaseDate ? new Date(m.releaseDate) : new Date();
        const diffTime = today - release;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        let isNewMovie = false;
        let gracePeriodDays = 10; // 10 ngày đầu tiên được xem là phim mới để chạy đua độ hot
        
        if (diffDays <= gracePeriodDays) {
            isNewMovie = true;
            // Cho phim mới một điểm cộng khởi điểm lớn (85% của điểm của phim hot nhất) 
            // để đảm bảo phim mới được xếp vào cụm HOT hoặc cụm THƯỜNG nhằm có nhiều suất chiếu đọ độ hot.
            const newMovieBoost = maxRealScore * 0.85;
            score = Math.max(score, newMovieBoost);
        }

        return {
            _id: m._id,
            title: m.title,
            duration: m.duration || 120,
            genre: m.genre, // Phục vụ luật 1, 2
            rated: m.rated, // Phục vụ luật 3, 4
            releaseDate: m.releaseDate, // Để lọc suất chiếu theo ngày bắt đầu khởi chiếu
            score: score,
            isNewMovie: isNewMovie
        };
    });

    // BƯỚC 2: Gom 13 phim thành 3 cụm Hot, Thường, Ế
    const clusters = kMeans(movieDataList, 3, 20);

    // BƯỚC 3: Triệu hồi Thuật toán Di Truyền để tự sinh lịch tối ưu
    const rooms = await Room.find();
    const ga = new GeneticAlgorithm(clusters, rooms, dates);
    const bestSchedule = ga.evolve(); // Bắt đầu lai ghép đột biến...

    // Trả cục dữ liệu siêu việt này về cho Admin Controller duyệt
    return {
        bestSchedule,
        clustersSummary: {
            hotMovies: clusters[0].map(c => c.title),
            normalMovies: clusters[1]?.map(c => c.title) || [],
            nicheMovies: clusters[2]?.map(c => c.title) || []
        }
    };
};
