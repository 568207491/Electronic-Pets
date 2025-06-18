<template>
  <div class="modal-overlay" @click.self="closeModal" v-show="isOpen">
    <div class="message-history-modal" :class="{ 'scale-in': isOpen, 'scale-out': !isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">消息记录</h3>
        <button class="close-btn" @click="closeModal">
          <i class="fa fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="message-container">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="message-content">
              <!-- <div class="avatar">
                <img :src="message.role === 'user' ? userAvatar : aiAvatar" alt="Avatar" />
              </div> -->
              <div class="message-bubble">
                <p class="message-text" v-html="parseMessage(message.content)"></p>
                <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="clear-btn" @click="clearMessages">
          <i class="fa fa-trash"></i> 清空记录
        </button>
        <button class="close-btn" @click="closeModal">
          <i class="fa fa-check"></i> 确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick,watch } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 接收props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  messages: {
    type: Array,
    default: () => []
  }
});

// 定义emits
const emits = defineEmits(['close', 'clear']);

// 工具函数
const parseMessage = (content) => {
  // 转换markdown为HTML
  const html = marked.parse(content);
  // 净化HTML防止XSS攻击
  return DOMPurify.sanitize(html);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};


// 关闭模态框 - 直接触发 close 事件
const closeModal = () => {
  emits('close');
};

// 清空消息记录
const clearMessages = () => {
  emits('clear');
  emits('close'); // 清空后也关闭模态框
};

// 弹窗动画
const animateScroll = () => {
  nextTick(() => {
    const container = document.querySelector('.message-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// 监听弹窗状态变化
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    animateScroll();
  }
});

// 组件数据
const userAvatar = 'https://picsum.photos/seed/user/40/40';
const aiAvatar = 'https://picsum.photos/seed/ai/40/40';
</script>

<style scoped>
.message-content {
	display: flex;
  width: 100%;
}
.user-message .message-content {
  flex-direction: row-reverse;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}

.modal-overlay.v-show {
  opacity: 1;
}

.message-history-modal {
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.06);
  transform: scale(0.95);
  transition: transform 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 70vh;
  max-height: 600px;
}

.scale-in {
  transform: scale(1);
}

.modal-header {
  padding: 16px 24px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
  padding: 8px;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.message-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.5s forwards;
}

.user-message {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  font-size: 15px;
  line-height: 1.4;
}

.user-message .message-bubble {
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-bubble {
  background-color: #f1f5f9;
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

.message-text {
  margin: 0;
  word-break: break-word;
}

.timestamp {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  text-align: right;
}

.ai-message .timestamp {
  color: rgba(0, 0, 0, 0.5);
}

.modal-footer {
  padding: 12px 24px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.clear-btn,
.modal-footer .close-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-btn {
  background-color: #f8fafc;
  color: #ef4444;
  border: 1px solid #e2e8f0;
}

.clear-btn:hover {
  background-color: #f1f5f9;
}

.modal-footer .close-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.modal-footer .close-btn:hover {
  background-color: #2563eb;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>  