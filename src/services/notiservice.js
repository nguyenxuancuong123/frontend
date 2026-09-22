import { Client } from '@stomp/stompjs';
import { reactive } from 'vue';
import api from '@/axios.js';


const state = reactive({
    connected: false,
    notifications: [], 
});

let client = null;

function getBrokerUrl() {
    const base = api.defaults.baseURL || 'http://localhost:8080';
    return base.replace(/\/$/, '').replace(/^http/, 'ws') + '/ws';
}


async function taiLichSu() {
    try {
        // API đúng: GET /api/v1/notify/
        const { data } = await api.get('/api/v1/notify');
        state.notifications = data; // ghi đè toàn bộ, tránh trùng nếu gọi lại nhiều lần
    } catch (e) {
        console.error('Không tải được lịch sử thông báo:', e);
    }
}

function connect() {
    const token = localStorage.getItem('jwt-token');
    if (!token) return; // chưa đăng nhập thì không có gì để kết nối

    if (client && client.active) return; // đã kết nối rồi, tránh mở trùng connection

    client = new Client({
        brokerURL: getBrokerUrl(),
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        onConnect: () => {
            state.connected = true;

            client.subscribe('/user/queue/donhang-update', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    
                    const daTonTai = state.notifications.some((n) => n.maThongBao === data.maThongBao);
                    if (!daTonTai) {
                        state.notifications.unshift({ ...data, thoiGian: new Date(), daDoc: false });
                    }
                } catch (e) {
                    console.error('Không parse được thông báo từ server:', e);
                }
            });
        },
        onStompError: (frame) => {
            console.error('Lỗi STOMP:', frame.headers['message'], frame.body);
            state.connected = false;
        },
        onWebSocketClose: () => {
            state.connected = false;
        },
    });

    client.activate();
}

function disconnect() {
    if (client) {
        client.deactivate();
        client = null;
    }
    state.connected = false;
}


function reset() {
    disconnect();
    state.notifications = [];
}

function soThongBaoChuaDoc() {
    return state.notifications.filter((n) => !n.daDoc).length;
}

async function danhDauDaDocHet() {
    state.notifications.forEach((n) => (n.daDoc = true));
    try {
        // API đúng: PATCH /api/v1/notify/tick
        await api.patch('/api/v1/notify/tick');
    } catch (e) {
        console.error('Đánh dấu đã đọc thất bại:', e);
    }
}

export default {
    state,
    connect,
    disconnect,
    reset,
    taiLichSu,
    soThongBaoChuaDoc,
    danhDauDaDocHet,
};