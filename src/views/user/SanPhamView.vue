<template>
    <AppHeader></AppHeader>
    <h1>Sản Phẩm</h1>

    <table border="1">
    <tr>
        <td>Hình ảnh</td>
        <td>Tên sản phẩm</td>
        <td>Giá bán</td>
        <td>Xem chi tiết</td>
    </tr>

    <tr v-for="sp in productList" :key="sp.maSP">
        <td>
            <div class="img-wrap">
                <img :src="'http://localhost:8080/images/' + sp.hinhAnh" alt="Ảnh SP" width="60" height="60" style="object-fit: cover; border-radius: 4px;" />
                <span v-if="isHetHang(sp)" class="badge-hethang">Hết hàng</span>
            </div>
        </td>
        <td>{{ sp.tenSP }}</td>
        <td>{{ formatCurrency(sp.giaBan) }}</td>
        <td>
            <router-link :to="'/SanPhamDetail/' + sp.maSP">
                <button>Xem chi tiết</button>
            </router-link> 
        </td>
    </tr>

    <tr v-if="!loading && productList.length === 0">
        <td colspan="4">Không có sản phẩm nào.</td>
    </tr>

    </table>

    <!-- Thanh phân trang (page 1-based, khớp với backend) -->
    <div class="pagination" v-if="totalPages > 0">
        <button :disabled="currentPage === 1" @click="loadPage(1)">« Đầu</button>
        <button :disabled="currentPage === 1" @click="loadPage(currentPage - 1)">‹ Trước</button>

        <button
            v-for="p in visiblePages"
            :key="p"
            :class="{ active: p === currentPage }"
            @click="loadPage(p)">
            {{ p }}
        </button>

        <button :disabled="currentPage === totalPages" @click="loadPage(currentPage + 1)">Sau ›</button>
        <button :disabled="currentPage === totalPages" @click="loadPage(totalPages)">Cuối »</button>

        <!-- <span class="page-info">Trang {{ currentPage }} / {{ totalPages }} ({{ totalElements }} sản phẩm)</span> -->
    </div>
</template>

<script>

import AppHeader from '@/components/layout/AppHeader.vue';
import api from '@/axios.js';

export default {
    components:{
        AppHeader
    },
    data(){
        return {
            productList: [],
            loading: false,

            // trạng thái phân trang
            currentPage: 1,
            size: 10,
            totalPages: 0,
            totalElements: 0,
        }
    },
    computed: {
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
    async mounted() { 
        await this.loadPage(1);
    },
    methods: {
        async loadPage(page) {
            // Lấy mã danh mục từ URL (được truyền từ DanhMuc)
            const madm = this.$route.params.id;

            // chặn gọi API với trang không hợp lệ
            if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) return;

            this.loading = true;
            try {
                // API đúng: GET /api/product/category/{madm}/page
                let result = await api.get(`/api/product/category/${madm}/page`, {
                    params: {
                        page: page,
                        size: this.size,
                    }
                });

                // Spring Page<T> trả về { content, totalPages, totalElements, number, ... }
                this.productList = result.data.content;
                this.currentPage = page;
                this.totalPages = result.data.totalPages;
                this.totalElements = result.data.totalElements;

                console.log("Dữ liệu sản phẩm lấy thành công:", this.productList);
        
            } catch (err) {
                console.error("Lỗi loading dữ liệu.",err)
                alert(err.response?.data?.message || err.message || "Có lỗi xảy ra");
            } finally {
                this.loading = false;
            }
        },
        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },
        // Hết hàng = tổng tồn kho của tất cả biến thể bằng 0 (hoặc chưa có biến thể nào).
        isHetHang(sp) {
            const tongTon = (sp.bienThes || []).reduce((sum, bt) => sum + (bt.soLuongTon || 0), 0);
            return tongTon <= 0;
        },
    },
    name:'SanPham',
}
</script>

<style>
table {
    margin: 30px auto;
    border-collapse: collapse;
    width: 70%;
}

td {
    height: 40px;
    text-align: center;
    padding: 10px;
    border: 1px solid #333;
}

tr:first-child {
    font-weight: bold;
    background-color: #f2f2f2;
}

.img-wrap {
    position: relative;
    display: inline-block;
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

.pagination {
    width: 70%;
    margin: 20px auto 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
}

.pagination button {
    min-width: 32px;
    padding: 6px 10px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
    border-radius: 4px;
}

.pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.pagination button.active {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
    font-weight: bold;
}

.page-info {
    margin-left: 12px;
    font-size: 14px;
    color: #555;
}
</style>

