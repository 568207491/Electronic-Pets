export const eventBus = {
  listeners: {}, // 存储事件监听器的对象
  
  // 注册事件监听器
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  
  // 触发事件，执行所有注册的回调函数
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};