<template>
    <AppHeader></AppHeader>
    <div class="cart-wrapper">
        <h1>Giỏ hàng của bạn</h1>

        <!-- Thông báo -->
        <div v-if="message" :class="['message-box', messageType]">{{ message }}</div>

        <!-- Giỏ hàng trống -->
        <div v-if="cartItems.length === 0 && !loading" class="empty-cart">
            <p>Giỏ hàng của bạn đang trống.</p>
            <router-link to="/" class="btn-continue">Tiếp tục mua sắm</router-link>
        </div>

        <!-- Danh sách sản phẩm trong giỏ -->
        <div v-else-if="cartItems.length > 0">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Hình ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Phân loại</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in cartItems" :key="item.maGioHang">
                        <td>{{ index + 1 }}</td>
                        <td>
                            <div class="cart-thumb">
                                <img 
                                    v-if="item.hinhAnh" 
                                    :src="getImageUrl(item.hinhAnh)" 
                                    :alt="item.tenSP" 
                                    @error="handleImageError"
                                    width="50" 
                                    height="50" 
                                />
                                <div v-else class="no-img-cart">N/A</div>
                            </div>
                        </td>
                        <td class="product-name">{{ item.tenSP }}</td>
                        <td>{{ item.size }}{{ item.size && item.tenMau ? ' / ' : '' }}{{ item.tenMau }}</td>
                        <td>{{ formatCurrency(item.giaBan) }}</td>
                        <td>
                            <div class="qty-control">
                                <button @click="capNhatSoLuong(item, item.soLuong - 1)">-</button>
                                <input 
                                    type="number" 
                                    v-model.number="item.soLuong" 
                                    @change="capNhatSoLuong(item, item.soLuong)"
                                    :max="item.soLuongTon"
                                    min="1" 
                                />
                                <button @click="capNhatSoLuong(item, item.soLuong + 1)">+</button>
                            </div>
                        </td>
                        <td class="subtotal">{{ formatCurrency(item.giaBan * item.soLuong) }}</td>
                        <td>
                            <button class="btn-delete" @click="xoaKhoiGio(item.maGioHang)">🗑️</button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Tổng tiền và nút đặt hàng -->
            <div class="cart-footer">
                <div class="total-price">
                    Tổng cộng: <strong>{{ formatCurrency(tongTien) }}</strong>
                </div>
                <div class="cart-actions">
                    <router-link to="/" class="btn-continue">← Mua thêm</router-link>
                    <button class="btn-checkout" @click="datHang" :disabled="loading">
                        Đặt hàng
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading-text">Đang xử lý...</div>
    </div>
</template>


<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    name: 'GioHang',
    components: { AppHeader },
    data() {
        return {
            cartItems: [],      // danh sách sản phẩm trong giỏ
            loading: false,
            message: '',
            messageType: 'success',
        }
    },
    computed: {
        // Tính tổng tiền từ danh sách sản phẩm trong giỏ
        tongTien() {
            return this.cartItems.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0);
        }
    },
    async mounted() {
        await this.loadGioHang();
    },
    methods: {
        getImageUrl(hinhAnh) {
        if (!hinhAnh) return '';
        if (hinhAnh.startsWith('http://') || hinhAnh.startsWith('https://')) {
            return hinhAnh;
        }
        return `http://localhost:8080/images/${hinhAnh}`;
        },
        handleImageError(e) {
            e.target.src = 'https://placehold.co/50x50?text=No+Image';
        },
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },

        // API đúng: GET /api/v1/cart/
        async loadGioHang() {
            this.loading = true;
            try {
                const result = await api.get('/api/v1/cart');
                this.cartItems = result.data;
            } catch (err) {
                this.messageType = 'error';
                this.message = err.response?.data?.message || 'Không thể tải giỏ hàng!';
            } finally {
                this.loading = false;
            }
        },

        // API đúng: PUT /api/v1/cart/{magh}
        async capNhatSoLuong(item, soLuongMoi) {
            if (soLuongMoi < 1) return;
            
            try {
                await api.put(`/api/v1/cart/${item.maGioHang}`, {
                    soluong: soLuongMoi,
                });
                item.soLuong = soLuongMoi;
            } catch (err) {
                this.messageType = 'error';
                this.message = err.response?.data?.message || 'Cập nhật thất bại!';
            }
        },

        // API đúng: DELETE /api/v1/cart/{magh}
        async xoaKhoiGio(maGioHang) {
            if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
            try {
                await api.delete(`/api/v1/cart/${maGioHang}`);
                this.cartItems = this.cartItems.filter(i => i.maGioHang !== maGioHang);
                this.messageType = 'success';
                this.message = 'Đã xóa sản phẩm khỏi giỏ hàng.';
            } catch (err) {
                this.messageType = 'error';
                this.message = err.response?.data?.message || 'Xóa thất bại!';
            }
        },

        
        datHang() {
            // Truyền danh sách giỏ hàng sang trang ThanhToan qua state
            this.$router.push({
                name: 'ThanhToan',
                query: { mode: 'cart' } // đặt hàng từ giỏ
            });
        },
    }
}
</script>


<style scoped>
.qty-control input[type="number"] {
    width: 45px;
    height: 30px;
    border: none;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
    outline: none;
    -moz-appearance: textfield;
}

.qty-control input[type="number"]::-webkit-outer-spin-button,
.qty-control input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.cart-wrapper {
    max-width: 900px;
    margin: 30px auto;
    padding: 0 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
}

h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
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

.empty-cart {
    text-align: center;
    padding: 60px 20px;
    color: #888;
}

.empty-cart p { font-size: 1.2rem; margin-bottom: 20px; }

table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    overflow: hidden;
}

thead tr { background: #2c3e50; color: #fff; }
th, td { padding: 14px 16px; text-align: center; }
tbody tr { border-bottom: 1px solid #eee; }
tbody tr:hover { background: #f8f9fa; }

.product-name { text-align: left; font-weight: 500; }

.subtotal { color: #e74c3c; font-weight: 700; }

.qty-control {
    display: inline-flex;
    align-items: center;
    border: 2px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}
.qty-control button {
    width: 30px; height: 30px;
    border: none; background: #f0f0f0;
    font-size: 1rem; cursor: pointer;
    transition: background 0.2s;
}
.qty-control button:hover { background: #ddd; }
.qty-control span { width: 40px; text-align: center; font-weight: 700; }

.btn-delete {
    background: none;
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    transition: transform 0.2s;
}
.btn-delete:hover { transform: scale(1.2); }

.cart-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding: 20px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.total-price {
    font-size: 1.2rem;
    color: #333;
}
.total-price strong { color: #e74c3c; font-size: 1.4rem; }

.cart-actions { display: flex; gap: 12px; }

.btn-continue {
    display: inline-flex;
    align-items: center;
    padding: 12px 22px;
    border: 2px solid #3498db;
    border-radius: 10px;
    color: #3498db;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.25s;
}
.btn-continue:hover { background: #3498db; color: #fff; }

.btn-checkout {
    padding: 12px 28px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
}
.btn-checkout:hover:not(:disabled) {
    background: linear-gradient(135deg, #c0392b, #a93226);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231,76,60,0.4);
}
.btn-checkout:disabled { opacity: 0.6; cursor: not-allowed; }

.loading-text { text-align: center; color: #888; padding: 20px; }
</style>

