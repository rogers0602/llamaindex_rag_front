<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Bot class="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 class="text-2xl font-bold text-center text-slate-800 mb-2">企业知识库系统</h1>
        <p class="text-center text-slate-500 mb-8">Unified Corporate Knowledge Base</p>
        
        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">企业邮箱 / 域账号</label>
            <input 
              type="email" 
              v-model="email"
              class="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input 
              type="password" 
              v-model="password"
              class="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          
          <button 
            type="submit" 
            class="w-full bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <Lock class="w-4 h-4" /> 安全登录
          </button>
        </form>
        
        <div class="mt-6 text-center text-xs text-slate-400">
          支持 LDAP / SSO 单点登录
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { Bot, Lock } from 'lucide-vue-next'
  
  const router = useRouter()
  const email = ref('admin@company.com')
  const password = ref('123456')
  
  const handleLogin = () => {
    // 这里可以加简单的校验
    router.push('/dashboard')
  }
  </script>