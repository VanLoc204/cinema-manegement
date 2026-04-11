const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Sếp ơi, phim phải có tên chứ!"], 
    trim: true 
  },
  description: { 
    type: String,
    required: [true, "Phải có mô tả phim sếp nhé!"],
    trim: true
  },
  
  // 🎬 THÔNG TIN CHI TIẾT
  director: { 
    type: String, 
    trim: true,
    default: "Đang cập nhật"
  }, 
  cast: { 
    type: String, 
    trim: true,
    default: "Đang cập nhật"
  },    
  genre: { 
    type: String, 
    trim: true,
    required: [true, "Sếp chọn thể loại cho phim nhé!"]
  },    
  releaseDate: { 
    type: Date,
    required: [true, "Ngày khởi chiếu là bắt buộc sếp ơi!"]
  }, 
  duration: { 
    type: Number, 
    required: [true, "Phim dài bao nhiêu phút sếp nhỉ?"]
  }, 
  language: { 
    type: String, 
    trim: true,
    default: "Tiếng Việt - Phụ đề Tiếng Anh"
  },  
  rated: { 
    type: String, 
    trim: true,
    default: "P" // Mặc định là mọi lứa tuổi
  },

  // 📸 HÌNH ẢNH & VIDEO
  image: { 
    type: String, 
    default: "/uploads/movies/default-poster.jpg" 
  },
  trailer: { 
    type: String, 
    trim: true,
    default: "" 
  },
  
  // 🎬 TRẠNG THÁI HIỂN THỊ
  status: { 
    type: String, 
    enum: ["now_showing", "coming_soon", "ended"], 
    default: "now_showing" 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Tự động thêm updatedAt và createdAt cho sếp quản lý
});

module.exports = mongoose.model("Movie", movieSchema);