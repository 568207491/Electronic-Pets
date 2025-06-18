<template>
  <div id="live2D">
    <canvas id="live2dcanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from '../utils/eventBus';

export default {
  data() {
    return {
      width: '150',
      height: '150',
      // 暂时只做umaru和wanko
      modelName: 'umaru',
      modelConfig: {
        '小埋': 'umaru',
        '茶杯小狗': 'wanko',
        '专业医生': 'kesyoban',
      }
    }
  },
  methods: {
    loadlive2d(id, modelUrl) {
      // 检查 loadlive2d 函数是否存在
      if (typeof window.loadlive2d === 'function') {
        window.loadlive2d(id, modelUrl);
      } else {
        console.error('loadlive2d function is not defined');
      }
    },
    initializeModel() {
      // 使用 data 中的 modelName
      let modelUrl = "./assets/name/name.model.json";
      modelUrl = modelUrl.replace(/name/g, this.modelName);
      // console.log('Model URL:', modelUrl);
      
      // 确保 canvas 尺寸正确
      document.getElementById("live2dcanvas").style.width = this.width + 'px';
      document.getElementById("live2dcanvas").style.height = this.height + 'px';
      
      // 加载模型
      this.loadlive2d("live2dcanvas", modelUrl);
    },
    updateLive2dModel(persona) {
      let modelUrl = "./assets/name/name.model.json";
      modelUrl = modelUrl.replace(/name/g, this.modelConfig[persona] || this.modelConfig['小埋']);
      this.loadlive2d("live2dcanvas", modelUrl);
    }
  },
  mounted() {
    // 引入 device.min.js
    const deviceScript = document.createElement('script');
    deviceScript.src = '/device.min.js';
    deviceScript.onload = () => {
      
      // 引入 bundle.js
      const bundleScript = document.createElement('script');
      bundleScript.src = '/bundle.js';
      bundleScript.onload = () => {
        // 脚本加载完成后再初始化模型
        this.initializeModel();
      };
      document.head.appendChild(bundleScript);
    };
    document.head.appendChild(deviceScript);
    // 监听人设变更事件
    eventBus.on('personaChanged', (persona) => {
      console.log('[Live2dComponent] 收到事件:', persona); // 添加日志
      if(persona !== '自定义') {
        this.updateLive2dModel(persona);
      }
    });
  },
  beforeUnmount() {
    // 移除监听器
    eventBus.listeners = {}; // 简化处理，清空所有监听器
  }
};
</script>

<style scoped>

</style>