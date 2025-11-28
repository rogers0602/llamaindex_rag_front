<template>
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
      <div class="p-4 border-b border-slate-800 flex items-center gap-2 font-bold text-white text-lg">
        <Bot class="w-6 h-6 text-blue-500" />
        <span>EntKnowledge</span>
      </div>
  
      <!-- 部门切换 -->
      <div class="p-4">
        <div class="text-xs font-semibold text-slate-500 mb-2 uppercase">切换部门</div>
        <div class="relative">
          <select v-model="currentWorkspace" class="w-full bg-slate-800 hover:bg-slate-700 text-white p-2 rounded appearance-none outline-none cursor-pointer border border-slate-700 focus:border-blue-500 transition">
            <option v-for="ws in workspaces" :key="ws.id" :value="ws">{{ ws.name }}</option>
          </select>
          <div class="absolute right-2 top-3 pointer-events-none text-slate-400"><ChevronDown class="w-4 h-4" /></div>
        </div>
        <div class="text-xs text-slate-500 mt-2">ID: {{ currentWorkspace.id }} / {{ currentWorkspace.role }}</div>
      </div>
  
      <!-- 菜单 -->
      <nav class="flex-1 px-2 space-y-1">
        <button 
          v-for="item in menuItems" :key="item.id"
          @click="$emit('change-tab', item.id)"
          :class="['w-full flex items-center gap-3 p-2 rounded transition', activeTab === item.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800']"
        >
          <component :is="item.icon" class="w-5 h-5" /> {{ item.label }}
        </button>
      </nav>
  
      <!-- 用户信息 -->
      <div class="p-4 border-t border-slate-800 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
        <div>
          <div class="text-sm text-white">Admin User</div>
          <div class="text-xs">admin@company.com</div>
        </div>
      </div>
    </aside>
  </template>
  
  <script setup>
  import { Bot, ChevronDown, MessageSquare, Database, Settings } from 'lucide-vue-next'
  import { useWorkspace } from '../composables/useWorkspace'
  
  const props = defineProps(['activeTab'])
  const emit = defineEmits(['change-tab'])
  
  // 直接引入 useWorkspace，状态会自动同步
  const { workspaces, currentWorkspace } = useWorkspace()
  
  const menuItems = [
    { id: 'chat', label: '智能问答', icon: MessageSquare },
    { id: 'knowledge', label: '知识库管理', icon: Database },
    { id: 'settings', label: '系统设置', icon: Settings },
  ]
  </script>