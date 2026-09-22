<template>
    <div class="nav">
        <div class="nav-links">
            <router-link to="/">Home</router-link>
            <router-link to="/DanhMuc">Danh mục</router-link>
            <router-link to="/GioHang">Giỏ hàng</router-link>
            <router-link to="/DonHang">Đơn hàng</router-link>
            <router-link to="/Profile">Hồ sơ</router-link>
        </div>
        <div class="user-info">
            <span v-if="userName" class="greeting">
                Xin chào, {{ userName }} 
                <span v-if="isGuest" class="badge">Khách vãng lai</span>
            </span>
            <router-link v-if="isGuest" to="/Login" class="btn-login">Đăng nhập / Đăng ký</router-link>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AppHeader',
    data() {
        return {
            userName: localStorage.getItem('user_name') || '',
            isGuest: localStorage.getItem('is_guest') === 'true'
        }
    },
    mounted() {
        window.addEventListener('storage', this.syncUserData);
        // Lắng nghe sự kiện custom nếu được emit trong cùng 1 tab
        window.addEventListener('auth-changed', this.syncUserData);
    },
    beforeUnmount() {
        window.removeEventListener('storage', this.syncUserData);
        window.removeEventListener('auth-changed', this.syncUserData);
    },
    methods: {
        syncUserData() {
            this.userName = localStorage.getItem('user_name') || '';
            this.isGuest = localStorage.getItem('is_guest') === 'true';
        },
        logout() {
            localStorage.removeItem('jwt-token');
            localStorage.removeItem('refresh-token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('is_guest');
            // Phát sự kiện để Header tự cập nhật
            window.dispatchEvent(new Event('auth-changed'));
            window.location.href = '/Login';
        }
    }
}
</script>

<style scoped>
.nav {
    background-color: #333;
    overflow: hidden;
    position: fixed;   
    top: 0;            
    left: 0;           
    width: 100%;       
    z-index: 1000;     
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex;
    justify-content: space-between;
}

.nav-links a {
    float: left;
    color: #f2f2f2;
    padding: 14px 20px;
    text-align: center;
    font-size: 17px;
    text-decoration: none;
}

.nav-links a:hover {
    background: #ddd;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    padding-right: 20px;
}

.greeting {
    color: white;
    margin-right: 15px;
    font-size: 15px;
}

.badge {
    background-color: #f39c12;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    margin-left: 5px;
}

.btn-login, .btn-logout {
    background-color: #3498db;
    color: white !important;
    padding: 8px 15px !important;
    border-radius: 4px;
    text-decoration: none;
    font-size: 14px !important;
}

.btn-login:hover, .btn-logout:hover {
    background-color: #2980b9 !important;
}
</style>

