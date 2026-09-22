<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="logo">
        <h2>Admin<span>Panel</span></h2>
      </div>
      <ul class="nav-menu">
        <li :class="{ active: currentView === 'dashboard' }" @click="currentView = 'dashboard'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
          Dashboard
        </li>
        <li :class="{ active: currentView === 'users' }" @click="currentView = 'users'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Quản lý người dùng
        </li>
        <li :class="{ active: currentView === 'products' }" @click="currentView = 'products'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Quản lý sản phẩm
        </li>
        <li :class="{ active: currentView === 'orders' }" @click="currentView = 'orders'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Quản lý đơn hàng
        </li>
        <li :class="{ active: currentView === 'categories' }" @click="currentView = 'categories'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Quản lý danh mục
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <h2>{{ pageTitle }}</h2>
          <p class="topbar-date">{{ currentDate }}</p>
        </div>
        <div class="topbar-right">
          <div class="admin-badge" @click="currentView = 'profile'" style="cursor:pointer">
            <div class="avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
      </header>

      <div class="content-wrapper">
        <!-- DASHBOARD HOME -->
        <template v-if="currentView === 'dashboard'">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card blue">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-value">{{ stats.totalUsers }}</h3>
                <p class="stat-label"> Tài khoản người dùng</p>
              </div>
            </div>
            <div class="stat-card green">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-value">{{ stats.totalProducts }}</h3>
                <p class="stat-label">Sản phẩm</p>
              </div>
            </div>
            <div class="stat-card orange">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-value">{{ stats.totalOrders }}</h3>
                <p class="stat-label">Đơn hàng</p>
              </div>
            </div>
            <div class="stat-card purple">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-value">{{ stats.totalCategories }}</h3>
                <p class="stat-label">Danh mục</p>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="charts-row">
            <!-- Order Status Chart -->
            <div class="chart-card">
              <div class="chart-header"><h4>Trạng thái đơn hàng</h4></div>
              <div v-if="statsLoading" class="chart-loading">Đang tải...</div>
              <div v-else class="donut-wrapper">
                <div class="donut-chart" :style="donutStyle"></div>
                <div class="donut-legend">
                  <div v-for="item in orderStatusData" :key="item.label" class="legend-item">
                    <span class="legend-dot" :style="{ background: item.color }"></span>
                    <span class="legend-label">{{ item.label }}</span>
                    <span class="legend-val">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bar Chart -->
            <div class="chart-card">
              <div class="chart-header"><h4>Sản phẩm theo danh mục</h4></div>
              <div v-if="statsLoading" class="chart-loading">Đang tải...</div>
              <div v-else class="bar-chart">
                <div v-for="item in categoryData" :key="item.label" class="bar-row">
                  <span class="bar-label">{{ item.label }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: item.pct + '%', background: item.color }"></div>
                  </div>
                  <span class="bar-count">{{ item.value }}</span>
                </div>
                <div v-if="categoryData.length === 0" class="empty-chart">Không có dữ liệu</div>
              </div>
            </div>
          </div>

          <!-- Recent Orders Table -->
          <div class="recent-card">
            <div class="recent-header">
              <h4>Đơn hàng gần đây</h4>
              <button class="btn-link" @click="currentView = 'orders'">Xem tất cả →</button>
            </div>
            <div v-if="statsLoading" class="chart-loading">Đang tải...</div>
            <table v-else class="recent-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.maDonHang">
                  <td class="fw-bold">{{ order.maDonHang }}</td>
                  <td>{{ order.tenNguoiNhan }}</td>
                  <td class="price-col">{{ formatPrice(order.tongTien) }}</td>
                  <td><span :class="['status-badge', getStatusClass(order.trangThai)]">{{ order.trangThai || 'Chờ duyệt' }}</span></td>
                </tr>
                <tr v-if="recentOrders.length === 0">
                  <td colspan="4" class="empty-row">Chưa có đơn hàng</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- Other Views -->
        <QuanLyNguoiDung v-else-if="currentView === 'users'" />
        <QuanLySanPham   v-else-if="currentView === 'products'" />
        <QuanLyDonHang   v-else-if="currentView === 'orders'" />
        <QuanLyDanhMuc   v-else-if="currentView === 'categories'" />
        <QuanLyHoSo      v-else-if="currentView === 'profile'" />
      </div>
    </div>

    <!-- Icon chat nổi -->
    <ChatWidget mode="staff" />
  </div>
</template>

<script>
import api from '@/axios';
import ChatWidget      from '@/components/admin/ChatWidget.vue';
import QuanLyNguoiDung from '@/components/admin/QuanLyNguoiDung.vue';
import QuanLySanPham   from '@/components/admin/QuanLySanPham.vue';
import QuanLyDonHang   from '@/components/admin/QuanLyDonHang.vue';
import QuanLyDanhMuc   from '@/components/admin/QuanLyDanhMuc.vue';
import QuanLyHoSo      from '@/components/admin/QuanLyHoSo.vue';
import { resetRouterState } from '@/router';

const PALETTE = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default {
  name: 'Dashboard',
  components: { QuanLyNguoiDung, QuanLySanPham, QuanLyDonHang, QuanLyDanhMuc, QuanLyHoSo, ChatWidget },
  data() {
    return {
      currentView: 'dashboard',
      statsLoading: true,
      stats: { totalUsers: 0, totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalCategories: 0 },
      orderStatusData: [],
      categoryData: [],
      recentOrders: [],
      currentDate: new Date().toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    };
  },
  computed: {
    pageTitle() {
      const map = { dashboard:'Tổng quan', users:'Quản lý người dùng', products:'Quản lý sản phẩm', orders:'Quản lý đơn hàng', categories:'Quản lý danh mục', profile:'Hồ sơ quản trị viên' };
      return map[this.currentView] || 'Dashboard';
    },
    donutStyle() {
      if (!this.orderStatusData.length) return {};
      const total = this.orderStatusData.reduce((s, i) => s + i.value, 0) || 1;
      let deg = 0;
      const segments = this.orderStatusData.map(i => {
        const pct = (i.value / total) * 360;
        const seg = `${i.color} ${deg}deg ${deg + pct}deg`;
        deg += pct;
        return seg;
      });
      return { background: `conic-gradient(${segments.join(',')})` };
    }
  },
  mounted() { this.loadStats(); },
  methods: {
    async loadStats() {
      this.statsLoading = true;
      try {
        const [usersRes, productsRes, ordersRes, catsRes] = await Promise.all([
          // API đúng: GET /api/v1/admin/user
          api.get('/api/v1/admin/user'),
          // API đúng: GET /api/v1/admin/product/listproduct
          api.get('/api/v1/admin/product/listproduct'),
          // API đúng: GET /api/v1/admin/order/list
          api.get('/api/v1/admin/order/list'),
          // API đúng: GET /api/v1/admin/category/listcategory
          api.get('/api/v1/admin/category/listcategory')
        ]);
        const users    = usersRes.data;
        const products = productsRes.data;
        const orders   = ordersRes.data;
        const cats     = catsRes.data;

        this.stats = {
          totalUsers:      users.length,
          totalProducts:   products.length,
          totalOrders:     orders.length,
          pendingOrders:   orders.filter(o => !o.trangThai || o.trangThai === 'Chờ duyệt').length,
          totalCategories: cats.length
        };

        // Order status donut
        const statusMap = {};
        orders.forEach(o => {
          const s = o.trangThai || 'Chờ duyệt';
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const statusColors = { 'Chờ duyệt':'#f59e0b','Đã duyệt':'#3b82f6','Đang giao':'#06b6d4','Hoàn thành':'#10b981','Hủy':'#ef4444' };
        this.orderStatusData = Object.entries(statusMap).map(([label, value]) => ({
          label, value, color: statusColors[label] || '#8b5cf6'
        }));

        // Category bar chart
        const catCount = {};
        products.forEach(p => {
          const name = p.danhMuc?.tenDM || 'Khác';
          catCount[name] = (catCount[name] || 0) + 1;
        });
        const max = Math.max(...Object.values(catCount), 1);
        this.categoryData = Object.entries(catCount)
          .sort((a,b) => b[1]-a[1])
          .slice(0, 6)
          .map(([label, value], i) => ({ label, value, pct: Math.round((value/max)*100), color: PALETTE[i % PALETTE.length] }));

        // Recent 5 orders
        this.recentOrders = [...orders].sort((a,b) => b.maDonHang - a.maDonHang).slice(0, 5);
      } catch (err) {
        console.error('Lỗi load stats:', err);
      } finally {
        this.statsLoading = false;
      }
    },
    formatPrice(price) {
      if (!price) return '0 ₫';
      return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(price);
    },
    getStatusClass(status) {
      return { 'Chờ duyệt':'badge-warning','Đã duyệt':'badge-info','Đang giao':'badge-primary','Hoàn thành':'badge-success','Hủy':'badge-danger' }[status] || 'badge-secondary';
    },
    logout() {
      localStorage.removeItem('jwt-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('user-info');
      resetRouterState();
      this.$router.push({ name: 'Login' });
    }
  }
};
</script>

<style scoped>
*{ box-sizing: border-box; margin:0; padding:0; font-family:'Inter',system-ui,sans-serif; }
.dashboard-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; background: #f1f5f9; }
.sidebar { width: 240px; height: 100vh; background: #0f172a; color: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
.logo { padding:24px 20px; border-bottom:1px solid #1e293b; }
.logo h2 { font-size:22px; font-weight:700; } .logo span { color:#3b82f6; }
.nav-menu { list-style:none; padding:16px 0; flex:1; overflow-y:auto; }
.nav-menu li { padding:13px 20px; display:flex; align-items:center; gap:10px; color:#94a3b8; cursor:pointer; font-size:14px; font-weight:500; border-left:3px solid transparent; transition:.2s; }
.nav-menu li svg { width:18px; height:18px; flex-shrink:0; }
.nav-menu li:hover { background:#1e293b; color:#fff; }
.nav-menu li.active { background:#1e3a5f; color:#60a5fa; border-left-color:#3b82f6; }
.main-content { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.topbar { background:#fff; height:68px; display:flex; justify-content:space-between; align-items:center; padding:0 28px; box-shadow:0 1px 3px rgba(0,0,0,0.06); flex-shrink:0; }
.topbar h2 { font-size:18px; color:#1e293b; font-weight:700; }
.topbar-date { font-size:12px; color:#94a3b8; margin-top:2px; }
.admin-badge { display:flex; align-items:center; gap:10px; }
.avatar { width:36px; height:36px; background:#3b82f6; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; }
.admin-badge span { font-size:14px; font-weight:600; color:#334155; }
.content-wrapper { padding:24px; flex:1; overflow-y:auto; }
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.stat-card { background:#fff; border-radius:14px; padding:20px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 8px rgba(0,0,0,0.06); border-left:4px solid; }
.stat-card.blue { border-color:#3b82f6; } .stat-card.green { border-color:#10b981; } .stat-card.orange { border-color:#f59e0b; } .stat-card.purple { border-color:#8b5cf6; }
.stat-icon { width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.stat-icon svg { width:24px; height:24px; }
.stat-card.blue .stat-icon { background:#eff6ff; color:#3b82f6; }
.stat-card.green .stat-icon { background:#f0fdf4; color:#10b981; }
.stat-card.orange .stat-icon { background:#fffbeb; color:#f59e0b; }
.stat-card.purple .stat-icon { background:#f5f3ff; color:#8b5cf6; }
.stat-label { font-size:12px; color:#94a3b8; font-weight:500; margin-bottom:4px; }
.stat-value { font-size:28px; font-weight:800; color:#1e293b; }
.charts-row { display:grid; grid-template-columns:1fr 1.4fr; gap:16px; margin-bottom:20px; }
.chart-card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
.chart-header { margin-bottom:16px; } .chart-header h4 { font-size:15px; color:#1e293b; font-weight:700; }
.chart-loading { display:flex; align-items:center; justify-content:center; height:120px; color:#94a3b8; font-size:14px; }
.donut-wrapper { display:flex; align-items:center; gap:20px; }
.donut-chart { width:120px; height:120px; border-radius:50%; flex-shrink:0; }
.donut-legend { flex:1; }
.legend-item { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:13px; }
.legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.legend-label { flex:1; color:#475569; }
.legend-val { font-weight:700; color:#1e293b; }
.bar-chart { display:flex; flex-direction:column; gap:10px; }
.bar-row { display:flex; align-items:center; gap:8px; }
.bar-label { font-size:12px; color:#64748b; width:100px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; flex-shrink:0; }
.bar-track { flex:1; height:10px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
.bar-fill { height:100%; border-radius:99px; transition:width .6s ease; }
.bar-count { font-size:12px; font-weight:700; color:#1e293b; width:24px; text-align:right; }
.empty-chart { text-align:center; color:#94a3b8; font-size:14px; padding:20px; }
.recent-card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
.recent-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.recent-header h4 { font-size:15px; color:#1e293b; font-weight:700; }
.btn-link { background:none; border:none; color:#3b82f6; font-size:13px; font-weight:600; cursor:pointer; }
.btn-link:hover { text-decoration:underline; }
.recent-table { width:100%; border-collapse:collapse; font-size:14px; }
.recent-table th { padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; border-bottom:2px solid #f1f5f9; }
.recent-table td { padding:12px; border-bottom:1px solid #f8fafc; color:#334155; }
.fw-bold { font-weight:700; color:#1e293b; }
.price-col { font-weight:600; color:#ef4444; }
.empty-row { text-align:center; color:#94a3b8; padding:24px; }
.status-badge { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.badge-warning  { background:#fef3c7; color:#d97706; }
.badge-info     { background:#e0f2fe; color:#0284c7; }
.badge-primary  { background:#dbeafe; color:#2563eb; }
.badge-success  { background:#dcfce7; color:#16a34a; }
.badge-danger   { background:#fee2e2; color:#dc2626; }
.badge-secondary{ background:#f1f5f9; color:#475569; }
</style>

