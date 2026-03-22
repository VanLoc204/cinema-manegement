// src/api/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🚀 TỰ ĐỘNG GẮN TOKEN VÀO MỖI LẦN GỌI API (Chìa khóa bảo mật)
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // 🛰️ Gửi token lên Backend (Sếp nhớ dùng đúng định dạng này)
      config.headers.Authorization = token; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
