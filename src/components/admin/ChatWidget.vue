<template>
  <!-- Icon nổi góc dưới phải -->
  <button class="chat-fab" @click="toggleOpen" :title="isOpen ? 'Đóng chat' : 'Mở chat'">
    💬
    <span v-if="!isOpen && tongChuaDoc > 0" class="fab-badge">{{ tongChuaDoc }}</span>
  </button>

  <!-- Khung chat -->
  <div v-if="isOpen" class="chat-window">
    <div class="chat-header">
      <span>{{ headerTitle }}</span>
      <button class="btn-close" @click="isOpen = false">✕</button>
    </div>

    <!-- danh sách hội thoại (hộp thư) -->
    <div v-if="mode === 'staff' && !currentPartner" class="conv-list">
      <p v-if="loadingConversations" class="hint">Đang tải hộp thư...</p>
      <p v-else-if="conversations.length === 0" class="hint">Chưa có khách hàng nào nhắn tin.</p>
      <div
        v-else
        v-for="c in conversations"
        :key="c.customerUsername"
        class="conv-item"
        @click="moHoiThoai(c.customerUsername)">
        <div class="avatar-mini">{{ c.customerUsername.charAt(0).toUpperCase() }}</div>
        <div class="conv-info">
          <div class="conv-name">
            {{ c.customerUsername }}
            <span v-if="chuaDoc[c.customerUsername]" class="dot-unread"></span>
          </div>
          <div class="conv-last">{{ c.lastMessage }}</div>
        </div>
        <div class="conv-time">{{ formatTime(c.lastTimestamp) }}</div>
      </div>
    </div>

    <!-- Khung tin nhắn -->
    <template v-else>
      <div v-if="mode === 'staff'" class="chat-subheader">
        <button class="btn-back" @click="quayLaiHopThu">← Hộp thư</button>
        <span>{{ currentPartner }}</span>
      </div>

      <div class="chat-body" ref="chatBody">
        <p v-if="loadingHistory" class="hint">Đang tải lịch sử...</p>
        <p v-else-if="messages.length === 0" class="hint">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>

        <div
          v-for="(m, idx) in messages"
          :key="m.id ?? idx"
          class="msg-row"
          :class="{ 'msg-me': m.sender === myUsername }">
          <div class="msg-bubble">
            <div v-if="mode === 'staff' && m.sender !== myUsername" class="msg-sender">{{ m.sender }}</div>
            <div class="msg-content">{{ m.content }}</div>
            <div class="msg-time">{{ formatTime(m.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="draft"
          @keyup.enter="guiTin"
          :disabled="!connected"
          placeholder="Nhập tin nhắn..." />
        <button @click="guiTin" :disabled="!connected || !draft.trim()">Gửi</button>
      </div>
      <div v-if="!connected" class="hint hint-warn">Đang kết nối...</div>
    </template>
  </div>
</template>

<script>
import { Client } from '@stomp/stompjs';
import { jwtDecode } from 'jwt-decode';
import api from '@/axios.js';

// Phải khớp CHÍNH XÁC với LienHe.STAFF_INBOX bên backend.
const STAFF_INBOX = 'STAFF_INBOX';
const STAFF_TOPIC = '/topic/staff-inbox';

export default {
  name: 'ChatWidget',
  props: {
    mode: {
      type: String,
      default: 'user',
      validator: (v) => ['user', 'staff'].includes(v),
    },
    title: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isOpen: false,
      connected: false,
      stompClient: null,
      messages: [],
      draft: '',

      // staff mode
      conversations: [],
      loadingConversations: false,
      currentPartner: '',
      chuaDoc: {},

      // user mode
      chuaDocUser: 0,

      loadingHistory: false,
      myUsername: this.layMyUsernameTuToken(),
    };
  },
  computed: {
    headerTitle() {
      if (this.title) return this.title;
      return this.mode === 'staff' ? 'Hộp thư hỗ trợ khách hàng' : 'Trò chuyện với cửa hàng';
    },
    tongChuaDoc() {
      if (this.mode === 'staff') return Object.keys(this.chuaDoc).length;
      return this.chuaDocUser;
    },
  },
  mounted() {
    this.ketNoiWebSocket();
  },
  beforeUnmount() {
    this.ngatKetNoi();
  },
  methods: {
    layMyUsernameTuToken() {
      const token = localStorage.getItem('jwt-token');
      if (!token) return '';
      try {
        const decoded = jwtDecode(token);
        return decoded.sub || decoded.email || decoded.username || '';
      } catch (err) {
        console.error('Không giải mã được token:', err);
        return '';
      }
    },

    toggleOpen() {
      this.isOpen = !this.isOpen;
      if (!this.isOpen) return;

      if (this.mode === 'staff') {
        this.taiHopThu();
      } else {
        this.chuaDocUser = 0;
        this.taiLichSuCuaToi();
      }
    },

    // API đúng: GET /api/chat/history
    async taiLichSuCuaToi() {
      this.loadingHistory = true;
      try {
        const res = await api.get('/api/chat/history');
        this.messages = res.data || [];
        this.cuonXuongCuoi();
      } catch (err) {
        console.error('Lỗi tải lịch sử chat:', err);
      } finally {
        this.loadingHistory = false;
      }
    },

    // API đúng: GET /api/chat/conversations
    async taiHopThu() {
      this.loadingConversations = true;
      try {
        const res = await api.get('/api/chat/conversations');
        this.conversations = res.data || [];
      } catch (err) {
        console.error('Lỗi tải hộp thư chat:', err);
      } finally {
        this.loadingConversations = false;
      }
    },

    async moHoiThoai(customerUsername) {
      this.currentPartner = customerUsername;
      delete this.chuaDoc[customerUsername];
      this.loadingHistory = true;
      try {
        const res = await api.get('/api/chat/history', { params: { partner: customerUsername } });
        this.messages = res.data || [];
        this.cuonXuongCuoi();
      } catch (err) {
        console.error('Lỗi tải lịch sử chat:', err);
      } finally {
        this.loadingHistory = false;
      }
    },

    quayLaiHopThu() {
      this.currentPartner = '';
      this.messages = [];
      this.taiHopThu();
    },

    layKhachHangCuaTin(msg) {
      return msg.receiver === STAFF_INBOX ? msg.sender : msg.receiver;
    },

    capNhatHopThu(msg) {
      const customer = this.layKhachHangCuaTin(msg);
      if (!customer) return;

      const idx = this.conversations.findIndex((c) => c.customerUsername === customer);
      const entry = { customerUsername: customer, lastMessage: msg.content, lastTimestamp: msg.timestamp };
      if (idx !== -1) this.conversations.splice(idx, 1);
      this.conversations.unshift(entry);

      if (customer !== this.currentPartner && msg.sender !== this.myUsername) {
        this.chuaDoc = { ...this.chuaDoc, [customer]: true };
      }
    },

    ketNoiWebSocket() {
      const token = localStorage.getItem('jwt-token');
      if (!token) return;

      this.stompClient = new Client({
        brokerURL: this.toWsUrl(api.defaults.baseURL) + '/ws',
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          this.connected = true;

          this.stompClient.subscribe('/user/queue/messages', (frame) => {
            this.xuLyTinNhanDen(JSON.parse(frame.body));
          });

          if (this.mode === 'staff') {
            this.stompClient.subscribe(STAFF_TOPIC, (frame) => {
              this.xuLyTinNhanDen(JSON.parse(frame.body));
            });
          }
        },
        onStompError: (frame) => {
          console.error('Lỗi STOMP:', frame.headers?.message);
        },
        onWebSocketClose: () => {
          this.connected = false;
        },
      });
      this.stompClient.activate();
    },

    xuLyTinNhanDen(msg) {
      if (this.mode === 'staff') {
        this.capNhatHopThu(msg);
        const customer = this.layKhachHangCuaTin(msg);
        if (customer === this.currentPartner) {
          const localIdx = this.messages.findIndex(
            (m) => m._local && m.sender === msg.sender && m.content === msg.content
          );
          if (localIdx !== -1) {
            this.messages.splice(localIdx, 1, msg);
          } else if (!this.messages.some((m) => m.id === msg.id)) {
            this.messages.push(msg);
            this.cuonXuongCuoi();
          }
        }
      } else {
        const localIdx = this.messages.findIndex(
          (m) => m._local && m.sender === msg.sender && m.content === msg.content
        );
        if (localIdx !== -1) {
          this.messages.splice(localIdx, 1, msg);
        } else if (!this.messages.some((m) => m.id === msg.id)) {
          this.messages.push(msg);
          this.cuonXuongCuoi();
          if (msg.sender !== this.myUsername && !this.isOpen) {
            this.chuaDocUser++;
          }
        }
      }
    },

    ngatKetNoi() {
      if (this.stompClient) {
        this.stompClient.deactivate();
      }
    },

    toWsUrl(httpBaseUrl) {
      const base = httpBaseUrl || 'http://localhost:8080';
      return base.replace(/\/$/, '').replace(/^http/, 'ws');
    },

    guiTin() {
      const content = this.draft.trim();
      if (!content || !this.connected) return;
      if (this.mode === 'staff' && !this.currentPartner) return;

      const body = { content };
      if (this.mode === 'staff') {
        body.receiver = this.currentPartner;
      }

      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(body),
      });

      const tinNhanTam = {
        _local: true,
        id: null,
        sender: this.myUsername,
        receiver: this.mode === 'staff' ? this.currentPartner : STAFF_INBOX,
        content,
        timestamp: new Date().toISOString(),
      };
      this.messages.push(tinNhanTam);
      this.cuonXuongCuoi();

      this.draft = '';
    },

    cuonXuongCuoi() {
      this.$nextTick(() => {
        const el = this.$refs.chatBody;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    formatTime(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },
  },
};
</script>

<style scoped>
.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  z-index: 1000;
}
.fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  padding: 2px 6px;
}

.chat-window {
  position: fixed;
  bottom: 92px;
  right: 24px;
  width: 340px;
  height: 460px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}
.chat-header {
  background: #2563eb;
  color: white;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.chat-subheader {
  padding: 8px 14px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #475569;
}
.btn-back {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}
.conv-item:hover { background: #f1f5f9; }
.avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.conv-info { flex: 1; min-width: 0; }
.conv-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot-unread {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  display: inline-block;
}
.conv-last {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-time { font-size: 11px; color: #cbd5e1; flex-shrink: 0; }

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f8fafc;
}
.msg-row { display: flex; margin-bottom: 8px; }
.msg-row.msg-me { justify-content: flex-end; }
.msg-bubble {
  max-width: 75%;
  background: white;
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.msg-row.msg-me .msg-bubble { background: #2563eb; color: white; }
.msg-sender { font-size: 11px; font-weight: 600; color: #2563eb; margin-bottom: 2px; }
.msg-content { font-size: 14px; white-space: pre-wrap; word-break: break-word; }
.msg-time { font-size: 10px; opacity: 0.7; margin-top: 2px; text-align: right; }

.chat-input {
  display: flex;
  border-top: 1px solid #eee;
  padding: 8px;
  gap: 8px;
}
.chat-input input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 14px;
  outline: none;
}
.chat-input button {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
}
.chat-input button:disabled { background: #cbd5e1; cursor: not-allowed; }

.hint { text-align: center; color: #94a3b8; font-size: 13px; padding: 16px; }
.hint-warn { color: #f59e0b; padding: 4px 12px; }
</style>

