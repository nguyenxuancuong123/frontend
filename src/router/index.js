import HomeView from "@/views/user/HomeView.vue";
import SignUpView from "@/views/auth/SignUpView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import DanhMucView from "@/views/user/DanhMucView.vue";
import SanPhamView from "@/views/user/SanPhamView.vue";
import SanPhamDetailView from "@/views/user/SanPhamDetailView.vue";
import GioHangView from "@/views/user/GioHangView.vue";
import ThanhToanView from "@/views/user/ThanhToanView.vue";
import ProfileView from "@/views/user/ProfileView.vue";
import DashboardView from "@/views/admin/DashboardView.vue";
import ChiTietDonHangView from "@/views/user/ChiTietDonHangView.vue";
import MoMoView from "@/views/user/MoMoView.vue";
import DonHangView from "@/views/user/DonHangView.vue";
import OAuth2RedirectView from "@/views/auth/OAuth2RedirectView.vue";
import { getRoleFromToken, getHomeRouteForRole } from '@/auth';

import { createRouter, createWebHistory } from "vue-router";

const publicRoutes = [
    { name: "SignUp", component: SignUpView, path: "/SignUp" },
    { name: "Login", component: LoginView, path: "/Login" },
    { name: "OAuth2Redirect", component: OAuth2RedirectView, path: "/oauth2/redirect" },
    // Nếu gõ sai URL hoặc vào trang không có quyền role
    { path: '/:pathMatch(.*)*', redirect: '/Login' }
];
 

const dynamicRoutes = [
    { 
        name: "Home", 
        component: HomeView, 
        path: "/", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "DanhMuc", 
        component: DanhMucView, 
        path: "/DanhMuc", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "SanPham", 
        component: SanPhamView, 
        path: "/SanPham/:id", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "SanPhamDetail", 
        component: SanPhamDetailView, 
        path: "/SanPhamDetail/:id", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "GioHang", 
        component: GioHangView, 
        path: "/GioHang", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "ThanhToan", 
        component: ThanhToanView, 
        path: "/ThanhToan", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "ChiTietDonHang", 
        component: ChiTietDonHangView, 
        path: "/ChiTietDonHang/:id", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "MoMo", 
        component: MoMoView, 
        path: "/momo/return", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "DonHang", 
        component: DonHangView, 
        path: "/DonHang", 
        meta: { requiresAuth: true, roles: ['USER'] } 
    },
    { 
        name: "Dashboard", 
        component: DashboardView, 
        path: "/Dashboard", 
        meta: { requiresAuth: true, roles: ['ADMIN', 'EMPLOYEE'] } 
    },
    { 
        name: "Profile", 
        component: ProfileView, 
        path: "/Profile", 
        meta: { requiresAuth: true, roles: ['USER', 'ADMIN', 'EMPLOYEE'] } 
    }
];

// Khởi tạo router mặc định chỉ với publicRoutes
const router = createRouter({
    history: createWebHistory(),
    routes: publicRoutes,
});

// Biến cờ kiểm tra xem các route động đã được nạp chưa
let isDynamicRoutesAdded = false;

function setupDynamicRoutes(role) {
    dynamicRoutes.forEach(route => {
        if (route.meta.roles.includes(role)) {
            if (!router.hasRoute(route.name)) {
                router.addRoute(route);
            }
        }
    });
}

// Export để auth.js gọi TRƯỚC khi router.push({name:...}) — vì push theo tên route
// sẽ báo "No match for" ngay lập tức nếu route đó chưa được add vào bảng route,
// mà trước đây các route động chỉ được add bên trong router.beforeEach (tức là
// SAU khi 1 lần điều hướng đã bắt đầu, quá trễ cho lần push đầu tiên sau khi login).
export function ensureDynamicRoutesForRole(role) {
    if (!role || isDynamicRoutesAdded) return;
    setupDynamicRoutes(role);
    isDynamicRoutesAdded = true;
}

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('jwt-token');
    const role = getRoleFromToken(token);
    const loggedIn = !!role;

    // A. XỬ LÝ KHI NGƯỜI DÙNG F5
    if (loggedIn && !isDynamicRoutesAdded) {
        ensureDynamicRoutesForRole(role);

        // Nếu người dùng F5 trên 1 route động, cần redirect lại chính route đó để router nhận ra route đã được nạp
        if (to.redirectedFrom) {
            return next({ path: to.redirectedFrom.fullPath, replace: true });
        } else {
            return next({ ...to, replace: true });
        }
    }

    // B. KIỂM TRA ĐĂNG NHẬP (Chưa đăng nhập mà vào route yêu cầu auth)
    if (to.meta.requiresAuth && !loggedIn) {
        return next('/Login');
    }

    // C. ĐÃ ĐĂNG NHẬP NHƯNG CỐ TÌNH QUAY LẠI LOGIN/SIGNUP
    const guestOnlyRoutes = ['Login', 'SignUp'];
    const isGuest = localStorage.getItem('is_guest') === 'true';
    if (guestOnlyRoutes.includes(to.name) && loggedIn && !isGuest) {
        return next(getHomeRouteForRole(role));
    }

    // Nếu qua được các trạm kiểm soát trên -> Cho phép truy cập
    next();
});

// Hàm này được export để khi đăng nhập thành công ở file Login.vue hoặc OAuth2Redirect.vue 
// bạn gọi nó ra để reset lại cờ, chuẩn bị đăng nhập tài khoản khác.
export function resetRouterState() {
    isDynamicRoutesAdded = false;
}

export default router;

