<template>
    <AppHeader></AppHeader>

    <!-- Chuông thông báo real-time -->
    <div class="thongbao-wrap">
        <button class="btn-chuong" @click="toggleDropdown">
            🔔
            <span v-if="soChuaDoc > 0" class="badge">{{ soChuaDoc }}</span>
        </button>

        <div v-if="showDropdown" class="dropdown-thongbao">
            <div class="dropdown-header">
                <strong>Thông báo</strong>
                <button v-if="soChuaDoc > 0" class="btn-danhdau" @click="notiService.danhDauDaDocHet()">
                    Đánh dấu đã đọc
                </button>
            </div>

            <p v-if="notifications.length === 0" class="rong">Chưa có thông báo nào.</p>

            <router-link
                v-for="(tb, idx) in notifications"
                :key="idx"
                :to="'/ChiTietDonHang/' + tb.maDonHang"
                class="item-thongbao"
                :class="{ 'chua-doc': !tb.daDoc }"
                @click="showDropdown = false">
                <div>Đơn hàng {{ tb.maDonHang }} đã chuyển sang <strong>{{ tb.trangThai }}</strong></div>
                <small>{{ formatThoiGian(tb.thoiGian) }}</small>
            </router-link>
        </div>
    </div>

    <div>
        <h1>Danh sách Sản Phẩm</h1>
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
                <td colspan="4">Không tìm thấy sản phẩm nào phù hợp.</td>
            </tr>
        </table>

        <!-- Phân trang (Ẩn đi khi đang ở chế độ Tìm kiếm) -->
        <div class="pagination" v-if="!isSearching && totalPages > 0">
            <button :disabled="currentPage === 1" @click="loadPage(currentPage - 1)">« Trước</button>
            <button
                v-for="p in totalPages"
                :key="p"
                :class="{ active: p === currentPage }"
                @click="loadPage(p)">
                {{ p }}
            </button>
            <button :disabled="currentPage === totalPages" @click="loadPage(currentPage + 1)">Sau »</button>
            <span class="page-info">Trang {{ currentPage }} / {{ totalPages }} ({{ totalElements }} sản phẩm)</span>
        </div>
    </div>

    <!-- Icon chat nổi, bấm vào mở khung chat với Admin -->
    <ChatWidget mode="user" title="Trò chuyện với cửa hàng" />
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue';
import ChatWidget from '@/components/admin/ChatWidget.vue';
import api from '@/axios.js';
import notiService from '@/services/notiservice.js';

export default {
    name: 'Home',
    components: { AppHeader, ChatWidget },
    data() {
        return {
            productList: [],
            loading: false,
            keyword: '',
            isSearching: false,
            currentPage: 1,
            size: 10,
            totalPages: 0,
            totalElements: 0,
            notiService,
            showDropdown: false,
        }
    },
    computed: {
        notifications() {
            return this.notiService.state.notifications;
        },
        soChuaDoc() {
            return this.notiService.soThongBaoChuaDoc();
        },
    },
    async mounted() {
        await this.loadPage(1);
        // 1. Nạp lại thông báo cũ từ DB trước
        await this.notiService.taiLichSu();
        // 2. Rồi mới mở kết nối WebSocket để nhận thông báo mới phát sinh từ giờ trở đi
        this.notiService.connect();
    },
    methods: {
        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        formatThoiGian(date) {
            return new Date(date).toLocaleString('vi-VN');
        },
        // Tải danh sách mặc định có phân trang
        // API đúng: GET /api/product/page
        async loadPage(page) {
            if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) return;
            this.loading = true;
            try {
                let result = await api.get("/api/product/page", {
                    params: { page: page, size: this.size }
                });
                this.productList = result.data.content;
                this.currentPage = page;
                this.totalPages = result.data.totalPages;
                this.totalElements = result.data.totalElements;
            } catch (err) {
                alert(err.response?.data?.message || "Lỗi tải dữ liệu!");
            } finally {
                this.loading = false;
            }
        },

        formatCurrency(value) {
            if (!value) return '0 ₫';
            return Number(value).toLocaleString('vi-VN') + ' ₫';
        },
        isHetHang(sp) {
            const tongTon = (sp.bienThes || []).reduce((sum, bt) => sum + (bt.soLuongTon || 0), 0);
            return tongTon <= 0;
        },
    }
}
</script>

<style scoped>
.thongbao-wrap {
    position: relative;
    display: flex;
    justify-content: flex-end;
    padding: 10px 20px;
}
.btn-chuong {
    position: relative;
    font-size: 22px;
    background: none;
    border: none;
    cursor: pointer;
}
.badge {
    position: absolute;
    top: -4px;
    right: -6px;
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: bold;
    border-radius: 50%;
    padding: 1px 5px;
    line-height: 1.4;
}
.dropdown-thongbao {
    position: absolute;
    top: 100%;
    right: 20px;
    width: 320px;
    max-height: 380px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    z-index: 100;
}
.dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid #eee;
}
.btn-danhdau {
    font-size: 12px;
    background: none;
    border: none;
    color: #2563eb;
    cursor: pointer;
}
.rong {
    padding: 16px;
    color: #888;
    text-align: center;
    margin: 0;
}
.item-thongbao {
    display: block;
    padding: 10px 14px;
    border-bottom: 1px solid #f2f2f2;
    text-decoration: none;
    color: #333;
    font-size: 14px;
}
.item-thongbao:hover {
    background: #f8f8f8;
}
.item-thongbao.chua-doc {
    background: #eff6ff;
    font-weight: 600;
}
.item-thongbao small {
    color: #999;
    font-weight: normal;
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

