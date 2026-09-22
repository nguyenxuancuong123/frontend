import axios from "axios"

const api = axios.create({
    baseURL: 'http://localhost:8080/', 
});

// Trạm kiểm soát TRƯỚC KHI request được gửi đi
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("jwt-token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Biến cờ để ngăn việc gọi refresh token liên tục nếu có nhiều API cùng lỗi 401 một lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Trạm kiểm soát SAU KHI nhận kết quả về
api.interceptors.response.use(
    (response) => {
        return response; // Nếu thành công thì cho qua
    },
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 và request chưa được thử lại lần nào
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // Nếu đang refresh rồi, các request khác bị 401 sẽ vào hàng đợi
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // 1. Gọi API Refresh Token của Backend
                // (Giả sử bạn lưu refresh-token trong localStorage hoặc HttpOnly Cookie)
                const refreshToken = localStorage.getItem("refresh-token"); 
                
                const response = await axios.post('/api/v1/auth/refresh', {
                    token: refreshToken
                });

                // 2. Lấy Access Token mới từ kết quả trả về
                const newAccessToken = response.data.accessToken;
                
                // Cập nhật lại vào localStorage
                localStorage.setItem("jwt-token", newAccessToken);

                // Cập nhật token mới cho header của Axios
                api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;

                // Xử lý các request đang chờ trong hàng đợi
                processQueue(null, newAccessToken);

                // 3. Thực hiện lại request bị lỗi ban đầu với token mới
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                return api(originalRequest);

            } catch (err) {
                // Nếu Refresh Token CŨNG HẾT HẠN hoặc LỖI -> Lúc này mới thực sự bắt Login lại
                processQueue(err, null);
                alert("Phiên đăng nhập đã hết hạn hoàn toàn, vui lòng đăng nhập lại!");
                
                localStorage.removeItem("jwt-token");
                localStorage.removeItem("refresh-token");
                localStorage.removeItem("user-info");
                
                window.location.href = "/Login"; 
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        
        // Nếu lỗi 403 (Không có quyền truy cập)
        if (error.response && error.response.status === 403) {
            alert("Bạn không có quyền thực hiện thao tác này!");
        }

        return Promise.reject(error);
    }
);

export default api;