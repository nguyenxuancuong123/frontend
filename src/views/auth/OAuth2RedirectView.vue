<template>
    <div class="oauth2-wrapper">
        <div class="status-card">
            <div v-if="error" class="error-block">
                <div class="icon">❌</div>
                <h2>Đăng nhập thất bại</h2>
                <p>{{ errorMessage }}</p>
                <router-link to="/Login">← Quay lại đăng nhập</router-link>
            </div>
            <div v-else class="loading-block">
                <div class="spinner"></div>
                <h2>Đang đăng nhập...</h2>
            </div>
        </div>
    </div>
</template>

<script>
import { saveTokenAndRedirect } from '@/auth';
import api from '@/axios';

export default {
    name: 'OAuth2Redirect',
    data() {
        return {
            error: false,
            errorMessage: '',
        }
    },
    async mounted() {
        const q = this.$route.query;

        if (q.error) {
            this.error = true;
            this.errorMessage = q.error === 'no_email_from_provider'
                ? 'Tài khoản Google/Facebook của bạn không cung cấp email — không thể đăng nhập.'
                : 'Đã có lỗi xảy ra trong quá trình đăng nhập.';
            return;
        }

        if (!q.token) {
            this.error = true;
            this.errorMessage = 'Không nhận được token đăng nhập.';
            return;
        }

        let oldGuestToken = localStorage.getItem('jwt-token');
        let isGuest = localStorage.getItem('is_guest') === 'true';

        // Gộp dữ liệu khách (nếu có)
        if (isGuest && oldGuestToken) {
            try {
                await api.post('/api/v1/auth/merge-guest', 
                    { guestToken: oldGuestToken },
                    { headers: { Authorization: `Bearer ${q.token}` } }
                );
                console.log('Đã gộp dữ liệu khách thành công!');
            } catch (e) {
                console.warn('Lỗi gộp tài khoản khách:', e);
            }
        }

        // Backend có thể gửi name/hoTen trên URL param nếu muốn
        saveTokenAndRedirect(this.$router, q.token, q.refreshToken, { hoTen: q.hoTen || q.name });
    }
}
</script>

<style scoped>
.oauth2-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fcfcfc;
}

.status-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    padding: 48px 40px;
    text-align: center;
    max-width: 400px;
}

.icon { font-size: 3rem; margin-bottom: 12px; }
h2 { color: #09090b; margin-bottom: 8px; }
p { color: #666; margin-bottom: 16px; }

.error-block a {
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #eee;
    border-top-color: #09090b;
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

