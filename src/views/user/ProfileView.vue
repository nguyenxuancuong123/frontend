<template>
    <AppHeader></AppHeader>
  <div class="profile-container">
    <div class="profile-card">
      <div class="header">
        <div class="avatar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
            <path d="M12 14.5C6.99026 14.5 2.7661 17.705 1.25 22C2.7661 26.295 6.99026 29.5 12 29.5C17.0097 29.5 21.2339 26.295 22.75 22C21.2339 17.705 17.0097 14.5 12 14.5Z" fill="currentColor"/>
          </svg>
        </div>
        
        <h2>Hồ Sơ Cá Nhân</h2>
        <h3 class="account-name">Xin chào, {{ profile ? profile.hoTen : accountName }}</h3>

        <p class="role-badge" :class="{'admin': role === 'ADMIN', 'user': role === 'USER', 'employee': role === 'EMPLOYEE'}">
          {{ role === 'ADMIN' ? 'Quản Trị Viên' : role === 'EMPLOYEE' ? 'Nhân Viên' : 'Người Dùng' }}
        </p>
      </div>

      <div v-if="loading" class="loading">Đang tải dữ liệu hồ sơ...</div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="profile" class="content-section">
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ profile.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Số điện thoại</span>
          <span class="info-value">{{ profile.soDienThoai || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Địa chỉ</span>
          <span class="info-value">{{ profile.diaChi || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trạng thái</span>
          <span class="status-badge" :class="profile.trangThai ? 'active' : 'inactive'">
            {{ profile.trangThai ? 'Đang hoạt động' : 'Đã khóa' }}
          </span>
        </div>
      </div>

      <div class="logout-section">
          <button @click="logout" class="btn btn-logout">Đăng Xuất</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';
import { jwtDecode } from 'jwt-decode';
import { resetRouterState } from '@/router';
import notiService from '@/services/notiservice.js';

export default {
  name: 'Profile',

  components: {
    AppHeader
  },

  data() {
    return {
      role: 'USER',
      accountName: 'Bạn',
      profile: null,
      loading: true,
      error: null
    }
  },

  mounted() {
    this.checkProfileAndFetchData();
  },

  methods: {
    checkProfileAndFetchData() {
      const token = localStorage.getItem('jwt-token');
      
      if (!token) {
        this.$router.push({ name: 'Login' });
        return;
      }

      try {
        const decoded = jwtDecode(token);

        this.accountName = decoded.sub || decoded.email || decoded.username || 'Tài khoản của bạn';

        const userRoles = decoded.role || decoded.roles || decoded.vaiTro || decoded.authorities || [];

        const hasRole = (targetRole) => {
          if (Array.isArray(userRoles)) {
            return userRoles.some(r => {
              const roleStr = typeof r === 'object' ? (r.authority || r.role || '') : String(r);
              return roleStr.toUpperCase().includes(targetRole);
            });
          }
          return String(userRoles).toUpperCase().includes(targetRole);
        };

        if (hasRole('ADMIN')) {
          this.role = 'ADMIN';
        } else if (hasRole('EMPLOYEE')) {
          this.role = 'EMPLOYEE';
        } else {
          this.role = 'USER';
        }

        this.fetchProfileData();

      } catch (e) {
        console.error("Lỗi giải mã token:", e);
        this.role = 'USER';
        this.fetchProfileData();
      }
    },

    async fetchProfileData() {
      this.error = null;
      try {
        // API đúng: GET /api/v1/user/ (cho tất cả role, lấy thông tin người đang đăng nhập)
        const response = await api.get('/api/v1/user');
        this.profile = response.data;
      } catch (err) {
        console.error("Lỗi gọi API Profile:", err);
        this.error = err.response?.data?.message || err.message || "Lỗi lấy thông tin tài khoản";
      } finally {
        this.loading = false;
      }
    },

    formatDate(value) {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('vi-VN');
    },

    logout() {
      localStorage.removeItem("jwt-token");
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("user-info");
      resetRouterState();
      notiService.reset();
      this.$router.push({ name: 'Login' });
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.profile-container {
  min-height: calc(100vh - 80px); 
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  padding: 40px 20px;
}

.profile-card {
  background: white;
  width: 100%;
  max-width: 520px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
  transition: transform 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-5px);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.avatar {
  width: 96px;
  height: 96px;
  background: #f1f5f9;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #94a3b8;
  border: 4px solid #fff;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.avatar svg {
  width: 48px;
  height: 48px;
}

h2 {
  color: #64748b;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.account-name {
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
}

.role-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.user {
  background: #dbeafe;
  color: #2563eb;
}

.role-badge.employee {
  background: #fef3c7;
  color: #b45309;
}

.role-badge.admin {
  background: #fee2e2;
  color: #dc2626;
}

.content-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 32px;
  border: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #b91c1c;
}

.loading {
  color: #64748b;
  text-align: center;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.loading::after {
  content: "";
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #ef4444;
  text-align: center;
  background: #fef2f2;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #fecaca;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 32px;
}

.logout-section {
  text-align: center;
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

.btn-logout {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
}

.btn-logout:hover {
  background: #f1f5f9;
  color: #334155;
  border-color: #94a3b8;
}
</style>

