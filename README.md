# 📘 Tài liệu API — Cập nhật cho Frontend

> **Cập nhật lần cuối:** 2026-10-02
> Tài liệu này mô tả các thay đổi API mới nhất ở phía Backend (BE).
> Frontend (FE) cần cập nhật lại cách gọi để hoạt động đúng.

---

## ⚠️ Thay đổi quan trọng — CẦN SỬA NGAY

---

## 1. 🚪 API Đăng xuất (Logout) — ĐÃ THAY ĐỔI

### Vấn đề cũ
FE chỉ gửi `Authorization: Bearer <access_token>` → BE chỉ blacklist Access Token.
Refresh Token vẫn còn hiệu lực → người dùng vẫn lấy lại được token mới sau khi logout.

### ✅ Cách gọi MỚI — BẮT BUỘC gửi thêm Refresh Token

```
POST /api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>
```

**Response thành công:**
```
"Đăng xuất thành công"
```

**Ví dụ Axios:**
```javascript
const logout = async () => {
  const accessToken  = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  await axios.post("/api/v1/auth/logout", null, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "X-Refresh-Token": refreshToken   // <- THÊM DÒNG NÀY
    }
  });

  // Xóa token khỏi storage
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  // Redirect về trang login
  window.location.href = "/login";
};
```

> **Lưu ý:** Header `X-Refresh-Token` là **optional** (không bắt buộc về mặt kỹ thuật),
> nhưng **nên luôn gửi** để đảm bảo bảo mật — ngăn Refresh Token bị lợi dụng sau khi logout.

---

## 2. 🔁 API Refresh Token — THÊM XỬ LÝ LỖI MỚI

### Endpoint
```
POST /api/v1/auth/refresh
```

**Request body:**
```json
{
  "token": "<refresh_token>"
}
```

### ⚠️ Trường hợp mới: Refresh Token bị thu hồi sau khi logout

Nếu người dùng đã logout, Refresh Token sẽ bị blacklist.
Khi FE gọi `/refresh` với token đó → BE sẽ trả về lỗi `400 Bad Request`:

```
"Refresh Token đã bị thu hồi. Vui lòng đăng nhập lại."
```

**FE cần xử lý thêm trường hợp này:**

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    const response = await axios.post("/api/v1/auth/refresh", {
      token: refreshToken
    });

    const newAccessToken = response.data.token;
    localStorage.setItem("token", newAccessToken);
    return newAccessToken;

  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      // THÊM XỬ LÝ NÀY: Refresh Token đã bị thu hồi → bắt buộc logout
      console.warn("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    throw error;
  }
};
```

---

## 3. 📋 Luồng xác thực đầy đủ (Auth Flow)

```
ĐĂNG NHẬP
  POST /api/v1/auth/signin
  → Nhận: { token, refreshToken, hoTen, isGuest }
  → Lưu: localStorage.token + localStorage.refreshToken
        |
        ▼
GỌI API CẦN XÁC THỰC
  Header: Authorization: Bearer <access_token>
  → Token hết hạn (401) → gọi /refresh để lấy token mới
        |
        ▼
ĐĂNG XUẤT
  POST /api/v1/auth/logout
  Header: Authorization: Bearer <access_token>
  Header: X-Refresh-Token: <refresh_token>   <- THÊM MỚI
  → Xóa token khỏi localStorage
  → Redirect về /login
```

---

## 4. 🔑 Bảng tóm tắt tất cả Auth Endpoints

| Method | Endpoint | Mô tả | Auth cần? |
|--------|----------|-------|-----------|
| POST | /api/v1/auth/signup | Đăng ký tài khoản | Không |
| POST | /api/v1/auth/signin | Đăng nhập | Không |
| POST | /api/v1/auth/refresh | Lấy Access Token mới | Không (dùng Refresh Token) |
| POST | /api/v1/auth/logout | Đăng xuất | Có + X-Refresh-Token |
| GET  | /api/v1/auth/me | Lấy thông tin user hiện tại | Có |
| POST | /api/v1/auth/guest | Tạo phiên khách | Không |
| POST | /api/v1/auth/register-guest | Nâng cấp GUEST lên USER | Có (GUEST token) |
| POST | /api/v1/auth/merge-guest | Gộp dữ liệu GUEST vào tài khoản thật | Có |

---

## 5. 🛡️ Phân quyền theo Role

| URL Pattern | Role được phép truy cập |
|-------------|------------------------|
| /api/v1/auth/** | Tất cả (public) |
| /api/product/** | Tất cả (public) |
| /api/category/** | Tất cả (public) |
| GET /api/v1/review/** | Tất cả (public) |
| /api/v1/admin/** | Chỉ Admin |
| /api/v1/user/** | User, Admin, Employee |
| /api/v1/employee/** | Chỉ Employee |
| Các endpoint khác | Phải đăng nhập |

**Role trong JWT payload:**
```json
{
  "sub": "user@example.com",
  "role": "User",
  "roles": ["User"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

> Dùng field `role` (string) hoặc `roles` (array) để kiểm tra quyền ở FE.

---

## 6. 📦 Cấu trúc Response sau khi đăng nhập / refresh

```json
{
  "token": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "hoTen": "Nguyễn Văn A",
  "isGuest": false
}
```

| Field | Kiểu | Mô tả |
|-------|------|-------|
| token | string | Access Token, hết hạn sau 1 ngày |
| refreshToken | string | Refresh Token, hết hạn sau 7 ngày |
| hoTen | string | Tên hiển thị của người dùng |
| isGuest | boolean | true nếu là tài khoản khách |

---

## 7. ⚙️ Gợi ý cài đặt Axios Interceptor cho FE

```javascript
// Tự động đính kèm token vào mọi request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Tự động refresh token khi nhận 401
let isRefreshing = false;
let failedQueue = [];

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axios(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post("/api/v1/auth/refresh", {
          token: refreshToken
        });

        localStorage.setItem("token", data.token);
        failedQueue.forEach(p => p.resolve(data.token));
        failedQueue = [];

        originalRequest.headers["Authorization"] = `Bearer ${data.token}`;
        return axios(originalRequest);

      } catch (refreshError) {
        // Refresh thất bại → logout
        failedQueue.forEach(p => p.reject(refreshError));
        failedQueue = [];
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 8. 📝 Checklist cho Frontend

- [ ] Cập nhật hàm `logout()` → thêm header `X-Refresh-Token`
- [ ] Xử lý thêm lỗi `400` khi gọi `/refresh` → redirect về `/login`
- [ ] Lưu `refreshToken` vào `localStorage` sau khi đăng nhập / refresh
- [ ] Xóa cả `token` lẫn `refreshToken` khỏi `localStorage` khi logout
- [ ] Cài Axios Interceptor để tự động xử lý 401 và refresh token

---

*Mọi thắc mắc liên hệ BE team.*

---

