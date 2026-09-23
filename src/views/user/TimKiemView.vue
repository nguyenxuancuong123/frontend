<template>
    <AppHeader />
    <div class="tk-wrapper">
        <!-- Tiêu đề kết quả -->
        <div class="tk-header">
            <h1>
                Kết quả tìm kiếm cho: 
                <span class="keyword-highlight">"{{ keyword }}"</span>
            </h1>
            <p class="tk-total" v-if="!loading">{{ totalElements }} sản phẩm được tìm thấy</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-text">Đang tìm kiếm...</div>

        <!-- Danh sách kết quả -->
        <div v-else-if="productList.length > 0" class="product-grid">
            <router-link
                v-for="sp in productList"
                :key="sp.maSP"
                :to="'/SanPhamDetail/' + sp.maSP"
                class="product-card"
            >
                <div class="card-img-wrap">
                    <img
                        :src="'http://localhost:8080/images/' + sp.hinhAnh"
                        :alt="sp.tenSP"
                    />
                    <span v-if="isHetHang(sp)" class="badge-hethang">Hết hàng</span>
                </div>
                <div class="card-body">
                    <p class="card-name">{{ sp.tenSP }}</p>
                    <!-- Rating -->
                    <div class="card-rating" v-if="sp.soLuotDanhGia > 0">
                        <span class="stars">{{ renderStars(sp.diemDanhGiaTb) }}</span>
                        <span class="rating-score">{{ sp.diemDanhGiaTb }}</span>
                        <span class="rating-count">({{ sp.soLuotDanhGia }})</span>
                    </div>
                    <div class="card-rating muted" v-else>
                        <span>Chưa có đánh giá</span>
                    </div>
                    <!-- Giá -->
                    <div class="card-price">
                        <template v-if="sp.giaKhuyenMai && sp.giaKhuyenMai > 0">
                            <span class="price-sale">{{ formatCurrency(sp.giaKhuyenMai) }}</span>
                            <span class="price-old">{{ formatCurrency(sp.giaBan) }}</span>
                        </template>
                        <template v-else>
                            <span class="price-normal">{{ formatCurrency(sp.giaBan) }}</span>
                        </template>
                    </div>
                </div>
            </router-link>
        </div>

        <!-- Không tìm thấy -->
        <div v-else class="empty-state">
            <p>😕 Không tìm thấy sản phẩm nào khớp với từ khóa <strong>"{{ keyword }}"</strong>.</p>
            <p>Hãy thử tìm với từ khóa khác nhé.</p>
        </div>

        <!-- Phân trang -->
        <div class="pagination" v-if="totalPages > 1">
            <button :disabled="currentPage === 1" @click="loadPage(1)">« Đầu</button>
            <button :disabled="currentPage === 1" @click="loadPage(currentPage - 1)">‹ Trước</button>
            
            <button
                v-for="p in visiblePages"
                :key="p"
                :class="{ active: p === currentPage }"
                @click="loadPage(p)"
            >
                {{ p }}
            </button>
            
            <button :disabled="currentPage === totalPages" @click="loadPage(currentPage + 1)">Sau ›</button>
            <button :disabled="currentPage === totalPages" @click="loadPage(totalPages)">Cuối »</button>
            <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
        </div>
    </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue';
import api from '@/axios.js';

export default {
    name: 'TimKiem',
    components: { AppHeader },
    data() {
        return {
            productList: [],
            loading: false,
            currentPage: 1,
            size: 12,
            totalPages: 0,
            totalElements: 0,
        };
    },
    computed: {
        keyword() {
            return this.$route.query.keyword || '';
        },
        visiblePages() {
            let pages = [];
            const maxVisible = 5;
            let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let end = start + maxVisible - 1;

            if (end > this.totalPages) {
                end = this.totalPages;
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            return pages;
        }
    },
    watch: {
        // Khi user tìm kiếm từ khóa mới ngay trên trang này, reload lại kết quả
        '$route.query.keyword'() {
            this.currentPage = 1;
            this.loadPage(1);
        },
    },
    mounted() {
        this.loadPage(1);
    },
    methods: {
        async loadPage(page) {
            if (!this.keyword) return;
            this.loading = true;
            try {
                // API: GET /api/product/search?keyword=...&page=...&size=...
                const res = await api.get('/api/product/search', {
                    params: { keyword: this.keyword, page, size: this.size },
                });
                let sortedList = res.data.content || []; sortedList.sort((a,b) => { const rA = a.soSao || a.diemTrungBinh || a.rating || 0; const rB = b.soSao || b.diemTrungBinh || b.rating || 0; if (rA !== rB) return rB - rA; return (a.maSP || 0) - (b.maSP || 0); }); this.productList = sortedList;
                this.currentPage = page;
                this.totalPages = res.data.totalPages;
                this.totalElements = res.data.totalElements;
            } catch (err) {
                alert(err.response?.data?.message || 'Lỗi tìm kiếm!');
            } finally {
                this.loading = false;
            }
        },
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },
        isHetHang(sp) {
            const tong = (sp.bienThes || []).reduce((s, bt) => s + (bt.soLuongTon || 0), 0);
            return tong <= 0;
        },
        renderStars(diem) {
            const full = Math.floor(diem);
            const half = diem - full >= 0.5 ? 1 : 0;
            return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
        },
    },
};
</script>

<style scoped>
.tk-wrapper {
    max-width: 1100px;
    margin: 80px auto 60px;
    padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.tk-header {
    margin-bottom: 24px;
}
.tk-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 6px;
}
.keyword-highlight {
    color: #2563eb;
}
.tk-total {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0;
}

.loading-text {
    text-align: center;
    color: #94a3b8;
    padding: 60px 0;
    font-size: 1rem;
}

/* Grid sản phẩm */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.product-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.2s, transform 0.2s;
    display: flex;
    flex-direction: column;
}
.product-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    transform: translateY(-3px);
}

.card-img-wrap {
    position: relative;
    width: 100%;
    padding-top: 100%;
    background: #f8fafc;
    overflow: hidden;
}
.card-img-wrap img {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
}
.badge-hethang {
    position: absolute;
    top: 8px; right: 8px;
    background: rgba(0,0,0,0.55);
    color: #fff;
    font-size: 11px;
    padding: 3px 7px;
    border-radius: 6px;
}

.card-body {
    padding: 12px 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.card-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
}
.stars { color: #f59e0b; font-size: 0.9rem; letter-spacing: 1px; }
.rating-score { font-weight: 600; color: #374151; }
.rating-count { color: #94a3b8; }
.card-rating.muted { color: #94a3b8; font-size: 0.82rem; }

.card-price { display: flex; align-items: center; gap: 8px; }
.price-sale { color: #e11d48; font-weight: 700; font-size: 1rem; }
.price-old { color: #94a3b8; text-decoration: line-through; font-size: 0.85rem; }
.price-normal { color: #0f172a; font-weight: 700; font-size: 1rem; }

/* Không tìm thấy */
.empty-state {
    text-align: center;
    padding: 80px 0;
    color: #64748b;
    font-size: 1rem;
    line-height: 1.8;
}

/* Phân trang */
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 32px;
}
.pagination button {
    min-width: 36px;
    padding: 7px 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    color: #334155;
    transition: all 0.15s;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination button.active {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
    font-weight: 700;
}
.pagination button:hover:not(:disabled):not(.active) { background: #f1f5f9; }
.page-info { font-size: 13px; color: #94a3b8; margin-left: 6px; }
</style>

