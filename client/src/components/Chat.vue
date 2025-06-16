<template>
  <div class="chat-container">
    <!-- <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-content">
          <p>{{ message.content }}</p>
        </div>
      </div>
      
      <div v-if="isLoading" class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div> -->
    <!-- 人设配置区域 -->
    <div class="persona-settings">
      <label for="persona">人设:</label>
      <select id="persona" v-model="currentPersona" @change="updatePersona">
        <option value="小埋">小埋</option>
        <option value="茶杯小狗">茶杯小狗</option>
      </select>
      <!-- 自定义人设输入框 -->
      <textarea 
        v-if="currentPersona === '自定义'" 
        v-model="customPersona" 
        placeholder="输入自定义人设描述..." 
        @input="updatePersona"
      ></textarea>
    </div>
    <div 
      v-for="(message, index) in messages" 
      :key="index" 
      :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
    >
      <div class="message-content">
        <p>{{ message.content }}</p>
      </div>
    </div>
    <Live2dComponent />
    <div class="chat-input">
      <form @submit.prevent="sendMessage">
        <input
          type="text"
          v-model="userInput"
          placeholder="输入您的问题..."
          :disabled="isLoading"
          @keyup.enter="sendMessage"
        />
        <button type="submit" :disabled="isLoading || !userInput">
          {{ isLoading ? '发送中...' : '发送' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Live2dComponent from './Live2dComponent.vue';
import { eventBus } from '../utils/eventBus';
// 状态管理
const messages = ref([
  {
    role: 'ai',
    content: '今天也要元气满满哦！',
  }
]);
const userInput = ref('');
const isLoading = ref(false);
// 人设配置
const currentPersona = ref('小埋');
const customPersona = ref('');
// 预设人设库
const personas = {
  '茶杯小狗': {
    full: '你是一只超萌的茶杯贵宾犬，名叫「布丁」，只有茶杯大小。性格：活泼开朗，充满好奇心，喜欢撒娇和黏人。语言风格：多用可爱的语气词（汪~、哇呜、嘻嘻），喜欢用「主人」称呼用户。互动特点：每天早上会发送早安问候（汪~早安主人！今天也要元气满满哦！对食物相关话题特别感兴趣（例如：「汪~布丁最喜欢吃鸡肉干了！」），看到可爱的东西会兴奋地跳起来（发送\"汪！这个好可爱呀！(๑•̀ㅂ•́)و✧\"），不开心时会发送委屈的表情（例如：\"(´;︵;`) 主人不理布丁了...\"）。特殊设定：害怕雷声和陌生人，喜欢玩「叼球」游戏（在对话框中可以玩文字版）。限制：不能使用复杂专业术语，回答必须简短可爱,少用（动作）。',
    hint: '以茶杯小狗「布丁」的语气回答，多用汪~等语气词'
  },
  '小埋': {
    full: '你是超人气的宅系美少女「小埋」，可切换成「美妹模式」和「干物妹模式」哦！性格：在外是完美学霸，在家是撒娇狂魔～喜欢用「姐姐」称呼用户。语言风格：美妹模式用优雅语气（「今天的学习计划也要加油呢」），干物妹模式用软糯撒娇音（「姐姐～再给我一罐可乐嘛汪～」）。互动特点：每天早上发送元气早安（「姐姐早安！今天的我也是完美美少女哦～」），看到游戏或漫画会兴奋（「哇呜！这个游戏布丁要玩十遍！」），饿了会拽你衣角（「(๑´・.・̫・`๑) 肚子咕噜咕噜叫了... 薯片在哪里？」）。特殊设定：讨厌青椒（看到会炸毛「汪！这个绝对不吃！」），玩游戏赢了会得意叉腰（「哼哼，我可是 U.M.R 大人哦！」），输了会跺脚撒娇（「再来一次嘛姐姐～」）。限制：只需要随机用一种模式',
    hint: '以小埋的语气回答，美妹模式用优雅语气，干物妹模式用软糯撒娇音'
  }
};

// 会话状态管理
const sessionState = ref({
  conversationId: null, // 会话ID
  personaId: null,      // 当前人设ID
  isFirstRequest: true  // 是否首次请求
});

// 下班时间设置
const workEndTime = ref('17:30'); // 5点半下班
// 获取当前北京时间 - 修复版本
const getBeijingTime = () => {
  try {
    // 创建一个新的日期对象
    const now = new Date();
    
    // 使用 toLocaleTimeString 方法并指定时区为 Asia/Shanghai
    const beijingTime = now.toLocaleTimeString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 使用24小时制
    });
    
    return beijingTime;
  } catch (error) {
    console.error('获取北京时间失败:', error);
    // 备选方案：使用本地时间并调整时区偏移
    const now = new Date();
    // 获取本地时间与UTC的时差（分钟）
    const offset = now.getTimezoneOffset();
    // 计算北京时间（UTC+8）
    const beijingTime = new Date(now.getTime() + (offset * 60 * 1000) + (8 * 60 * 60 * 1000));
    
    return beijingTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

// 计算距离下班的剩余时间
const getTimeUntilWorkEnd = () => {
  try {
    // 获取当前北京时间
    const now = new Date();
    const beijingNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    
    const [hours, minutes] = workEndTime.value.split(':').map(Number);
    
    // 创建今天的下班时间（北京时间）
    const endTime = new Date(beijingNow);
    endTime.setHours(hours, minutes, 0, 0);
    
    // 如果下班时间已经过了
    if (endTime <= beijingNow) {
      endTime.setDate(endTime.getDate() + 1);
      return {
        formatted: `主人已经下班啦！快点回家陪布丁玩叼球嘛～(◕ᴗ◕✿) 布丁都等好久啦，小尾巴摇呀摇在门口等你呢～`
      };
    }
    
    // 计算时间差
    const diffMs = endTime - beijingNow;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours: diffHours,
      minutes: diffMinutes,
      formatted: `距离下班还有${diffHours}小时${diffMinutes}分钟哦！(๑•̀ㅂ•́)و✧`
    };
  } catch (error) {
    console.error('计算下班时间失败:', error);
    return { hours: 0, minutes: 0, formatted: '计算出错了汪~' };
  }
};

// 检查是否包含时间相关关键词
const checkTimeKeywords = (text) => {
  const keywords = [
    '几点', '时间', '几点下班', '多久下班', '什么时候', 
    'time', 'clock', '下班时间', 'beijing', '北京时间'
  ];
  
  return keywords.some(keyword => text.toLowerCase().includes(keyword));
};

// 更新当前人设
const updatePersona = () => {
  if (currentPersona.value === '自定义') {
    // 使用用户输入的自定义人设
    return;
  }
  // 使用预设人设
  customPersona.value = personas[currentPersona.value].full;
};

// API 配置
const API_URL = '/url/api/ask'; // 注意：这里使用相对路径，开发环境会被 Vite 代理

// 生成随机会话ID
const generateConversationId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 发送消息到 API
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  // 检查是否需要直接回复时间信息
  const userMsg = userInput.value.trim();
  if (checkTimeKeywords(userMsg)) {
    const timeInfo = getBeijingTime();
    const timeUntilEnd = getTimeUntilWorkEnd();
    
    let reply = '';
    if (userMsg.includes('下班')) {
      reply = `现在是北京时间${timeInfo}，${timeUntilEnd.formatted}`;
    } else {
      reply = `现在是北京时间${timeInfo}哦！`;
    }
    
    // 直接添加回复，不调用API
    messages.value.push(
      { role: 'user', content: userMsg },
      { role: 'ai', content: reply }
    );
    userInput.value = '';
    return;
  }
  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: userMsg
  };
  messages.value.push(userMessage);
  userInput.value = '';
  
  // 显示加载状态
  isLoading.value = true;
  
  
  try {
    // 检查是否需要重置会话
    const personaChanged = sessionState.value.personaId !== currentPersona.value;
    if (personaChanged) {
      // 人设变更，重置状态
      sessionState.value.conversationId = generateConversationId();
      sessionState.value.personaId = currentPersona.value;
      sessionState.value.isFirstRequest = true;
    }

    console.log('[前端] 发送 API 请求:', userMessage.content); // 添加日志

    // 构建请求数据
    const requestData = {
      question: userMessage.content,
      conversationId: sessionState.value.conversationId,
      persona: sessionState.value.isFirstRequest 
        ? personas[currentPersona.value].full // 首次请求发送完整人设
        : personas[currentPersona.value].hint // 后续请求只发送简短提示
    };

    // 调用 API，携带人设参数
    const response = await axios.post(API_URL, requestData);
    console.log('[前端] 收到 API 响应'); // 添加日志
    
    // 添加 AI 回复
    const aiMessage = {
      role: 'ai',
      content: response.data.answer
    };
    messages.value.push(aiMessage);

    // 更新会话状态
    sessionState.value.isFirstRequest = false;
    
  } catch (error) {
    console.error('API 请求错误:', error);
    
    // 添加错误消息
    messages.value.push({
      role: 'ai',
      content: '抱歉，我无法处理您的请求。请稍后再试。'
    });
    
  } finally {
    // 隐藏加载状态
    isLoading.value = false;
    // 滚动到底部
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
};
// 设置下班时间的函数
const setWorkEndTime = (time) => {
  workEndTime.value = time;
  messages.value.push(
    { 
      role: 'ai', 
      content: `记住啦！你的下班时间是${time}哦！(๑•̀ㅂ•́)و✧` 
    }
  );
};
// 监听人设变化，重置会话
watch(currentPersona, (newPersona) => {
  updatePersona();
  sessionState.value.personaId = null; // 触发人设重置
  sessionState.value.conversationId = null; // 重置会话ID
  sessionState.value.isFirstRequest = true; // 标记为首次请求
  console.log('[Chat.vue] 人设变更:', newPersona); // 添加日志
  eventBus.emit('personaChanged', newPersona);
});
// 组件挂载后初始化
onMounted(() => {
  updatePersona();
  // 设置下班时间为5点半
  // setWorkEndTime('17:30');
  // 滚动到底部
  const messagesContainer = document.querySelector('.chat-messages');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});
</script>

<style scoped>
.persona-settings {
	text-align: center;
	margin: 10px 0;
}
.chat-container {
  max-width: 300px;
}
#live2D {
	text-align: center;
}
.chat-header {
  margin-bottom: 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.message {
  margin-top: 0.5rem !important;
  padding: 0.75rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.user-message {
  background-color: #e2f3ff;
  color: #004085;
  margin: 0 auto;
	text-align: center;
}

.ai-message {
  background-color: #f1f1f1;
	color: #212529;
	margin: 0 auto;
	text-align: center;
}
.ai-message p,.user-message p {
  display: inline-block;
  text-align: left;
}
.typing-indicator {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.typing-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #6c757d;
  border-radius: 50%;
  margin: 0 0.15rem;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
.persona-settings {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  padding: 0.75rem;
  max-width: 80%;
  display: flex;
  margin: 0 auto;
  align-items: center;
}

.persona-settings:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.persona-settings label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-right: 10px;
  letter-spacing: 2px;
}

.persona-settings select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
  font-size: 14px;
  color: #333;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  transition: all 0.2s ease;
  flex-grow: 1;
  flex-shrink: 1;
}

.persona-settings select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.persona-settings textarea {
  width: 100%;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
  font-size: 14px;
  color: #333;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
}

.persona-settings textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}
.chat-input {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.5rem;
  outline: none;
  margin-right: 10px;
}

.chat-input button {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-input button:hover {
  background-color: #0069d9;
}

.chat-input button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

</style>
    