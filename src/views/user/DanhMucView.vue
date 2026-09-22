<template>
    <AppHeader></AppHeader>
    <h1>Danh Mục</h1>
    <div>
        <table border="1">
    <tr>
        <td>Tên danh mục</td>
        <td>Mô tả</td>
        <td>Xem chi tiết</td>
    </tr>

    <tr v-for="dm in danhmucList" :key="dm.maDM">
        <td>{{ dm.tenDM }}</td>
        <td>{{ dm.moTa }}</td>
        <td>
            <router-link :to="'/SanPham/' + dm.maDM">
                        <button>Xem chi tiết</button>
            </router-link>
        </td>
    </tr>
    </table>
    </div>
</template>

<script>
import api from '@/axios.js';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
    components:{
        AppHeader
    },
    data(){
        return{
            danhmucList:[]
        }
    },
    async mounted() { 
        try {
            // API đúng: GET /api/category
            let result = await api.get("/api/category");

            // gán dữ liệu nhận được vào mảng
            this.danhmucList = result.data;
            console.log("Dữ liệu danh mục lấy thành công:", this.danhmucList);
        
        } catch (err) {
            console.error("Lỗi loading dữ liệu.",err)
            alert(err.response?.data?.message || err.message || "Có lỗi xảy ra");
        }
    },
    name:'DanhMuc',
}
</script>

