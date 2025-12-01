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
        <component :is="currentView" />
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

// 从 localStorage 恢复上次的活动标签页，默认是 'chat'
const activeTab = ref(localStorage.getItem('activeTab') || 'chat')

// 监听 activeTab 变化并保存到 localStorage
watch(activeTab, (newTab) => {
  localStorage.setItem('activeTab', newTab)
})

// 根据 tab 动态返回组件
const currentView = computed(() => {
  switch (activeTab.value) {
    case 'chat': return ChatView
    case 'knowledge': return KnowledgeBase
    case 'settings': return SettingsView
    case 'departments': return DepartmentView
    case 'users': return UserManageView
    default: return ChatView
  }
})
</script>