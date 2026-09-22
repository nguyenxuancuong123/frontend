<template>
    <AppHeader></AppHeader>
    <div class="order-detail-wrapper">
        <h1>Chi tiết đơn hàng</h1>

        <div v-if="loading" class="loading-text">Đang tải đơn hàng...</div>

        <div v-else-if="error" class="message-box error">{{ error }}</div>

        <div v-else-if="donHang" class="order-card">
            <div class="order-header">
                <div>
                    <span class="label">Mã đơn hàng</span>
                    <span class="value">{{ donHang.maDonHang }}</span>
                </div>
                <div>
                    <span class="label">Trạng thái</span>
                    <span class="status-badge" :class="trangThaiClass">{{ donHang.trangThai }}</span>
                </div>
            </div>

            <div class="order-info">
                <div class="info-row">
                    <span class="label">Ngày đặt</span>
                    <span>{{ formatDate(donHang.ngayDat) }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Người nhận</span>
                    <span>{{ donHang.tenNguoiNhan }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Số điện thoại</span>
                    <span>{{ donHang.soDienThoaiNhan }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Địa chỉ giao hàng</span>
                    <span>{{ donHang.diaChiGiaoHang }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Phương thức thanh toán</span>
                    <span>{{ donHang.phuongThucThanhToan }}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Hình ảnh</th>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="ct in donHang.chiTiet" :key="ct.maBienThe">
                        <td>
                            <img :src="'http://localhost:8080/images/' + ct.hinhAnh" alt="" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />
                        </td>
                        <td class="item-name">
                            {{ ct.tenSP }}
                            <span v-if="ct.size || ct.tenMau" class="item-variant">
                                ({{ ct.size }}{{ ct.size && ct.tenMau ? ' / ' : '' }}{{ ct.tenMau }})
                            </span>
                        </td>
                        <td>{{ formatCurrency(ct.donGia) }}</td>
                        <td>{{ ct.soLuong }}</td>
                        <td class="item-total">{{ formatCurrency(ct.thanhTien) }}</td>
                    </tr>
                </tbody>
            </table>
                                                                                                                                                                                                                                                                    
            <div class="order-total">
                <span>Tổng cộng:</span>
                <strong>{{ formatCurrency(donHang.tongTien) }}</strong>
            </div>
        </div>
    </div>
</template>

<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    components: { AppHeader },
    data() {
        return {
            donHang: null,
            loading: true,
            error: '',
        }
    },
    computed: {
        trangThaiClass() {
            const map = {
                'Chờ duyệt': 'status-pending',
                'Đang giao': 'status-shipping',
                'Hoàn thành': 'status-done',
                'Hủy': 'status-cancelled',
            };
            return map[this.donHang?.trangThai] || 'status-pending';
        }
    },
    async mounted() {
        await this.loadDonHang();
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
        async loadDonHang() {
            const maDonHang = this.$route.params.id;
            this.loading = true;
            this.error = '';
            try {
                // API đúng: GET /api/v1/order/{madh}
                const result = await api.get(`/api/v1/order/${maDonHang}`);
                this.donHang = result.data;
            } catch (err) {
                this.error = err.response?.data?.message || 'Không tìm thấy đơn hàng.';
            } finally {
                this.loading = false;
            }
        },
    },
    name: 'ChiTietDonHang'
}
</script>

<style scoped>
.order-detail-wrapper {
    max-width: 800px;
    margin: 30px auto;
    padding: 0 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
}

h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 24px;
}

.loading-text {
    text-align: center;
    color: #888;
    padding: 40px 0;
}

.message-box {
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
}
.message-box.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.order-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.09);
    padding: 28px;
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 2px solid #eee;
    margin-bottom: 16px;
}
.order-header .label { display: block; font-size: 0.8rem; color: #888; }
.order-header .value { font-size: 1.2rem; font-weight: 700; color: #2c3e50; }

.status-badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
}
.status-pending   { background: #fff3cd; color: #856404; }
.status-shipping  { background: #cce5ff; color: #004085; }
.status-done      { background: #d4edda; color: #155724; }
.status-cancelled { background: #f8d7da; color: #721c24; }

.order-info { margin-bottom: 20px; }
.info-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 0.95rem;
    color: #444;
}
.info-row .label { color: #888; }

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
}
th { background: #f0f4f8; color: #555; padding: 10px; font-size: 0.85rem; text-align: center; }
td { padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 0.95rem; }
.item-name { text-align: left; font-weight: 500; }
.item-variant { color: #888; font-weight: 400; font-size: 0.85rem; }
.item-total { color: #e74c3c; font-weight: 600; }

.order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 2px solid #eee;
    font-size: 1.1rem;
    color: #2c3e50;
}
.order-total strong { color: #e74c3c; font-size: 1.4rem; }
</style>

