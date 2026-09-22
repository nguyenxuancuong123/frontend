<template>
  <div class="signup-container">
    <div class="register">
      <h1>Đăng ký tài khoản</h1>
      
      <div class="name-group">
        <input type="text" v-model="hoTen" placeholder="Nhập họ và tên">
      </div>

      <input type="text" v-model="email" placeholder="Email">
      <input type="password" v-model="password" placeholder="Password">
      <input type="text" v-model="diachi" placeholder="Địa chỉ">
      <input type="text" v-model="sdt" placeholder="Số điện thoại">
      
      <button v-on:click="signUp">Đăng ký</button>
      
      <router-link to="/Login">
        <button class="btn-secondary">Đăng nhập</button>
      </router-link>
    </div>
  </div>
</template>

<script>
import api from '@/axios';

export default {
  name: 'SignUp',

  data() {
    return {
      hoTen: '',
      email: '',
      password: '',
      diachi: '',
      sdt: ''
    }
  },
  methods: {
    async signUp() {
      try {
        // Lưu ý: key JSON phải khớp CHÍNH XÁC tên field bên SignUpRequest (Jackson phân biệt hoa/thường).
        // Field Java là "diaChi", không phải "diachi".
        let result = await api.post("/api/v1/auth/signup", {
            hoTen: `${this.hoTen}`.trim(),
            email: this.email,
            password: this.password,
            diaChi: this.diachi,
            sdt: this.sdt,
        });

        if (result.status === 201 || result.status === 200) {
          this.$router.push({ name: 'Login' });
        }
      } catch (error) {
        console.error("Lỗi đăng ký:", error);
        alert(error.response?.data?.message || error.message || "Có lỗi xảy ra");
      }
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

.signup-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fcfcfc;
  padding: 20px;
}

.register {
  width: 100%;
  max-width: 440px;
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}

.register h1 {
  font-size: 28px;
  font-weight: 700;
  color: #09090b;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

.name-group {
  display: flex;
  gap: 12px;
}

.register input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  margin-bottom: 16px;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  font-size: 15px;
  color: #09090b;
  background-color: #ffffff;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.register input::placeholder {
  color: #a1a1aa;
}

.register input:focus {
  border-color: #09090b;
  box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.15);
}

.register button {
  width: 100%;
  height: 48px;
  background-color: #09090b;
  color: #ffffff;
  border: 1px solid #09090b;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.2s ease-in-out;
}

.register button:hover {
  background-color: #27272a;
  border-color: #27272a;
}

.register button:active {
  transform: scale(0.985);
}

.register a {
  display: block;
  margin-top: 12px;
  text-decoration: none;
}

.register .btn-secondary {
  background-color: transparent;
  color: #09090b;
  border: 1px solid #e4e4e7;
  margin-top: 0;
}

.register .btn-secondary:hover {
  background-color: #f4f4f5;
  border-color: #d4d4d8;
}
</style>

