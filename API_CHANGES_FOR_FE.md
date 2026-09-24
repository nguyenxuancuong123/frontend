# Thông báo cập nhật API Backend (Dành cho Frontend Team)

Chào team Frontend, Backend vừa thực hiện một số thay đổi về API liên quan đến trang Admin. Cụ thể là **khôi phục lại tính năng phân trang (Pagination)** cho các API quản lý nhằm đảm bảo hiệu năng hệ thống không bị chậm khi dữ liệu lớn. Dưới đây là chi tiết thay đổi:

## 1. API Lấy danh sách Đơn hàng (Admin)
- **Endpoint**: `GET /api/v1/admin/order/list`
- **Thay đổi**: **Khôi phục lại phân trang** (giống như thiết kế ban đầu).
- **Hiện tại**: 
  - Yêu cầu gửi tham số `page`, `size` trên URL (nếu không gửi, mặc định `page=1, size=10`).
  - Trả về đối tượng `Page<OrderResponse>`.
  - **Lưu ý cho FE**: Dữ liệu danh sách nằm ở `response.data.content`, và các thông tin phân trang nằm ở `totalPages`, `totalElements`,...

## 2. API Lấy danh sách Đánh giá (Admin)
- **Endpoint**: `GET /api/v1/admin/review`
- **Thay đổi**: **Khôi phục lại phân trang** (giống như thiết kế ban đầu).
- **Hiện tại**: 
  - Yêu cầu gửi tham số `page`, `size` trên URL (mặc định `page=1, size=10`).
  - Trả về đối tượng `Page<ReviewResponse>`.
  - **Lưu ý cho FE**: Dữ liệu danh sách nằm ở `response.data.content`.

## 3. Chú ý về API Lấy danh sách Sản phẩm & Danh sách Người dùng
- Các API hiển thị sản phẩm (`GET /api/product/page`, `GET /api/product/search`,...) và API Người dùng (`GET /api/v1/admin/user`) **không có sự thay đổi**.
- Các API này vẫn đang sử dụng cơ chế phân trang `Page<T>` với mặc định **10 dòng mỗi lần** để đảm bảo tốc độ tải trang nhanh nhất.

---
*Vui lòng cập nhật lại phía giao diện UI, sử dụng các component phân trang (Pagination) ở màn hình Đơn hàng và Đánh giá Admin để lấy dữ liệu theo từng trang. Nếu gặp sự cố gì trong quá trình tích hợp, hãy báo lại cho Backend!*
