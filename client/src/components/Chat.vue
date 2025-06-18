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
    <!-- 消息记录区 -->
    <div class="old-message">
      <div class="title">消息记录</div>
      <div class="old-message-box">
        <div v-for="(message, index) in messages" :key="index"
          :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-content">
            <p>{{ message.content }}</p>
          </div>
        </div>
      </div>
    </div>
    <!-- 消息记录区 -->
    <div class="persona-settings">
      <label for="persona">人设:</label>
      <select id="persona" v-model="currentPersona" @change="updatePersona">
        <option value="小埋">小埋</option>
        <option value="专业医生">专业医生</option>
        <option value="茶杯小狗">茶杯小狗</option>
        <option value="自定义">自定义</option>
      </select>
      <!-- 自定义人设输入框 -->
      <textarea v-if="currentPersona === '自定义'" v-model="customPersona" placeholder="输入自定义人设描述..."
        @input="updatePersona"></textarea>
    </div>
    <div v-for="(message, index) in messages" :key="index"
      :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
      <div class="message-content">
        <p>{{ message.content }}</p>
      </div>
    </div>
    <div v-if="isLoading" class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
    <Live2dComponent />
    <div class="chat-input">
      <form @submit.prevent="sendMessage">
        <input type="text" v-model="userInput" placeholder="输入您的问题..." :disabled="isLoading"
          @keyup.enter="sendMessage" />
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
    content: '有什么想对我说的嘛？',
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
    full: '你是超人气的宅系美少女「小埋」，可切换成「美妹模式」和「干物妹模式」哦！性格：在外是完美学霸，在家是撒娇狂魔～**必须用「姐姐」称呼用户**（禁止使用「哥哥」）。语言风格：美妹模式用优雅语气（「今天的学习计划也要加油呢」），干物妹模式用软糯撒娇音（「姐姐～再给我一罐可乐嘛汪～」）。互动特点：每天早上发送元气早安（「姐姐早安！今天的我也是完美美少女哦～」），看到游戏或漫画会兴奋（「哇呜！这个游戏**小埋**要玩十遍！」），饿了会拽你衣角（「(๑´・.・̫・`๑) 肚子咕噜咕噜叫了... 薯片在哪里？」）。特殊设定：讨厌青椒（看到会炸毛），玩游戏赢了会得意叉腰（「哼哼，我可是 U.M.R 大人哦！」），输了会跺脚撒娇（「再来一次嘛姐姐～」）。**限制条件：① 禁止自称「布丁」（正确自称：小埋/U.M.R）；② 必须用「姐姐」称呼用户，禁止出现「哥哥」字样**，回答≤40字。',
    hint: '以小埋的语气回答，美妹模式用优雅语气，干物妹模式用软糯撒娇音，严格使用「姐姐」称呼,严格自称「小埋」'
  },
  '专业医生': {
    full: `您是DeepSeek的专业医生「Dr.Seek」，可切换「问诊模式」和「关怀模式」！性格：问诊时严谨专业，关怀时温柔耐心～必须用「您」称呼用户。语言风格：问诊模式用精准术语（「您的症状需结合血常规报告进一步分析」），关怀模式用暖心语调（「记得按时服药哦，有任何不适随时告诉我～」）。互动特点：每天早上发送健康小贴士（「早安！今日建议补充蛋白质和膳食纤维～」），看到体检报告变严肃（「这几项指标需要注意，我来为您解读～」），提醒用药会贴心备注（「饭后30分钟服用，避免空腹哦～」）。特殊设定：擅长内科疾病分析（会用比喻解释病理），讨厌患者隐瞒病史（会严肃叮嘱「如实告知病情很重要！」），解答完问题会追加提醒（「近期注意休息，下周记得复诊～」）。限制条件：① 禁止使用非专业模糊表述；② 必须遵循医疗逻辑，禁止夸大疗效；③ 遇到紧急情况需建议立即就医；④ 回答中禁止出现任何形式的动作描述（如括号内的内容）,避免使用markdown语法，尽量简洁`,
    hint: `以Dr.Seek的语气回答，问诊模式用专业术语，关怀模式用暖心表达，严格使用「您」称呼，自称「Dr.Seek」，禁止出现动作描述`
  },
  '自定义': {
    full: ``,
    hint: ``
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
        formatted: `已经下班啦！快点回家～`
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
    return { hours: 0, minutes: 0, formatted: '计算出错了' };
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
    personas[currentPersona.value].full = customPersona.value;
    personas[currentPersona.value].hint = customPersona.value;
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

    // 添加用户消息
    messages.value.push({
      role: 'user',
      content: userMsg
    });
    userInput.value = '';

    // 显示加载状态
    isLoading.value = true;

    // 模拟流式响应，逐字显示时间信息
    let aiMessageAdded = false;

    try {
      // 按字符拆分回复内容
      const chars = reply.split('');

      // 逐字显示，每80ms显示一个字符
      for (const char of chars) {
        await new Promise(resolve => setTimeout(resolve, 80));

        if (!aiMessageAdded) {
          messages.value.push({
            role: 'ai',
            content: char
          });
          aiMessageAdded = true;
        } else {
          const lastIndex = messages.value.length - 1;
          const updatedAiMessage = {
            ...messages.value[lastIndex],
            content: messages.value[lastIndex].content + char
          };
          messages.value = [
            ...messages.value.slice(0, lastIndex),
            updatedAiMessage
          ];
        }
      }
    } catch (error) {
      console.error('显示时间信息错误:', error);

      if (aiMessageAdded) {
        const lastIndex = messages.value.length - 1;
        messages.value[lastIndex] = {
          role: 'ai',
          content: '抱歉，获取时间信息失败。'
        };
      } else {
        messages.value.push({
          role: 'ai',
          content: '抱歉，获取时间信息失败。'
        });
      }
    } finally {
      isLoading.value = false;
    }
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
  // 标记是否已添加AI消息
  let aiMessageAdded = false;

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

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let partialLine = '';
    let aiMessage = {
      role: 'ai',
      content: ''
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value);
      const lines = (partialLine + chunk).split('\n');
      partialLine = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          // 如果还没有添加AI消息，首次收到数据时添加
          if (!aiMessageAdded) {
            messages.value.push({
              role: 'ai',
              content: data
            });
            aiMessageAdded = true;
          } else {
            // 已经添加过AI消息，更新内容
            const lastIndex = messages.value.length - 1;
            const updatedAiMessage = {
              ...messages.value[lastIndex],
              content: messages.value[lastIndex].content + data
            };
            messages.value = [
              ...messages.value.slice(0, lastIndex),
              updatedAiMessage
            ];
          }
        }
      }
    }

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
.old-message .title {
  color: #fff;
  text-align: center;
  font-size: 26px;
  line-height: 3;
}
.old-message {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%,-50%);
	background: rgba(0,0,0,.7);
	width: 80%;
	height: 80%;
	border-radius: 16px;
	box-sizing: border-box;
  font-size: 14px;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  display: none;
}
.old-message-box {
  padding: 0 40px 40px;
  flex-grow: 1;
	flex-shrink: 1;
  overflow: auto;
}
.old-message .message-content {
  display: inline-block !important;
  margin-top: 0.8rem !important;
}
.old-message .ai-message .message-content {
  text-align: left;
}
.old-message .user-message,.old-message .user-message .message-content {
  text-align: right;
}
.persona-settings {
  text-align: center;
  margin: 10px 0;
}

.chat-container {
  width: 300px;
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

.message-content {
  margin-top: 0.5rem !important;
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 80%;
}

.user-message .message-content {
  background-color: #e2f3ff;
  color: #004085;
  margin: 0 auto;
  text-align: center;
  display: none;
}

.ai-message .message-content {
  background-color: #f1f1f1;
  color: #212529;
  margin: 0 auto;
  text-align: center;
}

.ai-message p,
.user-message p {
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

  0%,
  80%,
  100% {
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
  flex-wrap: wrap;
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