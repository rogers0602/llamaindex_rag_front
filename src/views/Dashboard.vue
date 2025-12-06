<template>
  <div class="flex h-screen w-screen overflow-hidden bg-white">
    
    <!-- 侧边栏组件 -->
    <Sidebar 
      :active-tab="activeTab" 
      @change-tab="(tab) => activeTab = tab" 
    />

    <!-- 主内容区 -->
    <main class="flex-1 h-full relative overflow-hidden">
      <!-- 动态组件切换 -->
      <KeepAlive>
        <component 
          :is="currentView" 
          @switch-tab="(tab) => activeTab = tab"
        />
      </KeepAlive>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ChatView from '../components/ChatView.vue'
import KnowledgeBase from '../components/KnowledgeBase.vue'
import SettingsView from '../components/SettingsView.vue'
import DepartmentView from './DepartmentView.vue'
import UserManageView from './UserManageView.vue'
import DashboardHome from './DashboardHome.vue' 

// 默认进入 'home'
const activeTab = ref(localStorage.getItem('activeTab') || 'home')

watch(activeTab, (newTab) => {
  localStorage.setItem('activeTab', newTab)
})

const currentView = computed(() => {
  switch (activeTab.value) {
    case 'home': return DashboardHome
    case 'chat': return ChatView
    case 'knowledge': return KnowledgeBase
    case 'settings': return SettingsView
    case 'departments': return DepartmentView
    case 'users': return UserManageView
    default: return DashboardHome
  }
})
</script>