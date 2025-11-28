import { createApp } from 'vue'
import './style.css' // 引入 Tailwind
import App from './App.vue'
import router from './router' // 引入路由

createApp(App).use(router).mount('#app')