<template>
    <AppHeader></AppHeader>
    <div class="orders-wrapper">
        <h1>Đơn hàng của tôi</h1>

        <div v-if="loading" class="loading-text">Đang tải danh sách đơn hàng...</div>

        <div v-else-if="orders.length === 0" class="empty-state">
            <p>Bạn chưa có đơn hàng nào.</p>
            <router-link to="/">Tiếp tục mua sắm</router-link>
        </div>

        <table v-else>
            <thead>
                <tr>
                    <th>Mã đơn</th>
                    <th>Ngày đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="dh in orders" :key="dh.maDonHang">
                    <td>{{ dh.maDonHang }}</td>
                    <td>{{ formatDate(dh.ngayDat) }}</td>
                    <td>{{ formatCurrency(dh.tongTien) }}</td>
                    <td><span class="status-badge" :class="trangThaiClass(dh.trangThai)">{{ dh.trangThai }}</span></td>
                    <td>
                        <router-link :to="{ name: 'ChiTietDonHang', params: { id: dh.maDonHang } }">
                            <button>Xem chi tiết</button>
                        </router-link>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    components: { AppHeader },
    data() {
        return {
            orders: [],
            loading: true,
        }
    },
    async mounted() {
        try {
            // API đúng: GET /api/v1/order/
            const result = await api.get('/api/v1/order');
            this.orders = result.data;
        } catch (err) {
            console.error('Lỗi tải danh sách đơn hàng.', err);
            alert(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
        } finally {
            this.loading = false;
        }
    },
    methods: {
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },
        formatDate(value) {
            if (!value) return '';
            return new Date(value).toLocaleString('vi-VN');
        },
        trangThaiClass(trangThai) {
            const map = {
                'Chờ duyệt': 'status-pending',
                'Đang giao': 'status-shipping',
                'Hoàn thành': 'status-done',
                'Hủy': 'status-cancelled',
            };
            return map[trangThai] || 'status-pending';
        }
    },
    name: 'DonHang',
}
</script>

<style scoped>
.orders-wrapper {
    max-width: 900px;
    margin: 30px auto;
    padding: 0 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
}
h1 { text-align: center; color: #2c3e50; margin-bottom: 20px; }
.loading-text, .empty-state { text-align: center; color: #888; padding: 40px 0; }
.empty-state a { color: #3498db; }

table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    overflow: hidden;
}
thead tr { background: #2c3e50; color: #fff; }
th, td { padding: 12px 16px; text-align: center; }
tbody tr { border-bottom: 1px solid #eee; }
tbody tr:hover { background: #f8f9fa; }

.status-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
}
.status-pending   { background: #fff3cd; color: #856404; }
.status-shipping  { background: #cce5ff; color: #004085; }
.status-done      { background: #d4edda; color: #155724; }
.status-cancelled { background: #f8d7da; color: #721c24; }
</style>

