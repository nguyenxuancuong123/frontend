<template>
  <div class="ql-wrapper">
    <div class="ql-header">
      <div>
        <h3>Quản lý đơn hàng</h3>
        <p class="ql-sub">{{ filteredOrders.length }} / {{ orders.length }} đơn hàng</p>
      </div>
      <div class="ql-toolbar">
        <input
          v-model="searchText"
          type="text"
          class="ql-search"
          placeholder="Tìm theo mã đơn hoặc tên khách..."
        />
        <select v-model="statusFilter" class="ql-filter">
          <option value="">Tất cả trạng thái</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <!-- Mini stats -->
    <div class="mini-stats">
      <div class="mini-stat">
        <span class="mini-label">Tổng đơn</span>
        <span class="mini-value">{{ orders.length }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Chờ duyệt</span>
        <span class="mini-value warning">{{ countByStatus('Chờ duyệt') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Đang giao</span>
        <span class="mini-value primary">{{ countByStatus('Đang giao') }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Doanh thu</span>
        <span class="mini-value success">{{ formatPrice(tongDoanhThu) }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Mã đơn hàng</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Ngày đặt</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th class="col-action">Đổi trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in filteredOrders" :key="order.maDonHang">
            <tr class="row-main" @click="toggleExpand(order.maDonHang)">
              <td class="col-expand">{{ expanded === order.maDonHang ? '▼' : '▶' }}</td>
              <td class="font-bold">#{{ order.maDonHang }}</td>
              <td class="cell-name">{{ order.tenNguoiNhan }}</td>
              <td>{{ order.soDienThoaiNhan }}</td>
              <td>{{ formatDate(order.ngayDat) }}</td>
              <td class="price">{{ formatPrice(order.tongTien) }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(order.trangThai)]">
                  {{ order.trangThai || 'Chờ duyệt' }}
                </span>
              </td>
              <td class="col-action" @click.stop>
                <select
                  class="status-select"
                  :value="order.trangThai"
                  @change="updateStatus(order, $event.target.value)"
                  :disabled="updatingId === order.maDonHang || order.trangThai === 'Hủy'"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
            </tr>

            <tr v-if="expanded === order.maDonHang" class="row-detail">
              <td colspan="8">
                <div class="detail-box">
                  <div class="detail-info">
                    <span><strong>Địa chỉ:</strong> {{ order.diaChiGiaoHang || '—' }}</span>
                    <span><strong>Thanh toán:</strong> {{ order.phuongThucThanhToan || '—' }}</span>
                  </div>
                  <table class="inner-table">
                    <thead>
                      <tr><th>Sản phẩm</th><th>Phân loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="ct in order.chiTiet" :key="ct.maBienThe">
                        <td class="text-left">{{ ct.tenSP }}</td>
                        <td>{{ ct.size }}{{ ct.size && ct.tenMau ? ' / ' : '' }}{{ ct.tenMau }}</td>
                        <td>{{ ct.soLuong }}</td>
                        <td>{{ formatPrice(ct.donGia) }}</td>
                        <td>{{ formatPrice(ct.thanhTien) }}</td>
                      </tr>
                      <tr v-if="!order.chiTiet || order.chiTiet.length === 0">
                        <td colspan="5" class="empty-row">Không có sản phẩm nào.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="filteredOrders.length === 0">
            <td colspan="8" class="empty-row">Không tìm thấy đơn hàng phù hợp</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phân trang -->
    <div class="pagination" v-if="totalPages > 0">
        <button :disabled="currentPage === 1" @click="fetchOrders(1)">« Đầu</button>
        <button :disabled="currentPage === 1" @click="fetchOrders(currentPage - 1)">‹ Trước</button>
        <button
            v-for="p in visiblePages"
            :key="p"
            :class="{ active: p === currentPage }"
            @click="fetchOrders(p)">
            {{ p }}
        </button>
        <button :disabled="currentPage === totalPages" @click="fetchOrders(currentPage + 1)">Sau ›</button>
        <button :disabled="currentPage === totalPages" @click="fetchOrders(totalPages)">Cuối »</button>
        <span class="page-info">Trang {{ currentPage }} / {{ totalPages }} ({{ totalElements }} đơn hàng)</span>
    </div>
    <!-- Toast lỗi thao tác -->
    <div v-if="actionError" class="toast-error">{{ actionError }}</div>
  </div>
</template>

<script>
import api from '@/axios';

const STATUS_OPTIONS = ['Chờ duyệt', 'Đang giao', 'Hoàn thành', 'Hủy'];

export default {
  name: 'QuanLyDonHang',
  data() {
    return {
      orders: [],
      loading: true,
      updatingId: null,
      expanded: null,
      searchText: '',
      statusFilter: '',
      actionError: null,
      statusOptions: STATUS_OPTIONS,
      // Pagination state
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0
    };
  },
  computed: {
    filteredOrders() {
      const kw = this.searchText.trim().toLowerCase();
      return this.orders.filter((o) => {
        const matchKw =
          !kw ||
          String(o.maDonHang).includes(kw) ||
          (o.tenNguoiNhan || '').toLowerCase().includes(kw);
        const matchStatus = !this.statusFilter || o.trangThai === this.statusFilter;
        return matchKw && matchStatus;
      });
    },
    tongDoanhThu() {
      return this.orders
        .filter(o => o.trangThai === 'Hoàn thành')
        .reduce((sum, o) => sum + (o.tongTien || 0), 0);
    },
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
    this.fetchOrders(1);
  },
  methods: {
    async fetchOrders(page = 1) {
      if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) return;
      this.loading = true;
      try {
        const res = await api.get('/api/v1/admin/order/list', {
          params: { page, size: this.pageSize }
        });
        this.orders = res.data.content;
        this.currentPage = page;
        this.totalPages = res.data.totalPages;
        this.totalElements = res.data.totalElements;
      } catch (err) {
        this.showActionError(err, 'Không thể tải danh sách đơn hàng.');
      } finally {
        this.loading = false;
      }
    },
    toggleExpand(maDonHang) {
      this.expanded = this.expanded === maDonHang ? null : maDonHang;
    },
    countByStatus(status) {
      return this.orders.filter(o => o.trangThai === status).length;
    },
    formatDate(dateString) {
      if (!dateString) return '—';
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },
    formatPrice(price) {
      if (!price) return '0 ₫';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    },
    getStatusClass(status) {
      switch (status) {
        case 'Chờ duyệt': return 'badge-warning';
        case 'Đang giao': return 'badge-primary';
        case 'Hoàn thành': return 'badge-success';
        case 'Hủy': return 'badge-danger';
        default: return 'badge-secondary';
      }
    },
    async updateStatus(order, newStatus) {
      if (order.trangThai === 'Hủy') return;
      if (order.trangThai === newStatus) return;

      if (!window.confirm(`Đổi trạng thái đơn #${order.maDonHang} sang "${newStatus}"?`)) {
        this.orders = [...this.orders];
        return;
      }
      const oldStatus = order.trangThai;
      this.updatingId = order.maDonHang;
      try {
        await api.put(`/api/v1/admin/order/${order.maDonHang}/status`, {
          trangThai: newStatus
        });
        order.trangThai = newStatus;
      } catch (err) {
        order.trangThai = oldStatus;
        this.orders = [...this.orders];
        this.showActionError(err, 'Cập nhật trạng thái thất bại.');
      } finally {
        this.updatingId = null;
      }
    },
    showActionError(err, fallback) {
      this.actionError = err.response?.data?.message || fallback;
      setTimeout(() => { this.actionError = null; }, 3500);
    }
  }
};
</script>

<style scoped>
/* Cấu trúc khung cố định chiều cao */
.ql-wrapper {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Phần Header cố định */
.ql-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.ql-header h3 { color: #1e293b; font-size: 18px; font-weight: 700; }
.ql-sub { color: #64748b; font-size: 13px; margin-top: 4px; }

.ql-toolbar { display: flex; gap: 10px; flex-wrap: wrap; }
.ql-search, .ql-filter {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;
  font-size: 14px; color: #334155; background: #f8fafc;
}
.ql-search { min-width: 220px; }
.ql-search:focus, .ql-filter:focus { outline: none; border-color: #3b82f6; background: #fff; }

/* Thống kê mini cố định */
.mini-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.mini-stat {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.mini-value { font-size: 18px; font-weight: 700; color: #1e293b; }
.mini-value.warning { color: #d97706; }
.mini-value.primary { color: #2563eb; }
.mini-value.success { color: #16a34a; }

.loading { display: flex; align-items: center; justify-content: center; height: 120px; color: #94a3b8; }

/* Khung cuộn nội dung độc lập cho bảng */
.table-wrapper { 
  flex: 1;
  overflow-y: auto; 
  overflow-x: auto;
}

.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }

/* Ghim tiêu đề bảng lên trên cùng */
.data-table th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  text-align: left; padding: 12px 14px; color: #64748b; font-weight: 600;
  font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9;
}
.data-table td { padding: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }

.col-expand { width: 24px; text-align: center; color: #94a3b8; font-size: 11px; }
.row-main { cursor: pointer; }
.row-main:hover { background: #f8fafc; }

.font-bold { font-weight: 700; }
.cell-name { font-weight: 600; color: #1e293b; }
.price { font-weight: 600; color: #ef4444; }
.text-left { text-align: left; }

.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-warning  { background-color: #fef3c7; color: #d97706; }
.badge-primary  { background-color: #dbeafe; color: #2563eb; }
.badge-success  { background-color: #dcfce7; color: #16a34a; }
.badge-danger   { background-color: #fee2e2; color: #dc2626; }
.badge-secondary{ background-color: #f1f5f9; color: #475569; }

.col-action { white-space: nowrap; text-align: right; }
.status-select {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 13px;
  background: #f8fafc; color: #334155; font-weight: 500; cursor: pointer;
}
.status-select:focus { outline: none; border-color: #3b82f6; }
.status-select:disabled { opacity: 0.6; cursor: not-allowed; }

/* Chi tiết đơn hàng mở rộng */
.row-detail td { background: #f8fafc; padding: 0; }
.detail-box { padding: 16px 20px; }
.detail-info { display: flex; gap: 24px; font-size: 13px; color: #475569; margin-bottom: 12px; flex-wrap: wrap; }
.detail-info strong { color: #334155; }

.inner-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.inner-table th { background: #eef2f7; font-size: 11px; padding: 8px 12px; text-transform: uppercase; color: #64748b; }
.inner-table td { padding: 8px 12px; font-size: 13px; border-top: 1px solid #f1f5f9; }

.empty-row { text-align: center !important; padding: 32px !important; color: #94a3b8 !important; }

/* Toast */
.toast-error {
  position: fixed; bottom: 24px; right: 24px; background-color: #ef4444; color: #fff;
  padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500;
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.25); z-index: 60;
}
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 20px; }
.pagination button { min-width: 32px; padding: 6px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; cursor: pointer; color: #334155; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; font-weight: bold; }
.page-info { margin-left: 12px; font-size: 14px; color: #64748b; }
</style>