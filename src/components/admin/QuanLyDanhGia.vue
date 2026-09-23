<template>
  <div class="ql-wrapper">
    <div class="ql-header">
      <div>
        <h3>Quản lý đánh giá</h3>
        <p class="ql-sub">Danh sách đánh giá của khách hàng</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sản phẩm</th>
            <th>Khách hàng</th>
            <th>Số sao</th>
            <th>Nội dung</th>
            <th>Ngày đánh giá</th>
            <th class="col-action">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in reviews" :key="review.maDanhGia">
            <td class="fw-id">#{{ review.maDanhGia }}</td>
            <td class="cell-name">
              <strong>{{ review.tenSP }}</strong><br />
              <small class="sub-text">Mã SP: {{ review.maSP }}</small>
            </td>
            <td>
              <strong>{{ review.hoTen }}</strong><br />
              <small class="sub-text">{{ review.email }}</small>
            </td>
            <td>
              <span class="star-rating">
                <svg v-for="i in 5" :key="i" :class="i <= review.soDiem ? 'star-filled' : 'star-empty'" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            </td>
            <td class="cell-comment">{{ review.binhLuan }}</td>
            <td class="cell-date">{{ formatDate(review.ngayTao) }}</td>
            <td class="col-action">
              <button class="btn-action btn-delete" @click="deleteReview(review.maDanhGia)">Xóa</button>
            </td>
          </tr>
          <tr v-if="reviews.length === 0">
            <td colspan="7" class="empty-row">Không có đánh giá nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phân trang -->
    <div class="pagination" v-if="totalPages > 0">
      <button :disabled="currentPage === 1" @click="fetchReviews(1)">« Đầu</button>
      <button :disabled="currentPage === 1" @click="fetchReviews(currentPage - 1)">‹ Trước</button>
      <button
        v-for="p in visiblePages"
        :key="p"
        :class="{ active: p === currentPage }"
        @click="fetchReviews(p)">
        {{ p }}
      </button>
      <button :disabled="currentPage === totalPages" @click="fetchReviews(currentPage + 1)">Sau ›</button>
      <button :disabled="currentPage === totalPages" @click="fetchReviews(totalPages)">Cuối »</button>
      <span class="page-info">Trang {{ currentPage }} / {{ totalPages }} ({{ totalElements }} đánh giá)</span>
    </div>

    <!-- Toast thông báo -->
    <div v-if="actionMessage" :class="['toast', isError ? 'toast-error' : 'toast-success']">
      {{ actionMessage }}
    </div>
  </div>
</template>

<script>
import api from '@/axios';

export default {
  name: 'QuanLyDanhGia',
  data() {
    return {
      reviews: [],
      loading: true,
      
      // Pagination state
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,

      // Toast state
      actionMessage: '',
      isError: false,
      toastTimeout: null
    };
  },
  computed: {
    visiblePages() {
      let pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = start + maxVisible - 1;

      if (end > this.totalPages) {
        end = this.totalPages;
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    }
  },
  mounted() {
    this.fetchReviews(1);
  },
  methods: {
    async fetchReviews(page = 1) {
      if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) return;
      this.loading = true;
      try {
        const res = await api.get('/api/v1/admin/review', {
          params: { page, size: this.pageSize }
        });
        this.reviews = res.data.content || res.data;
        this.currentPage = page;
        this.totalPages = res.data.totalPages || 0;
        this.totalElements = res.data.totalElements || 0;
      } catch (err) {
        console.error('Lỗi tải danh sách đánh giá:', err);
        this.showToast('Không thể tải danh sách đánh giá.', true);
      } finally {
        this.loading = false;
      }
    },
    async deleteReview(maDanhGia) {
      if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;
      
      try {
        await api.delete(`/api/v1/admin/review/${maDanhGia}`);
        this.showToast('Đã xóa đánh giá thành công.', false);
        // Tải lại danh sách hiện tại
        this.fetchReviews(this.currentPage);
      } catch (err) {
        console.error('Lỗi khi xóa đánh giá:', err);
        this.showToast('Xóa đánh giá thất bại.', true);
      }
    },
    formatDate(value) {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleString('vi-VN');
    },
    showToast(message, isError) {
      this.actionMessage = message;
      this.isError = isError;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.actionMessage = '';
      }, 3000);
    }
  }
};
</script>

<style scoped>
.ql-wrapper { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.ql-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.ql-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.ql-sub { font-size: 13px; color: #64748b; margin-top: 4px; margin-bottom: 0; }
.loading { display: flex; align-items: center; justify-content: center; height: 120px; color: #94a3b8; font-size: 14px; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #334155; }
.data-table tr:hover { background: #f8fafc; }
.fw-id { font-weight: 700; color: #94a3b8; }
.cell-name { max-width: 200px; }
.sub-text { color: #64748b; font-size: 12px; }
.cell-comment { max-width: 300px; line-height: 1.5; }
.cell-date { white-space: nowrap; font-size: 13px; color: #64748b; }
.star-rating { display: flex; gap: 2px; }
.star-rating svg { width: 16px; height: 16px; }
.star-filled { color: #f59e0b; }
.star-empty { color: #e2e8f0; }
.col-action { width: 80px; text-align: center; }
.btn-action { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
.btn-delete { background: #fee2e2; color: #dc2626; }
.btn-delete:hover { background: #fca5a5; }
.empty-row { text-align: center; color: #94a3b8; padding: 32px !important; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 20px; }
.pagination button { min-width: 32px; padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer; color: #334155; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; font-weight: bold; }
.page-info { margin-left: 12px; font-size: 14px; color: #64748b; }

.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; z-index: 100; animation: slideIn 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>

