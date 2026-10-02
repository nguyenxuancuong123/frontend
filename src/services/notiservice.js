import { Client } from '@stomp/stompjs';
import { reactive } from 'vue';
import api from '@/axios.js';

const state = reactive({
    connected: false,
    notifications: [],
});

let client = null;

// =====================================================
// URL WEBSOCKET
// =====================================================
function getBrokerUrl() {

    const protocol =
        window.location.protocol === 'https:'
            ? 'wss:'
            : 'ws:';

    return `${protocol}//${window.location.host}/ws`;
}

// =====================================================
// TẢI LỊCH SỬ THÔNG BÁO
// GET /api/v1/notify
// =====================================================
async function taiLichSu() {

    try {

        const { data } =
            await api.get('/v1/notify');

        state.notifications =
            data || [];

    } catch (e) {

        console.error(
            'Không tải được lịch sử thông báo:',
            e
        );
    }
}

// =====================================================
// KẾT NỐI WEBSOCKET
// =====================================================
function connect() {

    const token =
        localStorage.getItem('jwt-token');

    // -------------------------------------------------
    // Chưa có token
    // -------------------------------------------------
    if (!token) {

        window.addEventListener(
            'session-ready',
            _onSessionReady,
            {
                once: true,
            }
        );

        return;
    }

    // -------------------------------------------------
    // Đã có connection
    // -------------------------------------------------
    if (
        client &&
        client.active
    ) {
        return;
    }

    // -------------------------------------------------
    // Tạo STOMP client
    // -------------------------------------------------
    client = new Client({

        brokerURL:
            getBrokerUrl(),

        connectHeaders: {
            Authorization:
                `Bearer ${token}`,
        },

        reconnectDelay: 5000,

        onConnect: () => {

            state.connected = true;

            // ---------------------------------------------
            // Nhận thông báo cập nhật đơn hàng
            // ---------------------------------------------
            client.subscribe(
                '/user/queue/donhang-update',
                (message) => {

                    try {

                        const data =
                            JSON.parse(
                                message.body
                            );

                        const daTonTai =
                            state.notifications.some(
                                (n) =>
                                    n.maThongBao ===
                                    data.maThongBao
                            );

                        if (!daTonTai) {

                            state.notifications.unshift(
                                {
                                    ...data,

                                    thoiGian:
                                        new Date(),

                                    daDoc: false,
                                }
                            );
                        }

                    } catch (e) {

                        console.error(
                            'Không parse được thông báo từ server:',
                            e
                        );
                    }
                }
            );
        },

        onStompError: (frame) => {

            console.error(
                'Lỗi STOMP:',
                frame.headers?.message,
                frame.body
            );

            state.connected = false;
        },

        onWebSocketClose: () => {

            state.connected = false;

        },
    });

    client.activate();
}

// =====================================================
// SESSION READY
// =====================================================
function _onSessionReady() {

    connect();
}

// =====================================================
// NGẮT KẾT NỐI
// =====================================================
function disconnect() {

    if (client) {

        client.deactivate();

        client = null;
    }

    state.connected = false;
}

// =====================================================
// RESET
// =====================================================
function reset() {

    disconnect();

    state.notifications = [];
}

// =====================================================
// ĐẾM THÔNG BÁO CHƯA ĐỌC
// =====================================================
function soThongBaoChuaDoc() {

    return state.notifications.filter(
        (n) => !n.daDoc
    ).length;
}

// =====================================================
// ĐÁNH DẤU ĐÃ ĐỌC
// PATCH /api/v1/notify/tick
// =====================================================
async function danhDauDaDocHet() {

    state.notifications.forEach(
        (n) => (n.daDoc = true)
    );

    try {

        await api.patch(
            '/v1/notify/tick'
        );

    } catch (e) {

        console.error(
            'Đánh dấu đã đọc thất bại:',
            e
        );
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