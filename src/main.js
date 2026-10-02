import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initUserSession } from './auth';
import api from './axios';

// initUserSession co retry tu dong, nhung du that bai van mount app
// de nguoi dung thay UI (khong treo man hinh trang)
initUserSession()
  .catch((err) => console.error('initUserSession that bai:', err))
  .finally(() => {
    const app = createApp(App);
    app.config.globalProperties.$baseUrl = api.defaults.baseURL;
    app.use(router).mount('#app');
  });
