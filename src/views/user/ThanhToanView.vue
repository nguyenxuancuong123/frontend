<template>
    <AppHeader></AppHeader>
    <div class="checkout-wrapper">
        <h1>💳 Xác nhận & Thanh toán</h1>

        <!-- Thông báo kết quả -->
        <div v-if="message" :class="['message-box', messageType]">{{ message }}</div>

        <!-- Form thông tin giao hàng -->
        <div class="checkout-layout">
            <!-- Cột trái: thông tin người nhận -->
            <div class="shipping-form card">
                <h2>📦 Thông tin giao hàng</h2>
                <div class="form-group">
                    <label>Họ và tên *</label>
                    <input v-model="form.hoTen" type="text" placeholder="Nhập họ và tên" />
                </div>
                <div class="form-group">
                    <label>Số điện thoại *</label>
                    <input v-model="form.sdt" type="text" placeholder="Nhập số điện thoại" />
                </div>
                <div class="form-group">
                    <label>Địa chỉ giao hàng *</label>
                    <textarea v-model="form.diaChi" rows="3" placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"></textarea>
                </div>
                <div class="form-group">
                    <label>Phương thức thanh toán</label>
                    <select v-model="form.phuongThucTT">
                        <option value="COD">💵 Thanh toán khi nhận hàng (COD)</option>
                        <option value="MOMO">📱 Ví MoMo</option>
                    </select>
                </div>
            </div>

            <!-- Cột phải: tóm tắt đơn hàng -->
            <div class="order-summary card">
                <h2>🧾 Đơn hàng của bạn</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in orderItems" :key="item.maBienThe ?? index">
                            <td class="item-name">
                                {{ item.tenSP }}
                                <span v-if="item.size || item.tenMau" class="item-variant">
                                    ({{ item.size }}{{ item.size && item.tenMau ? ' / ' : '' }}{{ item.tenMau }})
                                </span>
                            </td>
                            <td>{{ item.soLuong }}</td>
                            <td class="item-price">{{ formatCurrency(item.donGia * item.soLuong) }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="price-breakdown">
                    <div class="price-row">
                        <span>Tổng tiền:</span>
                        <span>{{ formatCurrency(tamTinh) }}</span>
                    </div>
                    <div class="price-row total-row">
                        <span>Tổng cộng:</span>
                        <strong>{{ formatCurrency(tongCong) }}</strong>
                    </div>
                </div>

                <!-- Nút đặt hàng -->
                <button class="btn-place-order" @click="xacNhanDatHang" :disabled="loading || orderItems.length === 0">
                    {{ loading ? '⏳ Đang xử lý...' : (form.phuongThucTT === 'MOMO' ? '📱 Thanh toán qua MoMo' : '✅ Xác nhận đặt hàng') }}
                </button>

            </div>
        </div>

        <!-- Modal thành công: chỉ hiện cho COD, vì MOMO sẽ điều hướng sang trang MoMo -->
        <div v-if="showSuccess" class="success-overlay">
            <div class="success-box">
                <div class="success-icon">🎉</div>
                <h2>Đặt hàng thành công!</h2>
                <p>Mã đơn hàng: <strong>{{ maDonHang || 'N/A' }}</strong></p>
                <div class="success-actions">
                    <button class="btn-view-order" @click="xemDonHang">📦 Đơn hàng của bạn</button>
                    <button @click="veHome">🏠 Về trang chủ</button>
                </div>
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
            mode: 'direct',

            orderItems: [],     // danh sách sản phẩm (biến thể) trong đơn, chỉ để hiển thị

            form: {
                hoTen: '',
                sdt: '',
                diaChi: '',
                phuongThucTT: 'COD',
            },

            loading: false,
            message: '',
            messageType: 'success',
            showSuccess: false,
            maDonHang: null,
        }
    },
    computed: {
        tamTinh() {
            return this.orderItems.reduce((sum, i) => sum + i.donGia * i.soLuong, 0);
        },
        tongCong() {
            return this.tamTinh;
        }
    },
     watch: {
        '$route.query': {
            immediate: true,
            handler(q) {
                this.mode = q.mode || 'direct';
                if (this.mode === 'direct') {
                    this.orderItems = [{
                        maBienThe: q.maBienThe ? Number(q.maBienThe) : null,
                        tenSP: q.tenSP,
                        size: q.size,
                        tenMau: q.tenMau,
                        soLuong: Number(q.soLuong) || 1,
                        donGia: Number(q.donGia) || 0,
                    }];
                } else {
                    this.loadTuGioHang();
                }
            }
        }
    },
    methods: {
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },

        // API đúng: GET /api/v1/cart/
        async loadTuGioHang() {
            this.loading = true;
            try {
                const result = await api.get('/api/v1/cart/');
                this.orderItems = result.data.map(item => ({
                    maBienThe: item.maBienThe,
                    tenSP: item.tenSP,
                    size: item.size,
                    tenMau: item.tenMau,
                    soLuong: item.soLuong,
                    donGia: item.giaBan,
                }));
            } catch (err) {
                this.messageType = 'error';
                this.message = 'Không thể tải giỏ hàng. Vui lòng thử lại!';
            } finally {
                this.loading = false;
            }
        },

        validateForm() {
            if (!this.form.hoTen.trim()) { this.message = 'Vui lòng nhập họ tên!'; return false; }
            if (!this.form.sdt.trim())   { this.message = 'Vui lòng nhập số điện thoại!'; return false; }
            if (!this.form.diaChi.trim()){ this.message = 'Vui lòng nhập địa chỉ giao hàng!'; return false; }
            return true;
        },

        buildDonHangPayload() {
            const payload = {
                tenNguoiNhan: this.form.hoTen,
                soDienThoaiNhan: this.form.sdt,
                diaChiGiaoHang: this.form.diaChi,
                phuongThucThanhToan: this.form.phuongThucTT,
            };

            if (this.mode === 'direct') {
                payload.danhSachSanPham = this.orderItems.map(item => ({
                    maBienThe: item.maBienThe,
                    soLuong: item.soLuong,
                }));
            }
            return payload;
        },

        async xacNhanDatHang() {
            this.message = '';
            this.messageType = 'error';

            if (!this.validateForm()) return;

            this.loading = true;
            try {
                // API đúng: POST /api/v1/donhang/
                const donHangResult = await api.post('/api/v1/donhang/', this.buildDonHangPayload());
                const maDonHang = donHangResult.data?.maDonHang;
                this.maDonHang = maDonHang;

                if (this.form.phuongThucTT === 'MOMO') {
                    // API đúng: POST /api/v1/momo/create
                    const momoResult = await api.post('/api/v1/momo/create', {
                        amount: Math.round(this.tongCong),
                        orderInfo: `Thanh toan don hang #${maDonHang}`,
                        madh: maDonHang,
                    });

                    const payUrl = momoResult.data?.payUrl;
                    if (!payUrl) {
                        throw new Error('Không lấy được link thanh toán MoMo.');
                    }

                    window.location.href = payUrl;
                    return;
                }

                // COD: hiện modal thành công ngay
                this.showSuccess = true;
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    const data = err.response.data;
                    if (data.error === 'GUEST_CHECKOUT_RESTRICTED' || data.message?.includes('Tài khoản khách không thể thanh toán')) {
                        this.messageType = 'error';
                        this.message = data.message || 'Tài khoản khách không thể thanh toán. Vui lòng đăng nhập hoặc đăng ký tài khoản!';
                        setTimeout(() => {
                           this.$router.push('/Login');
                        }, 2000);
                        return;
                    }
                }
                this.messageType = 'error';
                this.message = err.response?.data?.message || err.message || 'Đặt hàng thất bại! Vui lòng thử lại.';
            } finally {
                this.loading = false;
            }
        },

        veHome() {
            this.showSuccess = false;
            this.$router.push('/');
        },

        xemDonHang() {
            if (!this.maDonHang) return;
            this.showSuccess = false;
            this.$router.push({ name: 'ChiTietDonHang', params: { id: this.maDonHang } });
        }
    }
}
</script>


<style scoped>
.checkout-wrapper {
    max-width: 1100px;
    margin: 30px auto;
    padding: 0 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
}

h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 24px;
}

.message-box {
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-weight: 500;
}
.message-box.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.message-box.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.checkout-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

@media (max-width: 768px) {
    .checkout-layout { grid-template-columns: 1fr; }
}

.card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.09);
    padding: 28px;
}

h2 { color: #2c3e50; margin-bottom: 20px; font-size: 1.1rem; }

.form-group {
    margin-bottom: 16px;
}
.form-group label {
    display: block;
    font-weight: 600;
    color: #555;
    margin-bottom: 6px;
    font-size: 0.9rem;
}
.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
    outline: none;
    font-family: inherit;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    border-color: #3498db;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}
th { background: #f0f4f8; color: #555; padding: 10px; font-size: 0.85rem; text-align: center; }
td { padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 0.95rem; }
.item-name { text-align: left; font-weight: 500; }
.item-variant { color: #888; font-weight: 400; font-size: 0.85rem; }
.item-price { color: #e74c3c; font-weight: 600; }

.price-breakdown { border-top: 2px solid #eee; padding-top: 14px; }
.price-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    color: #555;
    font-size: 0.95rem;
}
.total-row {
    font-size: 1.1rem;
    color: #2c3e50;
    border-top: 1px solid #ddd;
    padding-top: 10px;
    margin-top: 6px;
}
.total-row strong { color: #e74c3c; font-size: 1.3rem; }

.btn-place-order {
    width: 100%;
    padding: 16px;
    margin-top: 20px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #27ae60, #1e8449);
    color: #fff;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s;
    letter-spacing: 0.5px;
}
.btn-place-order:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e8449, #196f3d);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(39,174,96,0.4);
}
.btn-place-order:disabled { opacity: 0.6; cursor: not-allowed; }

.success-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.success-box {
    background: #fff;
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: popIn 0.3s ease;
}
@keyframes popIn {
    from { transform: scale(0.8); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
}
.success-icon { font-size: 4rem; margin-bottom: 16px; }
.success-box h2 { color: #27ae60; margin-bottom: 12px; }
.success-box p  { color: #555; margin-bottom: 8px; }
.success-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
}
.success-actions button {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
}
.success-actions .btn-view-order {
    background: linear-gradient(135deg, #f39c12, #e67e22);
    color: #fff;
}
.success-actions .btn-view-order:hover {
    background: linear-gradient(135deg, #e67e22, #d35400);
    transform: translateY(-2px);
}
.success-actions button:not(.btn-view-order) {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: #fff;
}
.success-actions button:not(.btn-view-order):hover {
    background: linear-gradient(135deg, #2980b9, #2471a3);
    transform: translateY(-2px);
}
</style>

