<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-slate-100">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
          <Bot class="w-10 h-10 text-white" />
        </div>
      </div>
      
      <h1 class="text-2xl font-bold text-center text-slate-800 mb-2">企业知识库系统</h1>
      <p class="text-center text-slate-500 mb-8">Unified Corporate Knowledge Base</p>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">账号 (LDAP / Local)</label>
          <!-- 改为 text 类型，因为 LDAP 账号可能不是邮箱格式 -->
          <input 
            type="text" 
            v-model="username"
            placeholder="LDAP用户名或本地用户名，例如：zhangsan"
            class="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
          <input 
            type="password" 
            v-model="password"
            class="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
          {{ errorMsg }}
        </div>
        
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lock class="w-4 h-4" /> 
          {{ isLoading ? '登录验证中...' : '安全登录' }}
        </button>
      </form>
      
      <div class="mt-6 text-center text-xs text-slate-400">
        已接入企业 AD/LDAP 域认证
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bot, Lock } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth' // 引入鉴权逻辑

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    await login(username.value, password.value)
    // 登录成功，跳转 Dashboard
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || "登录失败，请检查账号密码"
  } finally {
    isLoading.value = false
  }
}
</script>