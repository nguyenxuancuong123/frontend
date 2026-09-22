import { jwtDecode } from 'jwt-decode';
import { ensureDynamicRoutesForRole } from './router';
import api from './axios';

// Khởi tạo phiên làm việc (Guest Account)
// Nếu đã có token trong localStorage thì không làm gì cả, nếu chưa có thì gọi API tạo tài khoản ảo
export async function initUserSession() {
  let token = localStorage.getItem('jwt-token');
  
  if (!token) {
    try {
      const res = await api.post('/api/v1/auth/guest');
      const guestToken = res.data.token || res.data.accessToken;
      const refreshToken = res.data.refreshToken;
      const hoTen = res.data.hoTen || res.data.name;
      const isGuest = res.data.isGuest !== undefined ? res.data.isGuest : true;
      
      if (guestToken) localStorage.setItem('jwt-token', guestToken);
      if (refreshToken) localStorage.setItem('refresh-token', refreshToken);
      if (hoTen) localStorage.setItem('user_name', hoTen);
      localStorage.setItem('is_guest', isGuest);
      
      return { token: guestToken, hoTen, isGuest };
    } catch (error) {
      console.error('Lỗi tạo tài khoản ảo:', error);
    }
  }
  
  return {
    token,
    hoTen: localStorage.getItem('user_name'),
    isGuest: localStorage.getItem('is_guest') === 'true'
  };
}

// Hàm dùng chung: lấy role chuẩn hoá (ADMIN/EMPLOYEE/USER) từ 1 token bất kỳ
export function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    const userRoles = decoded.role || decoded.roles || decoded.vaiTro;

    const roleStr = Array.isArray(userRoles)
      ? userRoles.map(r => (typeof r === 'object' ? (r.authority || r.role || '') : String(r))).join(',')
      : String(userRoles);

    if (roleStr.toUpperCase().includes('ADMIN')) return 'ADMIN';
    if (roleStr.toUpperCase().includes('EMPLOYEE')) return 'EMPLOYEE';
    return 'USER';
  } catch (error) {
    return null;
  }
}

// Hàm dùng chung: lấy route mặc định tương ứng từng role
export function getHomeRouteForRole(role) {
  if (role === 'ADMIN') return { name: 'Dashboard' };
  if (role === 'EMPLOYEE') return { name: 'Dashboard' };
  return { name: 'Home' };
}

// Hàm cũ, giờ chỉ còn việc lưu token + gọi lại 2 hàm trên
export function saveTokenAndRedirect(router, token, refreshToken, userDetails = {}) {
  if (token) {
    localStorage.setItem('jwt-token', token);
  }
  if (refreshToken) {
    localStorage.setItem('refresh-token', refreshToken);
  }
  
  if (userDetails.hoTen) {
      localStorage.setItem('user_name', userDetails.hoTen);
  } else if (token) {
      try {
          const decoded = jwtDecode(token);
          const name = decoded.hoTen || decoded.name || decoded.sub || decoded.email;
          if (name) localStorage.setItem('user_name', name);
      } catch (e) {
          console.warn("Could not decode token for name");
      }
  }
  
  // Nếu là đăng nhập thật thì is_guest = false
  localStorage.setItem('is_guest', 'false');

  const role = getRoleFromToken(token);

  if (!role) {
    console.error("Lỗi giải mã Token khi đăng nhập");
    router.push({ path: '/' });
    return;
  }

  ensureDynamicRoutesForRole(role);

  const homeRoute = getHomeRouteForRole(role);
  router.push(homeRoute);
}