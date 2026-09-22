import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { initUserSession } from './auth';

initUserSession().then(() => {
    createApp(App)
        .use(router)
        .mount("#app");
});
