<template>
  <div class="ql-wrapper">
    <div class="ql-header">
      <div>
        <h3>Hồ sơ quản trị viên</h3>
        <p class="ql-sub">Thông tin tài khoản đang đăng nhập</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải hồ sơ...</div>

    <div v-else-if="error" class="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ error }}
    </div>

    <div v-else-if="profile" class="hoso-grid">
      <!-- Cột trái: avatar + tên + badge -->
      <div class="hoso-main">
        <div class="hoso-avatar">{{ initials }}</div>
        <h4 class="hoso-name">{{ profile.hoTen }}</h4>
        <span class="role-badge admin">Quản Trị Viên</span>
        <p class="hoso-email">{{ profile.email }}</p>
      </div>

      <!-- Cột phải: thông tin chi tiết -->
      <div class="hoso-details">
        <div class="info-row">
          <span class="info-label">Số điện thoại</span>
          <span class="info-value">{{ profile.soDienThoai || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Địa chỉ</span>
          <span class="info-value">{{ profile.diaChi || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày tạo tài khoản</span>
          <span class="info-value">{{ formatDate(profile.ngayTao) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trạng thái</span>
          <span class="badge" :class="profile.trangThai ? 'badge-active' : 'badge-locked'">
            {{ profile.trangThai ? 'Đang hoạt động' : 'Đã khóa' }}
          </span>
        </div>

        <button class="btn-logout-inline" @click="logout">Đăng xuất</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios';

export default {
  name: 'QuanLyHoSo',
  data() {
    return {
      profile: null,
      loading: true,
      error: null
    };
  },
  computed: {
    initials() {
      if (!this.profile?.hoTen) return '?';
      return this.profile.hoTen.trim().split(/\s+/).slice(-1)[0][0].toUpperCase();
    }
  },
  mounted() {
    this.fetchProfile();
  },
  methods: {
    async fetchProfile() {
      this.loading = true;
      this.error = null;
      try {
        // API đúng: GET /api/v1/user/ (lấy thông tin người dùng đang đăng nhập)
        const res = await api.get('/api/v1/user/');
        this.profile = res.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Không tải được hồ sơ.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(value) {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('vi-VN');
    },
    logout() {
      localStorage.removeItem('jwt-token');
      localStorage.removeItem('user-info');
      this.$router.push({ name: 'Login' });
    }
  }
};
</script>

<style scoped>
.ql-wrapper { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.ql-header { margin-bottom: 24px; }
.ql-header h3 { color: #1e293b; font-size: 18px; font-weight: 700; }
.ql-sub { color: #64748b; font-size: 13px; margin-top: 4px; }
.loading { display: flex; align-items: center; justify-content: center; height: 120px; color: #94a3b8; }
.error { display: flex; align-items: center; gap: 12px; background-color: #fef2f2; color: #ef4444; padding: 16px; border-radius: 12px; border: 1px solid #fecaca; font-weight: 500; }
.error svg { width: 24px; height: 24px; flex-shrink: 0; }
.hoso-grid { display: grid; grid-template-columns: 220px 1fr; gap: 32px; }
@media (max-width: 640px) { .hoso-grid { grid-template-columns: 1fr; } }
.hoso-main { text-align: center; padding: 24px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #f1f5f9; }
.hoso-avatar { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 14px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
.hoso-name { color: #0f172a; font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.role-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.role-badge.admin { background: #fee2e2; color: #dc2626; }
.hoso-email { color: #64748b; font-size: 13px; margin-top: 10px; word-break: break-all; }
.hoso-details { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.info-row:last-of-type { border-bottom: none; }
.info-label { font-size: 13px; color: #64748b; font-weight: 500; }
.info-value { font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.badge-active { background-color: #dcfce7; color: #16a34a; }
.badge-locked { background-color: #fee2e2; color: #dc2626; }
.btn-logout-inline { align-self: flex-start; margin-top: 20px; background: transparent; color: #64748b; border: 1px solid #cbd5e1; padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
.btn-logout-inline:hover { background: #f1f5f9; color: #334155; border-color: #94a3b8; }
</style>

