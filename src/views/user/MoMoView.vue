<template>
    <AppHeader></AppHeader>
    <div class="momo-return-wrapper">
        <div v-if="checking" class="status-card checking">
            <div class="spinner"></div>
            <h2>Đang xác nhận thanh toán...</h2>
            <p>Vui lòng chờ trong giây lát.</p>
        </div>

        <div v-else-if="resultCode === '0'" class="status-card success">
            <div class="icon">✅</div>
            <h2>Thanh toán MoMo thành công!</h2>
            <p v-if="donHang">Đơn hàng <strong>{{ donHang.maDonHang }}</strong> — trạng thái hiện tại: <strong>{{ donHang.trangThai }}</strong></p>
            <p v-else class="note">
                Giao dịch MoMo báo thành công, nhưng hệ thống chưa cập nhật trạng thái đơn hàng.
                Việc này thường mất vài giây do server xử lý xác nhận (IPN) không đồng bộ — thử bấm nút bên dưới.
            </p>
            <div class="actions">
                <button @click="retryCheck" v-if="!donHang">🔄 Kiểm tra lại</button>
                <button class="primary" @click="xemDonHang" v-if="maDonHang">📦 Xem đơn hàng của bạn</button>
                <router-link to="/" class="btn-home">🏠 Về trang chủ</router-link>
            </div>
        </div>

        <div v-else class="status-card failed">
            <div class="icon">❌</div>
            <h2>Thanh toán không thành công</h2>
            <p>{{ message || 'Giao dịch đã bị hủy hoặc thất bại.' }}</p>
            <div class="actions">
                <router-link to="/GioHang" class="btn-home">🛒 Về giỏ hàng</router-link>
                <router-link to="/" class="btn-home">🏠 Về trang chủ</router-link>
            </div>
        </div>
    </div>
</template>

<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    name: 'MoMo',
    components: { AppHeader },
    data() {
        return {
            checking: true,
            resultCode: null,
            message: '',
            maDonHang: null,
            donHang: null,
        }
    },
    async mounted() {
        const q = this.$route.query;
        this.resultCode = q.resultCode;
        this.message = q.message;

        // orderId là mã giao dịch nội bộ của MoMo (partnerCode + timestamp), KHÔNG phải mã đơn
        // hàng của mình. Mã đơn hàng thật (madh) được backend tự gắn vào redirectUrl lúc tạo
        // thanh toán (xem MomoPaymentServiceImpl.createPayment), nên đọc từ query "madh".
        this.maDonHang = q.madh;

        await this.checkOrderStatus();
    },
    methods: {
        // API đúng: GET /api/v1/donhang/{madh}
        async checkOrderStatus() {
            this.checking = true;
            if (this.maDonHang) {
                try {
                    const result = await api.get(`/api/v1/order/${this.maDonHang}`);
                    this.donHang = result.data;
                } catch (err) {
                    this.donHang = null;
                }
            }
            this.checking = false;
        },
        async retryCheck() {
            await this.checkOrderStatus();
        },
        xemDonHang() {
            this.$router.push({ name: 'ChiTietDonHang', params: { id: this.maDonHang } });
        }
    }
}
</script>

<style scoped>
.momo-return-wrapper {
    max-width: 480px;
    margin: 60px auto;
    padding: 0 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
}

.status-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    padding: 40px 32px;
    text-align: center;
}

.icon { font-size: 3.5rem; margin-bottom: 12px; }

h2 { color: #2c3e50; margin-bottom: 12px; }

p { color: #666; margin-bottom: 6px; }
.note { font-size: 0.9rem; color: #888; }

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #eee;
    border-top-color: #d82d8b;
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.actions button,
.actions .btn-home {
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    background: #f1f1f1;
    color: #333;
    transition: all 0.2s;
}
.actions .primary {
    background: linear-gradient(135deg, #27ae60, #1e8449);
    color: #fff;
}
.actions button:hover,
.actions .btn-home:hover {
    filter: brightness(0.95);
}
</style>

