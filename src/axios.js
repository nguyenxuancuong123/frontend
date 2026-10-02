import axios from "axios";
import { API_BASE_URL } from "./config/api.js";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("jwt-token");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =====================================================
// REFRESH TOKEN
// =====================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================
api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        // Không có request thì trả lỗi luôn
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // =================================================
        // 401 - ACCESS TOKEN HẾT HẠN
        // =================================================
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {

            // ---------------------------------------------
            // Nếu đang refresh token
            // → đưa request vào hàng đợi
            // ---------------------------------------------
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve,
                        reject,
                    });
                })
                    .then((token) => {
                        originalRequest.headers =
                            originalRequest.headers || {};

                        originalRequest.headers.Authorization =
                            `Bearer ${token}`;

                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // ---------------------------------------------
                // Lấy refresh token
                // ---------------------------------------------
                const refreshToken =
                    localStorage.getItem("refresh-token");

                if (!refreshToken) {
                    throw new Error("Không có refresh token");
                }

                // ---------------------------------------------
                // Gọi API refresh token
                //
                // Axios baseURL = /api
                //
                // "/v1/auth/refresh"
                //        ↓
                // "/auth/refresh"
                // ---------------------------------------------
                const response = await api.post(
                    "/v1/auth/refresh",
                    {
                        token: refreshToken,
                    }
                );

                // ---------------------------------------------
                // Lấy access token mới
                // BE trả về field "token" (không phải "accessToken")
                // ---------------------------------------------
                const newAccessToken =
                    response.data.token || response.data.accessToken;

                if (!newAccessToken) {
                    throw new Error(
                        "Backend không trả về access token mới"
                    );
                }

                // ---------------------------------------------
                // Lưu access token và refresh token mới
                // ---------------------------------------------
                localStorage.setItem(
                    "jwt-token",
                    newAccessToken
                );
                if (response.data.refreshToken) {
                    localStorage.setItem("refresh-token", response.data.refreshToken);
                }

                // ---------------------------------------------
                // Cập nhật Axios default header
                // ---------------------------------------------
                api.defaults.headers.common.Authorization =
                    `Bearer ${newAccessToken}`;

                // ---------------------------------------------
                // Xử lý các request đang chờ
                // ---------------------------------------------
                processQueue(null, newAccessToken);

                // ---------------------------------------------
                // Gửi lại request ban đầu
                // ---------------------------------------------
                originalRequest.headers =
                    originalRequest.headers || {};

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (err) {

                // ---------------------------------------------
                // Refresh token hết hạn / bị thu hồi (400) / lỗi khác
                // ---------------------------------------------
                processQueue(err, null);

                const wasGuest =
                    localStorage.getItem("is_guest") === "true";

                // Xóa thông tin đăng nhập
                localStorage.removeItem("jwt-token");
                localStorage.removeItem("refresh-token");
                localStorage.removeItem("user-info");

                if (!wasGuest) {

                    // 400 = Refresh Token đã bị thu hồi (logout trước đó)
                    // 401 = Refresh Token hết hạn
                    if (
                        err.response?.status === 400 ||
                        err.response?.status === 401
                    ) {
                        console.warn(
                            "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại."
                        );
                    } else {
                        alert(
                            "Phiên đăng nhập đã hết hạn hoàn toàn, vui lòng đăng nhập lại!"
                        );
                    }

                    window.location.href = "/Login";

                } else {

                    // Guest:
                    // reload để hệ thống tự cấp lại guest token
                    window.location.reload();
                }

                return Promise.reject(err);

            } finally {
                isRefreshing = false;
            }
        }

        // =================================================
        // 403 - KHÔNG CÓ QUYỀN
        // =================================================
        if (
            error.response &&
            error.response.status === 403
        ) {
            alert(
                "Bạn không có quyền thực hiện thao tác này!"
            );
        }

        return Promise.reject(error);
    }
);

export default api;