<template>
  <div class="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
    <!-- Logo -->
    <div class="p-4 border-b border-slate-800 flex items-center gap-2 font-bold text-white text-lg">
      <Bot class="w-6 h-6 text-blue-500" />
      <span>企业知识库</span>
    </div>

    <!-- 🌟 修改点 1: 部门显示 (不再是下拉框) -->
    <div class="p-4">
      <div class="text-xs font-semibold text-slate-500 mb-2 uppercase">所属部门 (Workspace)</div>
      
      <!-- 固定显示的卡片 -->
      <div class="w-full bg-slate-800 text-white p-3 rounded flex items-center justify-between border border-slate-700">
        <div class="flex items-center gap-2 overflow-hidden">
          <Building2 class="w-4 h-4 text-blue-400 shrink-0" />
          <!-- 这里绑定的是 currentWorkspace.name -->
          <span class="truncate font-medium">{{ currentWorkspace.name || '加载中...' }}</span>
        </div>
      </div>

      <div class="text-xs text-slate-500 mt-2 flex justify-between items-center px-1">
        <span>角色: <span class="text-slate-300">{{ user.role === 'admin' ? '管理员' : '成员' }}</span></span>
        <span class="flex items-center gap-1 text-green-500">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
        </span>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 px-2 space-y-1 mt-2">
      <button 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        @click="handleNav(tab.id)"
        :class="[
          'w-full flex items-center gap-3 p-2 rounded transition',
          activeTab === tab.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
        ]"
      >
        <component :is="tab.icon" class="w-5 h-5" /> {{ tab.label }}
      </button>
    </nav>

    <!-- 🌟 修改点 2: 底部用户信息 & 退出按钮 -->
    <div class="p-4 border-t border-slate-800">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {{ user.username ? user.username.substring(0, 1).toUpperCase() : 'U' }}
        </div>
        <div class="overflow-hidden">
          <div class="text-sm text-white font-medium truncate">{{ user.username }}</div>
          <div class="text-xs text-slate-500 truncate">已登录</div>
        </div>
      </div>
      
      <button 
        @click="handleLogout" 
        class="w-full flex items-center justify-center gap-2 text-xs bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 py-2 rounded transition"
      >
        <LogOut class="w-3 h-3" /> 退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Bot, MessageSquare, Database, Settings, Building2, LogOut, Users
} from 'lucide-vue-next'
import { useWorkspace } from '../composables/useWorkspace'
import { useAuth } from '../composables/useAuth'

// 接收父组件传来的 props
const props = defineProps(['activeTab'])
const emit = defineEmits(['change-tab'])
const router = useRouter()
const { currentWorkspace } = useWorkspace()
const { user, logout } = useAuth()

const allTabs = [
  { id: 'chat', label: '智能问答', icon: MessageSquare, roles: ['admin', 'member'] },
  { id: 'knowledge', label: '知识库管理', icon: Database, roles: ['admin', 'member'] },
  // 🔥 以下三个仅 Admin 可见
  { id: 'departments', label: '部门管理', icon: Building2, roles: ['admin'] },
  { id: 'users', label: '人员管理', icon: Users, roles: ['admin'] },
  { id: 'settings', label: '系统设置', icon: Settings, roles: ['admin'] },
]

// 🔥 核心：根据角色过滤菜单
const visibleTabs = computed(() => {
  return allTabs.filter(tab => tab.roles.includes(user.value.role))
})

const handleNav = (id) => {
  // 触发父组件切换 View，或者直接路由跳转
  emit('change-tab', id)
}

const handleLogout = () => {
  if(confirm('确定要退出登录吗？')) {
    logout()
  }
}
</script>