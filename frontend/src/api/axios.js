// src/api/axios.js

import axios from "axios";



const instance = axios.create({

  baseURL: "http://localhost:5000/api",

});



// 🚀 1. TỰ ĐỘNG GẮN TOKEN VÀO MỖI LẦN GỬI YÊU CẦU (REQUEST)

instance.interceptors.request.use(

  (config) => {

    const token = localStorage.getItem("token");

    if (token) {

      // ✅ Sửa lại: Thêm Bearer để Backend dễ dàng nhận diện (chuẩn JWT)

      config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);



// 🚔 2. TỰ ĐỘNG XỬ LÝ KHI TOKEN HẾT HẠN (RESPONSE)

instance.interceptors.response.use(

  (response) => {

    // Nếu API chạy thành công, cứ để nó đi tiếp bình thường

    return response;

  },

  (error) => {

    // 🚩 Kiểm tra nếu lỗi trả về là 401 (Unauthorized - Thẻ bài hết hạn/sai)

    if (error.response && error.response.status === 401) {

      console.warn("Token hết hạn hoặc không hợp lệ. Đang dọn dẹp và yêu cầu đăng nhập lại...");

     

      // Xóa sạch các thông tin cũ để giao diện không bị "đăng nhập giả"

      localStorage.removeItem("token");

      localStorage.removeItem("userId");

      localStorage.removeItem("name");

      localStorage.removeItem("role"); // Nếu sếp có lưu role



      // Đẩy sếp về trang Login ngay lập tức

      // Dùng window.location để đảm bảo toàn bộ App được reset lại sạch sẽ

      window.location.href = "/login";

    }

   

    return Promise.reject(error);

  }

);



// --- CÁC HÀM API EXPORT GIỮ NGUYÊN ---



// 🎬 Lấy tất cả phim (danh sách chung)

export const getMovies = () => instance.get("/movies");



// 🔥 Lấy phim đang chiếu

export const getNowPlaying = () => instance.get("/movies/now-playing");



// ⏳ Lấy phim sắp chiếu

export const getUpcoming = () => instance.get("/movies/upcoming");



export default instance;