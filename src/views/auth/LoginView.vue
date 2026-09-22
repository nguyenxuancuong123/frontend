<template>
  <div class="login-container">
    <div class="login">
      <h1>Đăng nhập</h1>
      <input type="text" v-model="email" placeholder="Email">
      <input type="password" v-model="password" placeholder="Password">
      <button v-on:click="login">Đăng nhập</button>

      <div class="divider"><span>hoặc</span></div>

      <button class="btn-google" @click="loginWithGoogle" type="button">Đăng nhập bằng Google</button>
      <button class="btn-facebook" @click="loginWithFacebook" type="button">Đăng nhập bằng Facebook</button>

      <router-link to="/SignUp">
        <button>Đăng ký</button>
      </router-link>
    </div>
  </div>
</template>

<script>

import api from '@/axios';
import { saveTokenAndRedirect } from '@/auth';

const BACKEND_URL = 'http://localhost:8080';

export default {
    name:'Login',
    data(){
        return{
            email:'',
            password:''
        }
    },
    methods:{
       async login(){
        try{
            let result = await api.post("/api/v1/auth/signin", {
                email: this.email,
                password: this.password
            });
                
            if(result.status==200)
            {
                let token = result.data.token || result.data.accessToken;
                let refreshToken = result.data.refreshToken; 
                
                let oldGuestToken = localStorage.getItem('jwt-token');
                let isGuest = localStorage.getItem('is_guest') === 'true';

                // Merge dữ liệu giỏ hàng/chat nếu đang là tài khoản khách
                if (isGuest && oldGuestToken) {
                    try {
                        await api.post('/api/v1/auth/merge-guest', 
                            { guestToken: oldGuestToken },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        console.log('Đã gộp dữ liệu khách thành công!');
                    } catch (e) {
                        console.warn('Lỗi gộp tài khoản khách:', e);
                    }
                }
                
                // Truyền cả token và userDetails vào hàm lưu
                saveTokenAndRedirect(this.$router, token, refreshToken, result.data);
            }
        }catch(error){
            console.error("Lỗi đăng nhập:", error);
            alert(error.response?.data?.message || error.message || "Có lỗi xảy ra");
        }
       },

       loginWithGoogle() {
            window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
       },

       loginWithFacebook() {
            window.location.href = `${BACKEND_URL}/oauth2/authorization/facebook`;
       }
    }
   
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fcfcfc;
  padding: 20px;
  box-sizing: border-box;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #09090b;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

.login {
  width: 100%;
  max-width: 440px;
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}

.login input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  margin-bottom: 20px;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  font-size: 15px;
  color: #09090b;
  background-color: #ffffff;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.login input::placeholder {
  color: #a1a1aa;
}

.login input:focus {
  border-color: #09090b;
  box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.15);
}

.login button {
  width: 100%;
  height: 48px;
  background-color: #09090b;
  color: #ffffff;
  border: 1px solid #09090b;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.login button:hover {
  background-color: #27272a;
  border-color: #27272a;
}

.login button:active {
  transform: scale(0.985);
}

.login a {
  display: block;
  margin-top: 12px;
  text-decoration: none;
}

.login a button {
  background-color: transparent;
  color: #09090b;
  border: 1px solid #e4e4e7;
}

.login a button:hover {
  background-color: #f4f4f5;
  border-color: #d4d4d8;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 8px 0 16px;
  color: #a1a1aa;
  font-size: 13px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e4e4e7;
}
.divider span {
  padding: 0 12px;
}

.btn-google,
.btn-facebook {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s ease-in-out;
}

.btn-google {
  background-color: #ffffff;
  color: #09090b;
  border: 1px solid #d4d4d8;
}
.btn-google:hover {
  background-color: #f4f4f5;
}

.btn-facebook {
  background-color: #1877f2;
  color: #ffffff;
  border: 1px solid #1877f2;
}
.btn-facebook:hover {
  background-color: #166fe0;
}
</style>

