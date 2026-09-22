<template>
  <div class="qlnd-wrapper">
    <!-- Header cố định -->
    <div class="qlnd-header">
      <div>
        <h3>Quản lý người dùng</h3>
        <p class="qlnd-sub">{{ filteredUsers.length }} / {{ users.length }} người dùng</p>
      </div>
      <div class="qlnd-toolbar">
        <input
          v-model="searchText"
          type="text"
          class="qlnd-search"
          placeholder="Tìm theo tên hoặc email..."
        />
        <select v-model="roleFilter" class="qlnd-filter">
          <option value="">Tất cả vai trò</option>
          <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
        </select>
        <select v-model="statusFilter" class="qlnd-filter">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
      </div>
    </div>

    <!-- Thanh Mini Stats -->
    <div class="mini-stats">
      <div class="mini-stat">
        <span class="mini-label">Tổng người dùng</span>
        <span class="mini-value">{{ users.length }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Hoạt động</span>
        <span class="mini-value success">{{ countActive }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Đã khóa</span>
        <span class="mini-value danger">{{ countLocked }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Quản trị viên</span>
        <span class="mini-value primary">{{ countAdmin }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải danh sách người dùng...</div>

    <div v-else-if="error" class="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ error }}
    </div>

    <!-- Khung bảng dữ liệu cuộn độc lập -->
    <div v-else class="table-wrapper">
      <table class="user-table">
        <thead>
          <tr>
            <th class="col-stt">STT</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th class="col-action">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id" class="row-main">
            <td class="col-stt">{{ index + 1 }}</td>
            <td class="cell-name">{{ user.hoTen }}</td>
            <td class="cell-email">{{ user.email }}</td>
            <td>{{ user.soDienThoai || '—' }}</td>
            <td>
              <select
                class="role-select"
                :value="user.vaiTro"
                :disabled="updatingId === user.id"
                @change="onChangeRole(user, $event.target.value)"
              >
                <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td>
              <span :class="['badge', user.trangThai ? 'badge-active' : 'badge-locked']">
                {{ user.trangThai ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td class="col-action">
              <button
                class="btn-action btn-view"
                @click="openDetail(user)"
              >Xem</button>
              <button
                class="btn-action"
                :class="user.trangThai ? 'btn-lock' : 'btn-unlock'"
                :disabled="updatingId === user.id"
                @click="onToggleStatus(user)"
              >{{ updatingId === user.id ? '...' : (user.trangThai ? 'Khóa' : 'Mở khóa') }}</button>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-row">Không tìm thấy người dùng phù hợp</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Chi tiết Người dùng dạng Bảng Cấu trúc Rõ ràng -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <h4>Thông tin người dùng</h4>
            <span class="modal-subtitle">ID Tài khoản: #{{ selectedUser.id }}</span>
          </div>
          <button class="modal-close" @click="closeDetail">&times;</button>
        </div>
        <div class="modal-body">
          <table class="detail-info-table">
            <tbody>
              <tr>
                <td class="info-label">Họ và tên</td>
                <td class="info-value font-bold">{{ selectedUser.hoTen }}</td>
              </tr>
              <tr>
                <td class="info-label">Email</td>
                <td class="info-value">{{ selectedUser.email }}</td>
              </tr>
              <tr>
                <td class="info-label">Số điện thoại</td>
                <td class="info-value">{{ selectedUser.soDienThoai || 'Chưa cập nhật' }}</td>
              </tr>
              <tr>
                <td class="info-label">Địa chỉ</td>
                <td class="info-value">{{ selectedUser.diaChi || 'Chưa cập nhật' }}</td>
              </tr>
              <tr>
                <td class="info-label">Vai trò hệ thống</td>
                <td class="info-value">
                  <span class="role-tag">{{ selectedUser.vaiTro }}</span>
                </td>
              </tr>
              <tr>
                <td class="info-label">Trạng thái</td>
                <td class="info-value">
                  <span :class="['badge', selectedUser.trangThai ? 'badge-active' : 'badge-locked']">
                    {{ selectedUser.trangThai ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn-close-modal" @click="closeDetail">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Toast lỗi thao tác -->
    <div v-if="actionError" class="toast-error">{{ actionError }}</div>
  </div>
</template>

<script>
import api from '@/axios';

export default {
  name: 'QuanLyNguoiDung',
  data() {
    return {
      users: [],
      loading: true,
      error: null,
      searchText: '',
      roleFilter: '',
      statusFilter: '',
      updatingId: null,
      selectedUser: null,
      actionError: null,
      roleOptions: ['Admin', 'Employee', 'User']
    };
  },
  computed: {
    filteredUsers() {
      const kw = this.searchText.trim().toLowerCase();
      return this.users.filter((u) => {
        const matchKw =
          !kw ||
          (u.hoTen || '').toLowerCase().includes(kw) ||
          (u.email || '').toLowerCase().includes(kw);
        const matchRole = !this.roleFilter || u.vaiTro === this.roleFilter;
        const matchStatus =
          !this.statusFilter ||
          (this.statusFilter === 'active' ? u.trangThai : !u.trangThai);
        return matchKw && matchRole && matchStatus;
      });
    },
    countActive() {
      return this.users.filter(u => u.trangThai).length;
    },
    countLocked() {
      return this.users.filter(u => !u.trangThai).length;
    },
    countAdmin() {
      return this.users.filter(u => u.vaiTro === 'Admin').length;
    }
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get('/api/v1/admin/user');
        this.users = res.data;
      } catch (err) {
        console.error('Lỗi tải danh sách người dùng:', err);
        this.error =
          err.response?.data?.message || err.message || 'Không thể tải danh sách người dùng.';
      } finally {
        this.loading = false;
      }
    },

    async onChangeRole(user, newRole) {
      if (newRole === user.vaiTro) return;
      const oldRole = user.vaiTro;
      this.updatingId = user.id;
      this.actionError = null;
      try {
        const res = await api.put(`/api/v1/admin/user/${user.id}/role`, {
          vaiTro: newRole
        });
        Object.assign(user, res.data);
      } catch (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        user.vaiTro = oldRole;
        this.showActionError(err, 'Cập nhật vai trò thất bại.');
      } finally {
        this.updatingId = null;
      }
    },

    async onToggleStatus(user) {
      const newStatus = !user.trangThai;
      const action = newStatus ? 'mở khóa' : 'khóa';
      if (!window.confirm(`Xác nhận ${action} tài khoản "${user.hoTen}"?`)) return;

      this.updatingId = user.id;
      this.actionError = null;
      try {
        const res = await api.put(`/api/v1/admin/user/${user.id}/status`, {
          trangThai: newStatus
        });
        Object.assign(user, res.data);
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        this.showActionError(err, 'Cập nhật trạng thái thất bại.');
      } finally {
        this.updatingId = null;
      }
    },

    showActionError(err, fallback) {
      this.actionError = err.response?.data?.message || fallback;
      setTimeout(() => {
        this.actionError = null;
      }, 3500);
    },

    openDetail(user) {
      this.selectedUser = user;
    },
    closeDetail() {
      this.selectedUser = null;
    }
  }
};
</script>

<style scoped>
/* Khung giao diện chính cố định */
.qlnd-wrapper {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header & Toolbar cố định */
.qlnd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.qlnd-header h3 { color: #1e293b; font-size: 18px; font-weight: 700; }
.qlnd-sub { color: #64748b; font-size: 13px; margin-top: 4px; }

.qlnd-toolbar { display: flex; gap: 10px; flex-wrap: wrap; }
.qlnd-search, .qlnd-filter {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px;
  font-size: 14px; color: #334155; background: #f8fafc;
}
.qlnd-search { min-width: 220px; }
.qlnd-search:focus, .qlnd-filter:focus { outline: none; border-color: #3b82f6; background: #fff; }

/* Mini Stats */
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
.mini-value.danger { color: #dc2626; }
.mini-value.primary { color: #2563eb; }
.mini-value.success { color: #16a34a; }

.loading { display: flex; align-items: center; justify-content: center; height: 120px; color: #64748b; font-weight: 500; }

.error {
  display: flex; align-items: center; gap: 12px; background-color: #fef2f2;
  color: #ef4444; padding: 16px; border-radius: 12px; border: 1px solid #fecaca; font-weight: 500;
}
.error svg { width: 24px; height: 24px; flex-shrink: 0; }

/* Khung cuộn độc lập cho bảng */
.table-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

.user-table { width: 100%; border-collapse: collapse; font-size: 14px; }

/* Ghim cố định tiêu đề cột khi cuộn */
.user-table th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  text-align: left;
  padding: 12px 14px;
  color: #64748b;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 2px solid #f1f5f9;
}

.user-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
.row-main:hover { background: #f8fafc; }

.col-stt { width: 50px; text-align: center; color: #94a3b8; }
.cell-name { font-weight: 600; color: #1e293b; }
.cell-email { color: #475569; }
.col-action { white-space: nowrap; text-align: right; }

.role-select {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 13px;
  background: #f8fafc; color: #334155; font-weight: 500; cursor: pointer;
}
.role-select:focus { outline: none; border-color: #3b82f6; }

.badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-active { background-color: #dcfce7; color: #16a34a; }
.badge-locked { background-color: #fee2e2; color: #dc2626; }

.btn-action {
  border: none; border-radius: 6px; padding: 6px 12px; font-size: 13px;
  font-weight: 600; cursor: pointer; margin-left: 6px; transition: all 0.15s;
}
.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-view { background-color: #eff6ff; color: #3b82f6; }
.btn-view:hover { background-color: #dbeafe; }
.btn-lock { background-color: #fef2f2; color: #ef4444; }
.btn-lock:hover { background-color: #fee2e2; }
.btn-unlock { background-color: #f0fdf4; color: #16a34a; }
.btn-unlock:hover { background-color: #dcfce7; }

.empty-row { text-align: center !important; padding: 32px !important; color: #94a3b8 !important; }

/* Modal chi tiết hiển thị dạng Bảng rõ ràng */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 50;
}

.modal-box {
  background: #fff; border-radius: 16px; width: 100%; max-width: 500px;
  padding: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;
}

.modal-header h4 { color: #1e293b; font-size: 17px; font-weight: 700; }
.modal-subtitle { font-size: 12px; color: #94a3b8; }

.modal-close {
  border: none; background: none; font-size: 22px; line-height: 1;
  color: #94a3b8; cursor: pointer;
}
.modal-close:hover { color: #1e293b; }

/* Bảng chi tiết thông tin trong Modal */
.detail-info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.detail-info-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.info-label { width: 38%; color: #64748b; font-weight: 500; background: #f8fafc; }
.info-value { color: #1e293b; word-break: break-word; }
.font-bold { font-weight: 600; }

.role-tag {
  background: #e0f2fe; color: #0369a1; padding: 3px 10px;
  border-radius: 6px; font-size: 12px; font-weight: 600;
}

.modal-footer { display: flex; justify-content: flex-end; }
.btn-close-modal {
  background: #f1f5f9; border: none; padding: 8px 18px; border-radius: 8px;
  color: #475569; font-weight: 600; cursor: pointer;
}
.btn-close-modal:hover { background: #e2e8f0; }

/* Toast */
.toast-error {
  position: fixed; bottom: 24px; right: 24px; background-color: #ef4444; color: #fff;
  padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500;
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.25); z-index: 60;
}
</style>