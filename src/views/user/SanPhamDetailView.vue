<template>
    <AppHeader></AppHeader>
    <div class="detail-wrapper">
        <h1>Chi tiết sản phẩm</h1>
        <!-- Thông báo -->
        <div v-if="message" :class="['message-box', messageType]">{{ message }}</div>

        <div class="detail-card" v-if="detail.maSP">
            <div class="detail-info">
                
                <!-- Giao diện thông tin sản phẩm có cột rõ ràng -->
                <div class="product-info-table">
                    <div class="info-row">
                        <span class="info-label">Hình ảnh</span>
                        <div class="info-value">
                            <img :src="'http://localhost:8080/images/' + detail.hinhAnh" alt="Ảnh sản phẩm" class="main-product-img" />
                            <div class="sub-images" v-if="detail.hinhAnhPhu && detail.hinhAnhPhu.length">
                                <img v-for="(img, idx) in detail.hinhAnhPhu" :key="idx" :src="'http://localhost:8080/images/' + img.duongDan" class="sub-img" />
                            </div>
                        </div>
                        
                        <span class="info-label">Tên sản phẩm: </span>
                        <span class="info-value product-title">{{ detail.tenSP }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Giá bán: </span>
                        <div class="info-value product-price-wrapper">
                            <template v-if="detail.giaKhuyenMai && detail.giaKhuyenMai > 0">
                                <span class="price-discount">{{ formatCurrency(detail.giaKhuyenMai) }}</span>
                                <span class="price-original">{{ formatCurrency(detail.giaBan) }}</span>
                            </template>
                            <template v-else>
                                <span class="price-normal">{{ formatCurrency(detail.giaBan) }}</span>
                            </template>
                        </div>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mô tả: </span>
                        <span class="info-value product-desc">{{ detail.moTa }}</span>
                    </div>
                </div>

                <!-- Chọn biến thể: size + màu -->
                <div class="variant-selector" v-if="detail.bienThes && detail.bienThes.length">
                    
                    <!-- Nhóm Size -->
                    <div class="variant-group">
                        <label class="group-label">Size:</label>
                        <div class="variant-options">
                            <button
                                v-for="size in sizeOptions"
                                :key="size.maSize"
                                :class="['variant-btn', { 
                                    active: selectedSize === size.maSize,
                                    disabled: isOutOfStockAll
                                }]"
                                @click="isOutOfStockAll ? null : selectSize(size.maSize)"
                                :disabled="isOutOfStockAll"
                            >
                                {{ size.tenSize }}
                            </button>
                        </div>
                    </div>

                    <!-- Nhóm Màu Sắc -->
                    <div class="variant-group">
                        <label class="group-label">Màu sắc:</label>
                        <div class="variant-options">
                            <button
                                v-for="mau in mauOptions"
                                :key="mau.maMau"
                                :class="['variant-btn', { 
                                    active: selectedMau === mau.maMau, 
                                    disabled: !isColorAvailable(mau.maMau) || isOutOfStockAll 
                                }]"
                                @click="(isOutOfStockAll || !isColorAvailable(mau.maMau)) ? null : selectMau(mau.maMau)"
                                :disabled="!isColorAvailable(mau.maMau) || isOutOfStockAll"
                            >
                                {{ mau.tenMau }}
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedBienThe" class="variant-info">
                        Còn lại: <strong>{{ selectedBienThe.soLuongTon }}</strong> sản phẩm
                    </div>
                    <div v-else-if="selectedSize && selectedMau" class="variant-info error-text">
                        Sản phẩm này hiện đang hết hàng hoặc không có sẵn.
                    </div>
                    <div v-else-if="isOutOfStockAll" class="variant-info error-text">
                        Sản phẩm này đã bán hết.
                    </div>
                </div>
                <div v-else class="variant-info error-text">
                    Sản phẩm hiện không có (size/màu) nào để bán.
                </div>

                <!-- Chọn số lượng mua-->
                <div class="quantity-selector">
                    <label class="group-label">Số lượng mua:</label>
                    <div class="qty-control">
                        <button @click="decreaseQty" :disabled="isOutOfStockAll">-</button>
                        <input 
                            type="number" 
                            v-model.number="quantity" 
                            @input="validateQty"
                            @blur="handleBlur"
                            min="1" 
                            :max="tonKhoHienTai"
                            :disabled="isOutOfStockAll"
                        />
                        <button @click="increaseQty" :disabled="isOutOfStockAll">+</button>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn-cart" @click="themVaoGioHang" :disabled="loading || !selectedBienThe || tonKhoHienTai < 1 || isOutOfStockAll">
                        🛒 Thêm vào giỏ hàng
                    </button>
                    <button class="btn-order" @click="datHangLuon" :disabled="loading || !selectedBienThe || tonKhoHienTai < 1 || isOutOfStockAll">
                        Đặt hàng
                    </button>
                </div>

            </div>
        </div>

        <div v-else class="loading-text">Đang tải dữ liệu...</div>
    </div>
</template>

<script>
import api from '@/axios';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    components: {
        AppHeader
    },
    data() {
        return {
            detail: {},
            selectedSize: null,
            selectedMau: null,
            quantity: 1,
            loading: false,
            message: '',
            messageType: 'success',
        }
    },
    computed: {
        sizeOptions() {
            const map = new Map();
            (this.detail.bienThes || []).forEach(bt => {
                if (bt.size) map.set(bt.size.maSize, bt.size);
            });
            return Array.from(map.values());
        },
        mauOptions() {
            const map = new Map();
            (this.detail.bienThes || []).forEach(bt => {
                if (bt.mauSac) map.set(bt.mauSac.maMau, bt.mauSac);
            });
            return Array.from(map.values());
        },
        selectedBienThe() {
            if (!this.selectedSize || !this.selectedMau) return null;
            return (this.detail.bienThes || []).find(
                bt => bt.size?.maSize === this.selectedSize && bt.mauSac?.maMau === this.selectedMau && bt.soLuongTon > 0
            ) || null;
        },
        tonKhoHienTai() {
            return this.selectedBienThe ? this.selectedBienThe.soLuongTon : 1;
        },
        giaHienThi() {
            if (!this.selectedBienThe) return 0;
            if (this.detail.giaKhuyenMai && this.detail.giaKhuyenMai > 0) {
                return this.detail.giaKhuyenMai;
            }
            return this.selectedBienThe.giaBan;
        },
        isOutOfStockAll() {
            if (!this.detail.bienThes || this.detail.bienThes.length === 0) return true;
            const tongTon = this.detail.bienThes.reduce((sum, bt) => sum + bt.soLuongTon, 0);
            return tongTon <= 0;
        }
    },
    async mounted() {
        const id = this.$route.params.id;
        try {
            // API đúng: GET /api/product/{masp}
            let result = await api.get(`/api/product/${id}`);
            this.detail = result.data;

            if (this.detail.bienThes && this.detail.bienThes.length) {
                const firstAvailable = this.detail.bienThes.find(bt => bt.soLuongTon > 0) || this.detail.bienThes[0];
                this.selectedSize = firstAvailable.size?.maSize || null;
                this.selectedMau = firstAvailable.mauSac?.maMau || null;
            }
        } catch (err) {
            console.error("Lỗi loading dữ liệu.", err);
            alert(err.response?.data?.message || err.message || "Có lỗi xảy ra");
        }
    },
    methods: {
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },
        isColorAvailable(maMau) {
            if (!this.selectedSize) return true; 
            return this.detail.bienThes.some(
                bt => bt.size?.maSize === this.selectedSize && bt.mauSac?.maMau === maMau && bt.soLuongTon > 0
            );
        },
        selectSize(maSize) {
            this.selectedSize = maSize;
            if (this.selectedMau && !this.isColorAvailable(this.selectedMau)) {
                this.selectedMau = null;
            }
        },
        selectMau(maMau) {
            if (this.isColorAvailable(maMau)) {
                this.selectedMau = maMau;
            }
        },
        increaseQty() {
            if (this.quantity < this.tonKhoHienTai) {
                this.quantity++;
                this.message = '';
            } else {
                this.messageType = 'error';
                this.message = 'Số lượng mua quá giới hạn số lượng sản phẩm.';
            }
        },
        decreaseQty() {
            if (this.quantity > 1) {
                this.quantity--;
                this.message = '';
            }
        },
        validateQty() {
            if (this.quantity > this.tonKhoHienTai) {
                this.quantity = this.tonKhoHienTai;
                this.messageType = 'error';
                this.message = 'Số lượng mua quá giới hạn số lượng sản phẩm.';
            } else {
                this.message = '';
            }
            if (this.quantity < 1 && this.quantity !== '' && this.quantity !== null) {
                this.quantity = 1;
            }
        },
        handleBlur() {
            if (!this.quantity || this.quantity < 1) {
                this.quantity = 1;
            }
        },
        async themVaoGioHang() {
            if (!this.selectedBienThe) return;
            this.loading = true;
            this.message = '';
            try {
                // API đúng: POST /api/v1/cart/
                await api.post('/api/v1/cart/', {
                    maBienThe: this.selectedBienThe.maBienThe,
                    soLuong: this.quantity,
                });
                this.messageType = 'success';
                this.message = `Đã thêm "${this.detail.tenSP}" vào giỏ hàng!`;
                setTimeout(() => {
                    this.$router.push({ name: 'GioHang' });
                }, 1500);
            } catch (err) {
                this.messageType = 'error';
                this.message = err.response?.data?.message || 'Thêm vào giỏ hàng thất bại!';
            } finally {
                this.loading = false;
            }
        },
        datHangLuon() {
            if (!this.selectedBienThe) return;
            this.$router.push({
                name: 'ThanhToan',
                query: {
                    maBienThe: this.selectedBienThe.maBienThe,
                    tenSP: this.detail.tenSP,
                    size: this.selectedBienThe.size?.tenSize,
                    tenMau: this.selectedBienThe.mauSac?.tenMau,
                    soLuong: this.quantity,
                    donGia: this.giaHienThi,
                    mode: 'direct',
                }
            });
        },
    }
}
</script>

<style scoped>
.detail-wrapper {
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #2d3748;
}
.main-product-img {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}
.sub-images {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}
.sub-img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}

h1 {
    text-align: center;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 24px;
    letter-spacing: -0.02em;
}

.message-box {
    text-align: center;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 0.95rem;
    font-weight: 500;
}
.message-box.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.message-box.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

.detail-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #edf2f7;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
    padding: 32px;
}

.product-info-table {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 24px;
    margin-bottom: 24px;
}
.info-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: flex-start;
    padding: 10px 0;
}
.info-label {
    color: #64748b;
    font-weight: 600;
    font-size: 0.95rem;
    padding-top: 2px;
}
.info-value {
    color: #1e293b;
    font-size: 1rem;
    text-align: left;
    display: block;
}

.product-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    text-align: left;
    display: block;
    margin: 0;
}

.product-desc {
    line-height: 1.6;
    color: #475569;
    text-align: left;
    display: block;
    margin: 0;
}
.price-discount { color: #e11d48; font-weight: 700; font-size: 1.25rem; }
.price-original { color: #94a3b8; text-decoration: line-through; font-size: 1rem; }
.price-normal { color: #0f172a; font-weight: 700; font-size: 1.25rem; }

.variant-selector { margin-bottom: 24px; }

.variant-group,
.quantity-selector {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: center;
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 12px;
}
.group-label {
    font-weight: 600;
    color: #475569;
    font-size: 0.95rem;
    margin: 0;
}
.variant-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
}
.variant-btn {
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #334155;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
}
.variant-btn:hover:not(.disabled) { background: #f1f5f9; }
.variant-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }

.variant-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8fafc;
    color: #94a3b8;
    text-decoration: line-through;
    border-color: #f1f5f9;
}

.variant-info {
    font-size: 0.9rem;
    color: #475569;
    margin-top: 12px;
    text-align: right; 
}
.error-text { color: #b91c1c; }

.quantity-selector { margin-bottom: 28px; }
.qty-control {
    display: inline-flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 3px;
    width: fit-content;
}
.qty-control button {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #334155;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
}
.qty-control button:hover { background: #f1f5f9; color: #0f172a; }
.qty-control input[type="number"] {
    width: 48px;
    height: 32px;
    border: none;
    background: transparent;
    text-align: center;
    font-weight: 600;
    font-size: 0.95rem;
    color: #0f172a;
    outline: none;
    -moz-appearance: textfield;
}
.qty-control input[type="number"]::-webkit-outer-spin-button,
.qty-control input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.action-buttons { display: flex; gap: 12px; }
.btn-cart, .btn-order {
    flex: 1;
    height: 48px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}
.btn-cart { background: #f1f5f9; color: #334155; }
.btn-cart:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
.btn-order { background: #0f172a; color: #ffffff; }
.btn-order:hover:not(:disabled) {
    background: #1e293b;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}
.btn-cart:disabled, .btn-order:disabled { opacity: 0.5; cursor: not-allowed; }
.loading-text { text-align: center; color: #94a3b8; font-size: 1rem; padding: 60px 0; }
</style>

